-- Secure public catalogue reads by exposing only published products without storage keys.

drop view if exists public.catalog_products;
create view public.catalog_products as
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
  ) as "purchasedFiles",
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

drop policy if exists "Public read products" on public.products;
grant select on public.catalog_products to anon, authenticated;
