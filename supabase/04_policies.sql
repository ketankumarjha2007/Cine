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
