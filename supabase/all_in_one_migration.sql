-- ============================================================================
-- 01_extensions.sql: Required Database Extensions
-- ============================================================================

-- PostGIS for geographic calculations and nearest theatre search
CREATE EXTENSION IF NOT EXISTS postgis;

-- btree_gist for exclusion constraints combining UUID/scalars with tstzrange
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- pg_cron for recurring scheduled background tasks (e.g., hold expiration)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- pgcrypto for UUID generation if not already active
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- ============================================================================
-- 02_schema.sql: Database Schema Definitions
-- ============================================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Trigger to auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', ''),
        'user'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Movies Table
CREATE TABLE IF NOT EXISTS public.movies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tmdb_id INTEGER UNIQUE,
    title TEXT NOT NULL,
    overview TEXT,
    language TEXT NOT NULL DEFAULT 'English',
    genres TEXT[] DEFAULT '{}',
    duration_minutes INTEGER NOT NULL DEFAULT 120,
    release_date DATE,
    certificate TEXT DEFAULT 'UA',
    poster_url TEXT,
    backdrop_url TEXT,
    trailer_key TEXT,
    rating NUMERIC(3, 1),
    status TEXT NOT NULL DEFAULT 'now_showing' CHECK (status IN ('now_showing', 'upcoming', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Theatres Table
CREATE TABLE IF NOT EXISTS public.theatres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    location geography(Point, 4326) NOT NULL,
    image_url TEXT,
    amenities TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Screens Table
CREATE TABLE IF NOT EXISTS public.screens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theatre_id UUID NOT NULL REFERENCES public.theatres(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    screen_type TEXT NOT NULL DEFAULT '2D',
    total_seats INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Seats Table
CREATE TABLE IF NOT EXISTS public.seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    screen_id UUID NOT NULL REFERENCES public.screens(id) ON DELETE CASCADE,
    row_label TEXT NOT NULL,
    seat_number INTEGER NOT NULL,
    category TEXT NOT NULL DEFAULT 'Standard',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_screen_row_number UNIQUE (screen_id, row_label, seat_number)
);

-- 6. Shows Table with Exclusion Constraint
CREATE TABLE IF NOT EXISTS public.shows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movie_id UUID NOT NULL REFERENCES public.movies(id) ON DELETE RESTRICT,
    screen_id UUID NOT NULL REFERENCES public.screens(id) ON DELETE RESTRICT,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    language TEXT NOT NULL DEFAULT 'English',
    format TEXT NOT NULL DEFAULT '2D',
    price_by_category JSONB NOT NULL DEFAULT '{"Standard": 200, "Premium": 350, "VIP": 500}',
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_show_time_valid CHECK (ends_at > starts_at)
);

-- Show overlap exclusion constraint: Screen cannot host overlapping active shows
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'no_screen_show_overlap'
    ) THEN
        ALTER TABLE public.shows
        ADD CONSTRAINT no_screen_show_overlap
        EXCLUDE USING gist (
            screen_id WITH =,
            tstzrange(starts_at, ends_at) WITH &&
        )
        WHERE (status = 'scheduled');
    END IF;
END $$;

-- 7. Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    show_id UUID NOT NULL REFERENCES public.shows(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED')),
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
    convenience_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    razorpay_order_id TEXT UNIQUE,
    hold_expires_at TIMESTAMPTZ NOT NULL,
    email_sent BOOLEAN NOT NULL DEFAULT false,
    booking_code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    confirmed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ
);

-- 8. Booking Seats Table
CREATE TABLE IF NOT EXISTS public.booking_seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    show_id UUID NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
    seat_id UUID NOT NULL REFERENCES public.seats(id) ON DELETE RESTRICT,
    price NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'HELD' CHECK (status IN ('HELD', 'BOOKED', 'RELEASED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- HARD DOUBLE-BOOKING GUARANTEE: Partial unique index on (show_id, seat_id) for active statuses
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_show_seat
ON public.booking_seats (show_id, seat_id)
WHERE status IN ('HELD', 'BOOKED');

-- 9. Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT UNIQUE,
    razorpay_signature TEXT,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'CREATED' CHECK (status IN ('CREATED', 'PAID', 'FAILED', 'REFUNDED')),
    refund_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. Banners Table
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT NOT NULL,
    link_url TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. Webhook Events Table (Idempotency)
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id TEXT PRIMARY KEY,
    payload JSONB NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_movies_status ON public.movies(status);
CREATE INDEX IF NOT EXISTS idx_theatres_city ON public.theatres(city);
CREATE INDEX IF NOT EXISTS idx_shows_movie_starts ON public.shows(movie_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_shows_screen_starts ON public.shows(screen_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_seats_screen ON public.seats(screen_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_show ON public.bookings(show_id);
CREATE INDEX IF NOT EXISTS idx_bookings_hold_exp ON public.bookings(hold_expires_at) WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_booking_seats_booking ON public.booking_seats(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_seats_show ON public.booking_seats(show_id);
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
    v_pricing JSONB;
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

    -- Safely parse price_by_category (handle string-encoded JSONB)
    IF jsonb_typeof(v_show.price_by_category) = 'string' THEN
        BEGIN
            v_pricing := (v_show.price_by_category #>> '{}')::jsonb;
        EXCEPTION WHEN OTHERS THEN
            v_pricing := '{"Standard": 220, "Premium": 350, "VIP": 500, "Recliner": 550}'::jsonb;
        END;
    ELSE
        v_pricing := COALESCE(v_show.price_by_category, '{"Standard": 220, "Premium": 350, "VIP": 500, "Recliner": 550}'::jsonb);
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
            (v_pricing->>v_seat.category)::NUMERIC,
            (v_pricing->>initcap(v_seat.category))::NUMERIC,
            (v_pricing->>upper(v_seat.category))::NUMERIC,
            (v_pricing->>lower(v_seat.category))::NUMERIC,
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

            v_seat_price := COALESCE(
                (v_pricing->>v_seat.category)::NUMERIC,
                (v_pricing->>initcap(v_seat.category))::NUMERIC,
                (v_pricing->>upper(v_seat.category))::NUMERIC,
                (v_pricing->>lower(v_seat.category))::NUMERIC,
                CASE
                    WHEN lower(v_seat.category) = 'recliner' THEN 550.00
                    WHEN lower(v_seat.category) = 'vip' THEN 500.00
                    WHEN lower(v_seat.category) = 'premium' THEN 350.00
                    ELSE 220.00
                END
            );

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
        v_pricing := COALESCE(v_show.price_by_category, '{"Standard": 220, "Premium": 350, "VIP": 500, "Recliner": 550}'::jsonb);
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
            (v_pricing->>upper(st.category))::NUMERIC,
            (v_pricing->>lower(st.category))::NUMERIC,
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
-- ============================================================================
-- 04_policies.sql: Row Level Security Policies
-- ============================================================================

-- Enable RLS on all public tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theatres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 1. Profiles Policies
-- ----------------------------------------------------------------------------
-- Authenticated users can view their own profile
CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Admins can view all profiles
CREATE POLICY "Admins can read all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_admin());

-- Users can update their own profile details (role column modification prevented by trigger/grant)
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Admins can update any profile (e.g. promoting users)
CREATE POLICY "Admins can update profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.is_admin());

-- Prevent users from changing their own role
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.role IS DISTINCT FROM NEW.role) AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only administrators can modify user roles';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_role_change ON public.profiles;
CREATE TRIGGER trg_prevent_role_change
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.prevent_role_change();

-- ----------------------------------------------------------------------------
-- 2. Movies Policies
-- ----------------------------------------------------------------------------
-- Public read access to active movies
CREATE POLICY "Public read movies"
ON public.movies FOR SELECT
TO anon, authenticated
USING (true);

-- Admin write access
CREATE POLICY "Admins insert movies"
ON public.movies FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins update movies"
ON public.movies FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins delete movies"
ON public.movies FOR DELETE
TO authenticated
USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 3. Theatres Policies
-- ----------------------------------------------------------------------------
-- Public read access to theatres
CREATE POLICY "Public read theatres"
ON public.theatres FOR SELECT
TO anon, authenticated
USING (true);

-- Admin write access
CREATE POLICY "Admins insert theatres"
ON public.theatres FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins update theatres"
ON public.theatres FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins delete theatres"
ON public.theatres FOR DELETE
TO authenticated
USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 4. Screens Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Public read screens"
ON public.screens FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins insert screens"
ON public.screens FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins update screens"
ON public.screens FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins delete screens"
ON public.screens FOR DELETE
TO authenticated
USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 5. Seats Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Public read seats"
ON public.seats FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins insert seats"
ON public.seats FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins update seats"
ON public.seats FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins delete seats"
ON public.seats FOR DELETE
TO authenticated
USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 6. Shows Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Public read shows"
ON public.shows FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins insert shows"
ON public.shows FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins update shows"
ON public.shows FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins delete shows"
ON public.shows FOR DELETE
TO authenticated
USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 7. Banners Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Public read banners"
ON public.banners FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins insert banners"
ON public.banners FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins update banners"
ON public.banners FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins delete banners"
ON public.banners FOR DELETE
TO authenticated
USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 8. Bookings Policies
-- ----------------------------------------------------------------------------
-- Users can view only their own bookings; admins can view all
CREATE POLICY "Users read own bookings"
ON public.bookings FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

-- ----------------------------------------------------------------------------
-- 9. Booking Seats Policies (Realtime support)
-- ----------------------------------------------------------------------------
-- Public can read show_id, seat_id, status to power realtime seat maps
CREATE POLICY "Public read booking seats status"
ON public.booking_seats FOR SELECT
TO anon, authenticated
USING (true);

-- ----------------------------------------------------------------------------
-- 10. Payments Policies
-- ----------------------------------------------------------------------------
-- Users can view payments for their own bookings; admins can view all
CREATE POLICY "Users read own payments"
ON public.payments FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE b.id = booking_id AND (b.user_id = auth.uid() OR public.is_admin())
    )
);

-- ----------------------------------------------------------------------------
-- 11. Webhook Events Policies
-- ----------------------------------------------------------------------------
-- Only server (service role) or admins can view
CREATE POLICY "Admins read webhook events"
ON public.webhook_events FOR SELECT
TO authenticated
USING (public.is_admin());
-- ============================================================================
-- 05_cron.sql: Scheduled Background Jobs (pg_cron)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-seat-holds-every-minute') THEN
    PERFORM cron.unschedule('expire-seat-holds-every-minute');
  END IF;
  
  PERFORM cron.schedule(
    'expire-seat-holds-every-minute',
    '* * * * *',
    'SELECT public.expire_holds();'
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron setup note: %', SQLERRM;
END;
$$;
-- ============================================================================
-- 06_storage.sql: Storage Bucket and Policies
-- ============================================================================

-- Create public media bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access to media bucket
DROP POLICY IF EXISTS "Public media access" ON storage.objects;
CREATE POLICY "Public media access"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'media');

-- Admin upload access
DROP POLICY IF EXISTS "Admins upload media" ON storage.objects;
CREATE POLICY "Admins upload media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'media' AND public.is_admin()
);

-- Admin update access
DROP POLICY IF EXISTS "Admins update media" ON storage.objects;
CREATE POLICY "Admins update media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'media' AND public.is_admin()
);

-- Admin delete access
DROP POLICY IF EXISTS "Admins delete media" ON storage.objects;
CREATE POLICY "Admins delete media"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'media' AND public.is_admin()
);
