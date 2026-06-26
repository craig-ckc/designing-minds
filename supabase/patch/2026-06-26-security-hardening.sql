-- Security hardening for the Supabase advisor findings. Safe to re-run.
--
--   1. public.set_updated_at         -> pin search_path
--   2. public.has_role / is_admin    -> SECURITY INVOKER, EXECUTE only for authenticated
--   3. public.handle_new_user        -> stays SECURITY DEFINER (trigger), EXECUTE revoked from REST
--   4. public.catalog_products       -> security_invoker view over a private SECURITY DEFINER function
--
-- NOTE: "Leaked password protection" is NOT fixable in SQL. Enable it in the
-- Supabase Dashboard: Authentication > Policies (Password security) > turn on
-- "Check passwords against HaveIBeenPwned", or set
-- `auth.password_hibp_enabled = true` via the Management API / config.toml.

-- 1. Pin the search_path on the updated-at trigger function. It only needs
--    now() (pg_catalog, always resolvable), so an empty search_path is safest.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$;

-- 2. Role helpers only ever read the caller's OWN role, which the
--    "User reads own role" RLS policy already permits, so they can run as the
--    caller instead of as a definer. RLS policies referencing them are
--    unchanged. EXECUTE is limited to signed-in users (off the anon surface).
create or replace function public.has_role(expected_role text)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur."userId" = auth.uid()
      and ur.role = expected_role
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select public.has_role('admin');
$$;

revoke execute on function public.has_role(text) from public, anon;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.has_role(text) to authenticated;
grant execute on function public.is_admin() to authenticated;

-- 3. handle_new_user must stay SECURITY DEFINER so the auth trigger can seed
--    the locked customers/user_roles/carts tables, but it should never be
--    callable through /rest/v1/rpc. The trigger fires regardless of EXECUTE.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- 4. Rebuild catalog_products as a security_invoker view. The published-row
--    filter and storage-key stripping move into a SECURITY DEFINER function in
--    the private schema (not exposed over REST), so anon/authenticated can read
--    the sanitized catalogue without any grant on the products table.
create schema if not exists private;

create or replace function private.published_products()
returns setof public.products
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    p.slug,
    p.title,
    p."shortDescription",
    p."fullDescription",
    p."priceZar",
    p.grade,
    p.term,
    p.year,
    p."productKind",
    p."resourceFormat",
    p.subjects,
    p.marks,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', file ->> 'id',
            'label', file ->> 'label',
            'filename', file ->> 'filename'
          )
          order by file ->> 'id'
        )
        from jsonb_array_elements(p."purchasedFiles") as file
      ),
      '[]'::jsonb
    ),
    p.featured,
    p.published,
    p."sortOrder",
    p.seo,
    p.faqs,
    p."updatedAt",
    p."bundleScope",
    p."accessPeriod",
    p."includedGrades",
    p."deliveryRules",
    p."renewalNotes",
    p."includedProductSlugs",
    p."includedSubjects",
    p."includedTerms"
  from public.products p
  where p.published = true;
$$;

revoke execute on function private.published_products() from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.published_products() to anon, authenticated;

drop view if exists public.catalog_products;
create view public.catalog_products
with (security_invoker = on) as
  select * from private.published_products();

grant select on public.catalog_products to anon, authenticated;
