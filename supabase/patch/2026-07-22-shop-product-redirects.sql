-- Align system-managed Product Detail redirects with the canonical
-- /shop/[product-slug] route. Preserve any legacy /product/* sources as useful
-- inbound redirects, while adding the equivalent /shop/* source for real slug
-- changes recorded by the previous trigger.

update public.slug_redirects
set "toPath" = regexp_replace("toPath", '^/product/', '/shop/')
where "toPath" like '/product/%';

insert into public.slug_redirects (
  id,
  "entityType",
  "entityId",
  "fromPath",
  "toPath",
  "statusCode",
  "createdAt",
  "createdBy"
)
select
  gen_random_uuid(),
  "entityType",
  "entityId",
  regexp_replace("fromPath", '^/product/', '/shop/'),
  "toPath",
  "statusCode",
  "createdAt",
  "createdBy"
from public.slug_redirects
where "fromPath" like '/product/%'
  and regexp_replace("fromPath", '^/product/', '/shop/') <> "toPath"
on conflict ("fromPath") do update
set "toPath" = excluded."toPath",
    "entityId" = excluded."entityId",
    "statusCode" = excluded."statusCode";

create or replace function public.handle_product_slug_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  old_path text := '/shop/' || old.slug;
  new_path text := '/shop/' || new.slug;
begin
  if new.slug is distinct from old.slug then
    update public.slug_redirects
      set "toPath" = new_path
      where "toPath" = old_path;

    delete from public.slug_redirects where "fromPath" = new_path;

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
        and ('/shop/' || p.slug) = sr."toPath"
    );
$$;

revoke execute on function private.active_slug_redirects() from public;
grant execute on function private.active_slug_redirects() to anon, authenticated;
