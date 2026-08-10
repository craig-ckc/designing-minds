-- Bundles become their own Collection, and Access Plans are retired.
--
-- Paste into the Supabase SQL editor. Safe to run more than once.
--
-- WHY -----------------------------------------------------------------------
-- `products` was three things at once: individual resources, bundles and
-- access plans, separated only by a "productKind" text column. Every bundle
-- field (bundleScope, includedProductSlugs, includedSubjects, includedTerms)
-- was therefore null on ~95% of rows, and "what is in this bundle?" had no
-- fixed answer — membership was partly an explicit slug list and partly a rule
-- evaluated at runtime (grade + includedSubjects + includedTerms; see
-- packages/cms/src/lib/entitlements.ts as it stood before this change).
--
-- After this patch:
--   * public.products         — individual resources only
--   * public.bundles          — a priced package
--   * public.bundle_products  — what is in it, as real foreign keys
--
-- Bundle membership is now EXPLICIT ONLY. The rule-based grants are resolved
-- into real rows below, so nothing a customer can reach today becomes
-- unreachable — the rules stop being a live mechanism, they don't stop having
-- been applied.
--
-- ACCESS PLANS --------------------------------------------------------------
-- The kind is retired. Plans nobody ever bought are deleted. Plans that appear
-- in a paid or fulfilled order are migrated into `bundles` with
-- published = false: withdrawn from sale, still resolvable, so the people who
-- paid for them keep their downloads. `orders.items` is a JSONB snapshot so
-- order history was never at risk — but issue-download resolves entitlements
-- by looking the purchased slug back up in the catalogue, and a deleted row
-- would have silently revoked access.
--
-- The notices at the end report what happened to each one.
--
-- ORDER OF OPERATIONS -------------------------------------------------------
-- Two things have to happen in a specific order and are easy to get wrong:
--   * catalog_products expands `select *`, so it holds stored references to
--     the columns being dropped. It must be dropped BEFORE them and rebuilt
--     after — Part 1 drops it, Part 3 recreates it.
--   * the cross-table slug uniqueness triggers would reject every migrated
--     bundle while the original product row still holds that slug, so they
--     are created in Part 3, once the originals are gone.
-- =========================================================================

-- =========================================================================
-- Part 1 — Structure
-- =========================================================================

-- Rebuilt in Part 3. Dropped here so Part 2 can drop the columns it depends on.
drop view if exists public.catalog_products;

create table if not exists public.bundles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  "shortDescription" text not null default '',
  "fullDescription" text not null default '',
  "priceZar" numeric(10,2) not null default 0,
  grade text not null,
  term text not null,
  year text not null,
  "bundleScope" text check ("bundleScope" in ('Term', 'Full Year')),
  featured boolean not null default false,
  published boolean not null default false,
  "sortOrder" integer not null default 0,
  seo jsonb not null default '{}',
  faqs text[] not null default '{}',
  "updatedAt" timestamptz not null default now()
);

comment on table public.bundles is
  'A priced package of individual resources. Subjects, terms, file count and '
  'value are DERIVED from bundle_products — never stored here, so a bundle can '
  'never disagree with what it contains.';

-- Membership as real foreign keys: deleting a resource removes it from every
-- bundle, instead of leaving a dangling slug inside a text[].
create table if not exists public.bundle_products (
  "bundleId" uuid not null references public.bundles (id) on delete cascade,
  "productId" uuid not null references public.products (id) on delete cascade,
  "sortOrder" integer not null default 0,
  primary key ("bundleId", "productId")
);

create index if not exists bundle_products_product_idx on public.bundle_products ("productId");
create index if not exists bundles_published_idx on public.bundles (published);

drop trigger if exists bundles_set_updated_at on public.bundles;
create trigger bundles_set_updated_at
before update on public.bundles
for each row execute procedure public.set_updated_at();

-- ---- Carts hold either a resource or a bundle ----------------------------
alter table public.cart_items alter column "productId" drop not null;
alter table public.cart_items
  add column if not exists "bundleId" uuid references public.bundles (id) on delete cascade;

alter table public.cart_items drop constraint if exists cart_items_one_target;
alter table public.cart_items
  add constraint cart_items_one_target check (num_nonnulls("productId", "bundleId") = 1);

-- The original unique ("cartId","productId") still guards resources (NULLs
-- never collide); bundles need their own partial unique index.
create unique index if not exists cart_items_cart_bundle_key
  on public.cart_items ("cartId", "bundleId")
  where "bundleId" is not null;

-- ---- Redirects can point at a bundle -------------------------------------
-- The original constraint was created inline from a quoted column name, so
-- Postgres named it with a capital T. An unquoted DROP folds to lower case and
-- silently misses it, leaving the old 'product'-only check in force alongside
-- the new one — so quote it, and drop the lower-case spelling too in case an
-- earlier run of this patch created one.
alter table public.slug_redirects drop constraint if exists "slug_redirects_entityType_check";
alter table public.slug_redirects drop constraint if exists slug_redirects_entitytype_check;
alter table public.slug_redirects drop constraint if exists slug_redirects_entity_type_allowed;
alter table public.slug_redirects
  add constraint slug_redirects_entity_type_allowed check ("entityType" in ('product', 'bundle'));

-- =========================================================================
-- Part 2 — Data migration, then retirement of productKind.
--
-- Guarded on products."productKind" still existing, so a second run is a
-- no-op rather than an error.
-- =========================================================================

do $migrate$
declare
  v_bundles     integer := 0;
  v_explicit    integer := 0;
  v_rules       integer := 0;
  v_plans_kept  integer := 0;
  v_plans_total integer := 0;
  v_carts       integer := 0;
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'productKind'
  ) then
    raise notice 'productKind is already gone — this migration has already run. Nothing to do.';
    return;
  end if;

  ---------------------------------------------------------------------------
  -- 1. Bundles move across, keeping their id and slug.
  --    The id matters: cart_items rows already point at it.
  ---------------------------------------------------------------------------
  insert into public.bundles (
    id, slug, title, "shortDescription", "fullDescription", "priceZar",
    grade, term, year, "bundleScope", featured, published, "sortOrder",
    seo, faqs, "updatedAt"
  )
  select
    p.id, p.slug, p.title, p."shortDescription", p."fullDescription", p."priceZar",
    p.grade, p.term, p.year, p."bundleScope", p.featured, p.published, p."sortOrder",
    p.seo, p.faqs, p."updatedAt"
  from public.products p
  where p."productKind" = 'Bundle'
  on conflict (id) do nothing;
  get diagnostics v_bundles = row_count;

  ---------------------------------------------------------------------------
  -- 2. Access Plans: keep the ones somebody paid for, withdrawn from sale.
  ---------------------------------------------------------------------------
  insert into public.bundles (
    id, slug, title, "shortDescription", "fullDescription", "priceZar",
    grade, term, year, "bundleScope", featured, published, "sortOrder",
    seo, faqs, "updatedAt"
  )
  select
    p.id, p.slug, p.title, p."shortDescription", p."fullDescription", p."priceZar",
    p.grade, p.term, p.year,
    case when p."accessPeriod" = 'Year' then 'Full Year' else 'Term' end,
    false,   -- never re-feature a retired plan
    false,   -- withdrawn from sale; still resolvable for the people who own it
    p."sortOrder", p.seo, p.faqs, p."updatedAt"
  from public.products p
  where p."productKind" = 'Access Plan'
    and exists (
      select 1
      from public.orders o
      cross join lateral jsonb_array_elements(o.items) as item
      where o.status in ('paid', 'fulfilled')
        and item ->> 'productSlug' = p.slug
    )
  on conflict (id) do nothing;
  get diagnostics v_plans_kept = row_count;

  ---------------------------------------------------------------------------
  -- 3a. Membership from the explicit includedProductSlugs list.
  ---------------------------------------------------------------------------
  insert into public.bundle_products ("bundleId", "productId", "sortOrder")
  select b.id, p.id, coalesce(p."sortOrder", 0)
  from public.products src
  join public.bundles b on b.id = src.id
  cross join lateral unnest(coalesce(src."includedProductSlugs", '{}'::text[])) as s(slug)
  join public.products p on p.slug = s.slug and p."productKind" = 'Single'
  on conflict ("bundleId", "productId") do nothing;
  get diagnostics v_explicit = row_count;

  ---------------------------------------------------------------------------
  -- 3b. Membership from the rule-based grants, materialised.
  --
  --     Mirrors resourceUnlockedByPlan() exactly as it behaved: rules apply
  --     only when the package carries at least one of includedSubjects /
  --     includedTerms; the grant is scoped to the package's own grade; an
  --     empty includedTerms means every term; and a subject matches when the
  --     resource carries ANY listed subject.
  ---------------------------------------------------------------------------
  insert into public.bundle_products ("bundleId", "productId", "sortOrder")
  select b.id, p.id, coalesce(p."sortOrder", 0)
  from public.products src
  join public.bundles b on b.id = src.id
  join public.products p
    on p."productKind" = 'Single'
   and p.grade = src.grade
   and (
     coalesce(cardinality(src."includedTerms"), 0) = 0
     or p.term = any (src."includedTerms")
   )
   and (
     coalesce(cardinality(src."includedSubjects"), 0) = 0
     or p.subjects && src."includedSubjects"
   )
  where coalesce(cardinality(src."includedSubjects"), 0) > 0
     or coalesce(cardinality(src."includedTerms"), 0) > 0
  on conflict ("bundleId", "productId") do nothing;
  get diagnostics v_rules = row_count;

  ---------------------------------------------------------------------------
  -- 4. Repoint carts: same id, different column. Must run before the source
  --    rows go, while the productId foreign key still resolves.
  ---------------------------------------------------------------------------
  update public.cart_items ci
  set "bundleId" = ci."productId",
      "productId" = null
  where ci."productId" in (select id from public.bundles);
  get diagnostics v_carts = row_count;

  ---------------------------------------------------------------------------
  -- 5. The old rows go. Anything still referenced as a bundle now lives in
  --    public.bundles under the same id. Carts holding an Access Plan that
  --    nobody ever bought cascade away with it, which is correct — it is no
  --    longer purchasable.
  ---------------------------------------------------------------------------
  delete from public.products p where p."productKind" = 'Access Plan';
  get diagnostics v_plans_total = row_count;

  delete from public.products p where p."productKind" = 'Bundle';

  ---------------------------------------------------------------------------
  -- 6. products is individual resources only — drop the columns that were
  --    only ever populated for the other two kinds.
  ---------------------------------------------------------------------------
  alter table public.products drop column if exists "productKind";
  alter table public.products drop column if exists "bundleScope";
  alter table public.products drop column if exists "accessPeriod";
  alter table public.products drop column if exists "includedGrades";
  alter table public.products drop column if exists "deliveryRules";
  alter table public.products drop column if exists "renewalNotes";
  alter table public.products drop column if exists "includedProductSlugs";
  alter table public.products drop column if exists "includedSubjects";
  alter table public.products drop column if exists "includedTerms";

  -- "Product kind" is no longer a choice anybody makes.
  delete from public.value_lists where key = 'productKinds';

  raise notice 'Bundles migrated:              %', v_bundles;
  raise notice 'Access Plans retained (owned): %  -> bundles, published = false', v_plans_kept;
  raise notice 'Access Plans deleted:          %', v_plans_total - v_plans_kept;
  raise notice 'Memberships from slug lists:   %', v_explicit;
  raise notice 'Memberships from rules:        %', v_rules;
  raise notice 'Cart rows repointed:           %', v_carts;
end
$migrate$;

-- =========================================================================
-- Part 3 — Read paths and constraints that had to wait for Part 2.
-- =========================================================================

-- ---- Cross-table slug uniqueness -----------------------------------------
-- Products and bundles share the /shop/<slug> URL space, so a slug has to be
-- unique across BOTH tables. A check constraint can't span tables; this can.
create or replace function public.assert_catalog_slug_unique()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_table_name = 'products' then
    if exists (select 1 from public.bundles b where b.slug = new.slug) then
      raise exception 'Slug "%" is already used by a bundle.', new.slug
        using errcode = 'unique_violation';
    end if;
  else
    if exists (select 1 from public.products p where p.slug = new.slug) then
      raise exception 'Slug "%" is already used by a product.', new.slug
        using errcode = 'unique_violation';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists products_slug_unique_across_catalog on public.products;
create trigger products_slug_unique_across_catalog
before insert or update of slug on public.products
for each row execute procedure public.assert_catalog_slug_unique();

drop trigger if exists bundles_slug_unique_across_catalog on public.bundles;
create trigger bundles_slug_unique_across_catalog
before insert or update of slug on public.bundles
for each row execute procedure public.assert_catalog_slug_unique();

-- ---- Public product catalogue, minus the retired columns ------------------
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
    p."updatedAt"
  from public.products p
  where p.published = true;
$$;

revoke execute on function private.published_products() from public;
grant execute on function private.published_products() to anon, authenticated;

create or replace view public.catalog_products
with (security_invoker = on) as
  select * from private.published_products();

grant select on public.catalog_products to anon, authenticated;

-- ---- Public bundle catalogue ---------------------------------------------
-- Mirrors the products pattern: a SECURITY DEFINER function in the private
-- schema filters, a security_invoker view exposes it, so anon/authenticated
-- read the published catalogue without any grant on the base tables.
--
-- Only PUBLISHED members are listed. An unpublished resource isn't purchasable
-- or downloadable, so counting it as bundle contents would overstate the
-- value. Server-side entitlement checks read bundle_products directly.
create or replace function private.published_bundles()
returns table (
  id uuid,
  slug text,
  title text,
  "shortDescription" text,
  "fullDescription" text,
  "priceZar" numeric(10,2),
  grade text,
  term text,
  year text,
  "bundleScope" text,
  featured boolean,
  published boolean,
  "sortOrder" integer,
  seo jsonb,
  faqs text[],
  "updatedAt" timestamptz,
  "includedProductIds" uuid[],
  "includedProductSlugs" text[]
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    b.id,
    b.slug,
    b.title,
    b."shortDescription",
    b."fullDescription",
    b."priceZar",
    b.grade,
    b.term,
    b.year,
    b."bundleScope",
    b.featured,
    b.published,
    b."sortOrder",
    b.seo,
    b.faqs,
    b."updatedAt",
    coalesce(members.ids, '{}'::uuid[])   as "includedProductIds",
    coalesce(members.slugs, '{}'::text[]) as "includedProductSlugs"
  from public.bundles b
  left join lateral (
    select
      array_agg(p.id order by bp."sortOrder", p."sortOrder", p.title)   as ids,
      array_agg(p.slug order by bp."sortOrder", p."sortOrder", p.title) as slugs
    from public.bundle_products bp
    join public.products p on p.id = bp."productId"
    where bp."bundleId" = b.id
      and p.published = true
  ) members on true
  where b.published = true;
$$;

revoke execute on function private.published_bundles() from public;
grant execute on function private.published_bundles() to anon, authenticated;

drop view if exists public.catalog_bundles;
create view public.catalog_bundles
with (security_invoker = on) as
  select * from private.published_bundles();

grant select on public.catalog_bundles to anon, authenticated;

-- ---- Admin membership write ----------------------------------------------
-- The admin runs in the browser and has no transaction of its own, so
-- replacing a bundle's membership row by row could leave it half-written.
-- This does the whole swap inside one call.
create or replace function public.set_bundle_products(p_bundle_id uuid, p_product_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator access is required.' using errcode = 'insufficient_privilege';
  end if;

  delete from public.bundle_products
  where "bundleId" = p_bundle_id
    and "productId" <> all (coalesce(p_product_ids, '{}'::uuid[]));

  insert into public.bundle_products ("bundleId", "productId", "sortOrder")
  select p_bundle_id, ids.id, ids.ord::int
  from unnest(coalesce(p_product_ids, '{}'::uuid[])) with ordinality as ids(id, ord)
  on conflict ("bundleId", "productId") do update set "sortOrder" = excluded."sortOrder";
end;
$$;

revoke execute on function public.set_bundle_products(uuid, uuid[]) from public, anon;
grant execute on function public.set_bundle_products(uuid, uuid[]) to authenticated;

-- ---- Slug redirects cover bundles too ------------------------------------
-- Products and bundles share /shop/<slug>, so renaming a bundle has to leave
-- a redirect behind exactly as renaming a product does. The entity type now
-- comes from whichever table fired the trigger.
create or replace function public.handle_product_slug_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  old_path text := '/shop/' || old.slug;
  new_path text := '/shop/' || new.slug;
  entity   text := case when tg_table_name = 'bundles' then 'bundle' else 'product' end;
begin
  if new.slug is distinct from old.slug then
    update public.slug_redirects
      set "toPath" = new_path
      where "toPath" = old_path;

    delete from public.slug_redirects where "fromPath" = new_path;

    insert into public.slug_redirects ("entityType", "entityId", "fromPath", "toPath", "statusCode", "createdBy")
    values (entity, new.id, old_path, new_path, 301, auth.uid())
    on conflict ("fromPath") do update
      set "toPath" = excluded."toPath",
          "entityId" = excluded."entityId",
          "entityType" = excluded."entityType",
          "statusCode" = excluded."statusCode";
  end if;
  return new;
end;
$$;

revoke execute on function public.handle_product_slug_change() from public, anon, authenticated;

drop trigger if exists bundles_slug_redirect on public.bundles;
create trigger bundles_slug_redirect
after update of slug on public.bundles
for each row execute procedure public.handle_product_slug_change();

-- A redirect stays live if EITHER catalogue serves its target. Without this,
-- every redirect left behind by a renamed bundle would be dropped from the
-- build feed the moment bundles stopped being products.
create or replace function private.active_slug_redirects()
returns setof public.slug_redirects
language sql
stable
security definer
set search_path = ''
as $$
  select sr.*
  from public.slug_redirects sr
  where exists (
      select 1
      from public.products p
      where p.published = true
        and ('/shop/' || p.slug) = sr."toPath"
    )
     or exists (
      select 1
      from public.bundles b
      where b.published = true
        and ('/shop/' || b.slug) = sr."toPath"
    );
$$;

revoke execute on function private.active_slug_redirects() from public;
grant execute on function private.active_slug_redirects() to anon, authenticated;

-- ---- RLS -----------------------------------------------------------------
alter table public.bundles enable row level security;
alter table public.bundle_products enable row level security;

drop policy if exists "Admin write bundles" on public.bundles;
create policy "Admin write bundles" on public.bundles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admin write bundle products" on public.bundle_products;
create policy "Admin write bundle products" on public.bundle_products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
