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
