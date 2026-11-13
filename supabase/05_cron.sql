-- ============================================================================
-- 05_cron.sql: Scheduled Background Jobs (pg_cron)
-- ============================================================================

-- Enable pg_cron schedule to expire abandoned seat holds every 1 minute
SELECT cron.schedule(
    'expire-seat-holds-every-minute',
    '* * * * *',
    $$SELECT public.expire_holds();$$
);
