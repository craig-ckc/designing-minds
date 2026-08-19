-- Amy's catalogue feedback (2026-08-19).
--
-- Paste into the Supabase SQL editor after the other patches, or include it in
-- the migration run. Safe to re-run.
--
-- WHAT CHANGED -------------------------------------------------------------
--   * Full Year Test Bundles (R1,200) are placed ON HOLD: unpublished and
--     unfeatured so they are no longer advertised or purchasable. Existing
--     buyers keep access — entitlements resolve against the bundle row, which
--     stays in place; only its visibility changes.
--   * A Term 3 Summary Bundle (R200) is advertised for Grades 4–7. Each grade's
--     bundle collects that grade's Term 3 summary singles (History, Geography,
--     Natural Science and Technology). Term Test Bundles (R350) for Grades 4–7
--     are left exactly as they are — still published and available.
--
-- WHY THIS SHAPE -----------------------------------------------------------
-- Bundles are their own Collection (see 2026-08-09-bundles-table.sql): the row
-- lives in public.bundles and its contents in public.bundle_products as real
-- foreign keys. Membership here is resolved from the summary resource slugs so
-- it can never disagree with what the page shows. Everything is idempotent so a
-- second run (or a run after a reseed that recreated the bundles) is a no-op
-- rather than an error.

begin;

-- ---------------------------------------------------------------------------
-- 1. Full Year Test Bundles on hold.
-- ---------------------------------------------------------------------------
update public.bundles
set published = false,
    featured = false,
    "updatedAt" = now()
where "bundleScope" = 'Full Year'
  and (published = true or featured = true);

-- ---------------------------------------------------------------------------
-- 2. Term 3 Summary Bundles (R200) for Grades 4–7.
-- ---------------------------------------------------------------------------
insert into public.bundles (
  id, slug, title, "shortDescription", "fullDescription", "priceZar",
  grade, term, year, "bundleScope", featured, published, "sortOrder",
  seo, faqs, "updatedAt"
) values
  ('4b1c0e11-0001-4a01-8c01-000000000401', 'grade-4-term-3-summary-bundle', 'Grade 4 Term 3 Summary Bundle',
   'All available Grade 4 Term 3 summaries in one CAPS-aligned bundle. Instant PDF download.',
   'All available Grade 4 Term 3 summaries in one CAPS-aligned bundle. Instant PDF download.',
   200.00, 'Grade 4', 'Term 3', '2026', 'Term', true, true, 3260,
   '{"title":"Grade 4 Term 3 Summary Bundle","description":"All available Grade 4 Term 3 summaries in one CAPS-aligned bundle. Instant PDF download."}'::jsonb,
   array[]::text[], now()),
  ('4b1c0e11-0002-4a02-8c02-000000000402', 'grade-5-term-3-summary-bundle', 'Grade 5 Term 3 Summary Bundle',
   'All available Grade 5 Term 3 summaries in one CAPS-aligned bundle. Instant PDF download.',
   'All available Grade 5 Term 3 summaries in one CAPS-aligned bundle. Instant PDF download.',
   200.00, 'Grade 5', 'Term 3', '2026', 'Term', true, true, 3270,
   '{"title":"Grade 5 Term 3 Summary Bundle","description":"All available Grade 5 Term 3 summaries in one CAPS-aligned bundle. Instant PDF download."}'::jsonb,
   array[]::text[], now()),
  ('4b1c0e11-0003-4a03-8c03-000000000403', 'grade-6-term-3-summary-bundle', 'Grade 6 Term 3 Summary Bundle',
   'All available Grade 6 Term 3 summaries in one CAPS-aligned bundle. Instant PDF download.',
   'All available Grade 6 Term 3 summaries in one CAPS-aligned bundle. Instant PDF download.',
   200.00, 'Grade 6', 'Term 3', '2026', 'Term', true, true, 3280,
   '{"title":"Grade 6 Term 3 Summary Bundle","description":"All available Grade 6 Term 3 summaries in one CAPS-aligned bundle. Instant PDF download."}'::jsonb,
   array[]::text[], now()),
  ('4b1c0e11-0004-4a04-8c04-000000000404', 'grade-7-term-3-summary-bundle', 'Grade 7 Term 3 Summary Bundle',
   'All available Grade 7 Term 3 summaries in one CAPS-aligned bundle. Instant PDF download.',
   'All available Grade 7 Term 3 summaries in one CAPS-aligned bundle. Instant PDF download.',
   200.00, 'Grade 7', 'Term 3', '2026', 'Term', true, true, 3290,
   '{"title":"Grade 7 Term 3 Summary Bundle","description":"All available Grade 7 Term 3 summaries in one CAPS-aligned bundle. Instant PDF download."}'::jsonb,
   array[]::text[], now())
on conflict (slug) do update set
  title = excluded.title,
  "shortDescription" = excluded."shortDescription",
  "fullDescription" = excluded."fullDescription",
  "priceZar" = excluded."priceZar",
  grade = excluded.grade,
  term = excluded.term,
  year = excluded.year,
  "bundleScope" = excluded."bundleScope",
  published = excluded.published,
  featured = excluded.featured,
  "sortOrder" = excluded."sortOrder",
  seo = excluded.seo,
  faqs = excluded.faqs,
  "updatedAt" = now();

-- ---------------------------------------------------------------------------
-- 3. Membership: each summary bundle collects its grade's Term 3 summary
--    singles. Resolved by slug so it stays in sync with the catalogue.
-- ---------------------------------------------------------------------------
insert into public.bundle_products ("bundleId", "productId", "sortOrder")
select b.id, p.id, p."sortOrder"
from public.bundles b
cross join lateral unnest(array[
  'grade-4-history-term-3-summary',
  'grade-4-geography-term-3-summary',
  'grade-4-nst-term-3-summary'
]) as s(slug)
join public.products p on p.slug = s.slug and p.published = true
where b.slug = 'grade-4-term-3-summary-bundle'
on conflict ("bundleId", "productId") do nothing;

insert into public.bundle_products ("bundleId", "productId", "sortOrder")
select b.id, p.id, p."sortOrder"
from public.bundles b
cross join lateral unnest(array[
  'grade-5-history-term-3-summary',
  'grade-5-geography-term-3-summary',
  'grade-5-natural-science-and-technology-term-3-summary'
]) as s(slug)
join public.products p on p.slug = s.slug and p.published = true
where b.slug = 'grade-5-term-3-summary-bundle'
on conflict ("bundleId", "productId") do nothing;

insert into public.bundle_products ("bundleId", "productId", "sortOrder")
select b.id, p.id, p."sortOrder"
from public.bundles b
cross join lateral unnest(array[
  'grade-6-history-term-3-summary',
  'grade-6-geography-term-3-summary',
  'grade-6-natural-science-and-technology-term-3-summary'
]) as s(slug)
join public.products p on p.slug = s.slug and p.published = true
where b.slug = 'grade-6-term-3-summary-bundle'
on conflict ("bundleId", "productId") do nothing;

insert into public.bundle_products ("bundleId", "productId", "sortOrder")
select b.id, p.id, p."sortOrder"
from public.bundles b
cross join lateral unnest(array[
  'grade-7-history-term-3-summary',
  'grade-7-geography-term-3-summary',
  'grade-7-natural-science-and-technology-term-3-summary'
]) as s(slug)
join public.products p on p.slug = s.slug and p.published = true
where b.slug = 'grade-7-term-3-summary-bundle'
on conflict ("bundleId", "productId") do nothing;

commit;
