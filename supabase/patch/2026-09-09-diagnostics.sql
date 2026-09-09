-- Searchable operational events. Apply before enabling DIAGNOSTICS_ENABLED.
-- Browser submissions are untrusted, write-only, sanitized by the API, and rate-limited here.
begin;

create table if not exists public.diagnostic_events (
  id uuid primary key,
  "receivedAt" timestamptz not null default now(),
  "occurredAt" timestamptz not null,
  sequence integer not null default 0 check (sequence between 0 and 1000000),
  source text not null check (source in ('browser', 'server')),
  level text not null check (level in ('info', 'warning', 'error')),
  event text not null check (length(event) <= 64),
  route text not null check (length(route) <= 100),
  "requestId" uuid,
  "sessionId" uuid,
  "orderId" uuid,
  status integer check (status between 0 and 599),
  "durationMs" integer check ("durationMs" between 0 and 3600000),
  "errorKind" text check (length("errorKind") <= 32),
  code text check (length(code) <= 8),
  asset text check (length(asset) <= 150),
  release text check (length(release) <= 40)
);
create index if not exists diagnostic_events_timeline on public.diagnostic_events ("occurredAt" desc, sequence desc, id desc);
create index if not exists diagnostic_events_received on public.diagnostic_events ("receivedAt" desc);
create index if not exists diagnostic_events_request on public.diagnostic_events ("requestId", "receivedAt" desc);
create index if not exists diagnostic_events_session on public.diagnostic_events ("sessionId", "receivedAt" desc);
create index if not exists diagnostic_events_order on public.diagnostic_events ("orderId", "receivedAt" desc);
create index if not exists diagnostic_events_level on public.diagnostic_events (level, "receivedAt" desc);
alter table public.diagnostic_events enable row level security;
revoke all on public.diagnostic_events from public, anon, authenticated;
grant select on public.diagnostic_events to authenticated;
grant all on public.diagnostic_events to service_role;
drop policy if exists "Admins read diagnostics" on public.diagnostic_events;
create policy "Admins read diagnostics" on public.diagnostic_events
  for select to authenticated using (public.is_admin());

-- Only the server can execute this RPC. Serialization makes limits effective
-- across concurrent serverless instances. Duplicate retries keep their event IDs.
create or replace function public.record_diagnostic_events(p_events jsonb)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  n integer;
  session_entry record;
begin
  if jsonb_typeof(p_events) <> 'array' then return false; end if;
  n := jsonb_array_length(p_events);
  if n < 1 or n > 30 or octet_length(p_events::text) > 40000 then return false; end if;
  perform pg_advisory_xact_lock(93470909);
  if (select count(*) from public.diagnostic_events where "receivedAt" > now() - interval '1 hour') + n > 10000 then
    return false;
  end if;
  if exists (select 1 from jsonb_array_elements(p_events) e where e->>'source' = 'browser') then
    if (select count(*) from public.diagnostic_events where source = 'browser' and "receivedAt" > now() - interval '1 minute') + n > 600 then
      return false;
    end if;
    for session_entry in
      select (e->>'sessionId')::uuid as session_id, count(*) as batch_count
      from jsonb_array_elements(p_events) e where e->>'source' = 'browser' group by 1
    loop
      if (select count(*) from public.diagnostic_events where source = 'browser'
        and "sessionId" is not distinct from session_entry.session_id and "receivedAt" > now() - interval '1 minute') + session_entry.batch_count > 120 then
        return false;
      end if;
    end loop;
  end if;
  insert into public.diagnostic_events (id, "occurredAt", sequence, source, level, event, route, "requestId", "sessionId", "orderId", status, "durationMs", "errorKind", code, asset, release)
  select x.id, x."occurredAt", coalesce(x.sequence, 0), x.source, x.level, x.event, x.route, x."requestId", x."sessionId", x."orderId", x.status, x."durationMs", x."errorKind", x.code, x.asset, x.release
  from jsonb_to_recordset(p_events) as x(id uuid, "occurredAt" timestamptz, sequence integer, source text, level text, event text, route text,
    "requestId" uuid, "sessionId" uuid, "orderId" uuid, status integer, "durationMs" integer, "errorKind" text, code text, asset text, release text)
  on conflict (id) do nothing;
  return true;
end;
$$;
revoke all on function public.record_diagnostic_events(jsonb) from public, anon, authenticated;
grant execute on function public.record_diagnostic_events(jsonb) to service_role;

-- Enable Supabase Cron and run the companion retention patch before enabling collection.
commit;
