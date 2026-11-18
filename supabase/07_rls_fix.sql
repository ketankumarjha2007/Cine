-- ============================================================================
-- 07_rls_fix.sql: Ensure RLS is enabled on ALL public tables
-- Run this in Supabase SQL Editor if Supabase security advisor flagged missing RLS
-- ============================================================================

-- Core tables (may already be enabled, ALTER is idempotent)
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movies            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theatres          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screens           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shows             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_seats     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events    ENABLE ROW LEVEL SECURITY;

-- Verify RLS status
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled,
  forcerowsecurity AS rls_forced
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
