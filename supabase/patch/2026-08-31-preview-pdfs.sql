-- Catalogue preview PDFs (2026-08-31).
--
-- Paste into the Supabase SQL editor after the other patches, or include it in
-- the migration run. Safe to re-run.
--
-- WHAT CHANGED -------------------------------------------------------------
--   * public.products and public.bundles each gain a "previewPdfs" jsonb
--     column: free, publicly downloadable PDF previews an editor uploads for
--     the Product Detail.
--   * private.published_products() and private.published_bundles() are
--     rebuilt so the new column actually reaches anonymous visitors.
--
-- WHY THIS SHAPE -----------------------------------------------------------
-- A preview PDF is built the same way as a gallery image (see the 2026-08-19
-- patch) and for the same reason: it is marketing an editor chose to publish,
-- not paid content, so it lives in the SAME public media bucket — no new
-- bucket, no new env var — under its own "previews/" prefix, and carries its
-- permanent url inline. The website prerenders to static HTML and has nothing
-- to sign with at build time. purchasedFiles stays the opposite:
-- published_products() below still strips its storageKey so the public
-- catalogue can never hand out a key to sign.
--
-- The column is jsonb rather than a child table for the same reason
-- galleryImages is: an ordered list that is only ever read and written whole
-- with the record, with nothing else referencing an individual entry.

begin;

alter table public.products
  add column if not exists "previewPdfs" jsonb not null default '[]';

alter table public.bundles
  add column if not exists "previewPdfs" jsonb not null default '[]';

-- Both functions enumerate their columns explicitly, so a new column does NOT
-- flow through on its own — without these rebuilds preview PDFs would upload
-- fine in the admin and never appear on the site.

-- Returns `setof public.products`, so this select list is POSITIONAL — it is
-- matched by column INDEX, not by name. ALTER TABLE can only append, so
-- "previewPdfs" is now the LAST column of public.products (after
-- "galleryImages") on any database that ran the statement above, and the
-- select list has to end with it. supabase/schema.sql declares the column
-- last for the same reason, so a fresh database and a migrated one have
-- identical column order.
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
    p."updatedAt",
    -- Passed through whole, unlike purchasedFiles above: a gallery image is
    -- public marketing, so withholding its url would only break the page.
    p."galleryImages",
    -- Same treatment, same reasoning, and it must stay last — see the note
    -- above about the appended column order.
    p."previewPdfs"
  from public.products p
  where p.published = true;
$$;

revoke execute on function private.published_products() from public;
grant execute on function private.published_products() to anon, authenticated;

-- Unlike published_products() above, this function declares its own OUT column
-- list (`returns table`), and Postgres refuses to change that row type through
-- CREATE OR REPLACE (error 42P13) — the function must be dropped first. The
-- catalog_bundles view depends on it, so the view is dropped here too and
-- recreated (grant included, since DROP discards grants) at the bottom.
drop view if exists public.catalog_bundles;
drop function if exists private.published_bundles();

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
    b."galleryImages",
    b."previewPdfs",
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

-- The views select * from the functions, so they must be rebuilt to pick up the
-- widened row type — a stale view keeps serving the old column list.
-- catalog_products keeps CREATE OR REPLACE: its new column lands at the END of
-- the select list, the one shape change a view replace accepts. catalog_bundles
-- gains its column mid-list, which is why it was dropped above and is created
-- fresh here — and being fresh, it needs its select grant back.
create or replace view public.catalog_products
with (security_invoker = on) as
  select * from private.published_products();

create view public.catalog_bundles
with (security_invoker = on) as
  select * from private.published_bundles();

grant select on public.catalog_bundles to anon, authenticated;

commit;

-- STORAGE ------------------------------------------------------------------
-- No new bucket and no new env var. Preview PDFs reuse the existing PUBLIC
-- public_media bucket (PUBLIC_MEDIA_BUCKET) that gallery images already live
-- in, under a new "previews/<recordId>/" key prefix alongside the existing
-- "gallery/<recordId>/" prefix — see admin-upload-url's 'preview' purpose.
