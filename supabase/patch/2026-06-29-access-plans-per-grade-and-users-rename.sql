-- 2026-06-29 — Access Plans become one product per grade (Essential also per term),
-- and the account/profile table is renamed customers -> users.
--
-- Idempotent and transactional: safe to re-run. Paste into the Supabase SQL editor.
-- Pre-launch migration — there are no production orders, so the two old plan rows
-- are simply removed. See docs/adr/0005 and docs/adr/0006.

begin;

-- 1) Rename the account/profile table customers -> users (ADR 0006).
--    FKs (orders.customerId, carts.customerId) and RLS policies travel with the
--    table automatically; the column names stay customerId on purpose.
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'customers')
     and not exists (select 1 from information_schema.tables
                     where table_schema = 'public' and table_name = 'users') then
    alter table public.customers rename to users;
  end if;
end $$;

-- The signup trigger names the table inside its body, so re-point it at users.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $func$
declare
  display_name text;
begin
  display_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'name', ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    split_part(new.email, '@', 1),
    ''
  );

  insert into public.users (id, name, email)
  values (new.id, display_name, new.email)
  on conflict (id) do nothing;

  insert into public.user_roles ("userId", role)
  values (new.id, 'customer')
  on conflict ("userId") do nothing;

  insert into public.carts ("customerId")
  values (new.id)
  on conflict ("customerId") do nothing;

  return new;
end;
$func$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- 2) Replace the two old grade-spanning plans with 25 per-grade plans (ADR 0005):
--    Premium = one per grade (all terms); Essential = one per grade-and-term.
delete from public.products where slug in ('essential-access', 'premium-access');

insert into public.products (
  id, slug, title, "shortDescription", "fullDescription", "priceZar", grade, term, year,
  "productKind", "resourceFormat", subjects, marks, "purchasedFiles", featured, published,
  "sortOrder", seo, faqs, "bundleScope", "accessPeriod", "includedGrades", "deliveryRules",
  "renewalNotes", "includedProductSlugs", "includedSubjects", "includedTerms"
)
values
  ('c7940ff7-a161-5334-af71-81b3f6afabd2', 'premium-access-grade-3', 'Premium Access — Grade 3', 'Full-year CAPS-aligned access for Grade 3 — every core subject across all four terms, with memorandums. Instant PDF download.', 'Premium Access — Grade 3

R1,200 for the full year.

Includes:

- Every core subject, across all four terms, for Grade 3
- Two CAPS-aligned tests per subject
- A memorandum with every test
- Instant download from your order page

This is a one-time purchase for the full year. It does not renew automatically.', 1200.00, 'Grade 3', 'Any Term', '2026', 'Access Plan', 'Test / Assessment', array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], null, '[]'::jsonb, false, true, 10000, '{"title":"Premium Access — Grade 3","description":"Full-year CAPS-aligned access for Grade 3 — every core subject across all four terms, with memorandums. Instant PDF download."}'::jsonb, array[]::text[], null, 'Year', array[]::text[], 'Full-year access unlocks every core subject across all four terms for Grade 3, each with a memorandum.', 'One-time annual access. No automatic renewal.', null, array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], null),
  ('7a00eb87-87dd-5383-92da-8c6c24a31edd', 'essential-access-grade-3-term-1', 'Essential Access — Grade 3, Term 1', 'One term of CAPS-aligned access for Grade 3, Term 1. Two tests per subject across all core subjects, with memorandums. Instant PDF download.', 'Essential Access — Grade 3, Term 1

R350 for one term.

Includes:

- All core subjects for Grade 3, Term 1
- Two CAPS-aligned tests per subject
- A memorandum with every test
- Instant download from your order page

This is a one-time purchase for Term 1. Buy another term, or upgrade to Premium for the full year, whenever you are ready.', 350.00, 'Grade 3', 'Term 1', '2026', 'Access Plan', 'Test / Assessment', array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], null, '[]'::jsonb, false, true, 10001, '{"title":"Essential Access — Grade 3, Term 1","description":"One term of CAPS-aligned access for Grade 3, Term 1. Two tests per subject across all core subjects, with memorandums. Instant PDF download."}'::jsonb, array[]::text[], null, 'Term', array[]::text[], 'Term access unlocks Grade 3, Term 1 resources across all core subjects, each with a memorandum.', 'One-time term access. Buy another term when you are ready.', null, array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], array['Term 1']),
  ('c1dd01ad-62df-5924-b6ea-a26cfc568205', 'essential-access-grade-3-term-2', 'Essential Access — Grade 3, Term 2', 'One term of CAPS-aligned access for Grade 3, Term 2. Two tests per subject across all core subjects, with memorandums. Instant PDF download.', 'Essential Access — Grade 3, Term 2

R350 for one term.

Includes:

- All core subjects for Grade 3, Term 2
- Two CAPS-aligned tests per subject
- A memorandum with every test
- Instant download from your order page

This is a one-time purchase for Term 2. Buy another term, or upgrade to Premium for the full year, whenever you are ready.', 350.00, 'Grade 3', 'Term 2', '2026', 'Access Plan', 'Test / Assessment', array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], null, '[]'::jsonb, false, true, 10002, '{"title":"Essential Access — Grade 3, Term 2","description":"One term of CAPS-aligned access for Grade 3, Term 2. Two tests per subject across all core subjects, with memorandums. Instant PDF download."}'::jsonb, array[]::text[], null, 'Term', array[]::text[], 'Term access unlocks Grade 3, Term 2 resources across all core subjects, each with a memorandum.', 'One-time term access. Buy another term when you are ready.', null, array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], array['Term 2']),
  ('c293eee3-91f4-5b3d-bdee-5810dc73a058', 'essential-access-grade-3-term-3', 'Essential Access — Grade 3, Term 3', 'One term of CAPS-aligned access for Grade 3, Term 3. Two tests per subject across all core subjects, with memorandums. Instant PDF download.', 'Essential Access — Grade 3, Term 3

R350 for one term.

Includes:

- All core subjects for Grade 3, Term 3
- Two CAPS-aligned tests per subject
- A memorandum with every test
- Instant download from your order page

This is a one-time purchase for Term 3. Buy another term, or upgrade to Premium for the full year, whenever you are ready.', 350.00, 'Grade 3', 'Term 3', '2026', 'Access Plan', 'Test / Assessment', array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], null, '[]'::jsonb, false, true, 10003, '{"title":"Essential Access — Grade 3, Term 3","description":"One term of CAPS-aligned access for Grade 3, Term 3. Two tests per subject across all core subjects, with memorandums. Instant PDF download."}'::jsonb, array[]::text[], null, 'Term', array[]::text[], 'Term access unlocks Grade 3, Term 3 resources across all core subjects, each with a memorandum.', 'One-time term access. Buy another term when you are ready.', null, array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], array['Term 3']),
  ('0dd4c88a-e38a-5c5e-b584-4fe039170c63', 'essential-access-grade-3-term-4', 'Essential Access — Grade 3, Term 4', 'One term of CAPS-aligned access for Grade 3, Term 4. Two tests per subject across all core subjects, with memorandums. Instant PDF download.', 'Essential Access — Grade 3, Term 4

R350 for one term.

Includes:

- All core subjects for Grade 3, Term 4
- Two CAPS-aligned tests per subject
- A memorandum with every test
- Instant download from your order page

This is a one-time purchase for Term 4. Buy another term, or upgrade to Premium for the full year, whenever you are ready.', 350.00, 'Grade 3', 'Term 4', '2026', 'Access Plan', 'Test / Assessment', array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], null, '[]'::jsonb, false, true, 10004, '{"title":"Essential Access — Grade 3, Term 4","description":"One term of CAPS-aligned access for Grade 3, Term 4. Two tests per subject across all core subjects, with memorandums. Instant PDF download."}'::jsonb, array[]::text[], null, 'Term', array[]::text[], 'Term access unlocks Grade 3, Term 4 resources across all core subjects, each with a memorandum.', 'One-time term access. Buy another term when you are ready.', null, array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], array['Term 4']),
  ('3774a868-3bac-53cb-85b4-bf719a186dab', 'premium-access-grade-4', 'Premium Access — Grade 4', 'Full-year CAPS-aligned access for Grade 4 — every core subject across all four terms, with memorandums. Instant PDF download.', 'Premium Access — Grade 4

R1,200 for the full year.

Includes:

- Every core subject, across all four terms, for Grade 4
- Two CAPS-aligned tests per subject
- A memorandum with every test
- Instant download from your order page

This is a one-time purchase for the full year. It does not renew automatically.', 1200.00, 'Grade 4', 'Any Term', '2026', 'Access Plan', 'Test / Assessment', array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], null, '[]'::jsonb, false, true, 10010, '{"title":"Premium Access — Grade 4","description":"Full-year CAPS-aligned access for Grade 4 — every core subject across all four terms, with memorandums. Instant PDF download."}'::jsonb, array[]::text[], null, 'Year', array[]::text[], 'Full-year access unlocks every core subject across all four terms for Grade 4, each with a memorandum.', 'One-time annual access. No automatic renewal.', null, array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], null),
  ('1452698f-d990-5ed1-adc6-6e5527f026f3', 'essential-access-grade-4-term-1', 'Essential Access — Grade 4, Term 1', 'One term of CAPS-aligned access for Grade 4, Term 1. Two tests per subject across all core subjects, with memorandums. Instant PDF download.', 'Essential Access — Grade 4, Term 1

R350 for one term.

Includes:

- All core subjects for Grade 4, Term 1
- Two CAPS-aligned tests per subject
- A memorandum with every test
- Instant download from your order page

This is a one-time purchase for Term 1. Buy another term, or upgrade to Premium for the full year, whenever you are ready.', 350.00, 'Grade 4', 'Term 1', '2026', 'Access Plan', 'Test / Assessment', array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], null, '[]'::jsonb, false, true, 10011, '{"title":"Essential Access — Grade 4, Term 1","description":"One term of CAPS-aligned access for Grade 4, Term 1. Two tests per subject across all core subjects, with memorandums. Instant PDF download."}'::jsonb, array[]::text[], null, 'Term', array[]::text[], 'Term access unlocks Grade 4, Term 1 resources across all core subjects, each with a memorandum.', 'One-time term access. Buy another term when you are ready.', null, array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], array['Term 1']),
  ('e30d6344-f9d4-5b1e-8e63-10cdb58247ab', 'essential-access-grade-4-term-2', 'Essential Access — Grade 4, Term 2', 'One term of CAPS-aligned access for Grade 4, Term 2. Two tests per subject across all core subjects, with memorandums. Instant PDF download.', 'Essential Access — Grade 4, Term 2

R350 for one term.

Includes:

- All core subjects for Grade 4, Term 2
- Two CAPS-aligned tests per subject
- A memorandum with every test
- Instant download from your order page

This is a one-time purchase for Term 2. Buy another term, or upgrade to Premium for the full year, whenever you are ready.', 350.00, 'Grade 4', 'Term 2', '2026', 'Access Plan', 'Test / Assessment', array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], null, '[]'::jsonb, false, true, 10012, '{"title":"Essential Access — Grade 4, Term 2","description":"One term of CAPS-aligned access for Grade 4, Term 2. Two tests per subject across all core subjects, with memorandums. Instant PDF download."}'::jsonb, array[]::text[], null, 'Term', array[]::text[], 'Term access unlocks Grade 4, Term 2 resources across all core subjects, each with a memorandum.', 'One-time term access. Buy another term when you are ready.', null, array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], array['Term 2']),
  ('089cc305-4347-50b0-8ff7-b7d766c28a7b', 'essential-access-grade-4-term-3', 'Essential Access — Grade 4, Term 3', 'One term of CAPS-aligned access for Grade 4, Term 3. Two tests per subject across all core subjects, with memorandums. Instant PDF download.', 'Essential Access — Grade 4, Term 3

R350 for one term.

Includes:

- All core subjects for Grade 4, Term 3
- Two CAPS-aligned tests per subject
- A memorandum with every test
- Instant download from your order page

This is a one-time purchase for Term 3. Buy another term, or upgrade to Premium for the full year, whenever you are ready.', 350.00, 'Grade 4', 'Term 3', '2026', 'Access Plan', 'Test / Assessment', array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], null, '[]'::jsonb, false, true, 10013, '{"title":"Essential Access — Grade 4, Term 3","description":"One term of CAPS-aligned access for Grade 4, Term 3. Two tests per subject across all core subjects, with memorandums. Instant PDF download."}'::jsonb, array[]::text[], null, 'Term', array[]::text[], 'Term access unlocks Grade 4, Term 3 resources across all core subjects, each with a memorandum.', 'One-time term access. Buy another term when you are ready.', null, array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], array['Term 3']),
  ('5afa206c-ba3e-5d4d-84fd-8f6b87d7c0ed', 'essential-access-grade-4-term-4', 'Essential Access — Grade 4, Term 4', 'One term of CAPS-aligned access for Grade 4, Term 4. Two tests per subject across all core subjects, with memorandums. Instant PDF download.', 'Essential Access — Grade 4, Term 4

R350 for one term.

Includes:

- All core subjects for Grade 4, Term 4
- Two CAPS-aligned tests per subject
- A memorandum with every test
- Instant download from your order page

This is a one-time purchase for Term 4. Buy another term, or upgrade to Premium for the full year, whenever you are ready.', 350.00, 'Grade 4', 'Term 4', '2026', 'Access Plan', 'Test / Assessment', array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], null, '[]'::jsonb, false, true, 10014, '{"title":"Essential Access — Grade 4, Term 4","description":"One term of CAPS-aligned access for Grade 4, Term 4. Two tests per subject across all core subjects, with memorandums. Instant PDF download."}'::jsonb, array[]::text[], null, 'Term', array[]::text[], 'Term access unlocks Grade 4, Term 4 resources across all core subjects, each with a memorandum.', 'One-time term access. Buy another term when you are ready.', null, array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], array['Term 4']),
  ('6053678d-571c-5b02-b099-e624ea585a74', 'premium-access-grade-5', 'Premium Access — Grade 5', 'Full-year CAPS-aligned access for Grade 5 — every core subject across all four terms, with memorandums. Instant PDF download.', 'Premium Access — Grade 5

R1,200 for the full year.

Includes:

- Every core subject, across all four terms, for Grade 5
- Two CAPS-aligned tests per subject
- A memorandum with every test
- Instant download from your order page

This is a one-time purchase for the full year. It does not renew automatically.', 1200.00, 'Grade 5', 'Any Term', '2026', 'Access Plan', 'Test / Assessment', array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], null, '[]'::jsonb, false, true, 10020, '{"title":"Premium Access — Grade 5","description":"Full-year CAPS-aligned access for Grade 5 — every core subject across all four terms, with memorandums. Instant PDF download."}'::jsonb, array[]::text[], null, 'Year', array[]::text[], 'Full-year access unlocks every core subject across all four terms for Grade 5, each with a memorandum.', 'One-time annual access. No automatic renewal.', null, array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], null),
  ('cab35cc7-62ee-5eff-a413-b58d05d5d414', 'essential-access-grade-5-term-1', 'Essential Access — Grade 5, Term 1', 'One term of CAPS-aligned access for Grade 5, Term 1. Two tests per subject across all core subjects, with memorandums. Instant PDF download.', 'Essential Access — Grade 5, Term 1

R350 for one term.

Includes:

- All core subjects for Grade 5, Term 1
- Two CAPS-aligned tests per subject
- A memorandum with every test
- Instant download from your order page

This is a one-time purchase for Term 1. Buy another term, or upgrade to Premium for the full year, whenever you are ready.', 350.00, 'Grade 5', 'Term 1', '2026', 'Access Plan', 'Test / Assessment', array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], null, '[]'::jsonb, false, true, 10021, '{"title":"Essential Access — Grade 5, Term 1","description":"One term of CAPS-aligned access for Grade 5, Term 1. Two tests per subject across all core subjects, with memorandums. Instant PDF download."}'::jsonb, array[]::text[], null, 'Term', array[]::text[], 'Term access unlocks Grade 5, Term 1 resources across all core subjects, each with a memorandum.', 'One-time term access. Buy another term when you are ready.', null, array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], array['Term 1']),
  ('c9b6b91b-b872-5313-a4f6-02a5897c6921', 'essential-access-grade-5-term-2', 'Essential Access — Grade 5, Term 2', 'One term of CAPS-aligned access for Grade 5, Term 2. Two tests per subject across all core subjects, with memorandums. Instant PDF download.', 'Essential Access — Grade 5, Term 2

R350 for one term.

Includes:

- All core subjects for Grade 5, Term 2
- Two CAPS-aligned tests per subject
- A memorandum with every test
- Instant download from your order page

This is a one-time purchase for Term 2. Buy another term, or upgrade to Premium for the full year, whenever you are ready.', 350.00, 'Grade 5', 'Term 2', '2026', 'Access Plan', 'Test / Assessment', array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], null, '[]'::jsonb, false, true, 10022, '{"title":"Essential Access — Grade 5, Term 2","description":"One term of CAPS-aligned access for Grade 5, Term 2. Two tests per subject across all core subjects, with memorandums. Instant PDF download."}'::jsonb, array[]::text[], null, 'Term', array[]::text[], 'Term access unlocks Grade 5, Term 2 resources across all core subjects, each with a memorandum.', 'One-time term access. Buy another term when you are ready.', null, array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], array['Term 2']),
  ('47dc281c-f6dd-5df6-95f3-a06d4f976111', 'essential-access-grade-5-term-3', 'Essential Access — Grade 5, Term 3', 'One term of CAPS-aligned access for Grade 5, Term 3. Two tests per subject across all core subjects, with memorandums. Instant PDF download.', 'Essential Access — Grade 5, Term 3

R350 for one term.

Includes:

- All core subjects for Grade 5, Term 3
- Two CAPS-aligned tests per subject
- A memorandum with every test
- Instant download from your order page

This is a one-time purchase for Term 3. Buy another term, or upgrade to Premium for the full year, whenever you are ready.', 350.00, 'Grade 5', 'Term 3', '2026', 'Access Plan', 'Test / Assessment', array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], null, '[]'::jsonb, false, true, 10023, '{"title":"Essential Access — Grade 5, Term 3","description":"One term of CAPS-aligned access for Grade 5, Term 3. Two tests per subject across all core subjects, with memorandums. Instant PDF download."}'::jsonb, array[]::text[], null, 'Term', array[]::text[], 'Term access unlocks Grade 5, Term 3 resources across all core subjects, each with a memorandum.', 'One-time term access. Buy another term when you are ready.', null, array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], array['Term 3']),
  ('5375dddd-71b7-5241-91cb-551656f6711d', 'essential-access-grade-5-term-4', 'Essential Access — Grade 5, Term 4', 'One term of CAPS-aligned access for Grade 5, Term 4. Two tests per subject across all core subjects, with memorandums. Instant PDF download.', 'Essential Access — Grade 5, Term 4

R350 for one term.

Includes:

- All core subjects for Grade 5, Term 4
- Two CAPS-aligned tests per subject
- A memorandum with every test
- Instant download from your order page

This is a one-time purchase for Term 4. Buy another term, or upgrade to Premium for the full year, whenever you are ready.', 350.00, 'Grade 5', 'Term 4', '2026', 'Access Plan', 'Test / Assessment', array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], null, '[]'::jsonb, false, true, 10024, '{"title":"Essential Access — Grade 5, Term 4","description":"One term of CAPS-aligned access for Grade 5, Term 4. Two tests per subject across all core subjects, with memorandums. Instant PDF download."}'::jsonb, array[]::text[], null, 'Term', array[]::text[], 'Term access unlocks Grade 5, Term 4 resources across all core subjects, each with a memorandum.', 'One-time term access. Buy another term when you are ready.', null, array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], array['Term 4']),
  ('8f17e19d-b086-5437-8efc-a8e75d337ce5', 'premium-access-grade-6', 'Premium Access — Grade 6', 'Full-year CAPS-aligned access for Grade 6 — every core subject across all four terms, with memorandums. Instant PDF download.', 'Premium Access — Grade 6

R1,200 for the full year.

Includes:

- Every core subject, across all four terms, for Grade 6
- Two CAPS-aligned tests per subject
- A memorandum with every test
- Instant download from your order page

This is a one-time purchase for the full year. It does not renew automatically.', 1200.00, 'Grade 6', 'Any Term', '2026', 'Access Plan', 'Test / Assessment', array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], null, '[]'::jsonb, false, true, 10030, '{"title":"Premium Access — Grade 6","description":"Full-year CAPS-aligned access for Grade 6 — every core subject across all four terms, with memorandums. Instant PDF download."}'::jsonb, array[]::text[], null, 'Year', array[]::text[], 'Full-year access unlocks every core subject across all four terms for Grade 6, each with a memorandum.', 'One-time annual access. No automatic renewal.', null, array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], null),
  ('c5ba5b70-653a-5d85-811d-218065ed2921', 'essential-access-grade-6-term-1', 'Essential Access — Grade 6, Term 1', 'One term of CAPS-aligned access for Grade 6, Term 1. Two tests per subject across all core subjects, with memorandums. Instant PDF download.', 'Essential Access — Grade 6, Term 1

R350 for one term.

Includes:

- All core subjects for Grade 6, Term 1
- Two CAPS-aligned tests per subject
- A memorandum with every test
- Instant download from your order page

This is a one-time purchase for Term 1. Buy another term, or upgrade to Premium for the full year, whenever you are ready.', 350.00, 'Grade 6', 'Term 1', '2026', 'Access Plan', 'Test / Assessment', array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], null, '[]'::jsonb, false, true, 10031, '{"title":"Essential Access — Grade 6, Term 1","description":"One term of CAPS-aligned access for Grade 6, Term 1. Two tests per subject across all core subjects, with memorandums. Instant PDF download."}'::jsonb, array[]::text[], null, 'Term', array[]::text[], 'Term access unlocks Grade 6, Term 1 resources across all core subjects, each with a memorandum.', 'One-time term access. Buy another term when you are ready.', null, array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], array['Term 1']),
  ('2acf9166-b016-5669-9e6c-fdef3832ecd6', 'essential-access-grade-6-term-2', 'Essential Access — Grade 6, Term 2', 'One term of CAPS-aligned access for Grade 6, Term 2. Two tests per subject across all core subjects, with memorandums. Instant PDF download.', 'Essential Access — Grade 6, Term 2

R350 for one term.

Includes:

- All core subjects for Grade 6, Term 2
- Two CAPS-aligned tests per subject
- A memorandum with every test
- Instant download from your order page

This is a one-time purchase for Term 2. Buy another term, or upgrade to Premium for the full year, whenever you are ready.', 350.00, 'Grade 6', 'Term 2', '2026', 'Access Plan', 'Test / Assessment', array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], null, '[]'::jsonb, false, true, 10032, '{"title":"Essential Access — Grade 6, Term 2","description":"One term of CAPS-aligned access for Grade 6, Term 2. Two tests per subject across all core subjects, with memorandums. Instant PDF download."}'::jsonb, array[]::text[], null, 'Term', array[]::text[], 'Term access unlocks Grade 6, Term 2 resources across all core subjects, each with a memorandum.', 'One-time term access. Buy another term when you are ready.', null, array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], array['Term 2']),
  ('adadfef7-9963-560a-9c5d-6fd11884d2c4', 'essential-access-grade-6-term-3', 'Essential Access — Grade 6, Term 3', 'One term of CAPS-aligned access for Grade 6, Term 3. Two tests per subject across all core subjects, with memorandums. Instant PDF download.', 'Essential Access — Grade 6, Term 3

R350 for one term.

Includes:

- All core subjects for Grade 6, Term 3
- Two CAPS-aligned tests per subject
- A memorandum with every test
- Instant download from your order page

This is a one-time purchase for Term 3. Buy another term, or upgrade to Premium for the full year, whenever you are ready.', 350.00, 'Grade 6', 'Term 3', '2026', 'Access Plan', 'Test / Assessment', array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], null, '[]'::jsonb, false, true, 10033, '{"title":"Essential Access — Grade 6, Term 3","description":"One term of CAPS-aligned access for Grade 6, Term 3. Two tests per subject across all core subjects, with memorandums. Instant PDF download."}'::jsonb, array[]::text[], null, 'Term', array[]::text[], 'Term access unlocks Grade 6, Term 3 resources across all core subjects, each with a memorandum.', 'One-time term access. Buy another term when you are ready.', null, array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], array['Term 3']),
  ('09722d46-5e5d-5870-8d49-902df62d927d', 'essential-access-grade-6-term-4', 'Essential Access — Grade 6, Term 4', 'One term of CAPS-aligned access for Grade 6, Term 4. Two tests per subject across all core subjects, with memorandums. Instant PDF download.', 'Essential Access — Grade 6, Term 4

R350 for one term.

Includes:

- All core subjects for Grade 6, Term 4
- Two CAPS-aligned tests per subject
- A memorandum with every test
- Instant download from your order page

This is a one-time purchase for Term 4. Buy another term, or upgrade to Premium for the full year, whenever you are ready.', 350.00, 'Grade 6', 'Term 4', '2026', 'Access Plan', 'Test / Assessment', array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], null, '[]'::jsonb, false, true, 10034, '{"title":"Essential Access — Grade 6, Term 4","description":"One term of CAPS-aligned access for Grade 6, Term 4. Two tests per subject across all core subjects, with memorandums. Instant PDF download."}'::jsonb, array[]::text[], null, 'Term', array[]::text[], 'Term access unlocks Grade 6, Term 4 resources across all core subjects, each with a memorandum.', 'One-time term access. Buy another term when you are ready.', null, array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], array['Term 4']),
  ('8a41e6aa-5ea9-5875-a673-bc6032d524ff', 'premium-access-grade-7', 'Premium Access — Grade 7', 'Full-year CAPS-aligned access for Grade 7 — every core subject across all four terms, with memorandums. Instant PDF download.', 'Premium Access — Grade 7

R1,200 for the full year.

Includes:

- Every core subject, across all four terms, for Grade 7
- Two CAPS-aligned tests per subject
- A memorandum with every test
- Instant download from your order page

This is a one-time purchase for the full year. It does not renew automatically.', 1200.00, 'Grade 7', 'Any Term', '2026', 'Access Plan', 'Test / Assessment', array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], null, '[]'::jsonb, false, true, 10040, '{"title":"Premium Access — Grade 7","description":"Full-year CAPS-aligned access for Grade 7 — every core subject across all four terms, with memorandums. Instant PDF download."}'::jsonb, array[]::text[], null, 'Year', array[]::text[], 'Full-year access unlocks every core subject across all four terms for Grade 7, each with a memorandum.', 'One-time annual access. No automatic renewal.', null, array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], null),
  ('a68c5045-fe0e-58d2-97d4-ab552ae9571e', 'essential-access-grade-7-term-1', 'Essential Access — Grade 7, Term 1', 'One term of CAPS-aligned access for Grade 7, Term 1. Two tests per subject across all core subjects, with memorandums. Instant PDF download.', 'Essential Access — Grade 7, Term 1

R350 for one term.

Includes:

- All core subjects for Grade 7, Term 1
- Two CAPS-aligned tests per subject
- A memorandum with every test
- Instant download from your order page

This is a one-time purchase for Term 1. Buy another term, or upgrade to Premium for the full year, whenever you are ready.', 350.00, 'Grade 7', 'Term 1', '2026', 'Access Plan', 'Test / Assessment', array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], null, '[]'::jsonb, false, true, 10041, '{"title":"Essential Access — Grade 7, Term 1","description":"One term of CAPS-aligned access for Grade 7, Term 1. Two tests per subject across all core subjects, with memorandums. Instant PDF download."}'::jsonb, array[]::text[], null, 'Term', array[]::text[], 'Term access unlocks Grade 7, Term 1 resources across all core subjects, each with a memorandum.', 'One-time term access. Buy another term when you are ready.', null, array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], array['Term 1']),
  ('4c7913c1-e548-5308-8ad0-41748c3dca27', 'essential-access-grade-7-term-2', 'Essential Access — Grade 7, Term 2', 'One term of CAPS-aligned access for Grade 7, Term 2. Two tests per subject across all core subjects, with memorandums. Instant PDF download.', 'Essential Access — Grade 7, Term 2

R350 for one term.

Includes:

- All core subjects for Grade 7, Term 2
- Two CAPS-aligned tests per subject
- A memorandum with every test
- Instant download from your order page

This is a one-time purchase for Term 2. Buy another term, or upgrade to Premium for the full year, whenever you are ready.', 350.00, 'Grade 7', 'Term 2', '2026', 'Access Plan', 'Test / Assessment', array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], null, '[]'::jsonb, false, true, 10042, '{"title":"Essential Access — Grade 7, Term 2","description":"One term of CAPS-aligned access for Grade 7, Term 2. Two tests per subject across all core subjects, with memorandums. Instant PDF download."}'::jsonb, array[]::text[], null, 'Term', array[]::text[], 'Term access unlocks Grade 7, Term 2 resources across all core subjects, each with a memorandum.', 'One-time term access. Buy another term when you are ready.', null, array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], array['Term 2']),
  ('885fce69-07a3-556e-92dd-202367536336', 'essential-access-grade-7-term-3', 'Essential Access — Grade 7, Term 3', 'One term of CAPS-aligned access for Grade 7, Term 3. Two tests per subject across all core subjects, with memorandums. Instant PDF download.', 'Essential Access — Grade 7, Term 3

R350 for one term.

Includes:

- All core subjects for Grade 7, Term 3
- Two CAPS-aligned tests per subject
- A memorandum with every test
- Instant download from your order page

This is a one-time purchase for Term 3. Buy another term, or upgrade to Premium for the full year, whenever you are ready.', 350.00, 'Grade 7', 'Term 3', '2026', 'Access Plan', 'Test / Assessment', array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], null, '[]'::jsonb, false, true, 10043, '{"title":"Essential Access — Grade 7, Term 3","description":"One term of CAPS-aligned access for Grade 7, Term 3. Two tests per subject across all core subjects, with memorandums. Instant PDF download."}'::jsonb, array[]::text[], null, 'Term', array[]::text[], 'Term access unlocks Grade 7, Term 3 resources across all core subjects, each with a memorandum.', 'One-time term access. Buy another term when you are ready.', null, array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], array['Term 3']),
  ('fc32982e-003b-5523-b4ce-71b8d54a3ad3', 'essential-access-grade-7-term-4', 'Essential Access — Grade 7, Term 4', 'One term of CAPS-aligned access for Grade 7, Term 4. Two tests per subject across all core subjects, with memorandums. Instant PDF download.', 'Essential Access — Grade 7, Term 4

R350 for one term.

Includes:

- All core subjects for Grade 7, Term 4
- Two CAPS-aligned tests per subject
- A memorandum with every test
- Instant download from your order page

This is a one-time purchase for Term 4. Buy another term, or upgrade to Premium for the full year, whenever you are ready.', 350.00, 'Grade 7', 'Term 4', '2026', 'Access Plan', 'Test / Assessment', array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], null, '[]'::jsonb, false, true, 10044, '{"title":"Essential Access — Grade 7, Term 4","description":"One term of CAPS-aligned access for Grade 7, Term 4. Two tests per subject across all core subjects, with memorandums. Instant PDF download."}'::jsonb, array[]::text[], null, 'Term', array[]::text[], 'Term access unlocks Grade 7, Term 4 resources across all core subjects, each with a memorandum.', 'One-time term access. Buy another term when you are ready.', null, array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography','social-sciences'], array['Term 4'])
on conflict (id) do update set
  slug = excluded.slug, title = excluded.title, "shortDescription" = excluded."shortDescription",
  "fullDescription" = excluded."fullDescription", "priceZar" = excluded."priceZar", grade = excluded.grade,
  term = excluded.term, year = excluded.year, "productKind" = excluded."productKind",
  "resourceFormat" = excluded."resourceFormat", subjects = excluded.subjects, marks = excluded.marks,
  "purchasedFiles" = excluded."purchasedFiles", featured = excluded.featured, published = excluded.published,
  "sortOrder" = excluded."sortOrder", seo = excluded.seo, faqs = excluded.faqs,
  "bundleScope" = excluded."bundleScope", "accessPeriod" = excluded."accessPeriod",
  "includedGrades" = excluded."includedGrades", "deliveryRules" = excluded."deliveryRules",
  "renewalNotes" = excluded."renewalNotes", "includedProductSlugs" = excluded."includedProductSlugs",
  "includedSubjects" = excluded."includedSubjects", "includedTerms" = excluded."includedTerms";

commit;
