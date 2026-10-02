-- Publish workflow: Draft / Queued / Published / Archived (2026-10-01).
--
-- Paste into the Supabase SQL editor after the other patches. Safe to re-run.
-- Apply it, then deploy functions + web + admin straight away — do not
-- publish the site from the OLD admin in between (see ORDER below).
--
-- WHAT CHANGED -------------------------------------------------------------
--   * products, bundles, faqs and testimonials each gain:
--       status        'draft' | 'queued' | 'published' | 'archived'
--       live          jsonb — the copy the website, cart and checkout serve
--       "publishedAt" when `live` last changed (promoted or removed)
--   * `published` is no longer an editor's choice. It is kept, maintained ONLY
--     by public.publish_site_content(), and now means "has a live copy" — so
--     every existing reader of it (slug redirects, checkout, the web
--     formatters) keeps its meaning without a rewrite.
--   * The public catalogue (catalog_products, catalog_bundles, and the new
--     catalog_faqs / catalog_testimonials) reads the LIVE copy, never the
--     working row. FAQs and testimonials lose their public table policy.
--   * public.publish_site_content() promotes every Queued record to live and
--     removes every Archived record's live copy, in one transaction. Only the
--     service role may call it — the functions app does, after requireAdmin.
--
-- WHY ----------------------------------------------------------------------
-- Before this, a save wrote straight to the rows the cart and checkout read,
-- while the static pages kept the old build: a saved-but-unpublished price
-- was charged at checkout while the page still showed the old one. And there
-- was no honest way to keep working on a published record without the next
-- publish shipping it. Keeping the live copy separately fixes both: Draft
-- edits stay out of everything public until they are queued AND published.
--
-- ORDER --------------------------------------------------------------------
-- Existing published rows are backfilled as Published with their current
-- content as the live copy; unpublished rows become Draft. "publishedAt" is
-- backfilled from "updatedAt", so the new admin flags anything saved since the
-- last site build as still needing a publish.

begin;

-- Session-local switch read by the guard trigger and set_updated_at below.
-- Only publish_site_content() (and this backfill) turn it on.
select set_config('app.publishing', 'on', true);

-- 1. Columns --------------------------------------------------------------

alter table public.products add column if not exists status text not null default 'draft';
alter table public.products add column if not exists live jsonb;
alter table public.products add column if not exists "publishedAt" timestamptz;
alter table public.bundles add column if not exists status text not null default 'draft';
alter table public.bundles add column if not exists live jsonb;
alter table public.bundles add column if not exists "publishedAt" timestamptz;
alter table public.faqs add column if not exists status text not null default 'draft';
alter table public.faqs add column if not exists live jsonb;
alter table public.faqs add column if not exists "publishedAt" timestamptz;
alter table public.testimonials add column if not exists status text not null default 'draft';
alter table public.testimonials add column if not exists live jsonb;
alter table public.testimonials add column if not exists "publishedAt" timestamptz;

alter table public.products drop constraint if exists products_status_check;
alter table public.products add constraint products_status_check check (status in ('draft', 'queued', 'published', 'archived'));
alter table public.bundles drop constraint if exists bundles_status_check;
alter table public.bundles add constraint bundles_status_check check (status in ('draft', 'queued', 'published', 'archived'));
alter table public.faqs drop constraint if exists faqs_status_check;
alter table public.faqs add constraint faqs_status_check check (status in ('draft', 'queued', 'published', 'archived'));
alter table public.testimonials drop constraint if exists testimonials_status_check;
alter table public.testimonials add constraint testimonials_status_check check (status in ('draft', 'queued', 'published', 'archived'));

-- New rows start hidden; publish_site_content() is what sets this to true.
alter table public.faqs alter column published set default false;
alter table public.testimonials alter column published set default false;

-- 2. Helpers --------------------------------------------------------------

-- The live copy of a row: everything except the publish bookkeeping itself.
create or replace function private.live_copy(row_data jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select row_data - 'status' - 'live' - 'published' - 'publishedAt';
$$;

-- What counts as "the content changed": the live copy minus the edit stamp and
-- the bundle membership snapshot (membership has its own check in
-- set_bundle_products).
create or replace function private.content_of(row_data jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select private.live_copy(row_data) - 'updatedAt' - 'includedProductIds';
$$;

-- A bundle's live copy also freezes its membership, in display order.
create or replace function private.bundle_live_copy(b public.bundles)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select private.live_copy(to_jsonb(b)) || jsonb_build_object(
    'includedProductIds',
    coalesce(
      (
        select jsonb_agg(bp."productId" order by bp."sortOrder", p."sortOrder", p.title)
        from public.bundle_products bp
        join public.products p on p.id = bp."productId"
        where bp."bundleId" = b.id
      ),
      '[]'::jsonb
    )
  );
$$;

-- 3. Backfill (idempotent: only rows that have never had a live copy) ------

update public.products p
set status = 'published', live = private.live_copy(to_jsonb(p)), "publishedAt" = p."updatedAt"
where p.published = true and p.live is null and p."publishedAt" is null;

update public.bundles b
set status = 'published', live = private.bundle_live_copy(b), "publishedAt" = b."updatedAt"
where b.published = true and b.live is null and b."publishedAt" is null;

update public.faqs f
set status = 'published', live = private.live_copy(to_jsonb(f)), "publishedAt" = f."updatedAt"
where f.published = true and f.live is null and f."publishedAt" is null;

update public.testimonials t
set status = 'published', live = private.live_copy(to_jsonb(t)), "publishedAt" = t."updatedAt"
where t.published = true and t.live is null and t."publishedAt" is null;

-- 4. Guard: editors can't write the live copy, or claim "published" -------
--
-- The admin sends whole records back on save, including whatever `status` it
-- last read. Without this, a CSV import or a background upload could leave a
-- changed row reading Published while the live copy is older.

create or replace function private.guard_publish_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(current_setting('app.publishing', true), '') = 'on' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.live := null;
    new.published := false;
    new."publishedAt" := null;
    if new.status = 'published' then
      new.status := 'queued';
    end if;
    return new;
  end if;

  new.live := old.live;
  new.published := old.published;
  new."publishedAt" := old."publishedAt";
  if new.status = 'published'
     and (old.status <> 'published'
          or old.live is null
          or private.content_of(to_jsonb(new)) is distinct from private.content_of(old.live)) then
    new.status := 'queued';
  end if;
  return new;
end;
$$;

drop trigger if exists products_guard_publish on public.products;
create trigger products_guard_publish
before insert or update on public.products
for each row execute procedure private.guard_publish_columns();

drop trigger if exists bundles_guard_publish on public.bundles;
create trigger bundles_guard_publish
before insert or update on public.bundles
for each row execute procedure private.guard_publish_columns();

drop trigger if exists faqs_guard_publish on public.faqs;
create trigger faqs_guard_publish
before insert or update on public.faqs
for each row execute procedure private.guard_publish_columns();

drop trigger if exists testimonials_guard_publish on public.testimonials;
create trigger testimonials_guard_publish
before insert or update on public.testimonials
for each row execute procedure private.guard_publish_columns();

-- Publishing must not look like an edit: "updatedAt" stays the editor's time.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(current_setting('app.publishing', true), '') = 'on' then
    return new;
  end if;
  new."updatedAt" = now();
  return new;
end;
$$;

-- A membership change on a Published bundle is a content change too.
create or replace function public.set_bundle_products(p_bundle_id uuid, p_product_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  before_ids uuid[];
  after_ids uuid[];
begin
  if not public.is_admin() then
    raise exception 'Administrator access is required.' using errcode = 'insufficient_privilege';
  end if;

  select array_agg("productId" order by "sortOrder") into before_ids
  from public.bundle_products where "bundleId" = p_bundle_id;

  delete from public.bundle_products
  where "bundleId" = p_bundle_id
    and "productId" <> all (coalesce(p_product_ids, '{}'::uuid[]));

  insert into public.bundle_products ("bundleId", "productId", "sortOrder")
  select p_bundle_id, ids.id, ids.ord::int
  from unnest(coalesce(p_product_ids, '{}'::uuid[])) with ordinality as ids(id, ord)
  on conflict ("bundleId", "productId") do update set "sortOrder" = excluded."sortOrder";

  select array_agg("productId" order by "sortOrder") into after_ids
  from public.bundle_products where "bundleId" = p_bundle_id;

  if before_ids is distinct from after_ids then
    update public.bundles set status = 'queued' where id = p_bundle_id and status = 'published';
  end if;
end;
$$;

revoke execute on function public.set_bundle_products(uuid, uuid[]) from public, anon;
grant execute on function public.set_bundle_products(uuid, uuid[]) to authenticated;

-- 5. Publish ---------------------------------------------------------------

create or replace function public.publish_site_content()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  at timestamptz := now();
  promoted integer := 0;
  removed integer := 0;
  n integer;
begin
  perform set_config('app.publishing', 'on', true);

  update public.products p
  set live = private.live_copy(to_jsonb(p)), published = true, status = 'published', "publishedAt" = at
  where p.status = 'queued';
  get diagnostics n = row_count; promoted := promoted + n;

  update public.bundles b
  set live = private.bundle_live_copy(b), published = true, status = 'published', "publishedAt" = at
  where b.status = 'queued';
  get diagnostics n = row_count; promoted := promoted + n;

  update public.faqs f
  set live = private.live_copy(to_jsonb(f)), published = true, status = 'published', "publishedAt" = at
  where f.status = 'queued';
  get diagnostics n = row_count; promoted := promoted + n;

  update public.testimonials t
  set live = private.live_copy(to_jsonb(t)), published = true, status = 'published', "publishedAt" = at
  where t.status = 'queued';
  get diagnostics n = row_count; promoted := promoted + n;

  update public.products set live = null, published = false, "publishedAt" = at
  where status = 'archived' and live is not null;
  get diagnostics n = row_count; removed := removed + n;

  update public.bundles set live = null, published = false, "publishedAt" = at
  where status = 'archived' and live is not null;
  get diagnostics n = row_count; removed := removed + n;

  update public.faqs set live = null, published = false, "publishedAt" = at
  where status = 'archived' and live is not null;
  get diagnostics n = row_count; removed := removed + n;

  update public.testimonials set live = null, published = false, "publishedAt" = at
  where status = 'archived' and live is not null;
  get diagnostics n = row_count; removed := removed + n;

  perform set_config('app.publishing', 'off', true);
  return jsonb_build_object('promoted', promoted, 'removed', removed, 'publishedAt', at);
end;
$$;

revoke execute on function public.publish_site_content() from public, anon, authenticated;
grant execute on function public.publish_site_content() to service_role;

-- 6. Public catalogue reads the live copy ----------------------------------
--
-- Both functions now declare their row type, so the old "column position must
-- match public.products" constraint is gone. CREATE OR REPLACE cannot change a
-- return type, hence drop + create (cascade takes the views with it).

drop function if exists private.published_products() cascade;
create function private.published_products()
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
  "resourceFormat" text,
  subjects text[],
  marks integer,
  "purchasedFiles" jsonb,
  featured boolean,
  published boolean,
  "sortOrder" integer,
  seo jsonb,
  faqs text[],
  "updatedAt" timestamptz,
  "galleryImages" jsonb,
  "previewPdfs" jsonb,
  status text,
  "publishedAt" timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    l.id,
    l.slug,
    l.title,
    l."shortDescription",
    l."fullDescription",
    l."priceZar",
    l.grade,
    l.term,
    l.year,
    l."resourceFormat",
    l.subjects,
    l.marks,
    -- Storage keys never leave the database: the public copy names the file
    -- but carries nothing to sign.
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
        from jsonb_array_elements(coalesce(l."purchasedFiles", '[]'::jsonb)) as file
      ),
      '[]'::jsonb
    ),
    l.featured,
    true,
    l."sortOrder",
    l.seo,
    l.faqs,
    l."updatedAt",
    coalesce(l."galleryImages", '[]'::jsonb),
    coalesce(l."previewPdfs", '[]'::jsonb),
    'published'::text,
    p."publishedAt"
  from public.products p
  cross join lateral jsonb_populate_record(null::public.products, p.live) l
  where p.live is not null;
$$;

drop function if exists private.published_bundles() cascade;
create function private.published_bundles()
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
  "galleryImages" jsonb,
  "previewPdfs" jsonb,
  featured boolean,
  published boolean,
  "sortOrder" integer,
  seo jsonb,
  faqs text[],
  "updatedAt" timestamptz,
  "includedProductIds" uuid[],
  "includedProductSlugs" text[],
  status text,
  "publishedAt" timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    l.id,
    l.slug,
    l.title,
    l."shortDescription",
    l."fullDescription",
    l."priceZar",
    l.grade,
    l.term,
    l.year,
    l."bundleScope",
    coalesce(l."galleryImages", '[]'::jsonb),
    coalesce(l."previewPdfs", '[]'::jsonb),
    l.featured,
    true,
    l."sortOrder",
    l.seo,
    l.faqs,
    l."updatedAt",
    coalesce(members.ids, '{}'::uuid[]),
    coalesce(members.slugs, '{}'::text[]),
    'published'::text,
    b."publishedAt"
  from public.bundles b
  cross join lateral jsonb_populate_record(null::public.bundles, b.live) l
  -- Membership as frozen at publish, narrowed to resources that are live
  -- themselves: a resource that isn't on the site isn't bundle contents.
  left join lateral (
    select
      array_agg(p.id order by m.ord)               as ids,
      array_agg(p.live ->> 'slug' order by m.ord)  as slugs
    from jsonb_array_elements_text(coalesce(b.live -> 'includedProductIds', '[]'::jsonb)) with ordinality as m(product_id, ord)
    join public.products p on p.id = m.product_id::uuid
    where p.live is not null
  ) members on true
  where b.live is not null;
$$;

create or replace function private.published_faqs()
returns table (
  id uuid,
  question text,
  answer text,
  category text,
  "sortOrder" integer,
  published boolean,
  "updatedAt" timestamptz,
  status text,
  "publishedAt" timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select l.id, l.question, l.answer, l.category, l."sortOrder", true, l."updatedAt", 'published'::text, f."publishedAt"
  from public.faqs f
  cross join lateral jsonb_populate_record(null::public.faqs, f.live) l
  where f.live is not null;
$$;

create or replace function private.published_testimonials()
returns table (
  id uuid,
  "customerName" text,
  quote text,
  context text,
  "learnerGrade" text,
  "sourceDate" date,
  featured boolean,
  "sortOrder" integer,
  published boolean,
  "updatedAt" timestamptz,
  status text,
  "publishedAt" timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select l.id, l."customerName", l.quote, l.context, l."learnerGrade", l."sourceDate", l.featured, l."sortOrder",
    true, l."updatedAt", 'published'::text, t."publishedAt"
  from public.testimonials t
  cross join lateral jsonb_populate_record(null::public.testimonials, t.live) l
  where t.live is not null;
$$;

revoke execute on function private.published_products() from public;
revoke execute on function private.published_bundles() from public;
revoke execute on function private.published_faqs() from public;
revoke execute on function private.published_testimonials() from public;
grant usage on schema private to anon, authenticated, service_role;
grant execute on function private.published_products() to anon, authenticated, service_role;
grant execute on function private.published_bundles() to anon, authenticated, service_role;
grant execute on function private.published_faqs() to anon, authenticated, service_role;
grant execute on function private.published_testimonials() to anon, authenticated, service_role;

create or replace view public.catalog_products
with (security_invoker = on) as
  select * from private.published_products();

create or replace view public.catalog_bundles
with (security_invoker = on) as
  select * from private.published_bundles();

create or replace view public.catalog_faqs
with (security_invoker = on) as
  select * from private.published_faqs();

create or replace view public.catalog_testimonials
with (security_invoker = on) as
  select * from private.published_testimonials();

grant select on public.catalog_products to anon, authenticated, service_role;
grant select on public.catalog_bundles to anon, authenticated, service_role;
grant select on public.catalog_faqs to anon, authenticated, service_role;
grant select on public.catalog_testimonials to anon, authenticated, service_role;

-- Redirects follow the LIVE slug. A slug edited in a Draft records its
-- redirect immediately (handle_product_slug_change), but the new URL only
-- exists once that slug is published — until then the old page still serves.
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
      where p.live is not null
        and ('/shop/' || (p.live ->> 'slug')) = sr."toPath"
    )
     or exists (
      select 1
      from public.bundles b
      where b.live is not null
        and ('/shop/' || (b.live ->> 'slug')) = sr."toPath"
    );
$$;

-- 7. FAQs and testimonials: public reads go through the views only --------

drop policy if exists "Public read faqs" on public.faqs;
drop policy if exists "Public read testimonials" on public.testimonials;

select set_config('app.publishing', 'off', true);

commit;
