-- Supabase SQL editor, as postgres, AFTER deploying the promotion functions.
-- Configure Vault secrets first (see docs/promotions.md). No secrets are
-- stored in this file or in cron.job.command. Idempotent named cron job.
-- Supabase runs extension installation hooks even for CREATE EXTENSION IF
-- NOT EXISTS. Reissuing it for an enabled pg_cron can fail while its hook
-- revokes cron.job permissions. Skip the command entirely when installed.
do $$
begin
  if not exists (select 1 from pg_catalog.pg_extension where extname = 'pg_cron') then
    create extension if not exists pg_cron with schema pg_catalog;
  end if;
  if not exists (select 1 from pg_catalog.pg_extension where extname = 'pg_net') then
    create extension if not exists pg_net with schema extensions;
  end if;
end;
$$;

create or replace function private.request_promotion_rebuild()
returns bigint language plpgsql security definer set search_path = '' as $$
declare endpoint text; secret text;
begin
  -- Avoid an HTTP invocation on quiet ticks or while another worker holds a lease.
  if not private.promotion_rebuild_due(now()) then return null; end if;
  select decrypted_secret into endpoint from vault.decrypted_secrets where name='promotions_cron_url';
  select decrypted_secret into secret from vault.decrypted_secrets where name='promotions_cron_secret';
  if endpoint is null or secret is null then raise exception 'Promotion cron Vault secrets are not configured.'; end if;
  return net.http_get(url:=endpoint, headers:=jsonb_build_object('Authorization','Bearer ' || secret), timeout_milliseconds:=30000);
end;
$$;
revoke all on function private.request_promotion_rebuild() from public,anon,authenticated,service_role;
select cron.schedule('promotion-rebuilds', '* * * * *', $$select private.request_promotion_rebuild()$$);
