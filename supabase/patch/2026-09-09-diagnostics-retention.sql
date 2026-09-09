-- Run in the Supabase SQL editor as postgres, after the diagnostics table migration.
-- Install Cron first so a fresh project has the cron schema and scheduling API.
create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

-- Idempotent named job; keeps at most 30 days plus the daily cleanup interval.
select cron.schedule(
  'diagnostics-retention', '15 2 * * *',
  $$delete from public.diagnostic_events where "receivedAt" < now() - interval '30 days'$$
);
