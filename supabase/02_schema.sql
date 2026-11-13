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
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
        'user'
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name);
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
