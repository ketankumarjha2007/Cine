-- ============================================================================
-- 03_functions.sql: Stored Functions and Procedures
-- ============================================================================

-- Helper function: Check if current authenticated user has admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    SELECT role INTO v_role
    FROM public.profiles
    WHERE id = auth.uid();

    RETURN v_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- 1. Function: hold_seats
-- Atomically creates a PENDING booking and locks requested seats with status 'HELD'
CREATE OR REPLACE FUNCTION public.hold_seats(
    p_user UUID,
    p_show UUID,
    p_seats UUID[],
    p_hold_minutes INTEGER DEFAULT 8,
    p_convenience_fee_percent NUMERIC DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
    v_show RECORD;
    v_seat RECORD;
    v_seat_count INTEGER;
    v_booking_id UUID;
    v_booking_code TEXT;
    v_hold_expires TIMESTAMPTZ;
    v_subtotal NUMERIC(10, 2) := 0;
    v_fee NUMERIC(10, 2) := 0;
    v_total NUMERIC(10, 2) := 0;
    v_seat_price NUMERIC(10, 2);
    v_cur_seat UUID;
BEGIN
    v_seat_count := array_length(p_seats, 1);
    IF v_seat_count IS NULL OR v_seat_count = 0 THEN
        RAISE EXCEPTION 'No seats specified for booking';
    END IF;

    IF v_seat_count > 10 THEN
        RAISE EXCEPTION 'Maximum booking limit is 10 seats per transaction';
    END IF;

    -- Fetch and validate show
    SELECT id, screen_id, starts_at, status, price_by_category
    INTO v_show
    FROM public.shows
    WHERE id = p_show;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Show not found';
    END IF;

    IF v_show.status <> 'scheduled' THEN
        RAISE EXCEPTION 'Show is not available for booking';
    END IF;

    IF v_show.starts_at <= now() THEN
        RAISE EXCEPTION 'Cannot book seats for a show that has already started';
    END IF;

    -- Verify all seats belong to the show's screen and lock them
    PERFORM id
    FROM public.seats
    WHERE screen_id = v_show.screen_id
      AND id = ANY(p_seats)
    FOR SHARE;

    -- Calculate subtotal based on seat category pricing
    FOR v_cur_seat IN SELECT unnest(p_seats)
    LOOP
        SELECT category INTO v_seat
        FROM public.seats
        WHERE id = v_cur_seat AND screen_id = v_show.screen_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Seat % does not belong to the selected screen', v_cur_seat;
        END IF;

        v_seat_price := COALESCE(
            (v_show.price_by_category->>v_seat.category)::NUMERIC,
            (v_show.price_by_category->>initcap(v_seat.category))::NUMERIC,
            CASE
                WHEN lower(v_seat.category) = 'recliner' THEN 550.00
                WHEN lower(v_seat.category) = 'vip' THEN 500.00
                WHEN lower(v_seat.category) = 'premium' THEN 350.00
                ELSE 220.00
            END
        );
        v_subtotal := v_subtotal + v_seat_price;
    END LOOP;

    v_fee := ROUND((v_subtotal * (p_convenience_fee_percent / 100.0)), 2);
    v_total := v_subtotal + v_fee;
    v_hold_expires := now() + (interval '1 minute' * p_hold_minutes);
    v_booking_code := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));

    -- Create PENDING booking
    INSERT INTO public.bookings (
        user_id, show_id, status, subtotal, convenience_fee, total_amount,
        hold_expires_at, booking_code
    )
    VALUES (
        p_user, p_show, 'PENDING', v_subtotal, v_fee, v_total,
        v_hold_expires, v_booking_code
    )
    RETURNING id INTO v_booking_id;

    -- Attempt to insert booking_seats with status 'HELD'
    -- Partial unique index uq_active_show_seat enforces no overlap
    BEGIN
        FOR v_cur_seat IN SELECT unnest(p_seats)
        LOOP
            SELECT category INTO v_seat
            FROM public.seats
            WHERE id = v_cur_seat;

            v_seat_price := COALESCE((v_show.price_by_category->>v_seat.category)::NUMERIC, 200.00);

            INSERT INTO public.booking_seats (
                booking_id, show_id, seat_id, price, status
            )
            VALUES (
                v_booking_id, p_show, v_cur_seat, v_seat_price, 'HELD'
            );
        END LOOP;
    EXCEPTION
        WHEN unique_violation THEN
            RAISE EXCEPTION 'One or more selected seats are no longer available. Please select different seats.';
    END;

    RETURN jsonb_build_object(
        'booking_id', v_booking_id,
        'booking_code', v_booking_code,
        'subtotal', v_subtotal,
        'convenience_fee', v_fee,
        'total', v_total,
        'expires_at', v_hold_expires
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Function: confirm_booking
-- Idempotent booking confirmation and payment record creation
CREATE OR REPLACE FUNCTION public.confirm_booking(
    p_booking UUID,
    p_order TEXT,
    p_payment TEXT,
    p_signature TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_booking RECORD;
BEGIN
    SELECT * INTO v_booking
    FROM public.bookings
    WHERE id = p_booking
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found';
    END IF;

    -- If already confirmed, return idempotently
    IF v_booking.status = 'CONFIRMED' THEN
        RETURN jsonb_build_object(
            'status', 'already_confirmed',
            'booking_id', v_booking.id,
            'booking_code', v_booking.booking_code
        );
    END IF;

    IF v_booking.status = 'CANCELLED' THEN
        RAISE EXCEPTION 'Cannot confirm a cancelled booking';
    END IF;

    -- Update booking status
    UPDATE public.bookings
    SET status = 'CONFIRMED',
        confirmed_at = now(),
        razorpay_order_id = p_order
    WHERE id = p_booking;

    -- Update seat states
    UPDATE public.booking_seats
    SET status = 'BOOKED'
    WHERE booking_id = p_booking;

    -- Insert or update payment record
    INSERT INTO public.payments (
        booking_id, razorpay_order_id, razorpay_payment_id,
        razorpay_signature, amount, currency, status
    )
    VALUES (
        p_booking, p_order, p_payment, p_signature,
        v_booking.total_amount, 'INR', 'PAID'
    )
    ON CONFLICT (razorpay_payment_id) DO UPDATE
    SET status = 'PAID',
        razorpay_signature = p_signature;

    RETURN jsonb_build_object(
        'status', 'confirmed',
        'booking_id', v_booking.id,
        'booking_code', v_booking.booking_code
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Function: cancel_booking
-- Allowed only for confirmed bookings before show start; releases seats
CREATE OR REPLACE FUNCTION public.cancel_booking(
    p_booking UUID,
    p_user UUID
)
RETURNS JSONB AS $$
DECLARE
    v_booking RECORD;
    v_show RECORD;
BEGIN
    SELECT * INTO v_booking
    FROM public.bookings
    WHERE id = p_booking AND user_id = p_user
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found or unauthorized';
    END IF;

    IF v_booking.status <> 'CONFIRMED' THEN
        RAISE EXCEPTION 'Only confirmed bookings can be cancelled';
    END IF;

    SELECT starts_at INTO v_show
    FROM public.shows
    WHERE id = v_booking.show_id;

    IF v_show.starts_at <= now() THEN
        RAISE EXCEPTION 'Cannot cancel booking after show start time';
    END IF;

    -- Mark booking cancelled
    UPDATE public.bookings
    SET status = 'CANCELLED',
        cancelled_at = now()
    WHERE id = p_booking;

    -- Release seats
    UPDATE public.booking_seats
    SET status = 'RELEASED'
    WHERE booking_id = p_booking;

    RETURN jsonb_build_object(
        'status', 'cancelled',
        'booking_id', v_booking.id,
        'amount', v_booking.total_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Function: expire_holds
-- Periodically marks expired PENDING bookings as EXPIRED and releases seats
CREATE OR REPLACE FUNCTION public.expire_holds()
RETURNS INTEGER AS $$
DECLARE
    v_expired_count INTEGER := 0;
    v_expired_booking RECORD;
BEGIN
    FOR v_expired_booking IN
        SELECT id FROM public.bookings
        WHERE status = 'PENDING' AND hold_expires_at <= now()
        FOR UPDATE SKIP LOCKED
    LOOP
        UPDATE public.bookings
        SET status = 'EXPIRED'
        WHERE id = v_expired_booking.id;

        UPDATE public.booking_seats
        SET status = 'RELEASED'
        WHERE booking_id = v_expired_booking.id;

        v_expired_count := v_expired_count + 1;
    END LOOP;

    RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. Function: nearby_theatres
-- Returns theatres with distance_km sorted ascending using PostGIS
CREATE OR REPLACE FUNCTION public.nearby_theatres(
    p_lat FLOAT8,
    p_lng FLOAT8,
    p_radius_km FLOAT8 DEFAULT 50.0
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    image_url TEXT,
    amenities TEXT[],
    distance_km FLOAT8,
    latitude FLOAT8,
    longitude FLOAT8
) AS $$
DECLARE
    v_point geography;
BEGIN
    v_point := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography;

    RETURN QUERY
    SELECT
        t.id,
        t.name,
        t.address,
        t.city,
        t.state,
        t.pincode,
        t.image_url,
        t.amenities,
        ROUND((ST_Distance(t.location, v_point) / 1000.0)::numeric, 2)::FLOAT8 AS distance_km,
        ST_Y(t.location::geometry)::FLOAT8 AS latitude,
        ST_X(t.location::geometry)::FLOAT8 AS longitude
    FROM public.theatres t
    WHERE ST_DWithin(t.location, v_point, p_radius_km * 1000.0)
    ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql STABLE;


-- 6. Function: get_show_seats
-- Returns every seat of the show's screen with its current status and price without exposing user data
CREATE OR REPLACE FUNCTION public.get_show_seats(p_show UUID)
RETURNS TABLE (
    seat_id UUID,
    row_label TEXT,
    seat_number INTEGER,
    category TEXT,
    price NUMERIC(10, 2),
    status TEXT
) AS $$
DECLARE
    v_show RECORD;
    v_pricing JSONB;
BEGIN
    SELECT s.screen_id, s.price_by_category
    INTO v_show
    FROM public.shows s
    WHERE s.id = p_show;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Show not found';
    END IF;

    -- Safely parse if price_by_category was stored as a JSON string
    IF jsonb_typeof(v_show.price_by_category) = 'string' THEN
        BEGIN
            v_pricing := (v_show.price_by_category #>> '{}')::jsonb;
        EXCEPTION WHEN OTHERS THEN
            v_pricing := '{"Standard": 220, "Premium": 350, "VIP": 500, "Recliner": 550}'::jsonb;
        END;
    ELSE
        v_pricing := v_show.price_by_category;
    END IF;

    RETURN QUERY
    SELECT
        st.id AS seat_id,
        st.row_label,
        st.seat_number,
        st.category,
        COALESCE(
            (v_pricing->>st.category)::NUMERIC,
            (v_pricing->>initcap(st.category))::NUMERIC,
            CASE
                WHEN lower(st.category) = 'recliner' THEN 550.00
                WHEN lower(st.category) = 'vip' THEN 500.00
                WHEN lower(st.category) = 'premium' THEN 350.00
                ELSE 220.00
            END
        ) AS price,
        CASE
            WHEN bs.status = 'BOOKED' THEN 'booked'
            WHEN bs.status = 'HELD' THEN 'held'
            ELSE 'available'
        END AS status
    FROM public.seats st
    LEFT JOIN public.booking_seats bs
        ON bs.seat_id = st.id
        AND bs.show_id = p_show
        AND bs.status IN ('HELD', 'BOOKED')
    WHERE st.screen_id = v_show.screen_id
    ORDER BY st.row_label ASC, st.seat_number ASC;
END;
$$ LANGUAGE plpgsql STABLE;


-- 7. Function: admin_report
-- Aggregates revenue, bookings, and seats sold by day, movie, and theatre
-- Uses CTE pre-aggregation for booking_seats to prevent duplicate revenue calculation on 1-to-many joins
CREATE OR REPLACE FUNCTION public.admin_report(
    p_from DATE,
    p_to DATE
)
RETURNS TABLE (
    report_date DATE,
    movie_title TEXT,
    theatre_name TEXT,
    total_bookings BIGINT,
    seats_sold BIGINT,
    total_revenue NUMERIC(12, 2)
) AS $$
BEGIN
    RETURN QUERY
    WITH booking_seats_agg AS (
        SELECT
            booking_id,
            COUNT(id) AS seats_count
        FROM public.booking_seats
        WHERE status = 'BOOKED'
        GROUP BY booking_id
    )
    SELECT
        b.confirmed_at::DATE AS report_date,
        m.title AS movie_title,
        t.name AS theatre_name,
        COUNT(b.id) AS total_bookings,
        COALESCE(SUM(bs.seats_count), 0)::BIGINT AS seats_sold,
        COALESCE(SUM(b.total_amount), 0)::NUMERIC(12, 2) AS total_revenue
    FROM public.bookings b
    JOIN public.shows s ON s.id = b.show_id
    JOIN public.movies m ON m.id = s.movie_id
    JOIN public.screens sc ON sc.id = s.screen_id
    JOIN public.theatres t ON t.id = sc.theatre_id
    LEFT JOIN booking_seats_agg bs ON bs.booking_id = b.id
    WHERE b.status = 'CONFIRMED'
      AND b.confirmed_at::DATE >= p_from
      AND b.confirmed_at::DATE <= p_to
    GROUP BY b.confirmed_at::DATE, m.title, t.name
    ORDER BY report_date DESC, total_revenue DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
