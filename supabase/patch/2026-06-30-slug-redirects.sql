-- System-managed product slug redirects.
--
-- Product Detail pages are public and indexable, so a slug change must leave a
-- permanent redirect from the old URL to the new canonical URL (see the web
-- static-generation design). Redirects are SYSTEM-managed: the admin never
-- creates, edits, or deletes them, and they are not a CMS collection. A trigger
-- on public.products records them automatically when a slug changes.
--
-- Safe to run once on an existing project; folded into schema.sql for fresh setups.

create table if not exists public.slug_redirects (
  id uuid primary key default gen_random_uuid(),
  "entityType" text not null default 'product' check ("entityType" in ('product')),
  "entityId" uuid,
  "fromPath" text not null unique,
  "toPath" text not null,
  "statusCode" integer not null default 301 check ("statusCode" in (301, 308)),
  "createdAt" timestamptz not null default now(),
  "createdBy" uuid references auth.users (id) on delete set null,
  constraint slug_redirects_from_not_to check ("fromPath" <> "toPath")
);

-- Chain collapse rewrites existing rows by their toPath, so index it.
create index if not exists slug_redirects_to_path_idx on public.slug_redirects ("toPath");

-- Records old -> new whenever a product slug changes, and collapses chains so
-- /product/a -> /product/b -> /product/c becomes a -> c and b -> c. Runs as
-- definer so it can write slug_redirects regardless of who updated the product.
create or replace function public.handle_product_slug_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  old_path text := '/product/' || old.slug;
  new_path text := '/product/' || new.slug;
begin
  if new.slug is distinct from old.slug then
    -- Collapse chains: anything that pointed at the old slug now points at the new one.
    update public.slug_redirects
      set "toPath" = new_path
      where "toPath" = old_path;

    -- The new (canonical) slug must never be a redirect source.
    delete from public.slug_redirects where "fromPath" = new_path;

    -- Record the old URL -> new canonical URL.
    insert into public.slug_redirects ("entityType", "entityId", "fromPath", "toPath", "statusCode", "createdBy")
    values ('product', new.id, old_path, new_path, 301, auth.uid())
    on conflict ("fromPath") do update
      set "toPath" = excluded."toPath",
          "entityId" = excluded."entityId",
          "statusCode" = excluded."statusCode";
  end if;
  return new;
end;
$$;

revoke execute on function public.handle_product_slug_change() from public, anon, authenticated;

drop trigger if exists products_slug_redirect on public.products;
create trigger products_slug_redirect
after update of slug on public.products
for each row execute procedure public.handle_product_slug_change();

-- Public, build-time read surface: only redirects whose target is a published
-- product. Sits in the private schema (not exposed over REST) so anon can read
-- the sanitized result through the security_invoker view without touching the
-- slug_redirects table directly. This omits redirects to unpublished products
-- from production output, as the design requires.
create or replace function private.active_slug_redirects()
returns setof public.slug_redirects
language sql
stable
security definer
set search_path = ''
as $$
  select sr.*
  from public.slug_redirects sr
  where sr."entityType" = 'product'
    and exists (
      select 1
      from public.products p
      where p.published = true
        and ('/product/' || p.slug) = sr."toPath"
    );
$$;

revoke execute on function private.active_slug_redirects() from public;
grant execute on function private.active_slug_redirects() to anon, authenticated;

create or replace view public.active_slug_redirects
with (security_invoker = on) as
  select * from private.active_slug_redirects();

grant select on public.active_slug_redirects to anon, authenticated;

-- Base table is locked down: no public reads (the view above is the public
-- surface); admins may read for support/debugging. The trigger is definer so it
-- writes regardless of these policies; the admin never writes directly.
alter table public.slug_redirects enable row level security;
drop policy if exists "Admin reads slug redirects" on public.slug_redirects;
create policy "Admin reads slug redirects" on public.slug_redirects
  for select to authenticated using (public.is_admin());
