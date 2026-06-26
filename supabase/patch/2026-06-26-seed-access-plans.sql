-- Seed the homepage access plans from designingminds.co.za.
-- Safe to re-run: rows are upserted by stable product ids.

insert into public.products (
  id, slug, title, "shortDescription", "fullDescription", "priceZar", grade, term, year,
  "productKind", "resourceFormat", subjects, marks, "purchasedFiles", featured, published,
  "sortOrder", seo, faqs, "bundleScope", "accessPeriod", "includedGrades", "deliveryRules",
  "renewalNotes", "includedProductSlugs", "includedSubjects", "includedTerms"
)
values
  ('4198c63e-4202-4362-8c12-7c4eda4e6413', 'essential-access', 'Essential Access', 'One term of CAPS-aligned access for a selected grade. Includes 2 tests per subject, all core subjects, and memorandums.', 'Essential Access

R350 per term.

Includes:

- 2 CAPS-aligned tests per subject
- All core subjects for your selected grade
- A memorandum with every test
- Ideal for short-term use or new learners', 350.00, 'Grade 3', 'Any Term', '2026', 'Access Plan', 'Test / Assessment', array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography'], null, '[]'::jsonb, false, true, 10000, '{"title":"Essential Access","description":"One term of CAPS-aligned access for a selected grade. Includes 2 tests per subject, all core subjects, and memorandums."}'::jsonb, array[]::text[], null, 'Term', array['Grade 3','Grade 4','Grade 5','Grade 6','Grade 7'], 'Term access covers all core subjects for the selected grade and term. Includes 2 CAPS-aligned tests per subject with memorandums.', 'One-time term access. Buy again when you are ready for another term.', null, array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography'], null),
  ('468fabcc-3f11-4840-ac6f-4a22646964b8', 'premium-access', 'Premium Access', 'Full-year CAPS-aligned access across every subject and every term, with automatic term delivery and priority updates.', 'Premium Access

R1,200 per year.

Includes:

- Access to every subject and every term
- Automatic delivery each term via email
- Priority updates and new test releases
- One simple subscription, no reordering needed', 1200.00, 'Grade 3', 'Any Term', '2026', 'Access Plan', 'Test / Assessment', array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography'], null, '[]'::jsonb, true, true, 10001, '{"title":"Premium Access","description":"Full-year CAPS-aligned access across every subject and every term, with automatic term delivery and priority updates."}'::jsonb, array[]::text[], null, 'Year', array['Grade 3','Grade 4','Grade 5','Grade 6','Grade 7'], 'Full-year access covers every subject and every term, with automatic delivery each term via email.', 'One-time annual access. No automatic renewal.', null, array['mathematics','english-home-language','english-first-additional-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography'], array['Term 1','Term 2','Term 3','Term 4'])
on conflict (id) do update set
  slug = excluded.slug,
  title = excluded.title,
  "shortDescription" = excluded."shortDescription",
  "fullDescription" = excluded."fullDescription",
  "priceZar" = excluded."priceZar",
  grade = excluded.grade,
  term = excluded.term,
  year = excluded.year,
  "productKind" = excluded."productKind",
  "resourceFormat" = excluded."resourceFormat",
  subjects = excluded.subjects,
  marks = excluded.marks,
  "purchasedFiles" = excluded."purchasedFiles",
  featured = excluded.featured,
  published = excluded.published,
  "sortOrder" = excluded."sortOrder",
  seo = excluded.seo,
  faqs = excluded.faqs,
  "bundleScope" = excluded."bundleScope",
  "accessPeriod" = excluded."accessPeriod",
  "includedGrades" = excluded."includedGrades",
  "deliveryRules" = excluded."deliveryRules",
  "renewalNotes" = excluded."renewalNotes",
  "includedProductSlugs" = excluded."includedProductSlugs",
  "includedSubjects" = excluded."includedSubjects",
  "includedTerms" = excluded."includedTerms";
