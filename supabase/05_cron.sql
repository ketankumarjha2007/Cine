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
