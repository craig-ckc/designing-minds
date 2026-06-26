-- Designing Minds — catalogue seed generated from research/extracted-content/data/products.json.
-- Run after supabase/schema.sql. Operational records are intentionally excluded.

insert into public.value_lists (key, values)
values
  ('grades', array['Grade 3','Grade 4','Grade 5','Grade 6','Grade 7']),
  ('terms', array['Any Term','Term 1','Term 2','Term 3','Term 4']),
  ('years', array['2024','2025','2026']),
  ('productKinds', array['Individual Resource','Bundle','Access Plan']),
  ('resourceFormats', array['Summary','Test / Assessment'])
on conflict (key) do update set values = excluded.values, "updatedAt" = now();

insert into public.subjects (id, slug, name, "shortLabel", description, "sortOrder", visible, faqs, accent, seo)
values
  ('f5515388-6097-5b5c-8352-663de97a0914', 'afrikaans-first-additional-language', 'Afrikaans First Additional Language', 'AFAL', 'Afrikaans First Additional Language resources.', 1, true, array[]::text[], null, null),
  ('abf343aa-7ead-56dd-b99b-b6b64c454d3f', 'english-first-additional-language', 'English First Additional Language', 'EFAL', 'English First Additional Language resources.', 2, true, array[]::text[], null, null),
  ('15719e8a-0615-5332-92be-e362e3ace2c4', 'english-home-language', 'English Home Language', 'EHL', 'English Home Language resources.', 3, true, array[]::text[], null, null),
  ('1610dc9a-ec28-5531-b93b-b132b89f7612', 'geography', 'Geography', 'Geography', 'Geography resources.', 4, true, array[]::text[], null, null),
  ('bcc8df69-5798-57b0-8c3a-3803db057321', 'history', 'History', 'History', 'History resources.', 5, true, array[]::text[], null, null),
  ('e6c4b9f7-22c4-5763-8681-b6520cfb66b3', 'life-skills', 'Life Skills', 'Life Skills', 'Life Skills resources.', 6, true, array[]::text[], null, null),
  ('c2e8f120-585e-587b-8aab-fe3aadfddbfe', 'mathematics', 'Mathematics', 'Mathematics', 'Mathematics resources.', 7, true, array[]::text[], null, null),
  ('b60c987d-4c16-515f-95a4-43df6e4ab53e', 'natural-science-and-technology', 'Natural Science & Technology', 'NS&T', 'Natural Science & Technology resources.', 8, true, array[]::text[], null, null),
  ('0b274d83-dc6b-5eb5-89bb-9f360af6d3bd', 'social-sciences', 'Social Sciences', 'Social Sciences', 'Social Sciences resources.', 9, true, array[]::text[], null, null)
on conflict (id) do update set slug = excluded.slug, name = excluded.name, "shortLabel" = excluded."shortLabel", description = excluded.description, "sortOrder" = excluded."sortOrder", visible = excluded.visible, faqs = excluded.faqs, accent = excluded.accent, seo = excluded.seo;

insert into public.faqs (id, question, answer, category, "sortOrder", published)
values
  ('d5b08af6-a33b-4fa0-bee9-9185edddac2a', 'What grades are your tests available for?', 'Designing Minds currently offers printable CAPS-aligned tests and learning resources for Grades 3 to 7, with new material released during the year.', 'Products', 10, true),
  ('80a8abba-0054-475b-8b47-545b168df214', 'Are your tests aligned with the South African CAPS curriculum?', 'Yes. The resources are created for the South African CAPS curriculum and follow the grade, term, subject, and assessment expectations shown on each product page.', 'Curriculum', 20, true),
  ('8a2f18eb-2ece-4e24-bbe5-4609f8a6e2b0', 'How do I receive the tests after purchase?', 'After payment, your purchased PDF resources are made available for download. You should also receive a confirmation email with access details.', 'Orders & Downloads', 30, true),
  ('cf408f21-e669-44a0-955e-9de65d522730', 'Do I need an account to buy tests?', 'You can complete checkout as a guest where available, but creating an account makes it easier to find orders and re-download purchased resources later.', 'Account', 40, true),
  ('ffb31110-40af-4b76-84a0-7bf8441abbf7', 'What is the difference between Essential Access and Premium Access?', 'Essential Access gives you one term of resources for a selected grade. Premium Access gives full-year access across all subjects and terms, with term updates delivered during the year.', 'Access Plans', 50, true),
  ('9235f4d3-da3b-409f-895a-1a948c6e9b78', 'Can I use the same tests for more than one child?', 'Purchased resources may be printed and reused within your household. Teachers, tutors, or schools should contact Designing Minds for classroom or multi-user licensing.', 'Licensing', 60, true),
  ('b519bbfe-6894-4e21-a3ad-8a3f57eed514', 'Can I print the tests from my phone or tablet?', 'Yes. The resources are supplied as PDF files, so you can download and print them from a phone, tablet, or computer connected to a printer.', 'Printing', 70, true),
  ('d1407685-b090-431f-8269-c4f9f492d77a', 'What subjects are included in each grade?', 'Core subjects commonly include Mathematics, English Home Language, English First Additional Language, Afrikaans First Additional Language, Life Skills, Natural Sciences, Geography, and History. Availability may vary by grade and term.', 'Products', 80, true),
  ('067c3736-3505-4357-9b4e-73712f26c4f0', 'Do the tests include memorandums?', 'Most test and assessment products include a memorandum. Check the product description before purchase for the exact files and content included.', 'Products', 90, true),
  ('710871b9-d19b-4eff-be7c-f9082725d6cf', 'Are the resources editable?', 'Resources are supplied as printable PDFs and are generally not editable. They are designed for download, printing, revision, and assessment practice.', 'Products', 100, true),
  ('c166a04e-f0a2-4977-9531-bd55ac176178', 'Can I preview a resource before buying?', 'Where a sample or preview is available, it will be shown on the product page so you can review the layout, question style, and memorandum format before purchasing.', 'Products', 110, true),
  ('454f6474-8c44-4746-9a46-975ddd8a2799', 'How often are new tests added?', 'New tests and assessments are added throughout the year, especially around term assessments and exam preparation periods.', 'Products', 120, true),
  ('bea2bad6-d0a0-4e7f-b390-b95a3a94c85f', 'What should I do if my download link does not work?', 'Contact Designing Minds with your order details and the email address used at checkout so the team can help restore access or resend the download information.', 'Orders & Downloads', 130, true),
  ('5fd009b8-9d59-4f58-ac6b-3cde99372027', 'Can I get a refund after downloading a PDF?', 'Because digital resources can be accessed immediately, refunds may be limited once a file has been downloaded. If there is a duplicate purchase or a problem with the file, contact support with your order details.', 'Orders & Downloads', 140, true),
  ('79c73cb6-3503-454c-96ad-70863bcc579b', 'Are the resources suitable for homeschool use?', 'Yes. Parents and homeschool families can use the printable tests, summaries, and memorandums for revision, practice, and informal assessment at home.', 'Curriculum', 150, true),
  ('8da9efbd-0c34-4ae7-8e4a-436482827958', 'How can I contact Designing Minds for help?', 'Use the contact page or email designingminds123@gmail.com with your question, order number if relevant, and the email address used during checkout.', 'Support', 160, true)
on conflict (id) do update set
  question = excluded.question,
  answer = excluded.answer,
  category = excluded.category,
  "sortOrder" = excluded."sortOrder",
  published = excluded.published;

insert into public.products (
  id, slug, title, "shortDescription", "fullDescription", "priceZar", grade, term, year,
  "productKind", "resourceFormat", subjects, marks, "purchasedFiles", featured, published,
  "sortOrder", seo, faqs, "bundleScope", "accessPeriod", "includedGrades", "deliveryRules",
  "renewalNotes", "includedProductSlugs", "includedSubjects", "includedTerms"
)
values
  ('765c75fc-0a0d-54cf-8226-d97e9b75b578', 'grade-4-nst-term-1-summary-questions', 'Grade 4 NST Term 1 Summary + Questions', 'CAPS-aligned Grade 4 Term 1 Natural Science & Technology Summary. Includes summary + Questions. Instant PDF download', 'This comprehensive Grade 4 NST Term 2 study summary is designed to help learners understand, revise and prepare for tests and exams with confidence. CAPS aligned.

Perfect for parents and teachers , this resource breaks down key concepts into simple, easy-to-understand notes , supported by practice questions and a full memorandum .

What’s included:

✔ Clear and detailed main summary notes

✔ Quick revision notes for easy studying

✔ A one-page exam revision sheet

✔ Practice questions (multiple choice, short and higher-order)

✔ Full answer memorandum

Topics covered:

- States of matter

- Changes of state

- Water cycle

- Raw and manufactured materials

- Processing and properties of materials

- Uses of materials

- Strengthening materials (including triangles & corrugation)

- Types of structures (frame, shell, solid)

- Indigenous structures

Format: PDF (ready to download and print)', 60.00, 'Grade 4', 'Term 1', '2026', 'Individual Resource', 'Summary', array['natural-science-and-technology'], null, '[{"id":"file-6179","label":"Summary PDF","filename":"grade-4-nst-term-1-summary-questions.pdf","storageKey":"products/765c75fc-0a0d-54cf-8226-d97e9b75b578/file-6179-grade-4-nst-term-1-summary-questions.pdf"}]'::jsonb, false, true, 6179, '{"title":"Grade 4 NST Term 1 Summary + Questions","description":"CAPS-aligned Grade 4 Term 1 Natural Science & Technology Summary. Includes summary + Questions. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('d852c03a-89ca-5d45-b06d-d7d3c6cb3893', 'grade-4-mathematics-term-4-practice-test-2026', 'Grade 4 Mathematics Term 4 Practice Test (2026)', 'CAPS-aligned Grade 4 Mathematics Term 4 Practice Test. Worth 60 marks , includes full memo. Instant PDF download', 'This CAPS-aligned Grade 4 Mathematics test is perfect for focused revision before exams , covering key Term 4 measurement topics in a clear and structured way.

What’s included:

- 60-mark test

- Detailed memorandum (answers included)

- 1.5-hour exam format

- Front page with section weighting and cognitive levels (Bloom’s aligned)

Topics covered:

- Area & Perimeter

- Capacity & Volume

- Time

- Length

PDF format (non-editable)

Make sure to check out our shop where we upload tests and assessments weekly.', 60.00, 'Grade 4', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 60, '[{"id":"file-6162","label":"Test / Assessment PDF","filename":"grade-4-mathematics-term-4-practice-test-2026.pdf","storageKey":"products/d852c03a-89ca-5d45-b06d-d7d3c6cb3893/file-6162-grade-4-mathematics-term-4-practice-test-2026.pdf"}]'::jsonb, false, true, 6162, '{"title":"Grade 4 Mathematics Term 4 Practice Test (2026)","description":"CAPS-aligned Grade 4 Mathematics Term 4 Practice Test. Worth 60 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('ccc66e91-0ddb-57ed-9599-b6aa71dbe7db', 'grade-4-mathematics-term-4-nov-practice-test-1-2026', 'Grade 4 Mathematics Term November 4 Practice Test 1 (2026)', 'CAPS-aligned Grade 4 Mathematics Term 4 November Test. Worth 70 marks , includes full memo. Instant PDF download', 'This CAPS-aligned Grade 4 Mathematics practice test is designed to help learners prepare confidently for their end-of-year exams. It follows the 2026 ATP and includes a variety of question types to assess understanding across all key topics.

📝 What’s included:

- Full 70-mark test

- Detailed memorandum (answers included)

- 2-hour exam format

- Front page with content weighting + cognitive levels (Bloom’s aligned)

Topics covered:

- Numbers, Operations & Relationships

- Patterns, Functions & Algebra

- Space & Shape (Geometry)

- Measurement (time, length, capacity, area & perimeter)

- Data Handling (tables, bar graphs & interpretation)

PDF format (non-editable)

Includes memorandum', 60.00, 'Grade 4', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 70, '[{"id":"file-6155","label":"Test / Assessment PDF","filename":"grade-4-mathematics-term-4-nov-practice-test-1-2026.pdf","storageKey":"products/ccc66e91-0ddb-57ed-9599-b6aa71dbe7db/file-6155-grade-4-mathematics-term-4-nov-practice-test-1-2026.pdf"}]'::jsonb, false, true, 6155, '{"title":"Grade 4 Mathematics Term November 4 Practice Test 1 (2026)","description":"CAPS-aligned Grade 4 Mathematics Term 4 November Test. Worth 70 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('d2cf1c08-2916-55e3-8289-fb009af2beed', 'grade-6-nst-term-2-summary', 'Grade 6 Natural Science & Technology Term 2 Summary', 'CAPS-aligned Grade 6 Term 2 Natural Science & Technology Summary. Includes summary + Questions. Instant PDF download', 'This clear and easy-to-use summary is designed to help Grade 6 learners revise key Term 2 concepts with confidence.

✔ Covers: Properties of materials, mixtures, acids & bases, recycling and environmental impact

✔ Simple explanations and visual notes

✔ Quick revision sections for exam prep

✔ Includes practice questions and answers

Perfect for revision before tests and exams or extra support at home.

PDF format – not editable', 60.00, 'Grade 6', 'Term 2', '2026', 'Individual Resource', 'Summary', array['natural-science-and-technology'], null, '[{"id":"file-6144","label":"Summary PDF","filename":"grade-6-nst-term-2-summary.pdf","storageKey":"products/d2cf1c08-2916-55e3-8289-fb009af2beed/file-6144-grade-6-nst-term-2-summary.pdf"}]'::jsonb, false, true, 6144, '{"title":"Grade 6 Natural Science & Technology Term 2 Summary","description":"CAPS-aligned Grade 6 Term 2 Natural Science & Technology Summary. Includes summary + Questions. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('233f68ae-6da0-5883-b017-2084180aa0a0', 'grade-7-natural-science-term-2-summary', 'Grade 7 Natural Science Term 2 Summary', 'CAPS-aligned Grade 7 Term 2 Natural Science Summary. Includes summary + Questions. Instant PDF download', 'This Grade 7 NS Term 2 Study Summary is designed to help learners understand, revise, and prepare with confidence for tests and exams. The notes are fully aligned to the CAPS curriculum and break down key concepts into simple, easy-to-understand sections.

What’s included:

- ✔ Clear, structured notes

- ✔ Key words and important concepts

- ✔ Visual explanations and diagrams

- ✔ Practice questions

- ✔ Quick exam revision page

Topics covered:

- Introduction to the Periodic Table

- Properties of materials

- Separating mixtures

- Acids, bases and neutrals

- Recycling and environmental impact

PDF format', 60.00, 'Grade 7', 'Term 2', '2026', 'Individual Resource', 'Summary', array['natural-science-and-technology'], null, '[{"id":"file-6138","label":"Summary PDF","filename":"grade-7-natural-science-term-2-summary.pdf","storageKey":"products/233f68ae-6da0-5883-b017-2084180aa0a0/file-6138-grade-7-natural-science-term-2-summary.pdf"}]'::jsonb, false, true, 6138, '{"title":"Grade 7 Natural Science Term 2 Summary","description":"CAPS-aligned Grade 7 Term 2 Natural Science Summary. Includes summary + Questions. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('649a7977-60f6-57f1-a869-b92b104057c0', 'grade-5-nst-term-2-summary', 'Grade 5 NST Term 2 Summary + Questions', 'CAPS-aligned Grade 5 Term 2 Natural Science & Technology Summary. Includes summary + Questions. Instant PDF download', 'This Grade 5 NST Term 2 Study Summary is designed to help learners understand, revise, and prepare with confidence for tests and exams. The notes are fully aligned to the CAPS curriculum and break down key concepts into simple, easy-to-understand sections.

This resource focuses on Metals, Non-metals, and Processed Materials , making it perfect for revision and consolidation.

What’s included:

- ✔ Clear, structured notes

- ✔ Key words and important concepts

- ✔ Visual explanations and diagrams

- ✔ Practice questions

- ✔ Quick exam revision page

Topics covered:

- Metals and non-metals

- Properties of materials

- Uses of metals

- Rusting and tarnishing

- Processing materials (mixing, heating, cooling, drying)

- Processed materials and their uses

PDF format', 60.00, 'Grade 5', 'Term 2', '2026', 'Individual Resource', 'Summary', array['natural-science-and-technology'], null, '[{"id":"file-6126","label":"Summary PDF","filename":"grade-5-nst-term-2-summary.pdf","storageKey":"products/649a7977-60f6-57f1-a869-b92b104057c0/file-6126-grade-5-nst-term-2-summary.pdf"}]'::jsonb, false, true, 6126, '{"title":"Grade 5 NST Term 2 Summary + Questions","description":"CAPS-aligned Grade 5 Term 2 Natural Science & Technology Summary. Includes summary + Questions. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('a32475c3-0784-5c0e-a005-a9f014c48730', 'grade-5-mathematics-term-3-practice-test-2-2026', 'Grade 5 Mathematics Term 3 Practice Test 2 (2026)', 'CAPS-aligned Grade 5 Mathematics Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 5 Mathematics Term 3 Test 2 is designed to help learners practise and prepare for assessments in a structured and supportive way. The test is fully aligned to the CAPS curriculum and covers the key concepts taught during the term.

This resource is ideal for revision, exam preparation, or extra practice at home .

What’s included:

- ✔ 50-mark test paper

- ✔ Detailed memorandum (answers included)

- ✔ CAPS-aligned content and structure

- ✔ Clear instructions and learner-friendly layout

Topics covered:

- Perimeter, Area & Volume

- Data Cycle

- 3D Objects (names, faces & properties)

- Length

PDF format (non-editable)

Includes memorandum', 60.00, 'Grade 5', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 50, '[{"id":"file-6122","label":"Test / Assessment PDF","filename":"grade-5-mathematics-term-3-practice-test-2-2026.pdf","storageKey":"products/a32475c3-0784-5c0e-a005-a9f014c48730/file-6122-grade-5-mathematics-term-3-practice-test-2-2026.pdf"}]'::jsonb, false, true, 6122, '{"title":"Grade 5 Mathematics Term 3 Practice Test 2 (2026)","description":"CAPS-aligned Grade 5 Mathematics Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('039094fe-5251-5a9e-bed5-71c86b42d6b8', 'grade-5-mathematics-term-3-practice-test-1-2026', 'Grade 5 Mathematics Term 3 Practice Test 1 (2026)', 'CAPS-aligned Grade 5 Mathematics Term 3 Test 1. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 5 Mathematics Term 3 Test 1 is designed to help learners practise and prepare for assessments in a structured and supportive way. The test is fully aligned to the CAPS curriculum and covers the key concepts taught during the term.

This resource is ideal for revision, exam preparation, or extra practice at home .

What’s included:

- ✔ 50-mark test paper

- ✔ Detailed memorandum (answers included)

- ✔ CAPS-aligned content and structure

- ✔ Clear instructions and learner-friendly layout

Topics covered:

- Perimeter, Area & Volume

- Data Cycle

- 3D Objects (names, faces & properties)

- Length

PDF format (non-editable)

Includes memorandum', 60.00, 'Grade 5', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 50, '[{"id":"file-6115","label":"Test / Assessment PDF","filename":"grade-5-mathematics-term-3-practice-test-1-2026.pdf","storageKey":"products/039094fe-5251-5a9e-bed5-71c86b42d6b8/file-6115-grade-5-mathematics-term-3-practice-test-1-2026.pdf"}]'::jsonb, false, true, 6115, '{"title":"Grade 5 Mathematics Term 3 Practice Test 1 (2026)","description":"CAPS-aligned Grade 5 Mathematics Term 3 Test 1. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('ff92492b-16a1-5594-a02d-92bb8c24640d', 'grade-4-mathematics-term-3-practice-test-1-2026', 'Grade 4 Mathematics Term 3 Practice Test 1 (2026)', 'CAPS-aligned Grade 4 Mathematics Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This CAPS-aligned Grade 4 Mathematics Term 3 Practice Test is designed according to the 2026 ATP requirements. The paper is set out of 50 marks and includes a detailed memorandum for easy marking.

Test covers:

- Mass,

- Data handling,

- Fractions, and

- Patterns & symmetry

Includes a variety of questions, visual elements, and real-life word problems to support understanding and exam preparation.

📄 PDF format (not editable)

✅ Memorandum included

Make sure to check out our shop where we upload tests and assessments weekly.', 60.00, 'Grade 4', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 50, '[{"id":"file-6110","label":"Test / Assessment PDF","filename":"grade-4-mathematics-term-3-practice-test-1-2026.pdf","storageKey":"products/ff92492b-16a1-5594-a02d-92bb8c24640d/file-6110-grade-4-mathematics-term-3-practice-test-1-2026.pdf"}]'::jsonb, false, true, 6110, '{"title":"Grade 4 Mathematics Term 3 Practice Test 1 (2026)","description":"CAPS-aligned Grade 4 Mathematics Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('8d92badf-ab24-567c-a9f9-c60b15ed23a4', 'grade-4-mathematics-term-3-practice-test-2-2026', 'Grade 4 Mathematics Term 3 Practice Test 2 (2026)', 'CAPS-aligned Grade 4 Mathematics Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This CAPS-aligned Grade 4 Mathematics Term 3 Practice Test is designed according to the 2026 ATP requirements. The paper is set out of 50 marks and includes a detailed memorandum for easy marking.

Test covers:

- Mass,

- Data handling,

- Fractions, and

- Patterns & symmetry

Includes a variety of questions, visual elements, and real-life word problems to support understanding and exam preparation.

📄 PDF format (not editable)

✅ Memorandum included

Make sure to check out our shop where we upload tests and assessments weekly.', 60.00, 'Grade 4', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 50, '[{"id":"file-6105","label":"Test / Assessment PDF","filename":"grade-4-mathematics-term-3-practice-test-2-2026.pdf","storageKey":"products/8d92badf-ab24-567c-a9f9-c60b15ed23a4/file-6105-grade-4-mathematics-term-3-practice-test-2-2026.pdf"}]'::jsonb, false, true, 6105, '{"title":"Grade 4 Mathematics Term 3 Practice Test 2 (2026)","description":"CAPS-aligned Grade 4 Mathematics Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('4cded1c7-7055-509b-b935-479e144133dc', 'grade-4-nst-term-2-summary', 'Grade 4 NST Term 2 Summary + Questions', 'CAPS-aligned Grade 4 Term 2 Natural Science & Technology Summary. Includes summary + Questions. Instant PDF download', 'This Grade 4 Natural Science and Technology Term 2 summary is designed to help learners understand and revise key concepts in a clear and simple way. It covers key topics including states of matter, changes of state, water cycle, raw and manufactured materials, properties and uses of materials, strengthening materials, structures and struts, indigenous structures.

The summary includes easy-to-understand notes, colourful diagrams, quick revision sections, practice questions, and a detailed memorandum to support learning and exam preparation.

Perfect for revision before tests and exams, or for reinforcing concepts at home.

Includes:

- Clear, CAPS-aligned notes

- Visual diagrams and examples

- Quick revision notes

- Practice questions and answers

- Exam revision page

PDF format (non-editable)', 60.00, 'Grade 4', 'Term 2', '2026', 'Individual Resource', 'Summary', array['natural-science-and-technology'], null, '[{"id":"file-6057","label":"Summary PDF","filename":"grade-4-nst-term-2-summary.pdf","storageKey":"products/4cded1c7-7055-509b-b935-479e144133dc/file-6057-grade-4-nst-term-2-summary.pdf"}]'::jsonb, false, true, 6057, '{"title":"Grade 4 NST Term 2 Summary + Questions","description":"CAPS-aligned Grade 4 Term 2 Natural Science & Technology Summary. Includes summary + Questions. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('82974a1c-f108-50a2-b01d-aeb74e09a96f', 'grade-7-history-term-2-summary', 'Grade 7 History Term 2 Summary', 'CAPS-aligned Grade 7 Term 2 History Summary. Includes summary + Questions. Instant PDF download', 'This CAPS-aligned study summary helps Grade 7 learners revise the key History concepts taught in Term 2.

The notes explain important topics in a clear and learner-friendly way and include key words, revision notes, practice questions, answers, and a quick exam revision page to support test and exam preparation.

What’s included:

✔ Easy-to-understand summary notes

✔ Key words and definitions

✔ Detailed explanations of all CAPS topics

✔ Practice questions (Multiple Choice, Short Questions & Paragraph Writing)

✔ Full memorandum with answers

✔ Quick exam revision notes

✔ Visual “Quick Exam Revision” study page

Topics covered:

- West Africa before the slave trade

- Slavery in Africa

- The Transatlantic Slave Trade

- The Middle Passage

- Life on plantations

- Resistance to slavery (Nat Turner, Harriet Tubman, Joseph Cinque, John Brown)

- Economic impact of slavery

PDF format (non-editable)', 60.00, 'Grade 7', 'Term 2', '2026', 'Individual Resource', 'Summary', array['natural-science-and-technology','history'], null, '[{"id":"file-6032","label":"Summary PDF","filename":"grade-7-history-term-2-summary.pdf","storageKey":"products/82974a1c-f108-50a2-b01d-aeb74e09a96f/file-6032-grade-7-history-term-2-summary.pdf"}]'::jsonb, false, true, 6032, '{"title":"Grade 7 History Term 2 Summary","description":"CAPS-aligned Grade 7 Term 2 History Summary. Includes summary + Questions. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('5a1a8b57-ec2c-57a4-9a9b-725e7215bb0f', 'grade-5-history-term-2-summary', 'Grade 5 History Term 2 Summary', 'CAPS-aligned Grade 5 Term 2 History Summary. Includes summary + Questions. Instant PDF download', 'This CAPS-aligned study summary helps Grade 5 learners revise the key History concepts taught in Term 2.

The notes explain important topics in a clear and learner-friendly way and include key words, revision notes, practice questions, answers, and a quick exam revision page to support test and exam preparation.

What’s included:

✔ Easy-to-understand summary notes

✔ Key words and definitions

✔ Detailed explanations of all CAPS topics

✔ Practice questions (Multiple Choice, Short Questions & Paragraph Writing)

✔ Full memorandum with answers

✔ Quick exam revision notes

✔ Visual “Quick Exam Revision” study page

Topics covered:

- When, where and why the first farmers settled

- The Iron Age

- The farmers’ attitude to the land

- Interaction with the Khoikhoi and San

- Roles of men, women and children

- Crops and livestock

- Importance of cattle (Mafisa & Lobola)

- Tools, pottery and trade

- Religion, medicine and healing

- Hunting

PDF format (non-editable)', 60.00, 'Grade 5', 'Term 2', '2026', 'Individual Resource', 'Summary', array['natural-science-and-technology','history'], null, '[{"id":"file-6028","label":"Summary PDF","filename":"grade-5-history-term-2-summary.pdf","storageKey":"products/5a1a8b57-ec2c-57a4-9a9b-725e7215bb0f/file-6028-grade-5-history-term-2-summary.pdf"}]'::jsonb, false, true, 6028, '{"title":"Grade 5 History Term 2 Summary","description":"CAPS-aligned Grade 5 Term 2 History Summary. Includes summary + Questions. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('59519c06-4150-5523-9440-9872de31fd6f', 'grade-4-history-term-2-summary', 'Grade 4 History Term 2 Summary', 'CAPS-aligned Grade 4 Term 2 History Summary. Includes summary + Questions. Instant PDF download', 'This CAPS-aligned study summary helps Grade 4 learners revise the key History concepts taught in Term 2.

The notes explain important topics in a clear and learner-friendly way and include key words, revision notes, practice questions, answers, and a quick exam revision page to support test and exam preparation.

Topics covered include:

• What is a leader

• Qualities of a good leader

• Nelson Mandela’s early life

• Apartheid and its effects

• Mandela’s role in fighting apartheid

• Gandhi in South Africa

• Peaceful protest and the Great March

PDF format (non-editable)', 60.00, 'Grade 4', 'Term 2', '2026', 'Individual Resource', 'Summary', array['natural-science-and-technology','history'], null, '[{"id":"file-6021","label":"Summary PDF","filename":"grade-4-history-term-2-summary.pdf","storageKey":"products/59519c06-4150-5523-9440-9872de31fd6f/file-6021-grade-4-history-term-2-summary.pdf"}]'::jsonb, false, true, 6021, '{"title":"Grade 4 History Term 2 Summary","description":"CAPS-aligned Grade 4 Term 2 History Summary. Includes summary + Questions. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('6d4b76ad-d282-5454-b96f-e24b0bfee017', 'grade-4-geography-term-2-summary', 'Grade 4 Geography Term 2 Summary', 'CAPS-aligned Grade 4 Term 2 Geography Summary. Includes summary + Questions. Instant PDF download', 'This CAPS-aligned study summary helps Grade 4 learners revise the key concepts taught in Term 2 Geography.

The notes explain important concepts in a clear and easy-to-understand way and include key definitions, revision notes, practice questions and a memorandum .

Topics covered:

- Side views and plan views

- Symbols and keys

- Reading and drawing simple maps

- Grid references

- Compass directions

- Land and sea on a map

- Provinces of South Africa

- Neighbouring countries and borders

Perfect for revision, exam preparation, homeschooling, or extra support at home.

✔ CAPS aligned

✔ Clear explanations and diagrams

✔ Quick revision notes

✔ Practice questions with answers

✔ Exam revision page

PDF format (non-editable)', 60.00, 'Grade 4', 'Term 2', '2026', 'Individual Resource', 'Summary', array['natural-science-and-technology','geography'], null, '[{"id":"file-6016","label":"Summary PDF","filename":"grade-4-geography-term-2-summary.pdf","storageKey":"products/6d4b76ad-d282-5454-b96f-e24b0bfee017/file-6016-grade-4-geography-term-2-summary.pdf"}]'::jsonb, false, true, 6016, '{"title":"Grade 4 Geography Term 2 Summary","description":"CAPS-aligned Grade 4 Term 2 Geography Summary. Includes summary + Questions. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('7d58ae99-f1c4-5396-b237-7c86f59ecb0e', 'grade-6-history-term-2-summary', 'Grade 6 History Term 2 Summary', 'CAPS-aligned Grade 6 Term 2 History Summary. Includes summary + Questions. Instant PDF download', 'This CAPS-aligned study summary helps Grade 6 learners revise the key History concepts taught in Term 2.

The notes explain important topics in a clear and learner-friendly way and include key words, revision notes, practice questions, answers, and a quick exam revision page to support test and exam preparation.

Topics covered include:

• Reasons Europeans began exploring

• The Renaissance

• Navigation tools used by sailors

• Improvements in ships

• The journeys of Bartholomew Dias and Vasco da Gama

• The Dutch East India Company (VOC) and Jan van Riebeeck

• Life on VOC ships

Perfect for revision, exam preparation, homeschooling, or extra support at home.

✔ CAPS aligned

✔ Clear explanations and diagrams

✔ Quick revision notes

✔ Practice questions with answers

✔ Exam revision page

PDF format (non-editable)', 60.00, 'Grade 6', 'Term 2', '2026', 'Individual Resource', 'Summary', array['natural-science-and-technology','history'], null, '[{"id":"file-6010","label":"Summary PDF","filename":"grade-6-history-term-2-summary.pdf","storageKey":"products/7d58ae99-f1c4-5396-b237-7c86f59ecb0e/file-6010-grade-6-history-term-2-summary.pdf"}]'::jsonb, false, true, 6010, '{"title":"Grade 6 History Term 2 Summary","description":"CAPS-aligned Grade 6 Term 2 History Summary. Includes summary + Questions. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('8d2cf5d0-83a9-510e-b200-591a5dbaeee9', 'grade-5-geography-term-2-summary', 'Grade 5 Geography Term 2 Summary', 'CAPS-aligned Grade 5 Term 2 Geography Summary. Includes summary + Questions. Instant PDF download', 'This CAPS-aligned study summary helps Grade 5 learners revise the key concepts taught in Term 2 Geography.

The notes explain important concepts in a clear and easy-to-understand way and include key definitions, revision notes, practice questions and a memorandum .

Topics covered include:

- Physical maps of South Africa

- Coastal plains, escarpment and plateau

- Physical regions (Highveld, Lowveld, Karoo, Kalahari, Namaqualand)

- Mountains, valleys and erosion

- River systems and the Orange River

- Waterfalls, capes and bays

- How landscapes influence people and how humans change landscapes

Perfect for revision, exam preparation, homeschooling, or extra support at home.

✔ CAPS aligned

✔ Clear explanations and diagrams

✔ Quick revision notes

✔ Practice questions with answers

✔ Exam revision page

PDF format (non-editable)', 60.00, 'Grade 5', 'Term 2', '2026', 'Individual Resource', 'Summary', array['natural-science-and-technology','geography'], null, '[{"id":"file-6005","label":"Summary PDF","filename":"grade-5-geography-term-2-summary.pdf","storageKey":"products/8d2cf5d0-83a9-510e-b200-591a5dbaeee9/file-6005-grade-5-geography-term-2-summary.pdf"}]'::jsonb, false, true, 6005, '{"title":"Grade 5 Geography Term 2 Summary","description":"CAPS-aligned Grade 5 Term 2 Geography Summary. Includes summary + Questions. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('a7642d29-eafd-5421-a7ba-2e7f74e452bc', 'grade-7-geography-term-2-summary', 'Grade 7 Geography Term 2 Summary', 'CAPS-aligned Grade 7 Term 2 Geography Summary. Includes summary + Questions. Instant PDF download', 'This CAPS-aligned study summary helps Grade 7 learners revise the key concepts for the Term 2 Geography topic: Volcanoes, Earthquakes & Floods

The resource includes clear explanations, visual diagrams, quick revision notes, practice questions with answers, and a quick exam revision page to support learners when preparing for tests and exams.

Perfect for revision, exam preparation, homeschooling, or extra support at home.

✔ CAPS aligned

✔ Clear explanations and diagrams

✔ Quick revision notes

✔ Practice questions with answers

✔ Exam revision page

PDF format (non-editable)', 60.00, 'Grade 7', 'Term 2', '2026', 'Individual Resource', 'Summary', array['natural-science-and-technology','geography'], null, '[{"id":"file-5996","label":"Summary PDF","filename":"grade-7-geography-term-2-summary.pdf","storageKey":"products/a7642d29-eafd-5421-a7ba-2e7f74e452bc/file-5996-grade-7-geography-term-2-summary.pdf"}]'::jsonb, false, true, 5996, '{"title":"Grade 7 Geography Term 2 Summary","description":"CAPS-aligned Grade 7 Term 2 Geography Summary. Includes summary + Questions. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('8c2edeb9-891e-5309-be61-3b2a3122e0e0', 'grade-6-geography-term-2-summary', 'Grade 6 Geography Term 2 Summary', 'CAPS-aligned Grade 6 Term 2 Geography Summary. Includes summary + Questions. Instant PDF download', 'This CAPS-aligned study summary helps Grade 6 learners revise the key concepts for the Term 2 Geography topic: Trade .

The resource includes clear explanations, quick revision notes, practice questions with answers and a quick exam revision page to support learners when preparing for tests and exams.

Perfect for revision, exam preparation and reinforcing important Geography concepts.

✔ 20-page study summary ✔ CAPS aligned ✔ Includes practice questions and answers ✔ Quick revision notes for exams

PDF format (non-editable)', 60.00, 'Grade 6', 'Term 2', '2026', 'Individual Resource', 'Summary', array['natural-science-and-technology','geography'], null, '[{"id":"file-5991","label":"Summary PDF","filename":"grade-6-geography-term-2-summary.pdf","storageKey":"products/8c2edeb9-891e-5309-be61-3b2a3122e0e0/file-5991-grade-6-geography-term-2-summary.pdf"}]'::jsonb, false, true, 5991, '{"title":"Grade 6 Geography Term 2 Summary","description":"CAPS-aligned Grade 6 Term 2 Geography Summary. Includes summary + Questions. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('c6173f26-3b38-5474-88e3-173e1a496649', 'grade-5-mathematics-term-2-test-2026', 'Grade 5 Mathematics Term 2 Practice Test (2026)', 'CAPS-aligned Grade 5 Mathematics Term 2 Test. Worth 60 marks , includes full memo. Instant PDF download', 'This CAPS-aligned Grade 5 Mathematics Term 2 Practice Test is designed according to the 2026 ATP requirements. The paper is set out of 60 marks and includes a detailed memorandum for easy marking.

Topics include division, common fractions, numeric and geometric patterns, and properties of 2D shapes and symmetry.

Perfect for revision, exam preparation and building confidence before the June test.

PDF format (non-editable)', 60.00, 'Grade 5', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 60, '[{"id":"file-5974","label":"Test / Assessment PDF","filename":"grade-5-mathematics-term-2-test-2026.pdf","storageKey":"products/c6173f26-3b38-5474-88e3-173e1a496649/file-5974-grade-5-mathematics-term-2-test-2026.pdf"}]'::jsonb, false, true, 5974, '{"title":"Grade 5 Mathematics Term 2 Practice Test (2026)","description":"CAPS-aligned Grade 5 Mathematics Term 2 Test. Worth 60 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('a83dfdef-957e-54f4-a3a7-9f6cd6391795', 'grade-5-mathematics-june-test-2', 'Grade 5 Mathematics June Test (2026)', 'CAPS-aligned Grade 5 Mathematics June Test. Worth 60 marks , includes full memo. Instant PDF download', 'This CAPS-aligned Grade 5 Mathematics June Practice Test is designed according to the 2026 ATP requirements. The paper is set out of 60 marks and includes a detailed memorandum for easy marking.

It covers whole numbers, number sentences and calculations, addition and subtraction, common fractions, numeric and geometric patterns, and properties of 2D shapes and symmetry.

Perfect for revision, exam preparation and building confidence before the June test.

Perfect for parents, tutors, and teachers looking for structured History exam preparation before November assessments.

PDF format (non-editable)', 60.00, 'Grade 5', 'Any Term', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology','history'], 60, '[{"id":"file-5915","label":"Test / Assessment PDF","filename":"grade-5-mathematics-june-test-2.pdf","storageKey":"products/a83dfdef-957e-54f4-a3a7-9f6cd6391795/file-5915-grade-5-mathematics-june-test-2.pdf"}]'::jsonb, false, true, 5915, '{"title":"Grade 5 Mathematics June Test (2026)","description":"CAPS-aligned Grade 5 Mathematics June Test. Worth 60 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('18eb32c9-7968-5486-97e7-a0518e5c1efc', 'grade-7-full-year-test-bundle-2026', 'Grade 7 Full-Year Test Bundle (2026)', 'All four Grade 7 Term Test Bundles in one complete pack. Fully CAPS-aligned, includes all subjects for Term 1–4, plus full memorandums. Instant downloadable PDFs. Download the previews in the description to see what is covered in EACH test!', 'Grade 7 Full-Year Test Bundle (2026)

Get all your Grade 7 CAPS-aligned tests for the entire 2026 school year in one convenient full-year bundle. This pack includes Term 1, Term 2, Term 3, and Term 4 assessment bundles , each containing two tests per subject and full marking memos.

Perfect for parents, tutors, and learners who want structured practice and confidence throughout the year.

What’s Included (All Subjects Per Term)

✔ English HL & FAL ✔ Afrikaans FAL ✔ Life Skills (PSW) ✔ History ✔ Geography ✔ Natural Science & Technology ✔ Mathematics

Each term includes:

-
Two tests per subject

-
Full memorandums

-
CAPS ATP-aligned content for 2026

-
Printable PDFs (non-editable)

Bundle Benefits

- Covers the entire school year

- You save R200

- Easy and convenient

-
Unlimited downloads

-
Instant access after purchase

-
Helps reduce exam stress and improve learner confidence

Have a look at the previews below:

Term 1 Preview: https://designingminds.co.za/wp-content/uploads/2026/02/Grade-4-Term-1-Test-Bundle-Preview.pdf

Term 2 Preview: https://designingminds.co.za/wp-content/uploads/2026/02/Grade-4-Term-2-Test-Bundle-Preview.pdf

Term 3 Preview: https://designingminds.co.za/wp-content/uploads/2026/02/Grade-4-Term-3-Test-Bundle-Preview.pdf

Term 4 Preview: https://designingminds.co.za/wp-content/uploads/2026/02/Grade-4-Term-4-Test-Bundle-Preview.pdf', 350.00, 'Grade 7', 'Term 1', '2026', 'Bundle', 'Test / Assessment', array['mathematics','english-home-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography'], null, '[]'::jsonb, false, true, 5851, '{"title":"Grade 7 Full-Year Test Bundle (2026)","description":"All four Grade 7 Term Test Bundles in one complete pack. Fully CAPS-aligned, includes all subjects for Term 1–4, plus full memorandums. Instant downloadable PDF"}'::jsonb, array[]::text[], 'Term', null, null, null, null, null, array['mathematics','english-home-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography'], array['Term 1']),
  ('2ec0906e-9bcc-58e2-a9b1-99ba1d0b7adb', 'grade-7-term-4-test-bundle-2026', 'Grade 7 Term 4 Test Bundle (2026)', 'A complete Term 4 test bundle including two tests per subject for Grade 7. Fully CAPS-aligned with memorandums. Instant digital download. PDF format.', 'Grade 7 Term 4 Test Bundle (2026)

Prepare your Grade 7 learner with this comprehensive Term 4 test bundle. Includes two tests per subject , covering all major Grade 7 subjects in accordance with the 2026 CAPS ATP. Full memos included for every test.

Subjects Included:

✔ English HL & FAL ✔ Afrikaans FAL ✔ Life Orientation ✔ History ✔ Geography ✔ Natural Sciences ✔ Technology ✔ EMS ✔ Mathematics

All tests include memos. PDF format. (non-editable)

Click the link below to have a look at the preview

https://designingminds.co.za/wp-content/uploads/2026/02/Grade-7-Term-3-Test-Bundle-Preview.pdf

What You Receive:

-
All Grade 7 Term 4 assessments

-
Full memorandums

-
Unlimited downloads

-
Instant access after payment', 350.00, 'Grade 7', 'Term 4', '2026', 'Bundle', 'Test / Assessment', array['mathematics','english-home-language','afrikaans-first-additional-language','natural-science-and-technology','history','geography'], null, '[]'::jsonb, false, true, 5844, '{"title":"Grade 7 Term 4 Test Bundle (2026)","description":"A complete Term 4 test bundle including two tests per subject for Grade 7. Fully CAPS-aligned with memorandums. Instant digital download. PDF format."}'::jsonb, array[]::text[], 'Term', null, null, null, null, null, array['mathematics','english-home-language','afrikaans-first-additional-language','natural-science-and-technology','history','geography'], array['Term 4']),
  ('122b24f0-227c-581e-b9a6-1ff9d93b175e', 'grade-7-term-3-test-bundle-2026', 'Grade 7 Term 3 Test Bundle (2026)', 'A complete Term 3 test bundle including two tests per subject for Grade 7. Fully CAPS-aligned with memorandums. Instant digital download. PDF format.', 'Grade 7 Term 3 Test Bundle (2026)

Prepare your Grade 7 learner with this comprehensive Term 3 test bundle. Includes two tests per subject , covering all major Grade 7 subjects in accordance with the 2026 CAPS ATP. Full memos included for every test.

Subjects Included:

✔ English HL & FAL ✔ Afrikaans FAL ✔ Life Orientation ✔ History ✔ Geography ✔ Natural Sciences ✔ Technology ✔ EMS ✔ Mathematics

All tests include memos. PDF format. (non-editable)

Click the link below to have a look at the preview

https://designingminds.co.za/wp-content/uploads/2026/02/Grade-7-Term-3-Test-Bundle-Preview.pdf

What You Receive:

-
All Grade 7 Term 3 assessments

-
Full memorandums

-
Unlimited downloads

-
Instant access after payment', 350.00, 'Grade 7', 'Term 3', '2026', 'Bundle', 'Test / Assessment', array['mathematics','english-home-language','afrikaans-first-additional-language','natural-science-and-technology','history','geography'], null, '[]'::jsonb, false, true, 5839, '{"title":"Grade 7 Term 3 Test Bundle (2026)","description":"A complete Term 3 test bundle including two tests per subject for Grade 7. Fully CAPS-aligned with memorandums. Instant digital download. PDF format."}'::jsonb, array[]::text[], 'Term', null, null, null, null, null, array['mathematics','english-home-language','afrikaans-first-additional-language','natural-science-and-technology','history','geography'], array['Term 3']),
  ('0892345e-1915-587b-96ad-00b5ef5effa3', 'grade-7-term-2-test-bundle-2026', 'Grade 7 Term 2 Test Bundle (2026)', 'A complete Term 2 test bundle including two tests per subject for Grade 7. Fully CAPS-aligned with memorandums. Instant digital download. PDF format.', 'Grade 7 Term 2 Test Bundle (2026)

Prepare your Grade 7 learner with this comprehensive Term 2 test bundle. Includes two tests per subject , covering all major Grade 7 subjects in accordance with the 2026 CAPS ATP. Full memos included for every test.

Subjects Included:

✔ English HL & FAL ✔ Afrikaans FAL ✔ Life Orientation ✔ History ✔ Geography ✔ Natural Sciences ✔ Technology ✔ EMS ✔ Mathematics

A preview PDF may be added for full topic breakdown. All tests include memos. Tests do not state cognitive levels. PDF format.

What You Receive:

-
All Grade 7 Term 2 assessments

-
Full memorandums

-
Unlimited downloads

-
Instant access after payment', 350.00, 'Grade 7', 'Term 2', '2026', 'Bundle', 'Test / Assessment', array['mathematics','english-home-language','afrikaans-first-additional-language','natural-science-and-technology','history','geography'], null, '[]'::jsonb, false, true, 5833, '{"title":"Grade 7 Term 2 Test Bundle (2026)","description":"A complete Term 2 test bundle including two tests per subject for Grade 7. Fully CAPS-aligned with memorandums. Instant digital download. PDF format."}'::jsonb, array[]::text[], 'Term', null, null, null, null, null, array['mathematics','english-home-language','afrikaans-first-additional-language','natural-science-and-technology','history','geography'], array['Term 2']),
  ('9583682c-ac35-54b4-9162-8abd62fb3c12', 'grade-6-full-year-test-bundle-2026', 'Grade 6 Full-Year Test Bundle (2026)', 'All four Grade 6 Term Test Bundles in one complete pack. Fully CAPS-aligned, includes all subjects for Term 1–4, plus full memorandums. Instant downloadable PDFs. Download the previews in the description to see what is covered in EACH test!', 'Grade 6 Full-Year Test Bundle (2026)

Get all your Grade 6 CAPS-aligned tests for the entire 2026 school year in one convenient full-year bundle. This pack includes Term 1, Term 2, Term 3, and Term 4 assessment bundles , each containing two tests per subject and full marking memos.

Perfect for parents, tutors, and learners who want structured practice and confidence throughout the year.

What’s Included (All Subjects Per Term)

✔ English HL & FAL ✔ Afrikaans FAL ✔ Life Skills (PSW) ✔ History ✔ Geography ✔ Natural Science & Technology ✔ Mathematics

Each term includes:

-
Two tests per subject

-
Full memorandums

-
CAPS ATP-aligned content for 2026

-
Printable PDFs (non-editable)

Bundle Benefits

- Covers the entire school year

- You save R200

- Easy and convenient

-
Unlimited downloads

-
Instant access after purchase

-
Helps reduce exam stress and improve learner confidence

Have a look at the previews below:

Term 1 Preview: https://designingminds.co.za/wp-content/uploads/2026/02/Grade-4-Term-1-Test-Bundle-Preview.pdf

Term 2 Preview: https://designingminds.co.za/wp-content/uploads/2026/02/Grade-4-Term-2-Test-Bundle-Preview.pdf

Term 3 Preview: https://designingminds.co.za/wp-content/uploads/2026/02/Grade-4-Term-3-Test-Bundle-Preview.pdf

Term 4 Preview: https://designingminds.co.za/wp-content/uploads/2026/02/Grade-4-Term-4-Test-Bundle-Preview.pdf', 350.00, 'Grade 6', 'Term 1', '2026', 'Bundle', 'Test / Assessment', array['mathematics','english-home-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography'], null, '[]'::jsonb, false, true, 5826, '{"title":"Grade 6 Full-Year Test Bundle (2026)","description":"All four Grade 6 Term Test Bundles in one complete pack. Fully CAPS-aligned, includes all subjects for Term 1–4, plus full memorandums. Instant downloadable PDF"}'::jsonb, array[]::text[], 'Term', null, null, null, null, null, array['mathematics','english-home-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography'], array['Term 1']),
  ('08077826-b766-58bc-b2e8-4a5fc153a24c', 'grade-6-term-4-test-bundle-2026', 'Grade 6 Term 4 Test Bundle (2026)', 'Complete Term 4 test pack for Grade 6, including two CAPS-aligned tests per subject plus full memorandums. Instant PDF download.', 'Support your Grade 6 learner with a full set of Term 4 assessments across all subjects. Each subject includes two practice tests , aligned to the 2026 CAPS ATP and designed to build confidence.

Subjects Included:

✔ English HL & FAL ✔ Afrikaans FAL ✔ Life Skills PSW ✔ History ✔ Geography ✔ Natural Science & Technology ✔ Mathematics

A preview PDF can be included for a breakdown of topics covered. Tests include full memorandums. PDF format (non-editable)

Have a look at the preview here

https://designingminds.co.za/wp-content/uploads/2026/02/Grade

What You Receive:

-
All Grade 6 Term 4 tests

-
Full memos for each test

-
Unlimited downloads

-
Instant access after checkout', 350.00, 'Grade 6', 'Term 4', '2026', 'Bundle', 'Test / Assessment', array['mathematics','english-home-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography'], null, '[]'::jsonb, false, true, 5822, '{"title":"Grade 6 Term 4 Test Bundle (2026)","description":"Complete Term 4 test pack for Grade 6, including two CAPS-aligned tests per subject plus full memorandums. Instant PDF download."}'::jsonb, array[]::text[], 'Term', null, null, null, null, null, array['mathematics','english-home-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography'], array['Term 4']),
  ('d5b2f74e-4232-55d6-8469-2d9b0b48777d', 'grade-6-term-3-test-bundle-2026', 'Grade 6 Term 3 Test Bundle (2026)', 'Complete Term 3 test pack for Grade 6, including two CAPS-aligned tests per subject plus full memorandums. Instant PDF download.', 'Support your Grade 6 learner with a full set of Term 3 assessments across all subjects. Each subject includes two practice tests , aligned to the 2026 CAPS ATP and designed to build confidence.

Subjects Included:

✔ English HL & FAL ✔ Afrikaans FAL ✔ Life Skills PSW ✔ History ✔ Geography ✔ Natural Science & Technology ✔ Mathematics

A preview PDF can be included for a breakdown of topics covered. Tests include full memorandums. PDF format (non-editable)

Have a look at the preview here

https://designingminds.co.za/wp-content/uploads/2026/02/Grade

What You Receive:

-
All Grade 6 Term 3 tests

-
Full memos for each test

-
Unlimited downloads

-
Instant access after checkout', 350.00, 'Grade 6', 'Term 3', '2026', 'Bundle', 'Test / Assessment', array['mathematics','english-home-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography'], null, '[]'::jsonb, false, true, 5816, '{"title":"Grade 6 Term 3 Test Bundle (2026)","description":"Complete Term 3 test pack for Grade 6, including two CAPS-aligned tests per subject plus full memorandums. Instant PDF download."}'::jsonb, array[]::text[], 'Term', null, null, null, null, null, array['mathematics','english-home-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography'], array['Term 3']),
  ('9b594181-bac1-566a-a76e-29aeb04e7b1b', 'grade-6-term-2-test-bundle-2026-2', 'Grade 6 Term 2 Test Bundle (2026)', 'Complete Term 2 test pack for Grade 6, including two CAPS-aligned tests per subject plus full memorandums. Instant PDF download.', 'Support your Grade 6 learner with a full set of Term 2 assessments across all subjects. Each subject includes two practice tests , aligned to the 2026 CAPS ATP and designed to build confidence.

Subjects Included:

✔ English HL & FAL ✔ Afrikaans FAL ✔ Life Skills PSW ✔ History ✔ Geography ✔ Natural Science & Technology ✔ Mathematics

A preview PDF can be included for a breakdown of topics covered. Tests include full memorandums. PDF format (non-editable)

Have a look at the preview here

https://designingminds.co.za/wp-content/uploads/2026/02/Grade

What You Receive:

-
All Grade 6 Term 2 tests

-
Full memos for each test

-
Unlimited downloads

-
Instant access after checkout', 350.00, 'Grade 6', 'Term 2', '2026', 'Bundle', 'Test / Assessment', array['mathematics','english-home-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography'], null, '[]'::jsonb, false, true, 5810, '{"title":"Grade 6 Term 2 Test Bundle (2026)","description":"Complete Term 2 test pack for Grade 6, including two CAPS-aligned tests per subject plus full memorandums. Instant PDF download."}'::jsonb, array[]::text[], 'Term', null, null, null, null, null, array['mathematics','english-home-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography'], array['Term 2']),
  ('306560cc-9008-5fb8-b003-8f8f4a362cda', 'grade-5-full-year-test-bundle-2026', 'Grade 5 Full-Year Test Bundle (2026)', 'All four Grade 5 Term Test Bundles in one complete pack. Fully CAPS-aligned, includes all subjects for Term 1–4, plus full memorandums. Instant downloadable PDFs. Download the previews in the description to see what is covered in EACH test!', 'Grade 5 Full-Year Test Bundle (2026)

Get all your Grade 5 CAPS-aligned tests for the entire 2026 school year in one convenient full-year bundle. This pack includes Term 1, Term 2, Term 3, and Term 4 assessment bundles , each containing two tests per subject and full marking memos.

Perfect for parents, tutors, and learners who want structured practice and confidence throughout the year.

What’s Included (All Subjects Per Term)

✔ English HL & FAL ✔ Afrikaans FAL ✔ Life Skills (PSW) ✔ History ✔ Geography ✔ Natural Science & Technology ✔ Mathematics

Each term includes:

-
Two tests per subject

-
Full memorandums

-
CAPS ATP-aligned content for 2026

-
Printable PDFs (non-editable)

Bundle Benefits

- Covers the entire school year

- You save R200

- Easy and convenient

-
Unlimited downloads

-
Instant access after purchase

-
Helps reduce exam stress and improve learner confidence

Have a look at the previews below:

Term 1 Preview: https://designingminds.co.za/wp-content/uploads/2026/02/Grade-4-Term-1-Test-Bundle-Preview.pdf

Term 2 Preview: https://designingminds.co.za/wp-content/uploads/2026/02/Grade-4-Term-2-Test-Bundle-Preview.pdf

Term 3 Preview: https://designingminds.co.za/wp-content/uploads/2026/02/Grade-4-Term-3-Test-Bundle-Preview.pdf

Term 4 Preview: https://designingminds.co.za/wp-content/uploads/2026/02/Grade-4-Term-4-Test-Bundle-Preview.pdf', 350.00, 'Grade 5', 'Term 1', '2026', 'Bundle', 'Test / Assessment', array['mathematics','english-home-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography'], null, '[]'::jsonb, false, true, 5799, '{"title":"Grade 5 Full-Year Test Bundle (2026)","description":"All four Grade 5 Term Test Bundles in one complete pack. Fully CAPS-aligned, includes all subjects for Term 1–4, plus full memorandums. Instant downloadable PDF"}'::jsonb, array[]::text[], 'Term', null, null, null, null, null, array['mathematics','english-home-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography'], array['Term 1']),
  ('13f1e72b-f2b8-568f-82b8-cf5193001179', 'grade-5-term-4-test-bundle-2026', 'Grade 5 Term 4 Test Bundle (2026)', 'Complete Term 4 test pack for Grade 5, including two CAPS-aligned tests per subject plus full memorandums. Instant PDF download.', 'Grade 5 Term 4 Test Bundle (2026)

Support your Grade 5 learner with a full set of Term 4 assessments across all subjects. Each subject includes two practice tests , aligned to the 2026 CAPS ATP and designed to build confidence.

Subjects Included:

✔ English HL & FAL ✔ Afrikaans FAL ✔ Life Skills PSW ✔ History ✔ Geography ✔ Natural Science & Technology ✔ Mathematics

A preview PDF can be included for a breakdown of topics covered. Tests include full memorandums. PDF format (non-editable)

Have a look at the preview here

https://designingminds.co.za/wp-content/uploads/2026/02/Grade-5-Term-1-Test-Bundle-Preview.pdf

What You Receive:

-
All Grade 5 Term 4 tests

-
Full memos for each test

-
Unlimited downloads

-
Instant access after checkout', 350.00, 'Grade 5', 'Term 4', '2026', 'Bundle', 'Test / Assessment', array['mathematics','english-home-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography'], null, '[]'::jsonb, false, true, 5795, '{"title":"Grade 5 Term 4 Test Bundle (2026)","description":"Complete Term 4 test pack for Grade 5, including two CAPS-aligned tests per subject plus full memorandums. Instant PDF download."}'::jsonb, array[]::text[], 'Term', null, null, null, null, null, array['mathematics','english-home-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography'], array['Term 4']),
  ('6e99eb86-fdbe-5fdd-93c7-f32dc525dce4', 'grade-5-term-3-test-bundle-2026', 'Grade 5 Term 3 Test Bundle (2026)', 'Complete Term 3 test pack for Grade 5, including two CAPS-aligned tests per subject plus full memorandums. Instant PDF download.', 'Grade 5 Term 3 Test Bundle (2026)

Support your Grade 5 learner with a full set of Term 3 assessments across all subjects. Each subject includes two practice tests , aligned to the 2026 CAPS ATP and designed to build confidence.

Subjects Included:

✔ English HL & FAL ✔ Afrikaans FAL ✔ Life Skills PSW ✔ History ✔ Geography ✔ Natural Science & Technology ✔ Mathematics

A preview PDF can be included for a breakdown of topics covered. Tests include full memorandums. PDF format (non-editable)

Have a look at the preview here

https://designingminds.co.za/wp-content/uploads/2026/02/Grade-5-Term-1-Test-Bundle-Preview.pdf

What You Receive:

-
All Grade 5 Term 3 tests

-
Full memos for each test

-
Unlimited downloads

-
Instant access after checkout', 350.00, 'Grade 5', 'Term 3', '2026', 'Bundle', 'Test / Assessment', array['mathematics','english-home-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography'], null, '[]'::jsonb, false, true, 5789, '{"title":"Grade 5 Term 3 Test Bundle (2026)","description":"Complete Term 3 test pack for Grade 5, including two CAPS-aligned tests per subject plus full memorandums. Instant PDF download."}'::jsonb, array[]::text[], 'Term', null, null, null, null, null, array['mathematics','english-home-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography'], array['Term 3']),
  ('0d7d4551-50af-50f0-8561-97bc157b705d', 'grade-5-term-2-test-bundle-2026', 'Grade 5 Term 2 Test Bundle (2026)', 'Complete Term 2 test pack for Grade 5, including two CAPS-aligned tests per subject plus full memorandums. Instant PDF download.', 'Grade 5 Term 2 Test Bundle (2026)

Support your Grade 5 learner with a full set of Term 2 assessments across all subjects. Each subject includes two practice tests , aligned to the 2026 CAPS ATP and designed to build confidence.

Subjects Included:

✔ English HL & FAL ✔ Afrikaans FAL ✔ Life Skills PSW ✔ History ✔ Geography ✔ Natural Science & Technology ✔ Mathematics

A preview PDF can be included for a breakdown of topics covered. Tests include full memorandums. PDF format (non-editable)

Have a look at the preview here

https://designingminds.co.za/wp-content/uploads/2026/02/Grade-5-Term-1-Test-Bundle-Preview.pdf

What You Receive:

-
All Grade 5 Term 2 tests

-
Full memos for each test

-
Unlimited downloads

-
Instant access after checkout', 350.00, 'Grade 5', 'Term 2', '2026', 'Bundle', 'Test / Assessment', array['mathematics','english-home-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography'], null, '[]'::jsonb, false, true, 5781, '{"title":"Grade 5 Term 2 Test Bundle (2026)","description":"Complete Term 2 test pack for Grade 5, including two CAPS-aligned tests per subject plus full memorandums. Instant PDF download."}'::jsonb, array[]::text[], 'Term', null, null, null, null, null, array['mathematics','english-home-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography'], array['Term 2']),
  ('000b6dff-13d8-559c-a88e-b0db2afe18fa', 'grade-4-term-3-test-bundle-2026-2', 'Grade 4 Term 3 Test Bundle (2026)', 'A complete Grade 4 Term 3 CAPS-aligned test bundle including two tests per subject, with full memorandums. Instant downloadable PDF pack.', 'Grade 4 Term 3 Test Bundle (2026)

Support your Grade 4 learner with this comprehensive Term 4 assessment bundle , designed according to the revised CAPS Annual Teaching Plan for 2026.

This bundle includes two tests per subject , making it ideal for revision, exam preparation, homeschooling, and extra practice at home. Each test is supplied with a full memorandum for easy and stress-free marking.

Subjects Included

✔ English HL & FAL ✔ Afrikaans FAL ✔ Mathematics ✔ Life Skills (PSW) ✔ History ✔ Geography ✔ Natural Science & Technology

All tests are aligned to the revised CAPS ATP (2026) .Tests are provided in PDF format and include memorandums .

What You Receive

-
All Grade 4 Term 4 tests

-
Two tests per subject

-
Full memorandums for every test

-
Unlimited downloads from your account

-
Instant access after purchase

Preview the Tests & Memos

Before purchasing, you can view a sample preview to see what each test and memorandum looks like, including the layout, question types, and marking format.

👉 [Click here to view the preview PDF]', 350.00, 'Grade 4', 'Term 3', '2026', 'Bundle', 'Test / Assessment', array['mathematics','english-home-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography'], null, '[]'::jsonb, false, true, 5766, '{"title":"Grade 4 Term 3 Test Bundle (2026)","description":"A complete Grade 4 Term 3 CAPS-aligned test bundle including two tests per subject, with full memorandums. Instant downloadable PDF pack."}'::jsonb, array[]::text[], 'Term', null, null, null, null, null, array['mathematics','english-home-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography'], array['Term 3']),
  ('a7ed5c20-1275-5cab-b15b-39b86b8a16b6', 'grade-7-mathematics-term-4-paper-2-2', 'Grade 7 Mathematics Term 4 Paper 2', 'CAPS-aligned Grade 7 Mathematics Term 4 Paper 2. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 7 Mathematics Term 4 Paper 2 Practice Test is designed according to the CAPS curriculum and is ideal for revision and exam preparation.

Learners practise geometry, measurement, volume, and data handling through structured exam-style questions that develop problem-solving and mathematical reasoning skills.

Topics include:

- Geometry and angle properties

- Area and perimeter of 2D shapes

- Surface area and volume

- Data handling and graphs

✔ 50 marks

✔ CAPS aligned

✔ Exam-style paper

✔ Memorandum included

✔ Ideal for revision and assessment preparation

PDF format (non-editable)', 60.00, 'Grade 7', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 50, '[{"id":"file-5754","label":"Test / Assessment PDF","filename":"grade-7-mathematics-term-4-paper-2-2.pdf","storageKey":"products/a7ed5c20-1275-5cab-b15b-39b86b8a16b6/file-5754-grade-7-mathematics-term-4-paper-2-2.pdf"}]'::jsonb, false, true, 5754, '{"title":"Grade 7 Mathematics Term 4 Paper 2","description":"CAPS-aligned Grade 7 Mathematics Term 4 Paper 2. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('c433ba2d-8a5c-5f1e-95f5-3cb06265b7ae', 'grade-7-mathematics-term-4-paper-1', 'Grade 7 Mathematics Term 4 Paper 1', 'CAPS-aligned Grade 7 Mathematics Term 4 Paper 1. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 7 Mathematics Term 4 Paper 1 Practice Test is designed according to the CAPS curriculum and is ideal for revision and exam preparation.

Learners practise key maths skills through structured, exam-style questions that develop problem-solving and calculation confidence.

Topics include:

- Whole numbers and operations

- Common fractions

- Exponents and square roots

- Integers

- Patterns, functions and relationships

✔ 50 marks

✔ CAPS aligned

✔ Exam-style paper

✔ Memorandum included

✔ Ideal for revision and assessment preparation

PDF format (non-editable)', 60.00, 'Grade 7', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 50, '[{"id":"file-5748","label":"Test / Assessment PDF","filename":"grade-7-mathematics-term-4-paper-1.pdf","storageKey":"products/c433ba2d-8a5c-5f1e-95f5-3cb06265b7ae/file-5748-grade-7-mathematics-term-4-paper-1.pdf"}]'::jsonb, false, true, 5748, '{"title":"Grade 7 Mathematics Term 4 Paper 1","description":"CAPS-aligned Grade 7 Mathematics Term 4 Paper 1. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('8bca8a2f-af63-5a51-8816-543a3d0654d3', 'grade-7-geography-november-test', 'Grade 7 Geography November Test', 'CAPS-aligned Grade 7 Geography November Test. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 7 Geography Term 4 November Practice Test is designed according to the CAPS curriculum and is ideal for exam revision and preparation.

Learners practise key Geography concepts through exam-style questions that develop understanding, data interpretation, and geographical skills.

Topics include:

- Birth rates, death rates and population growth

- Pandemics and population change

- Natural resources in South Africa

- Conservation and eco-tourism

- Graph and source-based questions

✔ 50 marks

✔ CAPS aligned

✔ Exam-style assessment

✔ Memorandum included

✔ Ideal for revision and exam preparation

PDF format (non-editable)', 60.00, 'Grade 7', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','geography'], 50, '[{"id":"file-5746","label":"Test / Assessment PDF","filename":"grade-7-geography-november-test.pdf","storageKey":"products/8bca8a2f-af63-5a51-8816-543a3d0654d3/file-5746-grade-7-geography-november-test.pdf"}]'::jsonb, false, true, 5746, '{"title":"Grade 7 Geography November Test","description":"CAPS-aligned Grade 7 Geography November Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('fe680f8b-febf-5950-9460-c35627197eb1', 'grade-7-geography-term-4-test', 'Grade 7 Geography Term 4 Test', 'CAPS-aligned Grade 7 Geography Term 4 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 7 Geography Term 4 Practice Test is designed according to the CAPS curriculum and is ideal for revision and assessment preparation.

Learners practise key concepts through exam-style questions that develop understanding and geographical skills.

Topics include:

- Natural resources

- Water in South Africa

- River health and catchment areas

- Conservation and eco-tourism

✔ 50 marks

✔ CAPS aligned

✔ Learner-friendly layout

✔ Memorandum included

✔ Ideal for revision and exam preparation

PDF format (non-editable)', 60.00, 'Grade 7', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','geography'], 50, '[{"id":"file-5743","label":"Test / Assessment PDF","filename":"grade-7-geography-term-4-test.pdf","storageKey":"products/fe680f8b-febf-5950-9460-c35627197eb1/file-5743-grade-7-geography-term-4-test.pdf"}]'::jsonb, false, true, 5743, '{"title":"Grade 7 Geography Term 4 Test","description":"CAPS-aligned Grade 7 Geography Term 4 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('87780d59-52ab-56a9-9336-52bafef54f96', 'grade-7-history-november-test', 'Grade 7 History November Test', 'CAPS-aligned Grade 7 History November Test. Worth 50 marks , includes full memo. Instant PDF download', 'Prepare your child confidently for end-of-year exams with this Grade 7 History Term 4 November Practice Test , carefully designed according to the CAPS Social Sciences curriculum.

Topics Covered:

Colonisation of the Cape (17th–18th Centuries)

- The Dutch East India Company (VOC)

- Jan van Riebeeck and the establishment of the Cape settlement

- Trekboers and expansion into the interior

- Impact of colonisation on indigenous communities

Co-operation and Conflict on the Frontiers

- Frontier expansion and labour systems

- The role of inboekselings

- Migration and settlement patterns

- Historical interpretation of sources

Missionaries and Christianity in Southern Africa

- Robert Moffat and the Kuruman Mission Station

- Spread of Christianity and education

- Challenges faced by missionaries

- Impact on local communities and future missionaries

What’s Included:

✔ CAPS-aligned Grade 7 History November test

✔ 50 marks total

✔ Source-based and essay questions included

✔ Detailed memorandum and essay marking rubric

✔ Learner-friendly layout

✔ Ideal for revision and exam preparation

Perfect for parents, tutors, and teachers looking for structured History exam preparation before November assessments.

PDF format (non-editable)', 60.00, 'Grade 7', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','social-sciences','history'], 50, '[{"id":"file-5740","label":"Test / Assessment PDF","filename":"grade-7-history-november-test.pdf","storageKey":"products/87780d59-52ab-56a9-9336-52bafef54f96/file-5740-grade-7-history-november-test.pdf"}]'::jsonb, false, true, 5740, '{"title":"Grade 7 History November Test","description":"CAPS-aligned Grade 7 History November Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('82d73bad-c9b7-5167-9716-2bccb49f0a29', 'grade-7-history-term-4-test', 'Grade 7 History Term 4 Test', 'CAPS-aligned Grade 7 History Term 4 Test. Worth 50 marks , includes full memo. Instant PDF download', 'Help your child revise confidently with this Grade 7 History Term 4 Practice Test , carefully designed according to the CAPS Social Sciences curriculum.

Topics Covered:

- The Cape frontier and Frontier Wars

- Causes of conflict between settlers and indigenous communities

- Chief Maqoma and Xhosa resistance

- British immigration and its impact on the eastern frontier

- Missionaries and traders on the northern frontier

- Trade relationships and changing power dynamics

- Key historical concepts and terminology

- Essay writing and historical argument skills

What’s Included:

✔ CAPS-aligned Grade 7 History Term 4 test

✔ 50 marks total

✔ Source-based and essay questions included

✔ Detailed memorandum and essay rubric

✔ Learner-friendly layout

✔ Ideal for revision, assessment preparation, and exam practice

PDF format (non-editable)', 60.00, 'Grade 7', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','social-sciences','history'], 50, '[{"id":"file-5737","label":"Test / Assessment PDF","filename":"grade-7-history-term-4-test.pdf","storageKey":"products/82d73bad-c9b7-5167-9716-2bccb49f0a29/file-5737-grade-7-history-term-4-test.pdf"}]'::jsonb, false, true, 5737, '{"title":"Grade 7 History Term 4 Test","description":"CAPS-aligned Grade 7 History Term 4 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('267b0b25-6227-5712-b386-38373994d171', 'grade-7-technology-november-test', 'Grade 7 Technology November Test', 'CAPS-aligned Grade 7 Technology November Test. Worth 60 marks , includes full memo. Instant PDF download', 'Prepare your child confidently for end-of-year assessments with this Grade 7 Technology Term 4 November Practice Test , carefully designed according to the CAPS curriculum.

Topics Covered:

Design Process

- Design brief, specifications and constraints

- Designing solutions for real-life problems

- Sketching and visual communication

Systems and Control

- Types of levers (Class 1, 2 and 3)

- Mechanical systems and motion

Structures

- Frame and shell structures

- Natural vs man-made structures

Electricity and Magnetism

- Magnetism and magnetic forces

- Electromagnets

- Series circuit diagrams

Cranes and Mechanical Systems

- Types of cranes and their uses

- Purpose and function of cranes

Case Study: Emergency Shelters

- Natural disasters and displacement

- Shelter design requirements

- Materials and safety considerations

What’s Included:

✔ CAPS-aligned Grade 7 Technology November test

✔ 60 marks total

✔ Exam-style structured paper

✔ Design and drawing tasks included

✔ Detailed memorandum included

✔ Ideal for revision and exam preparation

Perfect for parents, tutors, and teachers looking for structured Technology exam preparation before November assessments.

PDF format (non-editable)', 60.00, 'Grade 7', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 60, '[{"id":"file-5733","label":"Test / Assessment PDF","filename":"grade-7-technology-november-test.pdf","storageKey":"products/267b0b25-6227-5712-b386-38373994d171/file-5733-grade-7-technology-november-test.pdf"}]'::jsonb, false, true, 5733, '{"title":"Grade 7 Technology November Test","description":"CAPS-aligned Grade 7 Technology November Test. Worth 60 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('c032f9c9-7f32-5ded-9b4f-e96d752f2728', 'grade-7-technology-term-4-test', 'Grade 7 Technology Term 4 Test', 'CAPS-aligned Grade 7 Technology Term 4 Test. Worth 50 marks , includes full memo. Instant PDF download', 'Support your child’s learning with this Grade 7 Technology Term 4 Practice Test , carefully designed according to the CAPS curriculum and aligned with Term 4 assessment requirements.

Topics Covered:

Emergency Situations and Refugees

- Causes of refugee situations

- Needs of refugees in emergency camps

- Shelter, food, and safety considerations

Emergency Food

- Nutritional needs in emergencies

- Suitable food types for refugee camps

- Food preparation limitations in disaster situations

Emergency Workers and Textiles

- Role of emergency services (NSRI)

- Protective clothing and materials

- Properties of textiles and insulation

Design Skills

- Designing an emergency shelter

- Design brief, specifications, and constraints

- Tools and materials

- Sketching and labelling design solutions

What’s Included:

✔ CAPS-aligned Grade 7 Technology Term 4 test

✔ 50 marks total

✔ Design-based assessment task included

✔ Learner-friendly layout

✔ Detailed memorandum and marking rubric included

✔ Ideal for revision, projects, and assessment preparation

Perfect for parents, tutors, and teachers looking for structured Technology revision before assessments.

PDF format (non-editable)', 60.00, 'Grade 7', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 50, '[{"id":"file-5730","label":"Test / Assessment PDF","filename":"grade-7-technology-term-4-test.pdf","storageKey":"products/c032f9c9-7f32-5ded-9b4f-e96d752f2728/file-5730-grade-7-technology-term-4-test.pdf"}]'::jsonb, false, true, 5730, '{"title":"Grade 7 Technology Term 4 Test","description":"CAPS-aligned Grade 7 Technology Term 4 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('e425e3b6-f2b9-5430-aaf7-c99dbdd330be', 'grade-7-natural-science-november-test', 'Grade 7 Natural Science November Test', 'CAPS-aligned Grade 7 Natural Science November Test. Worth 80 marks , includes full memo. Instant PDF download', 'Prepare your child confidently for end-of-year exams with this Grade 7 Natural Science Term 4 November Practice Test , carefully designed according to the CAPS curriculum.

This comprehensive exam-style assessment helps learners revise key scientific concepts while practising structured questions that develop understanding, application, and scientific reasoning skills.

The test mirrors formal assessment standards and includes a variety of question types such as multiple choice questions, data interpretation, diagrams, paragraph responses, calculations, and case study analysis.

Topics Covered:

Energy and Change

- Forms of energy and energy transfer

- Renewable and non-renewable energy sources

- Energy efficiency

- Energy conversions and conservation of energy

- Electrical circuits and energy transformations

Planet Earth and Beyond

- Gravity and gravitational pull

- Earth, Moon and Sun system

- Tides and the Moon’s influence on Earth

- Moon phases and orbit

- Cultural significance of the Moon

What’s Included:

✔ CAPS-aligned Grade 7 Natural Science November test

✔ 80 marks total

✔ Exam-style structured paper

✔ Diagrams, data handling and investigation questions

✔ Detailed memorandum included

✔ Ideal for revision and exam preparation

Perfect for parents, tutors, and teachers looking for structured Natural Science exam preparation before November assessments.

PDF format (non-editable)', 60.00, 'Grade 7', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 80, '[{"id":"file-5727","label":"Test / Assessment PDF","filename":"grade-7-natural-science-november-test.pdf","storageKey":"products/e425e3b6-f2b9-5430-aaf7-c99dbdd330be/file-5727-grade-7-natural-science-november-test.pdf"}]'::jsonb, false, true, 5727, '{"title":"Grade 7 Natural Science November Test","description":"CAPS-aligned Grade 7 Natural Science November Test. Worth 80 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('6e0e758a-28af-54ef-835a-7a015c901de3', 'grade-7-natural-science-term-4-test', 'Grade 7 Natural Science Term 4 Test', 'CAPS-aligned Grade 7 Natural Science Term 4 Test. Worth 50 marks , includes full memo. Instant PDF download', 'Help your child prepare with confidence using this Grade 7 Natural Science Term 4 Practice Test , carefully designed according to the CAPS curriculum.

This structured assessment gives learners the opportunity to revise key Term 4 concepts while practising exam-style questions that develop scientific understanding, reasoning, and application skills.

The paper includes a variety of question types such as multiple choice questions, true or false, short answers, diagram interpretation, and case study questions — closely reflecting formal assessment standards.

Topics Covered:

- The Earth, Sun and Moon system

- Seasons and the Earth’s tilt

- Solar energy and stored solar energy

- Gravity and its effects

- Day and night

- Moon phases and lunar eclipses

- Tides and the alignment of the Earth, Moon and Sun

- Cultural significance of the Moon (case study)

What’s Included:

✔ CAPS-aligned Grade 7 Natural Science Term 4 test

✔ 50 marks total

✔ Clear learner-friendly layout

✔ Diagrams and application questions included

✔ Detailed memorandum included

✔ Ideal for revision, exam preparation, and extra practice

Perfect for parents, tutors, and teachers looking for structured Natural Science revision before end-of-term assessments.

PDF format (non-editable)', 60.00, 'Grade 7', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 50, '[{"id":"file-5724","label":"Test / Assessment PDF","filename":"grade-7-natural-science-term-4-test.pdf","storageKey":"products/6e0e758a-28af-54ef-835a-7a015c901de3/file-5724-grade-7-natural-science-term-4-test.pdf"}]'::jsonb, false, true, 5724, '{"title":"Grade 7 Natural Science Term 4 Test","description":"CAPS-aligned Grade 7 Natural Science Term 4 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('b4ef1979-3f4d-5568-89e3-4027c0c5ecfd', 'grade-7-ems-november-test', 'Grade 7 Economic Management Sciences November Test', 'CAPS-aligned Grade 7 EMS November Test. Worth 100 marks , includes full memo. Instant PDF download', 'Help your child prepare confidently for end-of-year assessments with this Grade 7 Economic & Management Sciences (EMS) Term 4 November Practice Test , designed according to the CAPS curriculum.

This comprehensive exam-style paper provides learners with structured revision across Financial Literacy, Entrepreneurship, and The Economy , helping them practise key concepts while developing problem-solving and application skills.

The test closely reflects formal assessment standards and includes a variety of question types to support deeper understanding and exam readiness.

Topics Covered:

Financial Literacy

- Banking services and savings

- Functions of money

- Interest and savings accounts

- Responsible financial habits

Entrepreneurship

- Statement of Net Worth

- Business budgets

- Entrepreneur characteristics and skills

- Business decision-making

- Case study analysis

The Economy

- Inputs and outputs

- Stages of production

- Economic growth and productivity

- Sustainable use of resources

What’s Included:

✔ CAPS-aligned Grade 7 EMS November test

✔ 100 marks total

✔ Exam-style structured paper

✔ Case studies and application questions

✔ Detailed memorandum included

✔ Ideal for revision and exam preparation

Perfect for parents, tutors, and teachers looking for structured EMS exam preparation before November assessments.

-

Perfect for parents, tutors, and teachers looking for structured revision before November exams.

PDF format (non-editable)', 60.00, 'Grade 7', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 100, '[{"id":"file-5721","label":"Test / Assessment PDF","filename":"grade-7-ems-november-test.pdf","storageKey":"products/b4ef1979-3f4d-5568-89e3-4027c0c5ecfd/file-5721-grade-7-ems-november-test.pdf"}]'::jsonb, false, true, 5721, '{"title":"Grade 7 Economic Management Sciences November Test","description":"CAPS-aligned Grade 7 EMS November Test. Worth 100 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('c8b4a8af-3527-59df-9eec-72f31e256625', 'grade-7-ems-term-4-test', 'Grade 7 Economic Management Sciences Term 4 Test', 'CAPS-aligned Grade 7 EMS Term 4 Test. Worth 60 marks , includes full memo. Instant PDF download', 'Prepare your child with confidence using this Grade 7 Economic & Management Sciences Term 4 Practice Test , carefully designed according to the CAPS curriculum.

This structured assessment covers key concepts from The Economy and Financial Literacy , helping learners revise content while practising exam-style questions that develop understanding, application skills, and critical thinking.

The test includes a variety of question types such as:

- True or False questions

- Matching columns

- Short-answer and paragraph responses

- Case study questions

- Multiple choice questions

Topics Covered:

Section A: The Economy

- Inputs and outputs in the production process

- Stages of production (Primary, Secondary, Tertiary)

- Sustainable use of resources

- Economic growth and productivity

- The role of technology in production

Section B: Financial Literacy

- Banking services and financial institutions

- Savings and the functions of money

- The role of banks in the economy

- Interest and savings accounts

- Case study on developing good saving habits

What’s Included:

✔ CAPS-aligned Grade 7 EMS Term 4 test

✔ 60 marks total

✔ Clear, learner-friendly layout

✔ Detailed memorandum included

✔ Ideal for revision, exam preparation, and extra practice

Perfect for parents, tutors, and teachers looking for structured EMS revision before end-of-year assessments.

PDF format (non-editable)', 60.00, 'Grade 7', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 60, '[{"id":"file-5718","label":"Test / Assessment PDF","filename":"grade-7-ems-term-4-test.pdf","storageKey":"products/c8b4a8af-3527-59df-9eec-72f31e256625/file-5718-grade-7-ems-term-4-test.pdf"}]'::jsonb, false, true, 5718, '{"title":"Grade 7 Economic Management Sciences Term 4 Test","description":"CAPS-aligned Grade 7 EMS Term 4 Test. Worth 60 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('bd2837ea-7f9b-5e2c-931b-8f268c5909ba', 'grade-7-life-orientation-november-test', 'Grade 7 Life Orientation November Test', 'CAPS-aligned Grade 7 English First Additional Language November Test. Worth 60 marks , includes full memo. Instant PDF download', 'Help your child prepare confidently for final assessments with this Grade 7 Life Orientation Term 4 November Practice Test , designed according to the CAPS curriculum.

This comprehensive practice test allows learners to revise key Term 4 concepts while practising exam-style questions that develop understanding, application skills, and confidence before exams.

The paper includes a variety of question types such as short-answer questions, multiple choice questions, case studies, visual interpretation, and application-based questions — closely reflecting formal assessment tasks.

Topics Covered:

- Substance abuse and contributing factors

- Healthy lifestyle choices and nutrition

- Environmental health issues

- HIV and AIDS awareness

- Community health resources

- Religious diversity and belief systems

- Career awareness and workplace understanding

- Chronic illness awareness (Asthma case study)

What’s Included:

✔ CAPS-aligned Grade 7 Life Orientation November test

✔ 50 marks total

✔ Clear learner-friendly layout

✔ Detailed memorandum included

✔ Ideal for revision and exam preparation

Perfect for parents, tutors, and teachers looking for structured revision before November exams.

PDF format (non-editable)', 60.00, 'Grade 7', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['english-first-additional-language','natural-science-and-technology'], 60, '[{"id":"file-5714","label":"Test / Assessment PDF","filename":"grade-7-life-orientation-november-test.pdf","storageKey":"products/bd2837ea-7f9b-5e2c-931b-8f268c5909ba/file-5714-grade-7-life-orientation-november-test.pdf"}]'::jsonb, false, true, 5714, '{"title":"Grade 7 Life Orientation November Test","description":"CAPS-aligned Grade 7 English First Additional Language November Test. Worth 60 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('7806a7b6-943c-55f8-85a9-99db1fb40d07', 'grade-7-lo-term-4-test', 'Grade 7 Life Orientation Term 4 Test', 'CAPS-aligned Grade 7 Life Orientation Term 4 Test. Worth 50 marks , includes full memo. Instant PDF download', 'Help your child prepare with confidence using this Grade 7 Life Orientation Term 4 Practice Test , carefully designed according to the CAPS curriculum.

This resource provides learners with meaningful practice on key Term 4 topics, helping them revise important concepts while improving understanding and exam readiness.

The test includes a variety of question types such as multiple choice questions, matching activities, short answers, case studies, and application-based questions to develop both knowledge and critical thinking skills.

Topics Covered:

- Personal hygiene and healthy lifestyle choices

- Social, economic, environmental and political factors affecting health

- Diseases and health awareness (including HIV & AIDS and Covid-19)

- Healthy coping strategies and emotional wellbeing

- Religious diversity and belief systems

- Case study: Managing chronic illness (Type 1 diabetes)

What’s Included:

✔ CAPS-aligned Grade 7 Life Orientation test

✔ 50 marks total

✔ Clear learner-friendly layout

✔ Detailed memorandum included

✔ Ideal for revision, exam preparation, or extra practice at home

Perfect for parents, tutors, and teachers looking to support learners before assessments or exams.

PDF format (non-editable)', 60.00, 'Grade 7', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 50, '[{"id":"file-5709","label":"Test / Assessment PDF","filename":"grade-7-lo-term-4-test.pdf","storageKey":"products/7806a7b6-943c-55f8-85a9-99db1fb40d07/file-5709-grade-7-lo-term-4-test.pdf"}]'::jsonb, false, true, 5709, '{"title":"Grade 7 Life Orientation Term 4 Test","description":"CAPS-aligned Grade 7 Life Orientation Term 4 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('04d7ccb1-d514-5260-95d4-494fa496cd39', 'grade-7-english-fal-november-test', 'Grade 7 English First Additional Language November Test', 'CAPS-aligned Grade 7 English First Additional Language November Test. Worth 60 marks , includes full memo. Instant PDF download', 'This Grade 7 English First Additional Language November Practice Test is designed to help learners revise and prepare confidently for end-of-year examinations. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in formal school assessments.

The test includes:

• Reading comprehension with higher-order questions

• Visual literacy analysis

• Summary writing task

• Language Structures and Conventions revision covering grammar, vocabulary, and sentence construction

This resource includes:

✔ A complete 60-mark November examination paper

✔ A detailed memorandum for easy marking

✔ CAPS-aligned exam-style questions

✔ Clear instructions and learner-friendly layout

Ideal for revision, exam preparation, or additional practice at home or in the classroom.

PDF format (non-editable)', 60.00, 'Grade 7', 'Any Term', '2026', 'Individual Resource', 'Summary', array['english-first-additional-language','natural-science-and-technology'], 60, '[{"id":"file-5705","label":"Summary PDF","filename":"grade-7-english-fal-november-test.pdf","storageKey":"products/04d7ccb1-d514-5260-95d4-494fa496cd39/file-5705-grade-7-english-fal-november-test.pdf"}]'::jsonb, false, true, 5705, '{"title":"Grade 7 English First Additional Language November Test","description":"CAPS-aligned Grade 7 English First Additional Language November Test. Worth 60 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('900202c0-d810-52b8-8f08-f9acb06f581e', 'grade-7-english-fal-term-4-test', 'Grade 7 English First Additional Language Term 4 Test', 'CAPS-aligned Grade 7 English First Additional Language Term 4 Test. Worth 60 marks , includes full memo. Instant PDF download', 'This Grade 7 English First Additional Language Term 4 Practice Test is designed to help learners revise key language skills and prepare confidently for formal assessments. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in school examinations.

The test includes:

• Reading comprehension based on an informative text about Siya Kolisi

• Visual literacy using a website homepage analysis

• Summary writing task (50–60 words)

• Language Structures and Conventions covering grammar, parts of speech, figurative language, pronouns, tenses, and sentence transformation

This resource includes:

✔ A complete 60-mark CAPS-aligned practice test

✔ A detailed memorandum for easy marking

✔ Exam-style questions learners recognise from school assessments

✔ Clear instructions and learner-friendly layout

Perfect for revision, extra practice, or assessment preparation at home or in the classroom.

PDF format (non-editable)', 60.00, 'Grade 7', 'Term 4', '2026', 'Individual Resource', 'Summary', array['english-first-additional-language','natural-science-and-technology'], 60, '[{"id":"file-5702","label":"Summary PDF","filename":"grade-7-english-fal-term-4-test.pdf","storageKey":"products/900202c0-d810-52b8-8f08-f9acb06f581e/file-5702-grade-7-english-fal-term-4-test.pdf"}]'::jsonb, false, true, 5702, '{"title":"Grade 7 English First Additional Language Term 4 Test","description":"CAPS-aligned Grade 7 English First Additional Language Term 4 Test. Worth 60 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('dfc65560-2e7c-5c2f-bbe3-8f125702595f', 'grade-7-afrikaans-fal-november-test', 'Grade 7 Afrikaans First Additional Language November Test', 'CAPS-aligned Grade 7 Afrikaans First Additional Language November Test. Worth 60 marks , includes full memo. Instant PDF download', 'This Grade 7 Afrikaans First Additional Language November Practice Test is designed to help learners revise and prepare confidently for end-of-year examinations. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in formal school assessments.

The test includes:

• Reading comprehension based on an Afrikaans film text

• Visual literacy using an advertisement

• Summary writing task (80–100 words)

• Language Structures and Conventions covering grammar, sentence types, tenses, pronouns, idioms, and sentence transformation

This resource includes:

✔ A complete 60-mark November examination paper

✔ A detailed memorandum for easy marking

✔ CAPS-aligned exam-style questions

✔ Clear instructions and learner-friendly layout

Ideal for revision, exam preparation, or additional practice at home or in the classroom.

PDF format (non-editable)', 60.00, 'Grade 7', 'Any Term', '2026', 'Individual Resource', 'Summary', array['afrikaans-first-additional-language','natural-science-and-technology'], 60, '[{"id":"file-5699","label":"Summary PDF","filename":"grade-7-afrikaans-fal-november-test.pdf","storageKey":"products/dfc65560-2e7c-5c2f-bbe3-8f125702595f/file-5699-grade-7-afrikaans-fal-november-test.pdf"}]'::jsonb, false, true, 5699, '{"title":"Grade 7 Afrikaans First Additional Language November Test","description":"CAPS-aligned Grade 7 Afrikaans First Additional Language November Test. Worth 60 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('3d958d0b-576d-54dd-b96b-935d5acacbcb', 'grade-7-afrikaans-fal-term-4-test', 'Grade 7 Afrikaans First Additional Language Term 4 Test', 'CAPS-aligned Grade 7 Afrikaans First Additional Language Term 4 Test. Worth 60 marks , includes full memo. Instant PDF download', 'This Grade 7 Afrikaans First Additional Language Term 4 Practice Test is designed to help learners revise key language skills and prepare confidently for formal assessments. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in school examinations.

The test includes:

• Reading comprehension based on a diary entry

• Visual literacy using a book cover analysis

• Summary writing task (40–50 words)

• Language Structures and Conventions covering grammar, sentence structure, tenses, pronouns, conjunctions, and vocabulary development

This resource includes:

✔ A complete 60-mark CAPS-aligned practice test

✔ A detailed memorandum for easy marking

✔ Exam-style questions learners recognise from school assessments

✔ Clear instructions and learner-friendly layout

Perfect for revision, extra practice, or assessment preparation at home or in the classroom.

PDF format (non-editable)', 60.00, 'Grade 7', 'Term 4', '2026', 'Individual Resource', 'Summary', array['afrikaans-first-additional-language','natural-science-and-technology'], 60, '[{"id":"file-5697","label":"Summary PDF","filename":"grade-7-afrikaans-fal-term-4-test.pdf","storageKey":"products/3d958d0b-576d-54dd-b96b-935d5acacbcb/file-5697-grade-7-afrikaans-fal-term-4-test.pdf"}]'::jsonb, false, true, 5697, '{"title":"Grade 7 Afrikaans First Additional Language Term 4 Test","description":"CAPS-aligned Grade 7 Afrikaans First Additional Language Term 4 Test. Worth 60 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('75265fe4-5880-5f54-85ec-6f82d4f6ff6d', 'grade-7-english-hl-november-test', 'Grade 7 English Home Language November Test', 'CAPS-aligned Grade 7 English Home Language November Test. Worth 60 marks , includes full memo. Instant PDF download', 'This Grade 7 English Home Language November Practice Test is designed to help learners revise and prepare confidently for their end-of-year examinations. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in formal school assessments.

The test includes:

• Reading comprehension based on an informative text

• Visual literacy using an infographic

• Summary writing task (60–80 words)

• Language Structures and Conventions covering grammar, sentence structure, tenses, and punctuation

This resource includes:

✔ A complete 60-mark November examination paper

✔ A detailed memorandum for easy marking

✔ CAPS-aligned assessment structure and weighting

✔ Clear instructions and learner-friendly layout

Perfect for revision, exam preparation, or extra practice at home or in the classroom.

PDF format (non-editable)', 60.00, 'Grade 7', 'Any Term', '2026', 'Individual Resource', 'Summary', array['english-home-language','natural-science-and-technology'], 60, '[{"id":"file-5693","label":"Summary PDF","filename":"grade-7-english-hl-november-test.pdf","storageKey":"products/75265fe4-5880-5f54-85ec-6f82d4f6ff6d/file-5693-grade-7-english-hl-november-test.pdf"}]'::jsonb, false, true, 5693, '{"title":"Grade 7 English Home Language November Test","description":"CAPS-aligned Grade 7 English Home Language November Test. Worth 60 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('e7326134-9907-563b-932a-88efda8a33b8', 'grade-7-english-hl-term-4-test', 'Grade 7 English Home Language Term 4 Test', 'CAPS-aligned Grade 7 English Home Language Term 4 Test. Worth 60 marks , includes full memo. Instant PDF download', 'This Grade 7 English Home Language practice test is designed to help learners revise and prepare for Term 4 assessments and examinations. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in formal school assessments.

The test includes:

• Reading comprehension based on an informative text

• Visual literacy questions using an advertisement

• A structured summary writing task

• Language Structures and Conventions questions covering grammar, tenses, punctuation, and sentence analysis

This resource includes:

✔ A complete 60-mark test

✔ Detailed memorandum for easy marking

✔ CAPS-aligned content and assessment format

✔ Clear instructions and learner-friendly layout

Perfect for revision, extra practice, or exam preparation at home.

PDF format (non-editable)', 60.00, 'Grade 7', 'Term 4', '2026', 'Individual Resource', 'Summary', array['english-home-language','natural-science-and-technology'], 60, '[{"id":"file-5649","label":"Summary PDF","filename":"grade-7-english-hl-term-4-test.pdf","storageKey":"products/e7326134-9907-563b-932a-88efda8a33b8/file-5649-grade-7-english-hl-term-4-test.pdf"}]'::jsonb, false, true, 5649, '{"title":"Grade 7 English Home Language Term 4 Test","description":"CAPS-aligned Grade 7 English Home Language Term 4 Test. Worth 60 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('4b6180ac-5bb3-59dc-89ff-ffa29fc2b052', 'grade-6-mathematics-november-test', 'Grade 6 Mathematics November Test', 'CAPS-aligned Grade 6 Mathematics November Test. Worth 100 marks , includes full memo. Instant PDF download', 'This Grade 6 Mathematics November Practice Test is designed to help learners revise and prepare confidently for their end-of-year examinations. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in formal school assessments.

The test covers key mathematics topics including:

• Mental Maths and Whole Numbers

• Data Handling and Graphs

• Time and Mass

• Area, Perimeter and Volume

• 2D Shapes, 3D Objects and Transformations

• Fractions, Decimals and Percentages

This resource includes:

✔ A complete 100-mark November examination paper

✔ A detailed memorandum for easy marking

✔ CAPS-aligned questions and cognitive levels

✔ Clear instructions and learner-friendly layout

Perfect for revision, exam preparation, or extra practice at home or in the classroom.

PDF format (non-editable)', 60.00, 'Grade 6', 'Any Term', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 100, '[{"id":"file-5644","label":"Test / Assessment PDF","filename":"grade-6-mathematics-november-test.pdf","storageKey":"products/4b6180ac-5bb3-59dc-89ff-ffa29fc2b052/file-5644-grade-6-mathematics-november-test.pdf"}]'::jsonb, false, true, 5644, '{"title":"Grade 6 Mathematics November Test","description":"CAPS-aligned Grade 6 Mathematics November Test. Worth 100 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('34abeee2-1d4e-5c84-92fa-615486d0dfe0', 'grade-6-mathematics-term-4-test', 'Grade 6 Mathematics Term 4 Test', 'CAPS-aligned Grade 6 Mathematics Term 4 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 6 Mathematics Term 4 test is designed to help learners revise key concepts and prepare confidently for formal assessments and examinations. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in school assessments.

The test covers important Term 4 topics including:

• Mental Maths

• Mass

• Time

• Capacity and Volume

• Data Handling

• Ratio, Fractions and Decimals

This resource includes:

✔ A complete 50-mark practice test

✔ A detailed memorandum for easy marking

✔ CAPS-aligned questions and cognitive levels

✔ Clear instructions and learner-friendly layout

Perfect for revision, extra practice, or exam preparation at home.

PDF format (non-editable)', 60.00, 'Grade 6', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 50, '[{"id":"file-5641","label":"Test / Assessment PDF","filename":"grade-6-mathematics-term-4-test.pdf","storageKey":"products/34abeee2-1d4e-5c84-92fa-615486d0dfe0/file-5641-grade-6-mathematics-term-4-test.pdf"}]'::jsonb, false, true, 5641, '{"title":"Grade 6 Mathematics Term 4 Test","description":"CAPS-aligned Grade 6 Mathematics Term 4 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('30fbeebe-5e89-5394-9855-62893ba364da', 'grade-6-nst-november-test', 'Grade 6 Natural Science & Technology November Test', 'CAPS-aligned Grade 6 NST November Test. Worth 60 marks , includes full memo. Instant PDF download', 'This Grade 6 Natural Science November Practice Test is designed to help learners revise and prepare confidently for their end-of-year examinations. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in formal school assessments.

The test covers important Term 4 topics, including:

• Energy and Change (electricity, conductors and insulators, renewable and non-renewable energy)

• Electric circuits and energy use

• Planet Earth and Beyond

• The Solar System, rotation and revolution

• Space exploration and the Curiosity Rover mission

This resource includes:

✔ A complete 60-mark CAPS-aligned November test

✔ A detailed memorandum for easy marking

✔ Diagram and case-study questions

✔ Clear instructions and learner-friendly layout

Perfect for revision, extra practice, or final exam preparation at home or in the classroom.

PDF format (non-editable)', 60.00, 'Grade 6', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 60, '[{"id":"file-5638","label":"Test / Assessment PDF","filename":"grade-6-nst-november-test.pdf","storageKey":"products/30fbeebe-5e89-5394-9855-62893ba364da/file-5638-grade-6-nst-november-test.pdf"}]'::jsonb, false, true, 5638, '{"title":"Grade 6 Natural Science & Technology November Test","description":"CAPS-aligned Grade 6 NST November Test. Worth 60 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('365bceeb-fdb2-5f1b-9dcc-716ae2ceadb3', 'grade-6-nst-term-4-test', 'Grade 6 Natural Science & Technology Term 4 Test', 'CAPS-aligned Grade 6 NST Term 4 Test. Worth 40 marks , includes full memo. Instant PDF download', 'This Grade 6 Natural Science Term 4 Practice Test is designed to help learners revise and prepare for formal assessments in line with the CAPS curriculum.

The test focuses on Planet Earth and Beyond , including:

• The Solar System

• Rotation and revolution

• Telescopes and space exploration

• The Curiosity Rover and Mars exploration

• Asteroids and space technology

This resource includes:

✔ A complete 40-mark test

✔ A detailed memorandum for easy marking

✔ Case study with higher-order questions

✔ Clear, learner-friendly layout

Perfect for revision, consolidation, or exam preparation at home or in class.

PDF format (non-editable)', 60.00, 'Grade 6', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 40, '[{"id":"file-5636","label":"Test / Assessment PDF","filename":"grade-6-nst-term-4-test.pdf","storageKey":"products/365bceeb-fdb2-5f1b-9dcc-716ae2ceadb3/file-5636-grade-6-nst-term-4-test.pdf"}]'::jsonb, false, true, 5636, '{"title":"Grade 6 Natural Science & Technology Term 4 Test","description":"CAPS-aligned Grade 6 NST Term 4 Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('8b2cf7f6-ff46-55e3-a4d7-e264117935e8', 'grade-6-geography-november-test', 'Grade 6 Geography November Test', 'CAPS-aligned Grade 6 Geography November Test. Worth 40 marks , includes full memo. Instant PDF download', 'This Grade 6 Geography November practice test is designed to help learners revise and prepare for their Term 4 examinations. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in formal school assessments.

The test covers key topics such as:

• Climate and vegetation around the world

• Weather instruments and synoptic maps

• Climate zones of the Earth

• Urban and rural settlements

• South Africa’s provinces and population distribution

• Factors influencing industrial location

This resource includes:

✔ A complete 40-mark practice test

✔ A detailed memorandum for easy marking

✔ Exam-style questions aligned to CAPS

✔ Clear, learner-friendly layout suitable for revision at home

Perfect for revision at home, extra practice, or assessment preparation.

PDF format (non-editable)', 60.00, 'Grade 6', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','geography'], 40, '[{"id":"file-5631","label":"Test / Assessment PDF","filename":"grade-6-geography-november-test.pdf","storageKey":"products/8b2cf7f6-ff46-55e3-a4d7-e264117935e8/file-5631-grade-6-geography-november-test.pdf"}]'::jsonb, false, true, 5631, '{"title":"Grade 6 Geography November Test","description":"CAPS-aligned Grade 6 Geography November Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('1f9e7b67-8c4c-5331-bcaa-de7cc202a319', 'grade-6-geography-term-4-test', 'Grade 6 Geography Term 4 Test', 'CAPS-aligned Grade 6 Geography Term 4 Test. Worth 40 marks , includes full memo. Instant PDF download', 'This Grade 6 Geography Term 4 Practice Test is designed to help learners revise key geographical concepts and prepare confidently for formal assessments. The test is aligned to the CAPS Social Sciences curriculum and follows the structure learners are familiar with in school examinations.

The test covers important Term 4 Geography topics, including:

• Why people live where they do

• Rural and urban settlements

• Natural and human factors influencing settlement locations

• Population distribution in South Africa

• Provinces and population density

• Population patterns around the world

• Map and graph interpretation skills

This resource includes:

✔ A complete 40-mark CAPS-aligned practice test

✔ A detailed memorandum for easy marking

✔ Map, graph, and data-based questions

✔ Clear instructions and learner-friendly layout

Perfect for revision, extra practice, or assessment preparation at home or in the classroom.

PDF format (non-editable)', 60.00, 'Grade 6', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','social-sciences','geography'], 40, '[{"id":"file-5628","label":"Test / Assessment PDF","filename":"grade-6-geography-term-4-test.pdf","storageKey":"products/1f9e7b67-8c4c-5331-bcaa-de7cc202a319/file-5628-grade-6-geography-term-4-test.pdf"}]'::jsonb, false, true, 5628, '{"title":"Grade 6 Geography Term 4 Test","description":"CAPS-aligned Grade 6 Geography Term 4 Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('af2ef375-64d3-5396-90f1-023ca6411da7', 'grade-6-history-november-test', 'Grade 6 History November Test', 'CAPS-aligned Grade 6 History November Test . Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 6 History Term 4 November Practice Test is designed to help learners revise key historical concepts and prepare confidently for end-of-year assessments. The test is aligned to the CAPS Social Sciences curriculum and follows the structure learners are familiar with in formal school examinations.

The test covers important Term 4 History topics, including:

• Democracy and citizenship in South Africa

• The Constitution and the Bill of Rights

• Nelson Mandela and the struggle against Apartheid

• Traditional healing and the development of modern medicine

• Diseases, vaccinations, and public health awareness

• Source-based and case study questions that develop historical thinking skills

This resource includes:

✔ A complete 50-mark CAPS-aligned November test

✔ A detailed memorandum for easy marking

✔ Source-based and extended response questions

✔ Clear instructions and learner-friendly layout

Perfect for revision at home, extra practice, or assessment preparation.

PDF format (non-editable)', 60.00, 'Grade 6', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','social-sciences','history'], 50, '[{"id":"file-5625","label":"Test / Assessment PDF","filename":"grade-6-history-november-test.pdf","storageKey":"products/af2ef375-64d3-5396-90f1-023ca6411da7/file-5625-grade-6-history-november-test.pdf"}]'::jsonb, false, true, 5625, '{"title":"Grade 6 History November Test","description":"CAPS-aligned Grade 6 History November Test . Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('21abfe6b-ca51-51e9-89ca-46c9bfb997ed', 'grade-6-history-term-4-test', 'Grade 6 History Term 4 Test', 'CAPS-aligned Grade 6 History Term 4 Test. Worth 40 marks , includes full memo. Instant PDF download', 'This Grade 6 History Term 4 Practice Test is designed to help learners revise important historical concepts and prepare confidently for formal assessments. The test is aligned to the CAPS Social Sciences curriculum and follows the structure learners are familiar with in school examinations.

The test focuses on key Term 4 History content and includes:

• Indigenous healing practices in South Africa

• Traditional healers and the role of medicinal plants and spiritual beliefs

• The development of modern Western scientific medicine

• Important medical discoveries and scientists such as Edward Jenner, Louis Pasteur, Robert Koch, and Christiaan Barnard

• The impact of vaccinations, germ theory, anaesthetics, and medical breakthroughs on society

This resource includes:

✔ A complete 40-mark CAPS-aligned practice test

✔ A detailed memorandum for easy marking

✔ Exam-style questions learners recognise from school assessments

✔ Higher-order thinking and paragraph-writing activities

✔ Clear instructions and learner-friendly layout

Perfect for revision, extra practice, or assessment preparation at home or in the classroom.

PDF format (non-editable)', 60.00, 'Grade 6', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','social-sciences','history'], 40, '[{"id":"file-5623","label":"Test / Assessment PDF","filename":"grade-6-history-term-4-test.pdf","storageKey":"products/21abfe6b-ca51-51e9-89ca-46c9bfb997ed/file-5623-grade-6-history-term-4-test.pdf"}]'::jsonb, false, true, 5623, '{"title":"Grade 6 History Term 4 Test","description":"CAPS-aligned Grade 6 History Term 4 Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('abbfc7c3-6468-52d6-b466-dcc063c971d3', 'grade-6-life-skills-psw-november-test', 'Grade 6 Life Skills PSW November Test', 'CAPS-aligned Grade 6 Life Skills PSW November Test . Worth 30 marks , includes full memo. Instant PDF download', 'This Grade 6 Life Skills Personal and Social Well-being (PSW) November Practice Test is designed to help learners revise important Term 4 concepts and prepare confidently for end-of-year assessments. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in formal school examinations.

The test covers key Personal and Social Well-being topics, including:

• Respect, diversity, and stereotyping

• Ubuntu and nation building

• Positive communication skills and relationships

• Animal care and anti-cruelty awareness

• Communicable diseases and HIV awareness

• Food hygiene and food safety practices

• Responsibility and citizenship values

• Communication and conflict resolution through a real-life case study

This resource includes:

✔ A complete 30-mark CAPS-aligned November practice test

✔ A detailed memorandum for easy marking

✔ Application-based and scenario questions

✔ Clear instructions and learner-friendly layout

✔ Ideal revision practice before final examinations

Perfect for revision at home, extra practice, or assessment preparation.

PDF format (non-editable)', 60.00, 'Grade 6', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['life-skills','natural-science-and-technology'], 30, '[{"id":"file-5620","label":"Test / Assessment PDF","filename":"grade-6-life-skills-psw-november-test.pdf","storageKey":"products/abbfc7c3-6468-52d6-b466-dcc063c971d3/file-5620-grade-6-life-skills-psw-november-test.pdf"}]'::jsonb, false, true, 5620, '{"title":"Grade 6 Life Skills PSW November Test","description":"CAPS-aligned Grade 6 Life Skills PSW November Test . Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('11557079-78e8-5407-b52d-ee7a72a864e0', 'grade-6-life-skills-psw-term-4-test', 'Grade 6 Life Skills PSW Term 4 Test', 'CAPS-aligned Grade 6 Life Skills PSW Term 4 Test. Worth 30 marks , includes full memo. Instant PDF download', 'This Grade 6 Life Skills PSW Term 4 Practice Test is designed to help learners revise key Personal and Social Well-being concepts and prepare confidently for formal assessments. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in school examinations.

The test covers important Term 4 topics such as:

• Basic first aid and treatment of injuries

• Food hygiene and prevention of food-borne diseases

• Communicable diseases and their symptoms

• HIV and AIDS education, myths, and awareness

• Health and safety practices in everyday life

• Case studies that develop problem-solving and decision-making skills

This resource includes:

✔ A complete 30-mark CAPS-aligned test

✔ A detailed memorandum for easy marking

✔ Application-based and scenario questions

✔ Clear instructions and learner-friendly layout

✔ Ideal for revision, practice, or assessment preparation at home or school

Perfect for parents and teachers looking to reinforce Life Skills knowledge and build learner confidence before assessments.

PDF format (non-editable)', 60.00, 'Grade 6', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['life-skills','natural-science-and-technology'], 30, '[{"id":"file-5615","label":"Test / Assessment PDF","filename":"grade-6-life-skills-psw-term-4-test.pdf","storageKey":"products/11557079-78e8-5407-b52d-ee7a72a864e0/file-5615-grade-6-life-skills-psw-term-4-test.pdf"}]'::jsonb, false, true, 5615, '{"title":"Grade 6 Life Skills PSW Term 4 Test","description":"CAPS-aligned Grade 6 Life Skills PSW Term 4 Test. Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('d3a5f507-b91c-5410-b909-7293a5218094', 'grade-6-afrikaans-first-additional-language-november-test', 'Grade 6 Afrikaans First Additional Language November Test', 'CAPS-aligned Grade 6 Afrikaans FAL November Test . Worth 40 marks , includes full memo. Instant PDF download', 'This Grade 6 Afrikaans First Additional Language November Practice Test is designed to help learners revise key language skills and prepare confidently for end-of-year examinations. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in formal school assessments.

The test assesses a range of language skills through engaging, real-life content and includes:

• Reading comprehension based on a newspaper article about a new community playground

• Visual literacy using a park map and picture interpretation activities

• Summary skills where learners sequence events logically

• Language in context including tenses, antonyms, adjectives, sentence construction, conjunctions, and negative form

This resource includes:

✔ A complete 40-mark CAPS-aligned November practice test

✔ A detailed memorandum for easy marking

✔ Cognitive-level weighting aligned to assessment standards

✔ Clear instructions and learner-friendly layout

✔ Ideal revision practice before final examinations

Perfect for revision at home, extra practice, or assessment preparation.

PDF format (non-editable)', 60.00, 'Grade 6', 'Any Term', '2026', 'Individual Resource', 'Summary', array['afrikaans-first-additional-language','natural-science-and-technology'], 40, '[{"id":"file-5612","label":"Summary PDF","filename":"grade-6-afrikaans-first-additional-language-november-test.pdf","storageKey":"products/d3a5f507-b91c-5410-b909-7293a5218094/file-5612-grade-6-afrikaans-first-additional-language-november-test.pdf"}]'::jsonb, false, true, 5612, '{"title":"Grade 6 Afrikaans First Additional Language November Test","description":"CAPS-aligned Grade 6 Afrikaans FAL November Test . Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('7021711a-dd78-595b-9af0-a1fa72acb54b', 'grade-6-afrikaans-first-additional-language-term-4-test', 'Grade 6 Afrikaans First Additional Language Term 4 Test', 'CAPS-aligned Grade 6 Afrikaans First Additional Language Term 4 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 6 Afrikaans First Additional Language (FAL) Term 4 Test is designed to help learners revise key language skills and prepare confidently for formal assessments and examinations. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in school-based assessments.

The test includes a variety of questions that assess reading comprehension, language understanding, and application skills through engaging and age-appropriate content.

The test covers important Term 4 topics such as:

• Literary and non-literary reading comprehension

• Visual text interpretation

• Summary writing skills

• Language in context

• Grammar, vocabulary, and sentence structure

• Direct and indirect speech, adjectives, antonyms, and punctuation

This resource includes:

✔ A complete 50-mark CAPS-aligned test

✔ A detailed memorandum for easy marking

✔ Exam-style questions learners recognise from school assessments

✔ Clear instructions and learner-friendly layout

Perfect for revision, extra practice, or exam preparation at home.

PDF format (non-editable)', 60.00, 'Grade 6', 'Term 4', '2026', 'Individual Resource', 'Summary', array['afrikaans-first-additional-language','natural-science-and-technology'], 50, '[{"id":"file-5608","label":"Summary PDF","filename":"grade-6-afrikaans-first-additional-language-term-4-test.pdf","storageKey":"products/7021711a-dd78-595b-9af0-a1fa72acb54b/file-5608-grade-6-afrikaans-first-additional-language-term-4-test.pdf"}]'::jsonb, false, true, 5608, '{"title":"Grade 6 Afrikaans First Additional Language Term 4 Test","description":"CAPS-aligned Grade 6 Afrikaans First Additional Language Term 4 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('d30f6f65-59a1-589a-93cf-ea1c54dac694', 'grade-6-english-fal-november-test', 'Grade 6 English First Additional Language November Test', 'CAPS-aligned Grade 6 English FAL November Test . Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 6 English First Additional Language (FAL) November Practice Test is designed to help learners revise and prepare confidently for their end-of-year examinations. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in formal school assessments.

The test covers key Term 4 language skills, including:

• Reading comprehension based on an informational text

• Visual literacy using a poster analysis task

• Summary writing skills (50–60 word summary)

• Language structures and conventions such as:

– Direct and indirect speech

– Parts of speech

– Conjunctions and sentence construction

– Adverbs and adjectives

– Tenses and punctuation

– Subject and predicate identification

This resource includes:

✔ A complete 50-mark CAPS-aligned test

✔ A detailed memorandum for easy marking

✔ Cognitive level distribution aligned to assessment standards

✔ Clear instructions and learner-friendly layout

✔ Ideal revision practice for November examinations

Perfect for revision at home, extra practice, or assessment preparation.

PDF format (non-editable)', 60.00, 'Grade 6', 'Term 4', '2026', 'Individual Resource', 'Summary', array['english-first-additional-language','natural-science-and-technology'], 50, '[{"id":"file-5606","label":"Summary PDF","filename":"grade-6-english-fal-november-test.pdf","storageKey":"products/d30f6f65-59a1-589a-93cf-ea1c54dac694/file-5606-grade-6-english-fal-november-test.pdf"}]'::jsonb, false, true, 5606, '{"title":"Grade 6 English First Additional Language November Test","description":"CAPS-aligned Grade 6 English FAL November Test . Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('d3abb0d5-899d-54a2-ac54-b19f96c08b19', 'grade-6-english-fal-term-4-test', 'Grade 6 English First Additional Language Term 4 Test', 'CAPS-aligned Grade 6 English First Additional Language Term 4 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 6 English First Additional Language (FAL) test is designed to help learners revise and prepare for formal assessments in Term 4. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in school-based assessments.

The test covers key language skills through engaging South African content and includes:

• Reading comprehension based on an informative passage about Clarens

• Visual literacy using a tourism brochure

• Summary writing to develop comprehension and writing skills

• Language structures and conventions including nouns, pronouns, tenses, conjunctions, prefixes and suffixes, direct and indirect speech, and degrees of comparison

This resource includes:

✔ A complete 50-mark CAPS-aligned test

✔ A detailed memorandum for easy marking

✔ Cognitive level weighting aligned to assessment standards

✔ Learner-friendly layout with clear instructions

Perfect for revision, practice assessments, or exam preparation at home or in the classroom.

PDF format (non-editable)', 60.00, 'Grade 6', 'Term 4', '2026', 'Individual Resource', 'Summary', array['english-first-additional-language','natural-science-and-technology'], 50, '[{"id":"file-5601","label":"Summary PDF","filename":"grade-6-english-fal-term-4-test.pdf","storageKey":"products/d3abb0d5-899d-54a2-ac54-b19f96c08b19/file-5601-grade-6-english-fal-term-4-test.pdf"}]'::jsonb, false, true, 5601, '{"title":"Grade 6 English First Additional Language Term 4 Test","description":"CAPS-aligned Grade 6 English First Additional Language Term 4 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('2dc2d89c-e994-5b98-a264-d8777ffd4cb0', 'grade-6-english-hl-november-test', 'Grade 6 English Home Language November Test', 'CAPS-aligned Grade 6 English HL November Test . Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 6 English Home Language November Practice Test is designed to help learners revise key language skills and prepare confidently for end-of-year assessments. The test is aligned to the CAPS curriculum and follows the structure and cognitive levels learners are familiar with in formal school examinations.

The test includes a variety of assessment components to develop comprehension, writing, and language accuracy, covering:

• Reading comprehension based on an informative text about Cape Town

• Visual literacy using an advertisement and real-life visual text analysis

• Summary writing that develops learners’ ability to identify main ideas and write in their own words

• Language structures and conventions including passive voice, sentence types, indirect speech, adverbs and their types, adjectives, prefixes and suffixes, and degrees of comparison

This resource includes:

✔ A complete 50-mark CAPS-aligned November test

✔ Detailed memorandum for easy marking

✔ Cognitive-level distribution aligned to assessment standards

✔ Clear instructions and learner-friendly layout

✔ Ideal revision practice before final examinations

Perfect for parents, tutors, and teachers looking for structured exam preparation at home or in the classroom.

PDF format (non-editable)', 60.00, 'Grade 6', 'Any Term', '2026', 'Individual Resource', 'Summary', array['english-home-language','natural-science-and-technology'], 50, '[{"id":"file-5598","label":"Summary PDF","filename":"grade-6-english-hl-november-test.pdf","storageKey":"products/2dc2d89c-e994-5b98-a264-d8777ffd4cb0/file-5598-grade-6-english-hl-november-test.pdf"}]'::jsonb, false, true, 5598, '{"title":"Grade 6 English Home Language November Test","description":"CAPS-aligned Grade 6 English HL November Test . Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('afd6e6e8-6488-5623-862d-760b655cc77f', 'grade-6-english-hl-term-4-test', 'Grade 6 English Home Language Term 4 Test', 'CAPS-aligned Grade 6 English Home Language Term 4 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 6 English Home Language Term 4 Practice Test is designed to help learners revise key language skills and prepare confidently for end-of-year assessments. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in formal school examinations.

The test covers important Term 4 language components such as:

• Reading comprehension based on an informational text about the Paris 2024 Olympics

• Visual literacy skills using posters and real-life visual texts

• Summary writing with word-count guidance

• Language structures and conventions including parts of speech, punctuation, direct and indirect speech, conjunctions, tenses, and degrees of comparison

• Grammar and editing skills that develop accurate sentence construction

This resource includes:

✔ A complete 50-mark CAPS-aligned practice test

✔ A detailed memorandum for easy marking

✔ Exam-style question layout familiar to learners

✔ Cognitive-level weighting aligned to assessment standards

✔ Clear instructions and learner-friendly formatting

PDF format (non-editable)', 60.00, 'Grade 6', 'Term 4', '2024', 'Individual Resource', 'Summary', array['english-home-language','natural-science-and-technology'], 50, '[{"id":"file-5562","label":"Summary PDF","filename":"grade-6-english-hl-term-4-test.pdf","storageKey":"products/afd6e6e8-6488-5623-862d-760b655cc77f/file-5562-grade-6-english-hl-term-4-test.pdf"}]'::jsonb, false, true, 5562, '{"title":"Grade 6 English Home Language Term 4 Test","description":"CAPS-aligned Grade 6 English Home Language Term 4 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('a037a1b0-c6a5-5bbf-ab17-ad36aa7455af', 'grade-5-nst-november-test', 'Grade 5 Natural Science & Technology November Test', 'CAPS-aligned Grade 5 Natural Science & Technology November Test . Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 5 Natural Science & Technology Term 4 November Practice Test is designed to help learners revise and prepare for end-of-year assessments. The test is aligned to the CAPS curriculum and follows a structure similar to formal school examinations, helping learners practise answering a variety of question types with confidence.

The test covers important topics such as:

• The Earth and space, including rotation, day and night, and the atmosphere

• Rocks, soil, fossils, and how sedimentary rocks are formed

• Energy, fuels, and renewable and non-renewable resources

• Water cycle processes such as evaporation and condensation

• Soil layers and the structure of the Earth

• Mechanisms, systems, and how springs and elastic bands store and release energy

This resource includes:

✔ A complete 50-mark practice test

✔ A detailed memorandum for easy marking

✔ Diagram-based and application questions

✔ A cognitive-level breakdown aligned to assessment standards

✔ Clear instructions and a learner-friendly layout

PDF format (non-editable)', 60.00, 'Grade 5', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 50, '[{"id":"file-5558","label":"Test / Assessment PDF","filename":"grade-5-nst-november-test.pdf","storageKey":"products/a037a1b0-c6a5-5bbf-ab17-ad36aa7455af/file-5558-grade-5-nst-november-test.pdf"}]'::jsonb, false, true, 5558, '{"title":"Grade 5 Natural Science & Technology November Test","description":"CAPS-aligned Grade 5 Natural Science & Technology November Test . Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('6ae5d96e-e911-5edc-a4bb-cfa326d8b7c5', 'grade-5-nst-term-4-test', 'Grade 5 Natural Science & Technology Term 4 Test', 'CAPS-aligned Grade 5 Natural Science & Technology Term 4 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 5 Mathematics November Exam Paper 2 is designed to help learners revise and prepare for end-of-year assessments. The paper is aligned to the CAPS curriculum and follows a structure similar to formal school examinations, helping learners practise answering a full exam-style paper with a variety of question types.

The exam covers important Term 4 mathematics topics such as:

• Common fractions, including calculations and word problems

• Length, ordering measurements, and unit conversions

• Properties of 2D and 3D shapes, angles, and transformations

• Volume and capacity, including real-life problem solving

• Area and perimeter of shapes

This resource includes:

✔ A complete 50-mark examination paper

✔ A detailed memorandum for easy marking

✔ A clear structure aligned to CAPS content areas and cognitive levels (as shown in the front-page tables)

✔ A learner-friendly layout suitable for revision or formal practice

This test is ideal for revision, extra practice, or preparing learners for the November examinations.

PDF format (non-editable)', 60.00, 'Grade 5', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 50, '[{"id":"file-5551","label":"Test / Assessment PDF","filename":"grade-5-nst-term-4-test.pdf","storageKey":"products/6ae5d96e-e911-5edc-a4bb-cfa326d8b7c5/file-5551-grade-5-nst-term-4-test.pdf"}]'::jsonb, false, true, 5551, '{"title":"Grade 5 Natural Science & Technology Term 4 Test","description":"CAPS-aligned Grade 5 Natural Science & Technology Term 4 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('60e41cf8-b1f8-541b-a3cd-55ba266bbfba', 'grade-5-mathematics-november-test-2', 'Grade 5 Mathematics November Paper 2', 'CAPS-aligned Grade 5 Mathematics November Test 2. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 5 Mathematics November Exam Paper 2 is designed to help learners revise and prepare for end-of-year assessments. The paper is aligned to the CAPS curriculum and follows a structure similar to formal school examinations, helping learners practise answering a full exam-style paper with a variety of question types.

The exam covers important Term 4 mathematics topics such as:

• Common fractions, including calculations and word problems

• Length, ordering measurements, and unit conversions

• Properties of 2D and 3D shapes, angles, and transformations

• Volume and capacity, including real-life problem solving

• Area and perimeter of shapes

This resource includes:

✔ A complete 50-mark examination paper

✔ A detailed memorandum for easy marking

✔ A clear structure aligned to CAPS content areas and cognitive levels (as shown in the front-page tables)

✔ A learner-friendly layout suitable for revision or formal practice

This test is ideal for revision, extra practice, or preparing learners for the November examinations.

PDF format (non-editable)', 60.00, 'Grade 5', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 50, '[{"id":"file-5546","label":"Test / Assessment PDF","filename":"grade-5-mathematics-november-test-2.pdf","storageKey":"products/60e41cf8-b1f8-541b-a3cd-55ba266bbfba/file-5546-grade-5-mathematics-november-test-2.pdf"}]'::jsonb, false, true, 5546, '{"title":"Grade 5 Mathematics November Paper 2","description":"CAPS-aligned Grade 5 Mathematics November Test 2. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('20322a31-2321-51ef-853c-a64049b8efd9', 'grade-5-mathematics-november-test', 'Grade 5 Mathematics November Paper 1', 'CAPS-aligned Grade 5 Mathematics November Test 1. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 5 Mathematics Term 4 November Exam Paper 1 is designed to help learners revise and prepare for end-of-year examinations. The paper is aligned to the CAPS curriculum and follows the structure and layout learners are familiar with in formal school exams, helping them practise working under exam conditions.

The exam covers key topics such as:

• Whole numbers, place value, rounding, and estimation

• Addition, subtraction, multiplication, and division with working out

• Problem-solving questions in real-life contexts

• Numeric patterns, rules, and flow diagrams

• Geometric patterns and identifying rules in visual patterns

This resource includes:

✔ A complete 50-mark exam paper

✔ A detailed memorandum for easy marking

✔ Cognitive-level breakdown aligned to assessment standards

✔ A clear exam-style layout with instructions and working space

✔ Questions that develop understanding, application, and problem-solving skills

PDF format (non-editable)', 60.00, 'Grade 5', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 50, '[{"id":"file-5543","label":"Test / Assessment PDF","filename":"grade-5-mathematics-november-test.pdf","storageKey":"products/20322a31-2321-51ef-853c-a64049b8efd9/file-5543-grade-5-mathematics-november-test.pdf"}]'::jsonb, false, true, 5543, '{"title":"Grade 5 Mathematics November Paper 1","description":"CAPS-aligned Grade 5 Mathematics November Test 1. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('d3a926c1-47de-5860-992a-cbc10f05b4b2', 'grade-5-mathematics-term-4-test', 'Grade 5 Mathematics Term 4 Test', 'CAPS-aligned Grade 5 Mathematics Term 4 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 5 Mathematics Term 4 Test is designed to help learners revise and prepare for formal assessments in Term 4. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in school assessments.

The test covers important topics such as:

• Multiple-choice questions reviewing mixed skills

• Area and perimeter of 2D shapes

• Capacity and volume, including counting cubes and measuring liquids

• Time, reading clocks, calculating durations, and solving time problems

• Problem-solving questions that apply mathematics to real-life situations

This resource includes:

✔ A complete 50-mark test

✔ A detailed memorandum for easy marking

✔ Visual and application-based questions

✔ Clear instructions and learner-friendly layout

PDF format (non-editable)', 60.00, 'Grade 5', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 50, '[{"id":"file-5540","label":"Test / Assessment PDF","filename":"grade-5-mathematics-term-4-test.pdf","storageKey":"products/d3a926c1-47de-5860-992a-cbc10f05b4b2/file-5540-grade-5-mathematics-term-4-test.pdf"}]'::jsonb, false, true, 5540, '{"title":"Grade 5 Mathematics Term 4 Test","description":"CAPS-aligned Grade 5 Mathematics Term 4 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('d09f247e-4650-5271-85e0-af09359ee57b', 'grade-5-geography-november-test', 'Grade 5 Geography November Test', 'CAPS-aligned Grade 5 Geography November Test. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 5 Geography Term 4 November Practice Test is designed to help learners revise and prepare for end-of-year assessments in Social Sciences. The test is aligned to the CAPS curriculum and follows a structure similar to formal school examinations, helping learners practise answering a variety of question types confidently.

The test covers key topics such as:

• Weather and climate, including elements of weather and measuring instruments

• High- and low-pressure systems and how they affect weather

• Wetlands and why they are important to the environment

• Landforms, rainfall patterns, and climate in different parts of South Africa

• Minerals and mining in South Africa and Africa

• Environmental impacts of mining and health and safety risks

• Different types of mining and how they are used

This resource includes:

✔ A complete 50-mark practice test

✔ A detailed memorandum for easy marking

✔ Map work, diagrams, and case-study questions

✔ Paragraph-writing and explanation questions

✔ Clear instructions and a learner-friendly layout

PDF format (non-editable)', 60.00, 'Grade 5', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','social-sciences','geography'], 50, '[{"id":"file-5537","label":"Test / Assessment PDF","filename":"grade-5-geography-november-test.pdf","storageKey":"products/d09f247e-4650-5271-85e0-af09359ee57b/file-5537-grade-5-geography-november-test.pdf"}]'::jsonb, false, true, 5537, '{"title":"Grade 5 Geography November Test","description":"CAPS-aligned Grade 5 Geography November Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('73d9c631-bdf8-5a11-a9ce-3c86dc3fa8e7', 'grade-5-geography-term-4-test', 'Grade 5 Geography Term 4 Test', 'CAPS-aligned Grade 5 Geography Term 4 Test. Worth 30 marks , includes full memo. Instant PDF download', 'This Grade 5 Geography Term 4 Test is designed to help learners revise and prepare for formal assessments in Social Sciences. The test is aligned to the CAPS curriculum and follows a structure similar to school-based assessments, helping learners practise key skills and content in a clear and manageable format.

The test covers important topics such as:

• Mineral and coal resources of South Africa

• Location of mineral and coal mines (map skills)

• Mining and the environment

• Mining and people, including a case study

This resource includes:

✔ A complete 30-mark test

✔ A detailed memorandum for easy marking

✔ Map work and case-study questions

✔ Clear instructions and learner-friendly layout

✔ CAPS-aligned content suitable for revision and practice

PDF format (non-editable)', 60.00, 'Grade 5', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','social-sciences','geography'], 30, '[{"id":"file-5535","label":"Test / Assessment PDF","filename":"grade-5-geography-term-4-test.pdf","storageKey":"products/73d9c631-bdf8-5a11-a9ce-3c86dc3fa8e7/file-5535-grade-5-geography-term-4-test.pdf"}]'::jsonb, false, true, 5535, '{"title":"Grade 5 Geography Term 4 Test","description":"CAPS-aligned Grade 5 Geography Term 4 Test. Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('4f07efc0-e715-5c9a-841b-b3574ac85cb5', 'grade-5-history-november-test', 'Grade 5 History November Test', 'CAPS-aligned Grade 5 History November Test. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 5 History Term 4 November Practice Test is designed to help learners revise and prepare for end-of-year assessments. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in formal school examinations, helping them practise answering a range of history question types confidently.

The test covers key topics such as:

• An ancient African society – Ancient Egypt , including daily life, farming along the Nile, beliefs, and social structure

• Important historical terms such as Pharaoh, hieroglyphics, papyrus, silt, and mummification

• The Rosetta Stone and why it is historically significant

• Heritage sites and symbols across the provinces of South Africa

• National symbols and ways South Africans preserve and celebrate their heritage

• Writing a structured paragraph explaining the importance of heritage preservation

This resource includes:

✔ A complete 50-mark practice test

✔ A detailed memorandum for easy marking

✔ Source-based, diagram, and paragraph-writing questions

✔ A clear cognitive-level breakdown aligned to assessment standards

✔ Clear instructions and a learner-friendly layout

PDF format (non-editable)', 60.00, 'Grade 5', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','history'], 50, '[{"id":"file-5532","label":"Test / Assessment PDF","filename":"grade-5-history-november-test.pdf","storageKey":"products/4f07efc0-e715-5c9a-841b-b3574ac85cb5/file-5532-grade-5-history-november-test.pdf"}]'::jsonb, false, true, 5532, '{"title":"Grade 5 History November Test","description":"CAPS-aligned Grade 5 History November Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('2e973e56-d8c3-5181-9281-15ce98265f13', 'grade-5-history-term-4-test', 'Grade 5 History Term 4 Test', 'CAPS-aligned Grade 5 History Term 4 Test. Worth 30 marks , includes full memo. Instant PDF download', 'This Grade 5 History Term 4 test is designed to help learners revise and prepare for formal assessments. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in school-based assessments, helping learners build confidence while revising important heritage topics.

The test covers important topics such as:

• Heritage sites of significance, including the Cradle of Humankind and Mapungubwe

• Heritage in the names of places in South Africa

• Indigenous healing and the use of natural medicines

• Natural heritage and Indigenous Knowledge Systems (IKS)

• San rock art and its importance in understanding the past

This resource includes:

✔ A complete 30-mark test

✔ A detailed memorandum for easy marking

✔ Visual sources and application-based questions

✔ A cognitive-level breakdown aligned to assessment standards

✔ Clear instructions and a learner-friendly layout

PDF format (non-editable)', 60.00, 'Grade 5', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','history'], 30, '[{"id":"file-5528","label":"Test / Assessment PDF","filename":"grade-5-history-term-4-test.pdf","storageKey":"products/2e973e56-d8c3-5181-9281-15ce98265f13/file-5528-grade-5-history-term-4-test.pdf"}]'::jsonb, false, true, 5528, '{"title":"Grade 5 History Term 4 Test","description":"CAPS-aligned Grade 5 History Term 4 Test. Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('b06a5d05-1c23-5f99-8a9f-ca3edb8b540b', 'grade-5-life-skills-psw-november-test', 'Grade 5 Life Skills PSW November Test', 'CAPS-aligned Grade 5 Life Skills PSW November Test. Worth 30 marks , includes full memo. Instant PDF download', 'This Grade 5 Life Skills PSW Term 4 November Test is designed to help learners revise and prepare for formal assessments and exams. The test is aligned to the CAPS curriculum and follows a structure learners are familiar with in school assessments.

The test covers important topics such as:

• Religions and belief systems

• Health, nutrition and substances

• Safety in the home and community

• Water conservation and alcohol abuse

• HIV and AIDS awareness and stigma

• Healthy lifestyle choices through a case study

This resource includes:

✔ A complete 30-mark test

✔ A detailed memorandum for easy marking

✔ Case study and application-based questions

✔ Clear instructions and learner-friendly layout

PDF format (non-editable)', 60.00, 'Grade 5', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['life-skills','natural-science-and-technology'], 30, '[{"id":"file-5526","label":"Test / Assessment PDF","filename":"grade-5-life-skills-psw-november-test.pdf","storageKey":"products/b06a5d05-1c23-5f99-8a9f-ca3edb8b540b/file-5526-grade-5-life-skills-psw-november-test.pdf"}]'::jsonb, false, true, 5526, '{"title":"Grade 5 Life Skills PSW November Test","description":"CAPS-aligned Grade 5 Life Skills PSW November Test. Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('149cdaaf-067f-5106-a3f2-cd949431918c', 'grade-5-life-skills-psw-term-4-test', 'Grade 5 Life Skills PSW Term 4 Test', 'CAPS-aligned Grade 5 Life Skills PSW Term 4 Test. Worth 30 marks , includes full memo. Instant PDF download', 'This Grade 5 Life Skills PSW Term 4 test is designed to help learners revise and prepare for formal assessments. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in school-based assessments, helping learners build confidence while revising important health and well-being topics.

The test covers important topics such as:

• Communicable diseases and basic health care

• HIV and AIDS, tuberculosis, malaria, and diarrhoea

• Prevention, symptoms, and treatment of common illnesses

• Substance abuse, including legal and illegal drugs and their effects

• Reducing stigma and showing empathy towards people living with HIV and AIDS

• A case study on malaria prevention and treatment that develops decision-making skills

This resource includes:

✔ A complete 30-mark test

✔ A detailed memorandum for easy marking

✔ Case study and application-based questions

✔ A cognitive-level breakdown aligned to assessment standards

✔ Clear instructions and a learner-friendly layout

PDF format (non-editable)', 60.00, 'Grade 5', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['life-skills','natural-science-and-technology'], 30, '[{"id":"file-5523","label":"Test / Assessment PDF","filename":"grade-5-life-skills-psw-term-4-test.pdf","storageKey":"products/149cdaaf-067f-5106-a3f2-cd949431918c/file-5523-grade-5-life-skills-psw-term-4-test.pdf"}]'::jsonb, false, true, 5523, '{"title":"Grade 5 Life Skills PSW Term 4 Test","description":"CAPS-aligned Grade 5 Life Skills PSW Term 4 Test. Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('31aae0aa-2842-50bd-9e9c-14ac24adfb68', 'grade-5-afrikaans-fal-november-test', 'Grade 5 Afrikaans First Additional Language November Test', 'CAPS-aligned Grade 5 Afrikaans First Additional Language November Test. Worth 40 marks , includes full memo. Instant PDF download', 'This Grade 5 Afrikaans First Additional Language Term 4 November Practice Test is designed to help learners revise and prepare for end-of-year assessments. The test is aligned to the CAPS curriculum and follows a structure similar to formal school assessments, helping learners feel confident and familiar with the exam format.

The test covers important skills such as:

• Reading comprehension based on a dialogue and answering questions that test understanding, vocabulary, and inference

• Interpreting a visual text and answering questions using information from a poster

• Summary skills by arranging events in the correct order

• Language structures and conventions, including meervoude, verkleinwoorde, voegwoorde, werkwoorde, ontkennende vorm, tye, lidwoorde, and punctuation

This resource includes:

✔ A complete 40-mark practice test

✔ A detailed memorandum for easy marking

✔ Comprehension, visual literacy, summary, and language questions

✔ A cognitive-level breakdown aligned to assessment standards

✔ Clear instructions and a learner-friendly layout

PDF format (non-editable)', 60.00, 'Grade 5', 'Term 4', '2026', 'Individual Resource', 'Summary', array['afrikaans-first-additional-language','natural-science-and-technology'], 40, '[{"id":"file-5519","label":"Summary PDF","filename":"grade-5-afrikaans-fal-november-test.pdf","storageKey":"products/31aae0aa-2842-50bd-9e9c-14ac24adfb68/file-5519-grade-5-afrikaans-fal-november-test.pdf"}]'::jsonb, false, true, 5519, '{"title":"Grade 5 Afrikaans First Additional Language November Test","description":"CAPS-aligned Grade 5 Afrikaans First Additional Language November Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('fd404b86-db4e-5a01-92cc-0f0116e81027', 'grade-5-afrikaans-fal-term-4-test', 'Grade 5 Afrikaans First Additional Language Term 4 Test', 'CAPS-aligned Grade 5 Afrikaans FAL Term 4 Test. Worth 40 marks , includes full memo. Instant PDF download', 'This Grade 5 Afrikaans First Additional Language Term 4 test is designed to help learners revise and prepare for formal assessments. The test is aligned to the CAPS curriculum and follows a structure similar to school-based assessments, helping learners practise language skills in a familiar format.

The test covers important skills such as:

• Reading comprehension based on a short story, with questions that develop understanding, vocabulary, and inference

• Visual literacy using an advertisement, including interpreting slogans, information, and meaning

• Summary skills by arranging events in the correct order

• Language structures and conventions, including meervoude, sinonieme, antonieme, tye, lidwoorde, voegwoorde, werkwoorde, and negatief vorm.

This resource includes:

✔ A complete 40-mark test

✔ A detailed memorandum for easy marking

✔ Comprehension, visual literacy, summary, and language questions

✔ A cognitive-level breakdown aligned to assessment standards

✔ Clear instructions and a learner-friendly layout

PDF format (non-editable)', 60.00, 'Grade 5', 'Term 4', '2026', 'Individual Resource', 'Summary', array['afrikaans-first-additional-language','natural-science-and-technology'], 40, '[{"id":"file-5517","label":"Summary PDF","filename":"grade-5-afrikaans-fal-term-4-test.pdf","storageKey":"products/fd404b86-db4e-5a01-92cc-0f0116e81027/file-5517-grade-5-afrikaans-fal-term-4-test.pdf"}]'::jsonb, false, true, 5517, '{"title":"Grade 5 Afrikaans First Additional Language Term 4 Test","description":"CAPS-aligned Grade 5 Afrikaans FAL Term 4 Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('b94742f1-42a7-5304-8f5a-c25a94ef610b', 'grade-5-english-fal-november-test', 'Grade 5 English First Additional Language November Test', 'CAPS-aligned Grade 5 English First Additional Language November Test. Worth 40 marks , includes full memo. Instant PDF download', 'This Grade 5 English First Additional Language Term 4 November Practice Test is designed to help learners revise and prepare for end-of-year assessments. The test is aligned to the CAPS curriculum and follows a structure similar to formal school assessments, helping learners feel confident and familiar with the exam format.

The test covers important skills such as:

• Reading comprehension based on an informative text about bees

• Answering questions that test recall, vocabulary, understanding, and inference

• Interpreting an infographic and answering visual literacy questions

• Writing a short summary in full sentences using key ideas

• Language structures and conventions, including tenses, pronouns, conjunctions, homophones, sentence types, and indirect speech

This resource includes:

✔ A complete 40-mark practice test

✔ A detailed memorandum for easy marking

✔ Comprehension, visual text, summary, and language questions

✔ A cognitive-level breakdown aligned to assessment standards

✔ Clear instructions and a learner-friendly layout

PDF format (non-editable)', 60.00, 'Grade 5', 'Term 4', '2026', 'Individual Resource', 'Summary', array['english-first-additional-language','natural-science-and-technology'], 40, '[{"id":"file-5513","label":"Summary PDF","filename":"grade-5-english-fal-november-test.pdf","storageKey":"products/b94742f1-42a7-5304-8f5a-c25a94ef610b/file-5513-grade-5-english-fal-november-test.pdf"}]'::jsonb, false, true, 5513, '{"title":"Grade 5 English First Additional Language November Test","description":"CAPS-aligned Grade 5 English First Additional Language November Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('d73d844d-3501-5f20-9a91-178294932d1b', 'grade-5-english-fal-term-4-test', 'Grade 5 English First Additional Language Term 4 Test', 'CAPS-aligned Grade 5 English FAL Term 4 Test. Worth 40 marks , includes full memo. Instant PDF download', 'This Grade 5 English First Additional Language Term 4 test is designed to help learners revise and prepare for formal assessments. The test is aligned to the CAPS curriculum and follows a structure similar to school-based assessments, helping learners practise key reading, writing, and language skills in a familiar format.

The test covers important skills such as:

• Reading comprehension based on an engaging story, with questions that develop understanding, inference, and vocabulary

• Visual literacy using an advertisement, including interpreting slogans, images, and target audience

• Summary writing by identifying key ideas and writing in full sentences

• Language structures and conventions, including plurals, adjectives, adverbs, prepositions, conjunctions, similes, tenses, and direct and indirect speech

This resource includes:

✔ A complete 40-mark test

✔ A detailed memorandum for easy marking

✔ Comprehension, visual literacy, summary, and language questions

✔ A cognitive-level breakdown aligned to assessment standards

✔ Clear instructions and a learner-friendly layout

PDF format (non-editable)', 60.00, 'Grade 5', 'Term 4', '2026', 'Individual Resource', 'Summary', array['english-first-additional-language','natural-science-and-technology'], 40, '[{"id":"file-5510","label":"Summary PDF","filename":"grade-5-english-fal-term-4-test.pdf","storageKey":"products/d73d844d-3501-5f20-9a91-178294932d1b/file-5510-grade-5-english-fal-term-4-test.pdf"}]'::jsonb, false, true, 5510, '{"title":"Grade 5 English First Additional Language Term 4 Test","description":"CAPS-aligned Grade 5 English FAL Term 4 Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('464370fe-6069-54a7-b5f5-92b359acc42a', 'grade-4-english-hl-november-test', 'Grade 5 English Home Language November Test', 'CAPS-aligned Grade 5 English Home Language November Test. Worth 40 marks , includes full memo. Instant PDF download', 'This Grade 5 English Home Language November Test is designed to help learners revise and prepare for end-of-year assessments. The test is aligned to the CAPS curriculum and follows a structure similar to formal school examinations, helping learners build confidence and exam readiness.

The test covers important skills such as:

• Reading comprehension using an informative text

• Interpreting visual texts and infographics

• Summary writing in the learner’s own words

• Language structures and conventions, including tense, conjunctions, pronouns, sentence types, spelling, and homophones

This resource includes:

✔ A complete 40-mark test

✔ A detailed memorandum for easy marking

✔ A variety of question types to develop different skills

✔ Clear instructions and a learner-friendly layout

PDF format (non-editable)', 60.00, 'Grade 5', 'Any Term', '2026', 'Individual Resource', 'Summary', array['english-home-language','natural-science-and-technology'], 40, '[{"id":"file-5506","label":"Summary PDF","filename":"grade-4-english-hl-november-test.pdf","storageKey":"products/464370fe-6069-54a7-b5f5-92b359acc42a/file-5506-grade-4-english-hl-november-test.pdf"}]'::jsonb, false, true, 5506, '{"title":"Grade 5 English Home Language November Test","description":"CAPS-aligned Grade 5 English Home Language November Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('f717360e-89c6-5c53-affd-6784d146522e', 'grade-5-english-hl-term-4-test', 'Grade 5 English Home Language Term 4 Test', 'CAPS-aligned Grade 5 English HL Term 4 Test. Worth 40 marks , includes full memo. Instant PDF download', 'This Grade 5 English Home Language Term 4 test is designed to help learners revise and prepare for formal assessments. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in school-based assessments, helping learners practise key reading, writing, and language skills in a clear and engaging format.

The test covers important skills such as:

• Reading and understanding an informational text about the flapjack octopus

• Answering comprehension questions that test recall, vocabulary, inference, and interpretation

• Interpreting an advertisement and answering visual literacy questions

• Writing a structured summary by identifying main ideas

• Language structures and conventions, including nouns, adjectives, adverbs, conjunctions, relative clauses, prefixes and suffixes, and sentence construction

This resource includes:

✔ A complete 40-mark test

✔ A detailed memorandum for easy marking

✔ Comprehension, visual literacy, summary, and language questions

✔ A cognitive-level breakdown aligned to assessment standards

✔ Clear instructions and a learner-friendly layout

PDF format (non-editable)', 60.00, 'Grade 5', 'Term 4', '2026', 'Individual Resource', 'Summary', array['english-home-language','natural-science-and-technology'], 40, '[{"id":"file-5468","label":"Summary PDF","filename":"grade-5-english-hl-term-4-test.pdf","storageKey":"products/f717360e-89c6-5c53-affd-6784d146522e/file-5468-grade-5-english-hl-term-4-test.pdf"}]'::jsonb, false, true, 5468, '{"title":"Grade 5 English Home Language Term 4 Test","description":"CAPS-aligned Grade 5 English HL Term 4 Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('07d4e854-defa-5321-92e4-1047e4899759', 'grade-4-mathematics-november-test', 'Grade 4 Mathematics November Test', 'CAPS-aligned Grade 4 Mathematics November Test. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 4 Mathematics Term 4 November Practice Test is designed to help learners revise and prepare for end-of-year examinations. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in school assessments, helping build confidence before formal exams.

The test covers important topics such as:

• Mental maths and place value

• Whole numbers, rounding, ordering, doubling, and halving

• Addition, subtraction, multiplication, and division with working out

• Problem solving in real-life contexts

• Fractions, equivalent fractions, and comparing fractions

• Geometry, including naming shapes and identifying properties

• Measuring length, perimeter, area, capacity, and time

This resource includes:

✔ A complete 50-mark practice test

✔ A detailed memorandum for easy marking

✔ Diagrams, measuring tasks, and application-based questions

✔ Questions that develop understanding, application, and problem-solving skills

✔ Clear instructions and a learner-friendly layout

PDF format (non-editable)', 60.00, 'Grade 4', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 50, '[{"id":"file-5465","label":"Test / Assessment PDF","filename":"grade-4-mathematics-november-test.pdf","storageKey":"products/07d4e854-defa-5321-92e4-1047e4899759/file-5465-grade-4-mathematics-november-test.pdf"}]'::jsonb, false, true, 5465, '{"title":"Grade 4 Mathematics November Test","description":"CAPS-aligned Grade 4 Mathematics November Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('0a4424a0-8fec-5b4f-b4a9-1a2bcf0fc304', 'grade-4-mathematics-term-4-test', 'Grade 4 Mathematics Term 4 Test', 'CAPS-aligned Grade 4 Mathematics Term 4 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 4 Mathematics Term 4 test is designed to help learners revise and prepare for formal assessments at the end of the year. The test is aligned to the CAPS curriculum and follows a structure similar to school-based assessments, helping learners practise key skills in a familiar format.

The test covers important topics such as:

• Area and perimeter, including measuring, calculating, and counting square units

• Calculating area of rectangles and shapes using given dimensions

• Capacity and volume, including converting between litres and millilitres

• Ordering and reading measurements from diagrams

• Solving problems in context, including financial, measurement, and ratio problems

• Comparing fractions and writing number sentences

This resource includes:

✔ A complete 50-mark test

✔ A detailed memorandum for easy marking

✔ Measurement, conversion, and problem-solving questions

✔ Diagrams and real-life contexts to support understanding

✔ Clear instructions and a learner-friendly layout

PDF format (non-editable)', 60.00, 'Grade 4', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 50, '[{"id":"file-5461","label":"Test / Assessment PDF","filename":"grade-4-mathematics-term-4-test.pdf","storageKey":"products/0a4424a0-8fec-5b4f-b4a9-1a2bcf0fc304/file-5461-grade-4-mathematics-term-4-test.pdf"}]'::jsonb, false, true, 5461, '{"title":"Grade 4 Mathematics Term 4 Test","description":"CAPS-aligned Grade 4 Mathematics Term 4 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('917da70a-7246-559b-b1c5-27aac6e51570', 'grade-4-nst-november-test', 'Grade 4 Natural Science & Technology November Test', 'CAPS-aligned Grade 4 Natural Science & Technology November Test. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 4 Natural Science and Technology Term 4 November test is designed to help learners revise and prepare for end-of-year assessments. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in school-based assessments.

The test covers important topics such as:

• Forms and uses of energy, including sound, light, and movement

• Sources of energy and how energy is used in everyday life

• Food chains and relationships between living things

• The solar system, including the Sun, Moon, planets, and gravity

• Earth’s rotation and orbit, and the difference between day and night

• Understanding scientific terms and applying knowledge to real-life questions

This resource includes:

✔ A complete 50-mark test

✔ A detailed memorandum for easy marking

✔ Diagrams and application-based questions

✔ Questions that develop understanding, application, and reasoning

✔ Clear instructions and a learner-friendly layout

PDF format (non-editable)', 60.00, 'Grade 4', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 50, '[{"id":"file-5458","label":"Test / Assessment PDF","filename":"grade-4-nst-november-test.pdf","storageKey":"products/917da70a-7246-559b-b1c5-27aac6e51570/file-5458-grade-4-nst-november-test.pdf"}]'::jsonb, false, true, 5458, '{"title":"Grade 4 Natural Science & Technology November Test","description":"CAPS-aligned Grade 4 Natural Science & Technology November Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('86e58288-628f-53f5-b6b1-1165c4a8c3e8', 'grade-4-nst-term-4-test', 'Grade 4 Natural Sciences & Technology Term 4 Test', 'CAPS-aligned Grade 4 Natural Science & Technology Term 4 Test. Worth 30 marks , includes full memo. Instant PDF download', 'This Grade 4 Natural Science and Technology Term 4 test is designed to help learners revise and prepare for formal assessments at the end of the year. The test is aligned to the CAPS curriculum and follows a structure similar to school-based assessments, helping learners feel confident and familiar with the format.

The test covers important topics such as:

• The Sun, Earth, and Moon

• Phases of the Moon

• The solar system and celestial bodies

• The relationship between Earth and space

• Cultural and practical importance of the Moon

• Application questions based on reading and understanding scientific texts

This resource includes:

✔ A complete 30-mark test

✔ A detailed memorandum for easy marking

✔ Diagrams and visual questions

✔ A reading passage with application-based questions

✔ Clear instructions and learner-friendly layout

PDF format (non-editable)', 60.00, 'Grade 4', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 30, '[{"id":"file-5456","label":"Test / Assessment PDF","filename":"grade-4-nst-term-4-test.pdf","storageKey":"products/86e58288-628f-53f5-b6b1-1165c4a8c3e8/file-5456-grade-4-nst-term-4-test.pdf"}]'::jsonb, false, true, 5456, '{"title":"Grade 4 Natural Sciences & Technology Term 4 Test","description":"CAPS-aligned Grade 4 Natural Science & Technology Term 4 Test. Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('7d5601bb-9f88-5072-8ed5-989130e74d64', 'grade-4-geography-november-test', 'Grade 4 Geography November Test', 'CAPS-aligned Grade 4 Geography November Test. Worth 25 marks , includes full memo. Instant PDF download', 'This Grade 4 Geography Term 4 November test is designed to help learners revise and prepare for end-of-year assessments. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in school-based assessments.

The test covers important topics such as:

• Food and farming in South Africa, including crops, livestock, and different types of farming

• Subsistence farming and crop rotation

• Challenges farmers face and the role of stock farms

• Interpreting a map showing animal farming areas in South Africa

• Uses of water in everyday life and the water cycle

• Water conservation, droughts, dams, and water pollution

This resource includes:

✔ A complete 25-mark test

✔ A detailed memorandum for easy marking

✔ Source-based, map-reading, and application-based questions

✔ Clear instructions and a learner-friendly layout

PDF format (non-editable)', 60.00, 'Grade 4', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','geography'], 25, '[{"id":"file-5452","label":"Test / Assessment PDF","filename":"grade-4-geography-november-test.pdf","storageKey":"products/7d5601bb-9f88-5072-8ed5-989130e74d64/file-5452-grade-4-geography-november-test.pdf"}]'::jsonb, false, true, 5452, '{"title":"Grade 4 Geography November Test","description":"CAPS-aligned Grade 4 Geography November Test. Worth 25 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('66513123-76be-5ee2-914e-a56fb8f2d093', 'grade-4-geography-term-4-test', 'Grade 4 Geography Term 4 Test', 'CAPS-aligned Grade 4 Geography Term 4 Test. Worth 25 marks , includes full memo. Instant PDF download', 'This Grade 4 Geography Term 4 test is designed to help learners revise and prepare for formal assessments. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in school-based assessments.

The test covers important topics such as:

• Uses of water in homes, farming, and factories

• Interpreting information from a pie chart about water usage

• The water cycle, including evaporation, condensation, and precipitation

• Why water needs to be stored and different ways people store water

• How people collect and transport water from natural and man-made sources

This resource includes:

✔ A complete 25-mark test

✔ A detailed memorandum for easy marking

✔ Source-based, diagram, and application-based questions

✔ Clear instructions and a learner-friendly layout.

PDF format (non-editable)', 60.00, 'Grade 4', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','geography'], 25, '[{"id":"file-5449","label":"Test / Assessment PDF","filename":"grade-4-geography-term-4-test.pdf","storageKey":"products/66513123-76be-5ee2-914e-a56fb8f2d093/file-5449-grade-4-geography-term-4-test.pdf"}]'::jsonb, false, true, 5449, '{"title":"Grade 4 Geography Term 4 Test","description":"CAPS-aligned Grade 4 Geography Term 4 Test. Worth 25 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('39814870-f2a4-51a0-9088-7c0ce97db0df', 'grade-4-history-november-test', 'Grade 4 History November Test', 'CAPS-aligned Grade 4 History November Test. Worth 25 marks , includes full memo. Instant PDF download', 'This Grade 4 History Term 4 November test is designed to help learners revise and prepare for end-of-year assessments. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in school-based assessments.

The test covers important topics such as:

• Transport through time, including early forms of transport and how vehicles developed

• The Model T Ford and how mass production made cars more affordable

• How roads and travel conditions were different in the past

• Air pollution caused by vehicles and its effects on people and the environment

• Communication through time, including smoke signals, the printing press, telegrams, radio, and the internet

• The benefits and challenges of modern technology and communication

This resource includes:

✔ A complete 25-mark test

✔ A detailed memorandum for easy marking

✔ Source-based and application-based questions

✔ Clear instructions and a learner-friendly layout

PDF format (non-editable)', 60.00, 'Grade 4', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','history'], 25, '[{"id":"file-5446","label":"Test / Assessment PDF","filename":"grade-4-history-november-test.pdf","storageKey":"products/39814870-f2a4-51a0-9088-7c0ce97db0df/file-5446-grade-4-history-november-test.pdf"}]'::jsonb, false, true, 5446, '{"title":"Grade 4 History November Test","description":"CAPS-aligned Grade 4 History November Test. Worth 25 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('d91c36bc-f19f-5d57-ac4c-1911dc6907f7', 'grade-4-history-term-4-test', 'Grade 4 History Term 4 Test', 'CAPS-aligned Grade 4 History Term 4 Test. Worth 25 marks , includes full memo. Instant PDF download', 'This Grade 4 History Term 4 test is designed to help learners revise and prepare for formal assessments. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in school-based assessments.

The test covers important topics such as:

• Early methods of communication, including the postal system and telegraph

• The development of communication technology such as typewriters, radio, television, and the internet

• Understanding timelines and placing historical events in chronological order

• Advantages and disadvantages of modern communication methods

• Important historical figures and inventions linked to communication

This resource includes:

✔ A complete 25-mark test

✔ A detailed memorandum for easy marking

✔ Multiple-choice, timeline, and short-answer questions

✔ Clear instructions and a learner-friendly layout

PDF format (non-editable)', 60.00, 'Grade 4', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','history'], 25, '[{"id":"file-5442","label":"Test / Assessment PDF","filename":"grade-4-history-term-4-test.pdf","storageKey":"products/d91c36bc-f19f-5d57-ac4c-1911dc6907f7/file-5442-grade-4-history-term-4-test.pdf"}]'::jsonb, false, true, 5442, '{"title":"Grade 4 History Term 4 Test","description":"CAPS-aligned Grade 4 History Term 4 Test. Worth 25 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('98bcdecb-251a-54ba-ae18-3c3cee365536', 'grade-4-life-skills-psw-november-test', 'Grade 4 Life Skills PSW November Test', 'CAPS-aligned Grade 4 Life Skills PSW November Test. Worth 30 marks , includes full memo. Instant PDF download', 'This Grade 4 Life Skills PSW Term 4 November test is designed to help learners revise and prepare for end-of-year assessments. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in school-based assessments.

The test covers important topics such as:

• Water safety and responsible behaviour around rivers, pools, and beaches

• Major religions in South Africa, including symbols, places of worship, and leaders

• Basic hygiene principles and healthy habits

• Traffic rules and recognising common road signs

• Healthy and unhealthy environments, including a case study that develops understanding of pollution and community health

This resource includes:

✔ A complete 30-mark test

✔ A detailed memorandum for easy marking

✔ Case study and application-based questions

✔ Clear instructions and a learner-friendly layout

PDF format (non-editable)', 60.00, 'Grade 4', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['life-skills','natural-science-and-technology'], 30, '[{"id":"file-5439","label":"Test / Assessment PDF","filename":"grade-4-life-skills-psw-november-test.pdf","storageKey":"products/98bcdecb-251a-54ba-ae18-3c3cee365536/file-5439-grade-4-life-skills-psw-november-test.pdf"}]'::jsonb, false, true, 5439, '{"title":"Grade 4 Life Skills PSW November Test","description":"CAPS-aligned Grade 4 Life Skills PSW November Test. Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('282fd7e8-3749-5dfe-9e35-02fff4ff9150', 'grade-4-ls-psw-term-4-test', 'Grade 4 Life Skills PSW Term 4 Test', 'CAPS-aligned Grade 4 Life Skills PSW Term 4 Test. Worth 30 marks , includes full memo. Instant PDF download', 'This Grade 4 Life Skills PSW Term 4 test is designed to help learners revise and prepare for formal assessments. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in school-based assessments.

The test covers important topics such as:

• Traffic rules and road safety for different road users

• Personal and household hygiene and preventing the spread of germs

• Unhealthy environments, pollution, and water safety

• Making responsible choices through a case study

• Basic facts about HIV and AIDS appropriate for the Grade 4 level

This resource includes:

✔ A complete 30-mark test

✔ A detailed memorandum for easy marking

✔ Case study and application-based questions

✔ Clear instructions and a learner-friendly layout

PDF format (non-editable)', 60.00, 'Grade 4', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['life-skills','natural-science-and-technology'], 30, '[{"id":"file-5431","label":"Test / Assessment PDF","filename":"grade-4-ls-psw-term-4-test.pdf","storageKey":"products/282fd7e8-3749-5dfe-9e35-02fff4ff9150/file-5431-grade-4-ls-psw-term-4-test.pdf"}]'::jsonb, false, true, 5431, '{"title":"Grade 4 Life Skills PSW Term 4 Test","description":"CAPS-aligned Grade 4 Life Skills PSW Term 4 Test. Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('b5fdfca4-d24d-5a1f-a416-3a2c638d1b92', 'grade-4-afrikaans-first-additional-language-november-test', 'Grade 4 Afrikaans First Additional Language November Test', 'CAPS-aligned Grade 4 Afrikaans FAL November Test. Worth 40 marks , includes full memo. Instant PDF download', 'This Grade 4 Afrikaans First Additional Language Term 4 November test is designed to help learners revise and prepare for end-of-year assessments. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in school-based assessments.

The test covers important skills such as:

• Reading and understanding a short story about a holiday at the beach

• Answering comprehension questions that test understanding, vocabulary, and inference

• Interpreting visual texts and identifying information from a picture

• Sequencing events and completing a summary activity

• Language structures and conventions, including adjectives, prepositions, tenses, conjunctions, negatives, indirect speech, and sentence construction

This resource includes:

✔ A complete 40-mark test

✔ A detailed memorandum for easy marking

✔ Comprehension, visual text, summary, and language questions

✔ Clear instructions and a learner-friendly layout

PDF format (non-editable)', 60.00, 'Grade 4', 'Term 4', '2026', 'Individual Resource', 'Summary', array['afrikaans-first-additional-language','natural-science-and-technology'], 40, '[{"id":"file-5427","label":"Summary PDF","filename":"grade-4-afrikaans-first-additional-language-november-test.pdf","storageKey":"products/b5fdfca4-d24d-5a1f-a416-3a2c638d1b92/file-5427-grade-4-afrikaans-first-additional-language-november-test.pdf"}]'::jsonb, false, true, 5427, '{"title":"Grade 4 Afrikaans First Additional Language November Test","description":"CAPS-aligned Grade 4 Afrikaans FAL November Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('36f7cb3f-359d-5563-be47-dea2d96cec34', 'grade-4-afrikaans-first-additional-language-term-4-test', 'Grade 4 Afrikaans First Additional Language Term 4 Test', 'CAPS-aligned Grade 4 Afrikaans First Additional Language Term 4 Test. Worth 40 marks , includes full memo. Instant PDF download', 'This Grade 4 Afrikaans First Additional Language Term 4 test is designed to help learners revise and prepare for formal assessments. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in school-based assessments.

The test covers important skills such as:

• Reading and understanding an informational text about Elon Musk

• Answering comprehension questions that test understanding, vocabulary, and inference

• Interpreting visual texts and identifying key information from an invitation

• Completing a short summary using a word bank

• Language structures and conventions, including meervoude, alfabetiese volgorde, sinonieme en antonieme, werkwoorde, verlede tyd, negatiewe vorm, indirekte rede, and soorte sinne

This resource includes:

✔ A complete 40-mark test

✔ A detailed memorandum for easy marking

✔ Comprehension, visual text, summary, and language questions

✔ Clear instructions and a learner-friendly layout

PDF format (non-editable)', 60.00, 'Grade 4', 'Term 4', '2026', 'Individual Resource', 'Summary', array['afrikaans-first-additional-language','natural-science-and-technology'], 40, '[{"id":"file-5424","label":"Summary PDF","filename":"grade-4-afrikaans-first-additional-language-term-4-test.pdf","storageKey":"products/36f7cb3f-359d-5563-be47-dea2d96cec34/file-5424-grade-4-afrikaans-first-additional-language-term-4-test.pdf"}]'::jsonb, false, true, 5424, '{"title":"Grade 4 Afrikaans First Additional Language Term 4 Test","description":"CAPS-aligned Grade 4 Afrikaans First Additional Language Term 4 Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('28419cc1-257a-5759-84fa-acfbd28f08b9', 'grade-4-english-first-additional-language-november-test', 'Grade 4 English First Additional Language November Test', 'CAPS-aligned Grade 4 English FAL November Test. Worth 40 marks , includes full memo. Instant PDF download', 'This Grade 4 English First Additional Language Term 4 November test is designed to help learners revise and prepare for end-of-year assessments. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in school-based assessments.

The test covers important skills such as:

• Reading and understanding an informational text about the life cycle of a butterfly

• Answering comprehension questions that test recall, vocabulary, and understanding

• Interpreting visual texts and identifying key information from a poster

• Writing a short summary in full sentences using own words

• Language structures and conventions, including tenses, pronouns, conjunctions, punctuation, root words, collective nouns, reflexive pronouns, and verbs

This resource includes:

✔ A complete 40-mark test

✔ A detailed memorandum for easy marking

✔ Comprehension, visual text, summary, and language questions

✔ Clear instructions and a learner-friendly layout

PDF format (non-editable)', 60.00, 'Grade 4', 'Term 4', '2026', 'Individual Resource', 'Summary', array['english-first-additional-language','natural-science-and-technology'], 40, '[{"id":"file-5421","label":"Summary PDF","filename":"grade-4-english-first-additional-language-november-test.pdf","storageKey":"products/28419cc1-257a-5759-84fa-acfbd28f08b9/file-5421-grade-4-english-first-additional-language-november-test.pdf"}]'::jsonb, false, true, 5421, '{"title":"Grade 4 English First Additional Language November Test","description":"CAPS-aligned Grade 4 English FAL November Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('de8b441c-9da3-5528-987a-12c5c4464336', 'grade-4-english-first-additional-language-term-4-test', 'Grade 4 English First Additional Language Term 4 Test', 'CAPS-aligned Grade 4 English First Additional Language Term 4 Test. Worth 40 marks , includes full memo. Instant PDF download', 'This Grade 4 English First Additional Language Term 4 test is designed to help learners revise and prepare for formal assessments. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in school-based assessments.

The test covers important skills such as:

• Reading and understanding a newspaper article

• Answering comprehension questions that test recall, vocabulary, and understanding

• Interpreting visual texts and identifying key information

• Language structures and conventions, including verbs, antonyms, collective nouns, and basic grammar skills

• Writing short answers in full sentences and explaining ideas clearly

This resource includes:

✔ A complete 40-mark test

✔ A detailed memorandum for easy marking

✔ Comprehension, visual text, and language questions

✔ Clear instructions and a learner-friendly layout

PDF format (non-editable)', 60.00, 'Grade 4', 'Term 4', '2026', 'Individual Resource', 'Test / Assessment', array['english-first-additional-language','natural-science-and-technology'], 40, '[{"id":"file-5418","label":"Test / Assessment PDF","filename":"grade-4-english-first-additional-language-term-4-test.pdf","storageKey":"products/de8b441c-9da3-5528-987a-12c5c4464336/file-5418-grade-4-english-first-additional-language-term-4-test.pdf"}]'::jsonb, false, true, 5418, '{"title":"Grade 4 English First Additional Language Term 4 Test","description":"CAPS-aligned Grade 4 English First Additional Language Term 4 Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('46f961cf-76c8-5245-8386-7c59bce47e19', 'grade-4-english-home-language-november-test', 'Grade 4 English Home Language November Test', 'CAPS-aligned Grade 4 English HL November Test. Worth 40 marks , includes full memo. Instant PDF download', 'This Grade 4 English Home Language Term 4 November test is designed to help learners revise and prepare for end-of-year assessments. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in school-based assessments.

The test covers important skills such as:

• Reading and understanding an informational text about the life cycle of a butterfly

• Answering comprehension questions that test recall, inference, and vocabulary

• Interpreting visual texts and identifying key information from a poster

• Writing a short summary by identifying main ideas and writing in full sentences

• Language structures and conventions, including tenses, pronouns, conjunctions, punctuation, root words, collective nouns, reflexive pronouns, and verbs

This resource includes:

✔ A complete 40-mark test

✔ A detailed memorandum for easy marking

✔ Comprehension, visual text, summary, and language questions

✔ Clear instructions and a learner-friendly layout

PDF format (non-editable)', 60.00, 'Grade 4', 'Term 4', '2026', 'Individual Resource', 'Summary', array['english-home-language','natural-science-and-technology'], 40, '[{"id":"file-5416","label":"Summary PDF","filename":"grade-4-english-home-language-november-test.pdf","storageKey":"products/46f961cf-76c8-5245-8386-7c59bce47e19/file-5416-grade-4-english-home-language-november-test.pdf"}]'::jsonb, false, true, 5416, '{"title":"Grade 4 English Home Language November Test","description":"CAPS-aligned Grade 4 English HL November Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('be4e3f6d-8f27-54e9-9770-2161c3999b44', 'grade-4-english-home-language-term-4-test', 'Grade 4 English Home Language Term 4 Test', 'CAPS-aligned Grade 4 English HL Term 4 Test. Worth 40 marks , includes full memo. Instant PDF download', 'This Grade 4 English Home Language Term 4 test is designed to help learners revise and prepare for formal assessments. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in school-based assessments.

The test covers important skills such as:

• Reading and understanding a newspaper article

• Answering comprehension questions using information from the text

• Interpreting visual texts and identifying key information

• Writing a short summary using own words and following instructions

• Language structures and conventions, including punctuation, tenses, verbs, adjectives, collective nouns, adverbs, and direct and indirect speech

This resource includes:

✔ A complete 40-mark test

✔ A detailed memorandum for easy marking

✔ Comprehension, visual text, summary, and language questions

✔ Clear instructions and a learner-friendly layout

PDF format (non-editable)', 60.00, 'Grade 4', 'Term 4', '2026', 'Individual Resource', 'Summary', array['english-home-language','natural-science-and-technology'], 40, '[{"id":"file-5376","label":"Summary PDF","filename":"grade-4-english-home-language-term-4-test.pdf","storageKey":"products/be4e3f6d-8f27-54e9-9770-2161c3999b44/file-5376-grade-4-english-home-language-term-4-test.pdf"}]'::jsonb, false, true, 5376, '{"title":"Grade 4 English Home Language Term 4 Test","description":"CAPS-aligned Grade 4 English HL Term 4 Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('05b36abb-ca5a-5295-ab27-3f1a6db72b28', 'grade-7-life-orientation-term-3-practice-test-2', 'Grade 7 Life Orientation Term 3 Practice Test 2', 'CAPS-aligned Grade 7 Life Orientation Term 3 Test. Worth 70 marks , includes full memo. Instant PDF download', 'This Grade 7 Life Orientation test is designed to help learners revise and prepare for formal assessments in Term 3. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in school assessments.

The test covers important topics such as:

• Substance abuse, risk factors, symptoms, and prevention strategies

• Legal and illegal drugs and their effects

• Environmental health and pollution

• Community action and problem-solving

• Careers, work environments, and personality traits

• Case studies that develop decision-making and critical thinking skills

Learners practise a variety of skills including multiple-choice questions, short answers, matching columns, case studies, and extended responses. For example, the environmental health case study on pages 3–4 requires learners to analyse a community pollution problem, and the career case study about a nurse on pages 6–7 helps learners apply knowledge about careers, skills, and work environments.

This resource includes:

✔ A complete 70-mark test

✔ A detailed memorandum for easy marking

✔ Case studies and application-based questions

✔ Clear instructions and learner-friendly layout', 60.00, 'Grade 7', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 70, '[{"id":"file-5373","label":"Test / Assessment PDF","filename":"grade-7-life-orientation-term-3-practice-test-2.pdf","storageKey":"products/05b36abb-ca5a-5295-ab27-3f1a6db72b28/file-5373-grade-7-life-orientation-term-3-practice-test-2.pdf"}]'::jsonb, false, true, 5373, '{"title":"Grade 7 Life Orientation Term 3 Practice Test 2","description":"CAPS-aligned Grade 7 Life Orientation Term 3 Test. Worth 70 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('cc63c36a-7867-5fe2-8b5c-4ff727faabb4', 'grade-7-life-orientation-term-3-practice-test', 'Grade 7 Life Orientation Term 3 Practice Test', 'CAPS-aligned Grade 7 Life Orientation Term 3 Test. Worth 70 marks , includes full memo. Instant PDF download', 'This Grade 7 Life Orientation test is designed to help learners revise and prepare for formal assessments in Term 3. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in school assessments.

The test covers important topics such as:

• Substance abuse, its causes, symptoms, and protective factors

• Types of drugs and their effects

• Healthy lifestyle choices and prevention strategies

• Career choices, personal goals, and overcoming challenges

• Environmental health and different types of pollution

• Case studies that develop decision-making and problem-solving skills

Learners practise a variety of skills including multiple-choice questions, matching columns, short answers, definitions, case studies, and extended responses. For example, the learner profile case study on pages 6–7 develops critical thinking about career choices, while the environmental health questions in Question 6 require learners to apply knowledge to real-life community scenarios.

This resource includes:

✔ A complete 70-mark test

✔ A detailed memorandum for easy marking

✔ Case studies and application-based questions

✔ Clear instructions and learner-friendly layout', 60.00, 'Grade 7', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 70, '[{"id":"file-5366","label":"Test / Assessment PDF","filename":"grade-7-life-orientation-term-3-practice-test.pdf","storageKey":"products/cc63c36a-7867-5fe2-8b5c-4ff727faabb4/file-5366-grade-7-life-orientation-term-3-practice-test.pdf"}]'::jsonb, false, true, 5366, '{"title":"Grade 7 Life Orientation Term 3 Practice Test","description":"CAPS-aligned Grade 7 Life Orientation Term 3 Test. Worth 70 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('8603ee01-1ec2-5eef-a572-46e28d522304', 'grade-7-mathematics-term-3-practice-test-2', 'Grade 7 Mathematics Term 3 Practice Test 2', 'CAPS-aligned Grade 7 Mathematics Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 7 Mathematics test is designed to help learners revise and practise key geometry and spatial reasoning concepts for Term 3. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in school assessments.

The test covers important topics such as:

• Parallel lines, rays, and line segments

• Parts of a circle and types of triangles

• Measuring and drawing angles

• Lines of symmetry and transformations

• Properties of quadrilaterals

• Enlargement and area calculations

• Angle calculations and geometric reasoning

Learners practise a variety of mathematical skills including defining terms, measuring angles, drawing shapes, interpreting diagrams, comparing shapes, and solving geometry problems. For example, the angle-measuring and drawing tasks on pages 4–5 develop practical geometry skills, and the comparison and reasoning questions in Question 3 build mathematical explanation and problem-solving ability.

This resource includes:

✔ A complete 50-mark test

✔ A detailed memorandum for easy marking

✔ Diagram-based and problem-solving questions

✔ Clear instructions and learner-friendly layout', 60.00, 'Grade 7', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 50, '[{"id":"file-5364","label":"Test / Assessment PDF","filename":"grade-7-mathematics-term-3-practice-test-2.pdf","storageKey":"products/8603ee01-1ec2-5eef-a572-46e28d522304/file-5364-grade-7-mathematics-term-3-practice-test-2.pdf"}]'::jsonb, false, true, 5364, '{"title":"Grade 7 Mathematics Term 3 Practice Test 2","description":"CAPS-aligned Grade 7 Mathematics Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('429f410f-6820-5d53-ae01-10794d9f97a2', 'grade-7-mathematics-term-3-practice-test', 'Grade 7 Mathematics Term 3 Practice Test', 'CAPS-aligned Grade 7 Mathematics Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 7 Mathematics test is designed to help learners revise and practise key concepts for Term 3. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in school assessments.

The test covers important topics such as:

• Measuring and constructing angles

• Types of angles and parallel lines

• 2D shapes and circle terminology

• Similar and congruent shapes

• Transformations (reflection, rotation, translation, enlargement)

• Problem-solving using shapes and perimeter

Learners practise a variety of skills including interpreting diagrams, constructing shapes accurately, identifying transformations, and solving word problems. For example, the angle reasoning questions on page 2 develop mathematical explanations, and the transformation grids on pages 7–9 help learners apply spatial reasoning and geometric skills.

This resource includes:

✔ A complete 50-mark test

✔ A detailed memorandum for easy marking

✔ Diagram-based and problem-solving questions

✔ Clear instructions and learner-friendly layout', 60.00, 'Grade 7', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 50, '[{"id":"file-5361","label":"Test / Assessment PDF","filename":"grade-7-mathematics-term-3-practice-test.pdf","storageKey":"products/429f410f-6820-5d53-ae01-10794d9f97a2/file-5361-grade-7-mathematics-term-3-practice-test.pdf"}]'::jsonb, false, true, 5361, '{"title":"Grade 7 Mathematics Term 3 Practice Test","description":"CAPS-aligned Grade 7 Mathematics Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('76f000d9-693b-5bdc-a5af-445856c0e5ec', 'grade-7-technology-term-3-practice-test-2', 'Grade 7 Technology Term 3 Practice Test 2', 'CAPS-aligned Grade 7 Technology Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 7 Technology test is designed to help learners revise and consolidate key Technology concepts for Term 3. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in school assessments.

The test covers important topics such as:

• Magnetism and electromagnets

• Simple electric circuits and components

• Conductors and insulators

• Simple machines (pulleys, levers, cranes)

• Mechanical advantage

• Technical drawings (oblique drawings and flow charts)

• The design process, including design briefs, specifications, and constraints

Learners practise a wide range of skills through multiple-choice questions, matching columns, short-answer questions, circuit drawing, diagram interpretation, and design-based tasks. The paper includes a case study on building a model crane using an electromagnet and a design task linked to recycling awareness , which develop problem-solving and application skills (see the case study and design brief sections in the later pages of the paper).

This resource includes:

✔ A complete 50-mark test

✔ A detailed memorandum for easy marking

✔ Design-based, diagram-based, and application questions

✔ Clear instructions and learner-friendly layout', 60.00, 'Grade 7', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 50, '[{"id":"file-5358","label":"Test / Assessment PDF","filename":"grade-7-technology-term-3-practice-test-2.pdf","storageKey":"products/76f000d9-693b-5bdc-a5af-445856c0e5ec/file-5358-grade-7-technology-term-3-practice-test-2.pdf"}]'::jsonb, false, true, 5358, '{"title":"Grade 7 Technology Term 3 Practice Test 2","description":"CAPS-aligned Grade 7 Technology Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('a7ee92a7-739f-5a85-93fa-98d408ca1047', 'grade-7-technology-term-3-practice-test', 'Grade 7 Technology Term 3 Practice Test', 'CAPS-aligned Grade 7 Technology Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 7 Technology test is designed to help learners revise and prepare for formal assessments in Term 3. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in school assessments.

The test covers key topics such as:

• Simple electric circuits and components

• Conductors, insulators, and resistance

• Series and parallel circuits

• Electromagnets and magnetism

• Simple machines (levers, pulleys, cranes)

• The design process, design briefs, specifications, and constraints

Learners practise a variety of skills including multiple-choice questions, matching diagrams, short answers, design-based questions, circuit drawing, and interpreting data from an investigation. For example, the design brief task on page 5 requires learners to design a toy using magnetism, and the electromagnet investigation with a results table on page 9 develops interpretation and application skills.

This resource includes:

✔ A complete 50-mark test

✔ A detailed memorandum for easy marking

✔ Diagram-based and design-process questions

✔ Clear instructions and learner-friendly layout', 60.00, 'Grade 7', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 50, '[{"id":"file-5351","label":"Test / Assessment PDF","filename":"grade-7-technology-term-3-practice-test.pdf","storageKey":"products/a7ee92a7-739f-5a85-93fa-98d408ca1047/file-5351-grade-7-technology-term-3-practice-test.pdf"}]'::jsonb, false, true, 5351, '{"title":"Grade 7 Technology Term 3 Practice Test","description":"CAPS-aligned Grade 7 Technology Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('d673be7e-33fd-56e2-a523-ae5c563c98da', 'grade-7-natural-science-term-3-practice-test-2', 'Grade 7 Natural Science Term 3 Practice Test 2', 'CAPS-aligned Grade 7 Natural Science Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 7 Natural Sciences test is designed to help learners revise and prepare for formal assessments in Term 3. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in school assessments.

The test covers key topics such as:

• Renewable and non-renewable energy

• Heat transfer (conduction, convection, radiation)

• Useful and wasted energy

• Insulation and energy saving

• Solar energy and solar water heaters

• Electricity use in households and energy conservation

• Power stations and electricity generation

This resource includes:

✔ A complete 50-mark test

✔ A detailed memorandum for easy marking

✔ Data-handling and diagram-based questions

✔ Clear instructions and learner-friendly layout', 60.00, 'Grade 7', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 50, '[{"id":"file-5348","label":"Test / Assessment PDF","filename":"grade-7-natural-science-term-3-practice-test-2.pdf","storageKey":"products/d673be7e-33fd-56e2-a523-ae5c563c98da/file-5348-grade-7-natural-science-term-3-practice-test-2.pdf"}]'::jsonb, false, true, 5348, '{"title":"Grade 7 Natural Science Term 3 Practice Test 2","description":"CAPS-aligned Grade 7 Natural Science Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('962c8e21-b5e1-55f2-994e-4b2e7f699e88', 'grade-7-natural-science-term-3-practice-test', 'Grade 7 Natural Science Term 3 Practice Test', 'CAPS-aligned Grade 7 Natural Science Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 7 Natural Sciences test is designed to help learners revise and prepare for formal assessments in Term 3. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in school assessments.

The test covers key Term 3 topics, including:

• Renewable and non-renewable energy

• Types of energy and energy transfer

• Insulation and heat transfer

• Advantages and disadvantages of renewable energy

• Scientific investigations and interpreting results

• Gravitational potential energy and kinetic energy

Learners practise a variety of skills through multiple-choice questions, matching columns, short answers, data interpretation, and investigation-based questions. The paper includes a practical investigation on heating water and interpreting results, as well as diagram-based questions on energy and motion (see the investigation and diagram questions in the middle and later pages of the test).

This resource includes:

✔ A complete 50-mark test

✔ A detailed memorandum for easy marking

✔ Investigation and application-based questions

✔ Clear instructions and learner-friendly layout', 60.00, 'Grade 7', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 50, '[{"id":"file-5345","label":"Test / Assessment PDF","filename":"grade-7-natural-science-term-3-practice-test.pdf","storageKey":"products/962c8e21-b5e1-55f2-994e-4b2e7f699e88/file-5345-grade-7-natural-science-term-3-practice-test.pdf"}]'::jsonb, false, true, 5345, '{"title":"Grade 7 Natural Science Term 3 Practice Test","description":"CAPS-aligned Grade 7 Natural Science Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('ae9959fd-7b99-526d-8b14-6ae8802bc3e9', 'grade-7-geography-term-3-practice-test-2', 'Grade 7 Geography Term 3 Practice Test 2', 'CAPS-aligned Grade 7 Geography Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 7 Geography test is designed to help learners revise and prepare for formal assessments in Term 3. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in school assessments.

The test covers important topics such as:

• Birth rates, death rates, and population growth

• Infant mortality and life expectancy

• Population data interpretation using tables and graphs

• Pandemics, diseases, and their impact on population growth

• Scientific developments, sanitation, and healthcare

• Factors affecting population change

Learners practise a variety of geographical skills including interpreting tables and graphs, analysing case studies, defining key terms, and writing structured paragraphs. The paper includes data interpretation activities and a case study on pandemics that require learners to apply knowledge and explain concepts in full sentences (see the population table and pandemic case study in the middle sections of the paper).

This resource includes:

✔ A complete 50-mark test

✔ A detailed memorandum for easy marking

✔ Data-handling and paragraph-writing questions

✔ Clear instructions and learner-friendly layout', 60.00, 'Grade 7', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','geography'], 50, '[{"id":"file-5341","label":"Test / Assessment PDF","filename":"grade-7-geography-term-3-practice-test-2.pdf","storageKey":"products/ae9959fd-7b99-526d-8b14-6ae8802bc3e9/file-5341-grade-7-geography-term-3-practice-test-2.pdf"}]'::jsonb, false, true, 5341, '{"title":"Grade 7 Geography Term 3 Practice Test 2","description":"CAPS-aligned Grade 7 Geography Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('62b0fba6-52eb-5546-a505-c3ee1d28aeec', 'grade-7-geography-term-3-practice-test', 'Grade 7 Geography Term 3 Practice Test', 'CAPS-aligned Grade 7 Geography Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 7 Geography test is designed to help learners revise and prepare for formal assessments in Term 3. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in school assessments.

The test covers important topics such as:

• Population concepts (birth rate, death rate, life expectancy, infant mortality)

• Factors affecting population growth

• World population growth and population projections

• Migration, conflict, and population change

• Diseases and developments affecting population growth

• Case study: The Spanish Flu epidemic

Learners practise a variety of geographical skills including interpreting graphs, analysing case studies, answering structured questions, and explaining concepts in full sentences. The paper includes visual sources such as graphs and case studies that require learners to interpret information and apply their knowledge (see the population graph and Spanish Flu case study in the middle and later sections of the paper).

This resource includes:

✔ A complete 50-mark test

✔ A detailed memorandum for easy marking

✔ Case study and graph interpretation questions

✔ Clear instructions and learner-friendly layout', 60.00, 'Grade 7', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','geography'], 50, '[{"id":"file-5337","label":"Test / Assessment PDF","filename":"grade-7-geography-term-3-practice-test.pdf","storageKey":"products/62b0fba6-52eb-5546-a505-c3ee1d28aeec/file-5337-grade-7-geography-term-3-practice-test.pdf"}]'::jsonb, false, true, 5337, '{"title":"Grade 7 Geography Term 3 Practice Test","description":"CAPS-aligned Grade 7 Geography Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('d5a153e8-f8d4-5da6-ad36-96497c97e7f8', 'grade-7-history-term-3-practice-test-2', 'Grade 7 History Term 3 Practice Test 2', 'CAPS-aligned Grade 7 History Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 7 History test is designed to help learners revise and prepare for formal assessments in Term 3. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in school assessments.

The test covers important topics such as:

• Slavery at the Cape and the transatlantic slave trade

• The VOC and early European settlement

• Trekboers and expanding frontiers

• The impact of European settlement on the Khoikhoi and San

• Free burghers, mission stations, and early communities

• Slave resistance and legacies of slavery

Learners practise a variety of historical skills including source-based questions, picture interpretation, paragraph writing, and essay writing. The paper includes diary extracts and visual sources that require learners to interpret historical evidence and explain its meaning (see the source-based questions and essays in the later sections of the paper).

This resource includes:

✔ A complete 50-mark test

✔ A detailed memorandum for easy marking

✔ Source-based, paragraph, and essay-writing questions

✔ Clear instructions and learner-friendly layout', 60.00, 'Grade 7', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','history'], 50, '[{"id":"file-5334","label":"Test / Assessment PDF","filename":"grade-7-history-term-3-practice-test-2.pdf","storageKey":"products/d5a153e8-f8d4-5da6-ad36-96497c97e7f8/file-5334-grade-7-history-term-3-practice-test-2.pdf"}]'::jsonb, false, true, 5334, '{"title":"Grade 7 History Term 3 Practice Test 2","description":"CAPS-aligned Grade 7 History Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('55762fb6-0c5e-59d7-9602-9b1516cb9c28', 'grade-7-history-term-3-practice-test', 'Grade 7 History Term 3 Practice Test', 'CAPS-aligned Grade 7 History Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 7 History test is designed to help learners revise and prepare for formal assessments in Term 3. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in school assessments.

The test covers important topics such as:

• The Dutch settlement at the Cape

• The VOC and early European settlers

• Slavery at the Cape

• Indigenous people of the Cape

• Mission stations and early communities

• Contact between the Dutch, Khoi, San and Xhosa

Learners practise a variety of skills including multiple-choice questions, matching columns, source-based questions, picture interpretation, and paragraph writing. The paper also includes case-based and source-based questions that develop historical thinking and interpretation skills (see the source and picture questions in the middle of the paper).

This resource includes:

✔ A complete 50-mark test

✔ A detailed memorandum for easy marking

✔ Source-based and paragraph-writing questions

✔ Clear instructions and learner-friendly layout', 60.00, 'Grade 7', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','history'], 50, '[{"id":"file-5332","label":"Test / Assessment PDF","filename":"grade-7-history-term-3-practice-test.pdf","storageKey":"products/55762fb6-0c5e-59d7-9602-9b1516cb9c28/file-5332-grade-7-history-term-3-practice-test.pdf"}]'::jsonb, false, true, 5332, '{"title":"Grade 7 History Term 3 Practice Test","description":"CAPS-aligned Grade 7 History Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('3b32b303-e117-578c-89b8-fc087441ccb0', 'grade-7-economic-management-sciences-term-3-practice-test-2', 'Grade 7 Economic Management Sciences Term 3 Practice Test', 'CAPS-aligned Grade 7 EMS Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 7 EMS test is designed to help learners revise and practise key concepts for Term 3. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in school assessments.

The test covers important topics such as:

• Fixed and variable costs

• Formal and informal businesses

• Advertising and the AIDA model

• Entrepreneurship and characteristics of entrepreneurs

• Needs and wants

• SWOT analysis

• Income, expenditure, and profit

Learners practise a variety of skills through multiple-choice questions, matching columns, short answers, case studies, and calculations. The case study section requires learners to apply business concepts to real-life scenarios, and the income and expenditure activity develops practical financial skills (see the case study and budgeting sections in the middle of the paper).

This resource includes:

✔ A complete 50-mark test

✔ A detailed memorandum for easy marking

✔ Case study and practical financial calculations

✔ Clear instructions and learner-friendly layout', 60.00, 'Grade 7', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 50, '[{"id":"file-5329","label":"Test / Assessment PDF","filename":"grade-7-economic-management-sciences-term-3-practice-test-2.pdf","storageKey":"products/3b32b303-e117-578c-89b8-fc087441ccb0/file-5329-grade-7-economic-management-sciences-term-3-practice-test-2.pdf"}]'::jsonb, false, true, 5329, '{"title":"Grade 7 Economic Management Sciences Term 3 Practice Test","description":"CAPS-aligned Grade 7 EMS Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('dfe9b80d-4bd8-5be9-a1b2-7ee275fed20a', 'grade-7-ems-term-3-practice-test', 'Grade 7 Economic Management Sciences Term 3 Practice Test', 'CAPS-aligned Grade 7 EMS Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 7 EMS test is designed to help learners revise and prepare for formal assessments in Term 3. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in school assessments.

The test covers important Term 3 topics, including:

• Entrepreneurship and characteristics of entrepreneurs

• Needs and wants

• Advertising and the AIDA model

• Case study analysis

• Budgeting and profit calculations

Learners practise applying their knowledge to multiple-choice questions, short answers, case studies, and practical budgeting activities. The case study section requires learners to analyse a small business and apply concepts such as SWOT, goal setting, and profit calculation (see the case study and budgeting sections in the middle of the paper).

This resource includes:

✔ A complete 50-mark test

✔ A detailed memorandum for easy marking

✔ Case study and budgeting activities to develop application skills

✔ Clear instructions and learner-friendly layout', 60.00, 'Grade 7', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 50, '[{"id":"file-5326","label":"Test / Assessment PDF","filename":"grade-7-ems-term-3-practice-test.pdf","storageKey":"products/dfe9b80d-4bd8-5be9-a1b2-7ee275fed20a/file-5326-grade-7-ems-term-3-practice-test.pdf"}]'::jsonb, false, true, 5326, '{"title":"Grade 7 Economic Management Sciences Term 3 Practice Test","description":"CAPS-aligned Grade 7 EMS Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('2a97e99d-b99f-5d01-8c6b-957f7da4bec0', 'grade-7-afrikaans-first-additional-language-term-3-test', 'Grade 7 Afrikaans First Additional Language Term 3 Test', 'CAPS-aligned Grade 7 Afrikaans FAL Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 7 Afrikaans First Additional Language practice test is designed to help learners revise and prepare for formal assessments in Term 3. The test follows the CAPS curriculum and includes a variety of question types to develop comprehension, writing, and language skills.

The test includes:

• Comprehension based on a youth drama

• Creative writing (dialogue writing)

• Language structures and conventions

Learners practise understanding dialogue and themes, expressing ideas in their own writing, and applying grammar and language rules in context. The language section includes work on tenses, pronouns, punctuation, sentence types, STOMPI sentence structure, and vocabulary (see the language section and memo near the end of the paper).

This resource includes:

✔ A complete 50-mark test

✔ A detailed memorandum and rubric for writing

✔ Clear instructions and learner-friendly layout

✔ A range of question types to assess different skills', 60.00, 'Grade 7', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['afrikaans-first-additional-language','natural-science-and-technology'], 50, '[{"id":"file-5322","label":"Test / Assessment PDF","filename":"grade-7-afrikaans-first-additional-language-term-3-test.pdf","storageKey":"products/2a97e99d-b99f-5d01-8c6b-957f7da4bec0/file-5322-grade-7-afrikaans-first-additional-language-term-3-test.pdf"}]'::jsonb, false, true, 5322, '{"title":"Grade 7 Afrikaans First Additional Language Term 3 Test","description":"CAPS-aligned Grade 7 Afrikaans FAL Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('56ec286e-772e-543e-926e-19cce20c5215', 'grade-7-afrikaams-fal-term-3-practice-test', 'Grade 7 Afrikaans First Additional Language Term 3 Practice Test', 'CAPS-aligned Grade 7 Afrikaans FAL Term 3 Tests Worth 50 and 30 marks , includes full memo. Instant PDF download', 'This resource includes two Grade 7 Afrikaans First Additional Language tests designed to help learners practise and revise key language skills for Term 3. The tests are aligned to the CAPS curriculum and follow the structure learners are familiar with in school assessments.

The tests include a variety of question types, such as:

• Poetry comprehension

• Drama and short story comprehension

• Reading comprehension and visual literacy

• Summary writing

• Language structures and conventions

Learners practise understanding texts, interpreting visual information, applying grammar rules, and expressing ideas in their own words, helping to build both confidence and language skills. The second test also includes a summary task and a language section covering verbs, tenses, antonyms, synonyms, direct speech, and sentence structure (see language questions in the later pages of the paper).

This resource includes:

✔ Two complete tests (30 marks and 50 marks)

✔ Detailed memorandums for easy marking

✔ Clear instructions and learner-friendly layout

✔ A range of question types to assess different skills', 60.00, 'Grade 7', 'Term 3', '2026', 'Individual Resource', 'Summary', array['afrikaans-first-additional-language','natural-science-and-technology'], 30, '[{"id":"file-5319","label":"Summary PDF","filename":"grade-7-afrikaams-fal-term-3-practice-test.pdf","storageKey":"products/56ec286e-772e-543e-926e-19cce20c5215/file-5319-grade-7-afrikaams-fal-term-3-practice-test.pdf"}]'::jsonb, false, true, 5319, '{"title":"Grade 7 Afrikaans First Additional Language Term 3 Practice Test","description":"CAPS-aligned Grade 7 Afrikaans FAL Term 3 Tests Worth 50 and 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('7898cb03-9377-588c-8d4d-0e9ccb39e7f7', 'grade-7-english-first-additional-language-term-3-practice-test-2', 'Grade 7 English First Additional Language Term 3 Practice Test 2', 'CAPS-aligned Grade 7 English FAL Term 3 Test. Worth 60 marks , includes full memo. Instant PDF download', 'This Grade 7 English First Additional Language Paper 2 is designed to help learners revise and prepare for formal assessments in Term 3. The paper is aligned to the CAPS curriculum and follows the structure learners are familiar with in school.

The paper includes a variety of question types, such as:

• Reading comprehension based on a short story

• Visual literacy using an advertisement

• Summary writing

• Language structures and conventions

Learners practise understanding texts, interpreting visual information, summarising key ideas, and applying grammar and language rules in context, helping to strengthen both language and thinking skills.

This resource includes:

✔ A complete 60-mark test

✔ A detailed memorandum for easy marking

✔ Clear instructions and learner-friendly layout

✔ A range of question types to assess different skills and levels', 60.00, 'Grade 7', 'Term 3', '2026', 'Individual Resource', 'Summary', array['english-first-additional-language','natural-science-and-technology'], 60, '[{"id":"file-5316","label":"Summary PDF","filename":"grade-7-english-first-additional-language-term-3-practice-test-2.pdf","storageKey":"products/7898cb03-9377-588c-8d4d-0e9ccb39e7f7/file-5316-grade-7-english-first-additional-language-term-3-practice-test-2.pdf"}]'::jsonb, false, true, 5316, '{"title":"Grade 7 English First Additional Language Term 3 Practice Test 2","description":"CAPS-aligned Grade 7 English FAL Term 3 Test. Worth 60 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('bb8b7679-9296-5788-b34b-e2ab16c88f6d', 'grade-7-english-fal-term-3-practice-test', 'Grade 7 English First Additional Language Term 3 Practice Test', 'CAPS-aligned Grade 7 English FAL Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 7 English First Additional Language test is designed to help learners practise and revise key language skills for Term 3. The test is aligned to the CAPS curriculum and follows the structure learners are familiar with in school assessments.

The test includes a variety of question types, such as:

• Reading comprehension based on an informational text

• Visual literacy using an advertisement

• Language structures and conventions

Learners practise understanding texts, interpreting visual information, and applying grammar and language rules in context, helping to build confidence and improve overall language ability.

This resource includes:

✔ A complete 50-mark test

✔ A detailed memorandum for easy marking

✔ Clear instructions and learner-friendly layout

✔ A variety of question types to assess different skills', 60.00, 'Grade 7', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['english-first-additional-language','natural-science-and-technology'], 50, '[{"id":"file-5314","label":"Test / Assessment PDF","filename":"grade-7-english-fal-term-3-practice-test.pdf","storageKey":"products/bb8b7679-9296-5788-b34b-e2ab16c88f6d/file-5314-grade-7-english-fal-term-3-practice-test.pdf"}]'::jsonb, false, true, 5314, '{"title":"Grade 7 English First Additional Language Term 3 Practice Test","description":"CAPS-aligned Grade 7 English FAL Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('568de33d-2288-5b80-9129-428764d9acd0', 'grade-7-english-home-language-term-3-practice-test-2', 'Grade 7 English Home Language Term 3 Practice Test 2', 'CAPS-aligned Grade 7 English HL Term 3 Test. Worth 60 marks , includes full memo. Instant PDF download', 'This Grade 7 English Home Language Paper 2 is designed to help learners revise and prepare for formal assessments in Term 3. The test follows the CAPS structure and includes a variety of question types to develop comprehension, language skills, and writing ability.

The paper includes:

• Reading comprehension based on a short story

• Visual literacy using an advert

• Summary writing

• Language structures and conventions

Learners are required to interpret texts, analyse visual information, apply grammar rules, and summarise key ideas in their own words, helping to build strong language and thinking skills.

This resource includes:

✔ A complete 60-mark test

✔ A detailed memorandum for easy marking

✔ Clear instructions and learner-friendly layout

✔ Questions that assess a range of skills and difficulty levels', 60.00, 'Grade 7', 'Term 3', '2026', 'Individual Resource', 'Summary', array['english-home-language','natural-science-and-technology'], 60, '[{"id":"file-5311","label":"Summary PDF","filename":"grade-7-english-home-language-term-3-practice-test-2.pdf","storageKey":"products/568de33d-2288-5b80-9129-428764d9acd0/file-5311-grade-7-english-home-language-term-3-practice-test-2.pdf"}]'::jsonb, false, true, 5311, '{"title":"Grade 7 English Home Language Term 3 Practice Test 2","description":"CAPS-aligned Grade 7 English HL Term 3 Test. Worth 60 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('f5365b58-a9cc-53d4-ad06-eb2f39a7d415', 'grade-7-english-hl-term-3-practice-test', 'Grade 7 English Home Language Term 3 Practice Test', 'CAPS-aligned Grade 7 English HL Term 3 Test. Worth 60 marks , includes full memo. Instant PDF download', 'This Grade 7 English Home Language test is designed to help learners revise and prepare for formal assessments in Term 3. The test is aligned to the CAPS curriculum and follows the structure learners are familiar within school.

The test includes a variety of question types to assess different language skills, including:

• Reading comprehension

• Language structures and conventions

• Dialogue comprehension

• Creative writing

Learners are required to interpret texts, apply grammar and language rules, and express their ideas clearly in writing, helping to build both understanding and confidence.

This resource includes:

✔ A complete 60-mark test

✔ A detailed memorandum for easy marking

✔ A creative writing rubric to guide assessment

✔ A clear, learner-friendly layout', 60.00, 'Grade 7', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['english-home-language','natural-science-and-technology'], 60, '[{"id":"file-5266","label":"Test / Assessment PDF","filename":"grade-7-english-hl-term-3-practice-test.pdf","storageKey":"products/f5365b58-a9cc-53d4-ad06-eb2f39a7d415/file-5266-grade-7-english-hl-term-3-practice-test.pdf"}]'::jsonb, false, true, 5266, '{"title":"Grade 7 English Home Language Term 3 Practice Test","description":"CAPS-aligned Grade 7 English HL Term 3 Test. Worth 60 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('475e9d56-1fc8-5e90-8acc-569c5e64070d', 'grade-6-mathematics-term-3-practice-test-2', 'Grade 6 Mathematics Term 3 Practice Test 2', 'CAPS-aligned Grade 6 Mathematics Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 6 Mathematics practice test is designed to help learners revise and prepare for formal assessments in Term 3. The test is aligned to the CAPS curriculum and follows the structure and cognitive levels learners are familiar with in school.

The test covers important Term 3 topics, including:

• Fractions and decimals

• Measurement

• Transformations and symmetry

• Data handling

• 3D shapes

• Multiple-choice and problem-solving questions

This resource includes:

✔ A full 50-mark test

✔ Clear instructions and structured layout

✔ Cognitive level and content breakdown tables

✔ Memorandum with answers for easy marking

This practice test is ideal for revision, exam preparation, and identifying areas where learners need extra support. It helps build confidence and ensures learners understand concepts, not just memorise procedures.

Perfect for parents, tutors, and teachers who want structured, CAPS-aligned practice at home or in the classroom.', 60.00, 'Grade 6', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 50, '[{"id":"file-5264","label":"Test / Assessment PDF","filename":"grade-6-mathematics-term-3-practice-test-2.pdf","storageKey":"products/475e9d56-1fc8-5e90-8acc-569c5e64070d/file-5264-grade-6-mathematics-term-3-practice-test-2.pdf"}]'::jsonb, false, true, 5264, '{"title":"Grade 6 Mathematics Term 3 Practice Test 2","description":"CAPS-aligned Grade 6 Mathematics Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('0189ae27-1bf7-502c-b23a-a60c9b49185d', 'grade-6-mathematics-term-3-practice-test', 'Grade 6 Mathematics Term 3 Practice Test', 'CAPS-aligned Grade 6 Mathematics Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 6 Mathematics content for Term 3 . It includes a range of structured questions designed to assess knowledge, understanding, and problem-solving skills.

The test covers important topics such as properties of 2D shapes , symmetry and transformations , properties of 3D objects , and area, perimeter, and volume . Learners complete multiple-choice questions, diagram-based questions, drawing and labelling tasks, and calculations to apply their understanding of geometric concepts and measurement.

Learners are also required to interpret diagrams, describe transformations, identify shapes from descriptions, and solve practical measurement problems, helping to develop reasoning and spatial understanding in line with CAPS requirements.

A full memorandum is included to support marking and feedback.

Total: 50 marks

Duration: 90 minutes

Format: PDF (not editable)', 60.00, 'Grade 6', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 50, '[{"id":"file-5261","label":"Test / Assessment PDF","filename":"grade-6-mathematics-term-3-practice-test.pdf","storageKey":"products/0189ae27-1bf7-502c-b23a-a60c9b49185d/file-5261-grade-6-mathematics-term-3-practice-test.pdf"}]'::jsonb, false, true, 5261, '{"title":"Grade 6 Mathematics Term 3 Practice Test","description":"CAPS-aligned Grade 6 Mathematics Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('fa5fb7f7-098b-5d0d-bb77-152f5bfabb79', 'grade-6-natural-science-technology-term-3-practice-test-2', 'Grade 6 Natural Science & Technology Term 3 Practice Test 2', 'CAPS-aligned Grade 6 NST Term 3 Test. Worth 30 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 6 Natural Science & Technology content for Term 3 . It focuses on Electricity and Energy and includes a range of structured questions to assess knowledge, understanding, and application.

The test includes labelling diagrams, drawing circuits, explanations, short answer questions, and a comprehension task . Learners practise identifying parts of a circuit, explaining the difference between open and closed circuits, distinguishing between conductors and insulators, and understanding energy sources and power stations.

Learners also apply their knowledge to explain energy conservation and interpret information in context, helping to develop reasoning and problem-solving skills in line with CAPS requirements.

A full memorandum is included to support marking and feedback.

Total: 30 marks

Duration: 45 minutes

Format: PDF (not editable)', 60.00, 'Grade 6', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 30, '[{"id":"file-5258","label":"Test / Assessment PDF","filename":"grade-6-natural-science-technology-term-3-practice-test-2.pdf","storageKey":"products/fa5fb7f7-098b-5d0d-bb77-152f5bfabb79/file-5258-grade-6-natural-science-technology-term-3-practice-test-2.pdf"}]'::jsonb, false, true, 5258, '{"title":"Grade 6 Natural Science & Technology Term 3 Practice Test 2","description":"CAPS-aligned Grade 6 NST Term 3 Test. Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('3e722a53-d50c-536f-94c7-0ece1f799401', 'grade-6-nst-term-3-practice-test', 'Grade 6 Natural Science & Technology Term 3 Practice Test', 'CAPS-aligned Grade 6 NST Term 3 Test. Worth 30 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 6 Natural Science & Technology content for Term 3 . It focuses on Electricity and Energy and includes a range of structured questions to assess knowledge, understanding, and application.

The test includes concepts and terminology , column matching , diagram-based questions , drawing and labelling electric circuits , and short answer questions . Learners are required to draw and label simple electric circuits, explain the difference between open and closed circuits, and apply their understanding of conductors, insulators, fossil fuels, and renewable energy sources.

The test also assesses learners’ ability to explain how electricity is generated, identify ways to conserve energy, recognise unsafe electricity practices, and understand why South Africa is moving towards renewable energy sources.

A full memorandum is included to support marking and feedback.

Total: 30 marks

Duration: 45 minutes

Format: PDF (not editable)', 60.00, 'Grade 6', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 30, '[{"id":"file-5255","label":"Test / Assessment PDF","filename":"grade-6-nst-term-3-practice-test.pdf","storageKey":"products/3e722a53-d50c-536f-94c7-0ece1f799401/file-5255-grade-6-nst-term-3-practice-test.pdf"}]'::jsonb, false, true, 5255, '{"title":"Grade 6 Natural Science & Technology Term 3 Practice Test","description":"CAPS-aligned Grade 6 NST Term 3 Test. Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('582e557b-b27a-5fc6-a960-0b3b52b7d466', 'grade-6-geography-term-3-practice-test-2', 'Grade 6 Geography Term 3 Practice Test 2', 'CAPS-aligned Grade 6 Geography Term 3 Test. Worth 40 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 6 Social Sciences: Geography content for Term 3 . It includes true or false questions, matching activities, short answer questions, source-based questions, and definition questions , designed to assess both knowledge and understanding.

The test covers important Term 3 topics including climate and temperature , forest layers and deforestation , deserts and nomadic life , and coniferous forests . Learners are required to interpret written information and images, explain key concepts, and apply their understanding to real-life geographical contexts.

Learners also revise key geographical vocabulary through matching and definition questions , including terms such as equator, migration, hibernation, prey, evergreen trees, and water sources in deserts , helping to strengthen subject-specific language and understanding.

A full memorandum is included to support marking and feedback.

Total: 40 marks

Duration: 1 hour

Format: PDF (not editable)', 60.00, 'Grade 6', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','social-sciences','geography'], 40, '[{"id":"file-5252","label":"Test / Assessment PDF","filename":"grade-6-geography-term-3-practice-test-2.pdf","storageKey":"products/582e557b-b27a-5fc6-a960-0b3b52b7d466/file-5252-grade-6-geography-term-3-practice-test-2.pdf"}]'::jsonb, false, true, 5252, '{"title":"Grade 6 Geography Term 3 Practice Test 2","description":"CAPS-aligned Grade 6 Geography Term 3 Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('2e7092ab-5408-5c50-8297-f79d031d6ce7', 'grade-6-geography-term-3-practice-test', 'Grade 6 Geography Term 3 Practice Test 1', 'CAPS-aligned Grade 6 Geography Term 3 Test. Worth 40 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 6 Social Sciences: Geography content for Term 3. It includes multiple-choice questions, visual interpretation, short answers, diagram-based questions, and structured questions designed to assess both knowledge and understanding.

The test covers important topics such as weather and climate , biomes and animal adaptations , desert environments , relief rainfall , climate zones , and rainfall patterns in South Africa . Learners interpret maps, diagrams, and pictures, and apply their understanding to explain real-life environmental and climate-related concepts.

Learners also analyse maps of rainfall in South Africa , interpret weather diagrams and climate graphs of the United Kingdom , and answer questions about deforestation and climate change , helping to develop interpretation, reasoning, and explanation skills.

A full memorandum is included to support marking and feedback.

Total: 40 marks

Duration: 1 hour

Format: PDF (not editable)', 60.00, 'Grade 6', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','social-sciences','geography'], 40, '[{"id":"file-5247","label":"Test / Assessment PDF","filename":"grade-6-geography-term-3-practice-test.pdf","storageKey":"products/2e7092ab-5408-5c50-8297-f79d031d6ce7/file-5247-grade-6-geography-term-3-practice-test.pdf"}]'::jsonb, false, true, 5247, '{"title":"Grade 6 Geography Term 3 Practice Test 1","description":"CAPS-aligned Grade 6 Geography Term 3 Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('be6de303-636c-5396-b8fe-8058b46c4731', 'grade-6-history-term-3-practice-test-2', 'Grade 6 History Term 3 Practice Test 2', 'CAPS-aligned Grade 6 History Term 3 Test. Worth 40 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 6 Social Sciences: History content for Term 3. It includes multiple-choice questions, matching activities, short answer questions, visual interpretation, and structured questions designed to assess both knowledge and understanding.

The test focuses on topics related to democracy, government, rights and responsibilities, national symbols, and the Constitution . Learners revise important concepts such as democracy, voting, political parties, and citizens’ rights and responsibilities , and interpret information about the South African Coat of Arms, national symbols, and the national flag .

Learners are also required to apply their knowledge to answer questions about Parliament, the Constitutional Court, elections, and key features of South Africa’s democracy , helping to develop understanding as well as reasoning and explanation skills.

A full memorandum is included to support marking and feedback.

Total: 40 marks

Duration: 1 hour

Format: PDF (not editable)', 60.00, 'Grade 6', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','social-sciences','history'], 40, '[{"id":"file-5244","label":"Test / Assessment PDF","filename":"grade-6-history-term-3-practice-test-2.pdf","storageKey":"products/be6de303-636c-5396-b8fe-8058b46c4731/file-5244-grade-6-history-term-3-practice-test-2.pdf"}]'::jsonb, false, true, 5244, '{"title":"Grade 6 History Term 3 Practice Test 2","description":"CAPS-aligned Grade 6 History Term 3 Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('eca389d3-0e47-59ab-8a08-f3667e9e0284', 'grade-6-history-term-3-practice-test', 'Grade 6 History Term 3 Practice Test 1', 'CAPS-aligned Grade 6 History Term 3 Test. Worth 40 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 6 Social Sciences: History content for Term 3. It includes multiple-choice questions, source-based questions, matching activities, short answer questions, and a structured writing task .

The test focuses on topics related to democracy and citizenship , including elections, political parties, the Constitution, the justice system, and the responsibilities of citizens . Learners interpret visual sources such as graphs and charts about election results and answer questions that develop observation, reasoning, and interpretation skills.

Learners also complete a letter-writing task explaining the importance of voting, helping to develop historical understanding together with written communication skills. Additional questions assess knowledge of children’s rights and responsibilities , national symbols , and key figures who contributed to democracy in South Africa.

A full memorandum is included to support marking and feedback.

Total: 40 marks

Duration: 1 hour

Format: PDF (not editable)', 60.00, 'Grade 6', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','social-sciences','history'], 40, '[{"id":"file-5242","label":"Test / Assessment PDF","filename":"grade-6-history-term-3-practice-test.pdf","storageKey":"products/eca389d3-0e47-59ab-8a08-f3667e9e0284/file-5242-grade-6-history-term-3-practice-test.pdf"}]'::jsonb, false, true, 5242, '{"title":"Grade 6 History Term 3 Practice Test 1","description":"CAPS-aligned Grade 6 History Term 3 Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('b2d7315d-e3d6-522e-bc5f-99fd9cae8923', 'grade-6-life-skills-psw-term-3-practice-test-2', 'Grade 6 Life Skills PSW Term 3 Practice Test 2', 'CAPS-aligned Grade 6 Life Skills PSW Term 3 Test. Worth 40 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 6 Life Skills (PSW) skills for Term 3 . It includes multiple choice questions, matching concepts, short answers, and case studies designed to assess both knowledge and understanding.

The test covers important Term 3 topics including heritage and nation building, culture and oral traditions, cultural identity, Ubuntu, gender stereotypes and sexism, caring for animals, and caring for others in the community . Learners are required to apply their knowledge to real-life situations, give reasons for their answers, and suggest practical solutions in case study questions.

The questions assess a range of skills including remembering, understanding, applying knowledge, reasoning, and decision-making , in line with CAPS requirements. The test is clearly structured with instructions, mark allocation, and cognitive-level weighting to support effective revision and assessment.

A full memorandum is included to support marking and feedback.

Total: 40 marks

Duration: 1 hour

Format: PDF (not editable)', 60.00, 'Grade 6', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['life-skills','natural-science-and-technology'], 40, '[{"id":"file-5239","label":"Test / Assessment PDF","filename":"grade-6-life-skills-psw-term-3-practice-test-2.pdf","storageKey":"products/b2d7315d-e3d6-522e-bc5f-99fd9cae8923/file-5239-grade-6-life-skills-psw-term-3-practice-test-2.pdf"}]'::jsonb, false, true, 5239, '{"title":"Grade 6 Life Skills PSW Term 3 Practice Test 2","description":"CAPS-aligned Grade 6 Life Skills PSW Term 3 Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('71dad221-eb13-5fd4-8f77-7d27435d33ae', 'grade-6-life-skills-psw-term-3-practice-test', 'Grade 6 Life Skills PSW Term 3 Practice Test 1', 'CAPS-aligned Grade 6 Life Skills PSW Term 3 Test. Worth 40 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 6 Life Skills (PSW) skills for Term 3 . It includes multiple choice questions, true or false questions, short answers, case studies, and matching questions designed to assess both knowledge and understanding.

The test covers important Term 3 topics including values and democracy, rights and responsibilities, Ubuntu, caring for animals and others, national symbols and heritage, cultural heritage, gender stereotyping, and abuse awareness . Learners are also required to read short case studies, give advice in a supportive way, and apply their knowledge to real-life situations.

The questions assess a range of skills including remembering, understanding, applying knowledge, reasoning, and decision-making , in line with CAPS requirements. The test is clearly structured with instructions, mark allocation, and cognitive-level weighting to support effective revision and assessment.

A full memorandum is included to support marking and feedback.

Total: 40 marks

Duration: 1 hour

Format: PDF (not editable)', 60.00, 'Grade 6', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['life-skills','natural-science-and-technology'], 40, '[{"id":"file-5236","label":"Test / Assessment PDF","filename":"grade-6-life-skills-psw-term-3-practice-test.pdf","storageKey":"products/71dad221-eb13-5fd4-8f77-7d27435d33ae/file-5236-grade-6-life-skills-psw-term-3-practice-test.pdf"}]'::jsonb, false, true, 5236, '{"title":"Grade 6 Life Skills PSW Term 3 Practice Test 1","description":"CAPS-aligned Grade 6 Life Skills PSW Term 3 Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('5a055e73-5f21-5c8e-9756-9e172a68a76d', 'grade-6-afrikaans-first-additional-language-term-3-practice-test-2', 'Grade 6 Afrikaans First Additional Language Term 3 Practice Test 2', 'CAPS-aligned Grade 6 Afrikaans FAL Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 6 Afrikaans First Additional Language skills for Term 3 . It includes a Begripstoets (Reading Comprehension) , a Kreatiewe skryfwerk (Creative Writing) task, and a Taalwerk (Language) section.

The Begripstoets (Reading Comprehension) is based on a narrative text titled “Die Jakkals en die Blink Klip” and assesses learners’ understanding of the story, characters, vocabulary in context, tense changes, synonyms, prepositions, and answering both factual and higher-order questions. Learners are also required to interpret the message of the story and give their own opinions with reasons.

The Kreatiewe skryfwerk (Creative Writing) section requires learners to write a short dialogue between two friends about a school concert, using correct dialogue format, punctuation, and descriptive language. A rubric is included to support structured writing and marking.

The Taalwerk (Language) section covers a range of grammar and language skills, including trappe van vergelyking, werkwoorde en tye, letterlike en figuurlike taal, bedrywende en lydende vorm, ontkennende vorm, bywoorde, sinsoorte, voegwoorde, and punctuation .

A full memorandum and writing rubric are included to support marking and feedback.

Total: 50 marks

Duration: 1 hour

Format: PDF (not editable)', 60.00, 'Grade 6', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['afrikaans-first-additional-language','natural-science-and-technology'], 50, '[{"id":"file-5232","label":"Test / Assessment PDF","filename":"grade-6-afrikaans-first-additional-language-term-3-practice-test-2.pdf","storageKey":"products/5a055e73-5f21-5c8e-9756-9e172a68a76d/file-5232-grade-6-afrikaans-first-additional-language-term-3-practice-test-2.pdf"}]'::jsonb, false, true, 5232, '{"title":"Grade 6 Afrikaans First Additional Language Term 3 Practice Test 2","description":"CAPS-aligned Grade 6 Afrikaans FAL Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('67306ea5-c68c-55ea-8956-8456177ebfd3', 'grade-6-afrikaans-first-additional-language-term-3-practice-test', 'Grade 6 Afrikaans First Additional Language Term 3 Practice Test 1', 'CAPS-aligned Grade 6 Afrikaans FAL Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 6 Afrikaans First Additional Language skills for Term 3 . It includes a Begripstoets (Reading Comprehension) , a Visuele teks (Visual Literacy) section, an Opsomming (Summary Writing) task, and a Taal in konteks (Language in Context) section.

The Begripstoets (Reading Comprehension) is based on a narrative text and assesses learners’ ability to understand the story, identify details, interpret meaning, describe characters and events, and answer both factual and higher-order questions.

The Visuele teks (Visual Literacy) section requires learners to interpret information from a poster, identify key details, and justify their answers using evidence from the text and image.

The Opsomming (Summary Writing) task develops learners’ ability to identify main ideas, use their own words, organise information logically, and write a summary within a word limit.

The Taal in konteks (Language in Context) section covers a range of grammar and language skills, including verbs, figurative meaning, active and passive voice, negative form, tenses, conjunctions, direct and indirect speech, and sentence structure.

A full memorandum and summary rubric are included to support marking and feedback.

Total: 50 marks

Duration: 1 hour

Format: PDF (not editable)', 60.00, 'Grade 6', 'Term 3', '2026', 'Individual Resource', 'Summary', array['afrikaans-first-additional-language','natural-science-and-technology'], 50, '[{"id":"file-5228","label":"Summary PDF","filename":"grade-6-afrikaans-first-additional-language-term-3-practice-test.pdf","storageKey":"products/67306ea5-c68c-55ea-8956-8456177ebfd3/file-5228-grade-6-afrikaans-first-additional-language-term-3-practice-test.pdf"}]'::jsonb, false, true, 5228, '{"title":"Grade 6 Afrikaans First Additional Language Term 3 Practice Test 1","description":"CAPS-aligned Grade 6 Afrikaans FAL Term 3 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('c3ec80a6-d689-568c-83a4-24984cd8c909', 'grade-6-english-first-additional-language-term-3-practice-test-2', 'Grade 6 English First Additional Language Term 3 Practice Test 2', 'CAPS-aligned Grade 6 English FAL Term 3 Test. Worth 40 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 6 English First Additional Language skills for Term 3 . It includes a Reading Comprehension , a Creative Writing task , and a Language Structures and Conventions section.

The Reading Comprehension is based on a fable about a tortoise and a feast in the sky and assesses learners’ ability to understand the text, identify main ideas and details, interpret meaning, recognise lessons in a story, and apply language skills such as synonyms, conjunctions, tense changes, and degrees of comparison within context.

The Creative Writing section requires learners to write a diary entry in the first person about getting lost on a school trip. Learners practise organising ideas, describing events and feelings, using adjectives and adverbs, and writing in full sentences with correct punctuation.

The Language Structures and Conventions section covers a range of grammar and language skills, including adjectives, gerunds, passive voice, negative form, adverbs and their types, nouns, sentence types (simple, compound and complex), root words, verb clauses, prefixes and suffixes, and direct and indirect speech.

A full memorandum and writing rubric are included to support marking and feedback.

Total: 40 marks

Duration: 1 hour

Format: PDF (not editable)', 60.00, 'Grade 6', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['english-first-additional-language','natural-science-and-technology'], 40, '[{"id":"file-5226","label":"Test / Assessment PDF","filename":"grade-6-english-first-additional-language-term-3-practice-test-2.pdf","storageKey":"products/c3ec80a6-d689-568c-83a4-24984cd8c909/file-5226-grade-6-english-first-additional-language-term-3-practice-test-2.pdf"}]'::jsonb, false, true, 5226, '{"title":"Grade 6 English First Additional Language Term 3 Practice Test 2","description":"CAPS-aligned Grade 6 English FAL Term 3 Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('6c31c67a-48f3-5f31-83a0-a2012a7ee8df', 'grade-6-english-first-additional-language-term-3-practice-test', 'Grade 6 English First Additional Language Term 3 Practice Test 1', 'CAPS-aligned Grade 6 English FAL Term 3 Test. Worth 40 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 6 English First Additional Language skills for Term 3 . It includes a Reading Comprehension and a Language Structures and Conventions section.

The Reading Comprehension is based on an informational text about sourdough bread and assesses learners’ ability to understand the text, identify key information, interpret meaning, recognise vocabulary in context, and answer both factual and higher-order questions. Learners also develop comprehension skills such as identifying synonyms and explaining ideas in their own words.

The Language Structures and Conventions section covers a range of grammar and language skills, including punctuation, pronouns, plural forms, conjunctions, verb tenses, adverbs, degrees of comparison, adjectives, collective nouns, direct and indirect speech, and gerunds .

A full memorandum is included to support marking and feedback.

Total: 40 marks

Duration: 1 hour

Format: PDF (not editable)', 60.00, 'Grade 6', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['english-first-additional-language','natural-science-and-technology'], 40, '[{"id":"file-5223","label":"Test / Assessment PDF","filename":"grade-6-english-first-additional-language-term-3-practice-test.pdf","storageKey":"products/6c31c67a-48f3-5f31-83a0-a2012a7ee8df/file-5223-grade-6-english-first-additional-language-term-3-practice-test.pdf"}]'::jsonb, false, true, 5223, '{"title":"Grade 6 English First Additional Language Term 3 Practice Test 1","description":"CAPS-aligned Grade 6 English FAL Term 3 Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('e2975e41-3c2d-57aa-9f45-83917da65a51', 'grade-6-english-home-language-term-3-practice-test-2-2', 'Grade 6 English Home Language Term 3 Practice Test 2', 'CAPS-aligned Grade 6 English HL Term 3 Test. Worth 40 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 6 English Home Language skills for Term 3 . It includes a Reading Comprehension based on a narrative text and a Language section .

The Reading Comprehension assesses learners’ ability to understand a text, identify main ideas and details, interpret meaning, recognise figurative language, and answer both factual and higher-order questions.

The Language section covers a range of grammar and language skills, including conjunctions, direct and indirect speech, adjectives, auxiliary verbs, homophones, pronouns, figures of speech, degrees of comparison, gerunds, active and passive voice, contractions, word stems, sentence types, and adverbial clauses.

A full memorandum is included to support marking and feedback.

40 marks

PDF format – not editable', 60.00, 'Grade 6', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['english-home-language','natural-science-and-technology'], 40, '[{"id":"file-5218","label":"Test / Assessment PDF","filename":"grade-6-english-home-language-term-3-practice-test-2-2.pdf","storageKey":"products/e2975e41-3c2d-57aa-9f45-83917da65a51/file-5218-grade-6-english-home-language-term-3-practice-test-2-2.pdf"}]'::jsonb, false, true, 5218, '{"title":"Grade 6 English Home Language Term 3 Practice Test 2","description":"CAPS-aligned Grade 6 English HL Term 3 Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('bfeceaca-2f55-5007-891b-56aca79111fc', 'grade-6-english-home-language-term-3-practice-test-2', 'Grade 6 English Home Language Term 3 Practice Test 1', 'CAPS-aligned Grade 6 English HL Term 3 Test. Worth 40 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 6 English Home Language skills for Term 3 . It includes a Reading Comprehension based on a narrative text and a Language section .

The Reading Comprehension assesses learners’ ability to understand a text, identify main ideas and details, interpret meaning, recognise figurative language, and answer both factual and higher-order questions.

The Language section covers a range of grammar and language skills, including conjunctions, direct and indirect speech, adjectives, auxiliary verbs, homophones, pronouns, figures of speech, degrees of comparison, gerunds, active and passive voice, contractions, word stems, sentence types, and adverbial clauses.

A full memorandum is included to support marking and feedback.

40 marks

PDF format – not editable', 60.00, 'Grade 6', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['english-home-language','natural-science-and-technology'], 40, '[{"id":"file-5215","label":"Test / Assessment PDF","filename":"grade-6-english-home-language-term-3-practice-test-2.pdf","storageKey":"products/bfeceaca-2f55-5007-891b-56aca79111fc/file-5215-grade-6-english-home-language-term-3-practice-test-2.pdf"}]'::jsonb, false, true, 5215, '{"title":"Grade 6 English Home Language Term 3 Practice Test 1","description":"CAPS-aligned Grade 6 English HL Term 3 Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('a06e1510-1f1a-567b-8b50-3d159e1b105f', 'grade-5-mathematics-term-3-test', 'Grade 5 Mathematics Term 3 Test', 'CAPS-aligned Grade 5 Mathematics Term 3 Test. Worth 40 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 5 Mathematics content for Term 3. It includes a variety of structured questions that assess number sense, geometry, measurement, and problem-solving skills.

The test covers topics such as place value and number ordering , writing numbers in words , 2D shapes and their properties , types of triangles , angles , 3D objects and their faces , and identifying curved and straight sides . Learners also practise measuring lengths , converting between centimetres and millimetres , and solving real-life word problems involving measurement .

Learners interpret diagrams, identify shapes, complete tables, and apply their understanding to practical scenarios such as comparing measurements and solving everyday problems involving length and height.

A full memorandum is included to support marking and feedback.

Total: 40 marks

Duration: 1 hour

Format: PDF (not editable)', 60.00, 'Grade 5', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 40, '[{"id":"file-5179","label":"Test / Assessment PDF","filename":"grade-5-mathematics-term-3-test.pdf","storageKey":"products/a06e1510-1f1a-567b-8b50-3d159e1b105f/file-5179-grade-5-mathematics-term-3-test.pdf"}]'::jsonb, false, true, 5179, '{"title":"Grade 5 Mathematics Term 3 Test","description":"CAPS-aligned Grade 5 Mathematics Term 3 Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('6de7cabc-b26b-56b5-955b-04d9be5684c1', 'grade-5-math-term-3-fractions-test', 'Grade 5 Mathematics Term 3 Fractions Test', 'CAPS-aligned Grade 5 Mathematics Term 3 Fractions Test. Worth 50 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 5 Mathematics content for Term 3, with a focus on fractions and decimals . It includes a variety of question types such as comparing and ordering fractions, equivalent fractions, converting between improper fractions and mixed numbers, simplifying fractions, and solving fraction calculations.

Learners practise adding and subtracting fractions , multiplying fractions by whole numbers , and solving word problems involving fractions and percentages . The test also includes activities using number lines, diagrams, and tables to support conceptual understanding.

In addition, learners work with decimals , including rounding decimals, converting between fractions and decimals, and understanding thousandths and place value relationships. Real-life problem-solving questions help learners apply their understanding in practical contexts.

A full memorandum is included to support marking and feedback.

Total: 50 marks

Duration: 1 hour

Format: PDF (not editable)', 60.00, 'Grade 5', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 50, '[{"id":"file-5176","label":"Test / Assessment PDF","filename":"grade-5-math-term-3-fractions-test.pdf","storageKey":"products/6de7cabc-b26b-56b5-955b-04d9be5684c1/file-5176-grade-5-math-term-3-fractions-test.pdf"}]'::jsonb, false, true, 5176, '{"title":"Grade 5 Mathematics Term 3 Fractions Test","description":"CAPS-aligned Grade 5 Mathematics Term 3 Fractions Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('8f1462ae-458d-5427-b95f-3f40140213d6', 'grade-5-natural-science-technology-term-3-practice-test-2', 'Grade 5 Natural Science & Technology Term 3 Practice Test 2', 'CAPS-aligned Grade 5 Natural Science & Technology Term 3 Practice Test. Worth 30 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 5 Natural Sciences content for Term 3. It includes true or false questions, picture-based questions, matching activities, short answer questions, and scenario-based safety questions.

The test focuses on energy and fuels , electricity , safety , and elastic energy . Learners are assessed on types of fuels, stored energy, heat and light energy, renewable and non-renewable fuels, and everyday uses of energy. Questions also cover batteries and mains electricity , identifying safe and unsafe situations involving electricity, and the correct use of a fire extinguisher.

Learners explore elastic energy and springs , including how energy is stored and released, how springs are used in everyday objects such as trampolines, and the difference between elastic energy and chemical energy. Scenario-based questions require learners to explain why certain situations are dangerous and how to respond safely.

A full memorandum is included to support marking and feedback.

Total: 30 marks

Duration: 45 minutes

Format: PDF (not editable)', 60.00, 'Grade 5', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 30, '[{"id":"file-5173","label":"Test / Assessment PDF","filename":"grade-5-natural-science-technology-term-3-practice-test-2.pdf","storageKey":"products/8f1462ae-458d-5427-b95f-3f40140213d6/file-5173-grade-5-natural-science-technology-term-3-practice-test-2.pdf"}]'::jsonb, false, true, 5173, '{"title":"Grade 5 Natural Science & Technology Term 3 Practice Test 2","description":"CAPS-aligned Grade 5 Natural Science & Technology Term 3 Practice Test. Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('4f6952c5-e4fe-5b37-93cb-2799888f22a2', 'grade-5-nst-term-3-practice-test-1', 'Grade 5 Natural Science & Technology Term 3 Practice Test 1', 'CAPS-aligned Grade 5 Natural Science & Technology Term 3 Practice Test. Worth 30 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 5 Natural Sciences content for Term 3. It includes multiple-choice questions, true or false questions, fill-in-the-blanks, short answer questions, picture-based safety scenarios, and structured written responses.

The test focuses on energy, fuels, electricity, safety, and simple machines . Learners are assessed on topics such as renewable and non-renewable fuels, forms of energy, batteries and mains electricity, burning fuels, elastic materials, and stored energy .

Learners also answer questions about electricity safety in the home , including how to respond to dangerous situations such as fires and damaged electrical cords, and identify everyday uses of springs, elastic materials, wheels and axles, and fuels .

A full memorandum is included to support marking and feedback.

Total: 30 marks

Duration: 45 minutes

Format: PDF (not editable)', 60.00, 'Grade 5', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 30, '[{"id":"file-5170","label":"Test / Assessment PDF","filename":"grade-5-nst-term-3-practice-test-1.pdf","storageKey":"products/4f6952c5-e4fe-5b37-93cb-2799888f22a2/file-5170-grade-5-nst-term-3-practice-test-1.pdf"}]'::jsonb, false, true, 5170, '{"title":"Grade 5 Natural Science & Technology Term 3 Practice Test 1","description":"CAPS-aligned Grade 5 Natural Science & Technology Term 3 Practice Test. Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('5f2f3fc9-1c61-5329-a3d2-9f768e4f5f55', 'grade-5-geography-term-3-practice-test-2', 'Grade 5 Geography Term 3 Practice Test 2', 'CAPS-aligned Grade 5 Geography Term 3 Practice Test. Worth 30 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 5 Social Sciences: Geography content for Term 3. It includes true or false questions, matching activities, fill-in-the-blanks, short answer questions, paragraph responses, and graph interpretation.

The test covers important Geography topics including physical features of South Africa , weather instruments and what they measure , natural vegetation and climate , plant adaptations , and how climate affects vegetation . Learners recall factual knowledge, match concepts, and explain ideas in their own words.

Learners also interpret a rainfall graph for Johannesburg and answer structured questions about rainfall patterns, seasonal changes, and the difference between weather and climate , helping to develop data interpretation and reasoning skills.

A full memorandum is included to support marking and feedback.

Total: 30 marks

Duration: 45 minutes

Format: PDF (not editable)', 60.00, 'Grade 5', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','social-sciences','geography'], 30, '[{"id":"file-5167","label":"Test / Assessment PDF","filename":"grade-5-geography-term-3-practice-test-2.pdf","storageKey":"products/5f2f3fc9-1c61-5329-a3d2-9f768e4f5f55/file-5167-grade-5-geography-term-3-practice-test-2.pdf"}]'::jsonb, false, true, 5167, '{"title":"Grade 5 Geography Term 3 Practice Test 2","description":"CAPS-aligned Grade 5 Geography Term 3 Practice Test. Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('e7e20903-5925-51ae-aff9-62eafafb985d', 'grade-5-geography-term-3-practice-test-1', 'Grade 5 Geography Term 3 Practice Test 1', 'CAPS-aligned Grade 5 Geography Term 3 Practice Test. Worth 30 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 5 Social Sciences: Geography content for Term 3. It includes multiple-choice questions, true or false questions, definitions, map-work, graph interpretation, short answer questions, a table completion activity, and a case study.

The test covers important Geography topics including elements of weather , weather instruments , precipitation , wind direction , and weather maps . Learners interpret a weather map of South Africa and analyse rainfall graphs to answer questions and draw conclusions.

Learners also explore how weather affects people , including impacts on health, farming, tourism, energy, and transport , and complete a table showing both positive and negative effects.

The case study section focuses on savannah grasslands , covering climate, vegetation, wildlife, and human impact , and requires learners to interpret information from a short text and answer structured questions.

A full memorandum is included to support marking and feedback.

Total: 30 marks

Duration: 45 minutes

Format: PDF (not editable)', 60.00, 'Grade 5', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','social-sciences','geography'], 30, '[{"id":"file-5163","label":"Test / Assessment PDF","filename":"grade-5-geography-term-3-practice-test-1.pdf","storageKey":"products/e7e20903-5925-51ae-aff9-62eafafb985d/file-5163-grade-5-geography-term-3-practice-test-1.pdf"}]'::jsonb, false, true, 5163, '{"title":"Grade 5 Geography Term 3 Practice Test 1","description":"CAPS-aligned Grade 5 Geography Term 3 Practice Test. Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('e4dc22a3-af7f-52c1-b1a6-ea8ac76f61f9', 'grade-5-history-term-3-practice-test-2', 'Grade 5 History Term 3 Practice Test 2', 'CAPS-aligned Grade 5 History Term 3 Practice Test. Worth 30 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 5 Social Sciences: History content for Term 3. It includes source-based questions, short answer questions, paragraph writing, matching activities, and visual interpretation tasks.

The test focuses on Ancient Egypt , with particular emphasis on the importance of the Nile River , farming and flooding , the social structure of Egyptian society , Egyptian science and medicine , hieroglyphics , and the discovery of Tutankhamun’s tomb . Learners are required to recall factual knowledge, interpret maps and pictures, explain historical ideas in their own words, and apply their understanding in short written responses.

Learners analyse written sources about the Nile River, interpret a map showing countries through which the Nile flows , identify the social pyramid of ancient Egypt , and answer questions based on images of Egyptian buildings and artefacts. The final question requires learners to write a short paragraph explaining how the discovery of Tutankhamun’s tomb helped historians understand daily life, religion, and social structure in ancient Egypt.

A full memorandum is included to support marking and feedback.

Total: 30 marks

Duration: 1 hour

Format: PDF (not editable)', 60.00, 'Grade 5', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','social-sciences','history'], 30, '[{"id":"file-5161","label":"Test / Assessment PDF","filename":"grade-5-history-term-3-practice-test-2.pdf","storageKey":"products/e4dc22a3-af7f-52c1-b1a6-ea8ac76f61f9/file-5161-grade-5-history-term-3-practice-test-2.pdf"}]'::jsonb, false, true, 5161, '{"title":"Grade 5 History Term 3 Practice Test 2","description":"CAPS-aligned Grade 5 History Term 3 Practice Test. Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('305b9917-72b0-51b6-8991-ad5682b1a1e2', 'grade-5-history-term-3-practice-test-1', 'Grade 5 History Term 3 Practice Test 1', 'CAPS-aligned Grade 5 History Term 3 Practice Test. Worth 30 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 5 Social Sciences: History content for Term 3. It includes multiple-choice questions, true or false questions, matching columns, short answer questions, and a visual source-based question.

The test focuses on Ancient Egypt and covers topics such as the importance of the Nile River, the social structure of ancient Egyptian society, pyramids and burial practices, hieroglyphics, medicine and mathematics in ancient Egypt, and the discovery of Tutankhamun’s tomb . Learners are required to recall factual knowledge, explain concepts in their own words, and interpret historical sources.

The source-based section requires learners to identify and interpret artefacts from ancient Egypt , explaining what they are and what they were used for, helping learners develop observation and historical interpretation skills.

A full memorandum is included to support marking and feedback.

Total: 30 marks

Duration: 1 hour

Format: PDF (not editable)', 60.00, 'Grade 5', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology','social-sciences','history'], 30, '[{"id":"file-5158","label":"Test / Assessment PDF","filename":"grade-5-history-term-3-practice-test-1.pdf","storageKey":"products/305b9917-72b0-51b6-8991-ad5682b1a1e2/file-5158-grade-5-history-term-3-practice-test-1.pdf"}]'::jsonb, false, true, 5158, '{"title":"Grade 5 History Term 3 Practice Test 1","description":"CAPS-aligned Grade 5 History Term 3 Practice Test. Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('b3316400-f1cd-5cb1-a2ff-bc6c749fd850', 'grade-5-life-skills-psw-term-3-assessment', 'Grade 5 Life Skills PSW Term 3 Assessment', 'CAPS-aligned Grade 5 Life Skills PSW Term 3 Assessment. Worth 30 marks , includes full memo. Instant PDF download', 'This assessment evaluates the key Grade 5 Life Skills: Personal and Social Well-being (PSW) content for Term 3. It includes true or false questions, picture-based questions, short answer questions, a short reading passage, interpreting a food label, and a case study with longer responses.

The assessment covers important PSW topics including safe use of medication , dangerous household products , the importance of water and saving water , reading and interpreting food labels , balanced diets and the food pyramid , and healthy lifestyle choices . Learners are required to recall factual knowledge, interpret information from texts and visuals, apply knowledge to real-life situations, and explain their thinking in their own words.

A case study section assesses learners’ understanding of healthy eating, physical activity, and making responsible choices , while the written task requires learners to communicate practical tips for saving water in everyday life.

A full memorandum is included to support accurate marking and feedback.

Total: 30 marks

Duration: 45 minutes

Format: PDF (not editable)', 60.00, 'Grade 5', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['life-skills','natural-science-and-technology'], 30, '[{"id":"file-5154","label":"Test / Assessment PDF","filename":"grade-5-life-skills-psw-term-3-assessment.pdf","storageKey":"products/b3316400-f1cd-5cb1-a2ff-bc6c749fd850/file-5154-grade-5-life-skills-psw-term-3-assessment.pdf"}]'::jsonb, false, true, 5154, '{"title":"Grade 5 Life Skills PSW Term 3 Assessment","description":"CAPS-aligned Grade 5 Life Skills PSW Term 3 Assessment. Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('39b65e8d-375c-559c-993b-1928d98f6db6', 'grade-5-life-skills-term-3-practice-test', 'Grade 5 Life Skills PSW Term 3 Practice Test', 'CAPS-aligned Grade 5 Life Skills PSW Term 3 Practice Test. Worth 30 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 5 Life Skills: Personal and Social Well-being (PSW) content for Term 3. It includes multiple-choice questions, true or false questions, short answer questions, sentence completion, and a short comprehension passage.

The test covers important PSW topics including festivals and customs in different cultures and religions , safety measures at home , water as a basic need , and healthy eating for children . Learners are required to recall factual knowledge, interpret a short reading passage, explain ideas in their own words, and apply their understanding to real-life situations.

The reading section focuses on the importance of water for health, farming, and daily life , and how to protect water sources . The health section includes questions about balanced diets, nutrients, and healthy food choices . Safety questions assess learners’ understanding of fire safety, harmful household products, and preventing accidents at home .

A full memorandum is included to support marking and feedback.

Total: 30 marks

Duration: 1 hour

Format: PDF (not editable)', 60.00, 'Grade 5', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['life-skills','natural-science-and-technology'], 30, '[{"id":"file-5152","label":"Test / Assessment PDF","filename":"grade-5-life-skills-term-3-practice-test.pdf","storageKey":"products/39b65e8d-375c-559c-993b-1928d98f6db6/file-5152-grade-5-life-skills-term-3-practice-test.pdf"}]'::jsonb, false, true, 5152, '{"title":"Grade 5 Life Skills PSW Term 3 Practice Test","description":"CAPS-aligned Grade 5 Life Skills PSW Term 3 Practice Test. Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('9f50e8f4-5a9a-52cd-9da9-50b7de189924', 'grade-5-afrikaans-first-additional-language-term-3-practice-test-2', 'Grade 5 Afrikaans First Additional Language Term 3 Practice Test 2', 'CAPS-aligned Grade 5 Afrikaans First Additional Language Term 3 Practice Test. Worth 40 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 5 Afrikaans First Additional Language skills for Term 3. It includes a Begripstoets (Reading Comprehension) , a Kreatiewe Skryfwerk (Creative Writing) task, and a Taalwerk (Language) section.

The Begripstoets (Reading Comprehension) is based on a short drama titled Die Verborge Sleutel and assesses learners’ understanding of characters, theme and message, vocabulary in context, direct speech, plural forms, and answering both factual and inferential questions.

The Kreatiewe Skryfwerk (Creative Writing) section requires learners to write a paragraph of 8–10 sentences about a rainy day, using past tense, descriptive language, and correct punctuation. A clear rubric is included to guide writing and marking.

The Taalwerk (Language) section covers a range of grammar and language skills, including basisvorme, sinonieme en antonieme, trappe van vergelyking, homonieme, voornaamwoorde, ontkennende vorm, indirekte rede, voorsetsels, sinsoorte, onderwerp en gesegde, afkortings, idiome, woordorde, figuurlike taal , and sentence construction.

A full memorandum and writing rubric are included to support marking and feedback.

Total: 40 marks

Duration: 1 hour

Format: PDF (not editable)', 60.00, 'Grade 5', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['afrikaans-first-additional-language','natural-science-and-technology'], 40, '[{"id":"file-5149","label":"Test / Assessment PDF","filename":"grade-5-afrikaans-first-additional-language-term-3-practice-test-2.pdf","storageKey":"products/9f50e8f4-5a9a-52cd-9da9-50b7de189924/file-5149-grade-5-afrikaans-first-additional-language-term-3-practice-test-2.pdf"}]'::jsonb, false, true, 5149, '{"title":"Grade 5 Afrikaans First Additional Language Term 3 Practice Test 2","description":"CAPS-aligned Grade 5 Afrikaans First Additional Language Term 3 Practice Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('a37bbb56-2093-543c-9188-2c29b79728a2', 'grade-5-afrikaans-first-additional-language-term-3-practice-test-1', 'Grade 5 Afrikaans First Additional Language Term 3 Practice Test 1', 'CAPS-aligned Grade 5 Afrikaans First Additional Language Term 3 Practice Test. Worth 40 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 5 Afrikaans First Additional Language skills for Term 3. It includes a Begripstoets (Reading Comprehension) , Visuele Teks (Visual Literacy) , Opsomming (Summary Writing) , and Taalwerk (Language) section.

The Begripstoets (Reading Comprehension) is based on an informational text about Wimbledon and assesses learners’ understanding of the text, vocabulary in context, punctuation, antonyms, and answering both factual and higher-order questions.

The Visuele Teks (Visual Literacy) section requires learners to interpret a graph and a school activity programme , identify information, and answer questions that assess observation, reasoning, and understanding of information presented visually.

The Opsomming (Summary Writing) section requires learners to summarise key information from a text in their own words using a word limit.

The Taalwerk (Language) section covers a range of grammar and language skills, including trappe van vergelyking, meervoude, werkwoorde, verkleinwoorde, indirekte rede, samestellings, lidwoorde, and toekomende tyd .

A full memorandum and rubric are included to support marking and feedback.

Total: 40 marks

Duration: 1 hour

Format: PDF (not editable)', 60.00, 'Grade 5', 'Term 3', '2026', 'Individual Resource', 'Summary', array['afrikaans-first-additional-language','natural-science-and-technology'], 40, '[{"id":"file-5145","label":"Summary PDF","filename":"grade-5-afrikaans-first-additional-language-term-3-practice-test-1.pdf","storageKey":"products/a37bbb56-2093-543c-9188-2c29b79728a2/file-5145-grade-5-afrikaans-first-additional-language-term-3-practice-test-1.pdf"}]'::jsonb, false, true, 5145, '{"title":"Grade 5 Afrikaans First Additional Language Term 3 Practice Test 1","description":"CAPS-aligned Grade 5 Afrikaans First Additional Language Term 3 Practice Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('8d1edbcd-9b0a-52b7-9c00-4e2883528e44', 'grade-5-english-first-additional-language-term-3-practice-test-3', 'Grade 5 English HL & FAL Term 3 Practice Test 3', 'CAPS-aligned Grade 5 English First Additional Language Term 3 Practice Test. Worth 50 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 5 English HL and FAL skills for Term 3. It includes a Reading Comprehension , a Creative Writing task, and a Language Structures and Conventions section.

The Reading Comprehension is based on the story The Broken Pencil and assesses learners’ understanding of the text, characters and events, vocabulary in context, identifying adjectives and verbs, articles, subject identification, and rewriting sentences in different tenses. Learners answer both factual and higher-order questions that require explanation and personal response.

The Creative Writing section requires learners to write a diary entry in the first person, describing feelings, events, and what was learned from the experience. A clear rubric is included to support structured writing and marking.

The Language Structures and Conventions section covers a range of grammar and language skills, including nouns, adjectives, pronouns, verb tenses (past and future), punctuation, direct and indirect speech, sentence types, conjunctions, idioms, proverbs, articles, and figures of speech (simile).

A full memorandum and writing rubric are included to support marking and feedback.

Total: 50 marks

Duration: 1 hour

Format: PDF (not editable)', 60.00, 'Grade 5', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['english-home-language','english-first-additional-language','natural-science-and-technology'], 50, '[{"id":"file-5142","label":"Test / Assessment PDF","filename":"grade-5-english-first-additional-language-term-3-practice-test-3.pdf","storageKey":"products/8d1edbcd-9b0a-52b7-9c00-4e2883528e44/file-5142-grade-5-english-first-additional-language-term-3-practice-test-3.pdf"}]'::jsonb, false, true, 5142, '{"title":"Grade 5 English HL & FAL Term 3 Practice Test 3","description":"CAPS-aligned Grade 5 English First Additional Language Term 3 Practice Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('d09159e0-5d61-518e-a219-e9ffc3a27ff0', 'grade-5-english-first-additional-language-term-3-practice-test-2', 'Grade 5 English First Additional Language Term 3 Practice Test 2', 'CAPS-aligned Grade 5 English First Additional Language Term 3 Practice Test. Worth 50 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 5 English First Additional Language skills for Term 3. It includes a Reading Comprehension , a Visual Literacy section based on an advertisement, and a Language Structures and Conventions section.

The Reading Comprehension is based on an informational text about the importance of storytelling and assesses learners’ understanding of the text, vocabulary in context, synonyms and antonyms, identifying adjectives and conjunctions, and answering both factual and higher-order questions that require explanation and interpretation.

The Visual Literacy section requires learners to interpret an advertisement, identify information, and answer questions that assess observation, reasoning, and understanding of purpose and audience.

The Language Structures and Conventions section covers a range of grammar and language skills, including punctuation, verb tenses (past, present and future), comparative and superlative forms, conjunctions, plural forms, proverbs, prepositions, subject–verb agreement, infinitive verbs, literary devices (simile, metaphor, personification, hyperbole and alliteration), and direct and indirect speech .

A full memorandum is included to support marking and feedback.

Total: 50 marks

Duration: 1 hour

Format: PDF (not editable)', 60.00, 'Grade 5', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['english-first-additional-language','natural-science-and-technology'], 50, '[{"id":"file-5138","label":"Test / Assessment PDF","filename":"grade-5-english-first-additional-language-term-3-practice-test-2.pdf","storageKey":"products/d09159e0-5d61-518e-a219-e9ffc3a27ff0/file-5138-grade-5-english-first-additional-language-term-3-practice-test-2.pdf"}]'::jsonb, false, true, 5138, '{"title":"Grade 5 English First Additional Language Term 3 Practice Test 2","description":"CAPS-aligned Grade 5 English First Additional Language Term 3 Practice Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('c7c0f330-f4ad-5572-bf79-94c2b3fdfcd0', 'grade-5-english-fal-term-3-practice-test-1', 'Grade 5 English First Additional Language Term 3 Practice Test 1', 'CAPS-aligned Grade 5 English First Additional Language Term 3 Practice Test 1. Worth 40 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 5 English First Additional Language skills for Term 3. It includes a Reading Comprehension based on an informational text and a Language in Context section.

The Reading Comprehension is based on a text about the first PlayStation and assesses learners’ understanding of the text, vocabulary in context, true or false questions, antonyms, proper nouns, pronouns, adjectives, and rewriting sentences in different tenses. Learners answer both factual and higher-order questions that require explanation and interpretation.

The Language in Context section covers a range of grammar and language skills, including direct and indirect speech, figures of speech (hyperbole and simile), conjunctions, punctuation, verb tenses, and identifying adverbs .

A full memorandum is included to support marking and feedback.

Total: 40 marks

Duration: 1 hour

Format: PDF (not editable)', 60.00, 'Grade 5', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['english-first-additional-language','natural-science-and-technology'], 40, '[{"id":"file-5136","label":"Test / Assessment PDF","filename":"grade-5-english-fal-term-3-practice-test-1.pdf","storageKey":"products/c7c0f330-f4ad-5572-bf79-94c2b3fdfcd0/file-5136-grade-5-english-fal-term-3-practice-test-1.pdf"}]'::jsonb, false, true, 5136, '{"title":"Grade 5 English First Additional Language Term 3 Practice Test 1","description":"CAPS-aligned Grade 5 English First Additional Language Term 3 Practice Test 1. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('7f818113-33cb-546b-b9c2-1adea779e2d2', 'grade-5-english-hl-term-3-practice-test-2', 'Grade 5 English HL Term 3 Practice Test 2', 'CAPS-aligned Grade 5 English Home Language Term 3 Practice Test. Worth 50 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 5 English Home Language skills for Term 3. It includes a Reading Comprehension based on a narrative text, a Creative Writing task, and a Language Structures and Conventions section.

The Reading Comprehension is based on the story The Broken Pencil and assesses learners’ understanding of characters, events, vocabulary in context, identifying adjectives, sentence structure, figurative language, verb tenses, subject and predicate, and answering both factual and higher-order questions that require explanation and personal response.

The Creative Writing section requires learners to write a diary entry in the first person, describing feelings, events, and lessons learned. Learners are guided to structure their writing clearly and use descriptive language, correct punctuation, and past tense.

The Language Structures and Conventions section covers a range of grammar and language skills, including nouns, adjectives, pronouns, verb tenses (past and future), punctuation, direct and indirect speech, sentence types, figures of speech (simile), idioms, proverbs, and articles.

A full memorandum and writing rubric are included to support marking and feedback.

Total: 50 marks

Duration: 1 hour

Format: PDF (not editable)', 60.00, 'Grade 5', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['english-home-language','natural-science-and-technology'], 50, '[{"id":"file-5133","label":"Test / Assessment PDF","filename":"grade-5-english-hl-term-3-practice-test-2.pdf","storageKey":"products/7f818113-33cb-546b-b9c2-1adea779e2d2/file-5133-grade-5-english-hl-term-3-practice-test-2.pdf"}]'::jsonb, false, true, 5133, '{"title":"Grade 5 English HL Term 3 Practice Test 2","description":"CAPS-aligned Grade 5 English Home Language Term 3 Practice Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('e07ae540-3ece-578c-aced-7c3d84851dda', 'grade-5-english-hl-term-3-practice-test-1', 'Grade 5 English HL Term 3 Practice Test 1', 'CAPS-aligned Grade 5 English Home Language Term 3 Practice Test 1. Worth 40 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 5 English Home Language skills for Term 3. It includes a Reading Comprehension based on an informational text, and a Language in Context section.

The Reading Comprehension is based on a text about the invention of the first PlayStation and assesses learners’ understanding of the text, vocabulary in context, true or false questions, short written explanations, antonyms, parts of speech (pronouns and adjectives), proper nouns, and rewriting sentences in different tenses. Learners answer both factual and higher-order questions that require interpretation and explanation.

The Language in Context section covers a range of grammar and language skills, including direct and indirect speech, figures of speech (hyperbole and simile), conjunctions, punctuation, verb tenses, and adverbs .

A full memorandum is included to support marking and feedback.

Total: 40 marks

Duration: 1 hour

Format: PDF (not editable)', 60.00, 'Grade 5', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['english-home-language','natural-science-and-technology'], 40, '[{"id":"file-5090","label":"Test / Assessment PDF","filename":"grade-5-english-hl-term-3-practice-test-1.pdf","storageKey":"products/e07ae540-3ece-578c-aced-7c3d84851dda/file-5090-grade-5-english-hl-term-3-practice-test-1.pdf"}]'::jsonb, false, true, 5090, '{"title":"Grade 5 English HL Term 3 Practice Test 1","description":"CAPS-aligned Grade 5 English Home Language Term 3 Practice Test 1. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('9e8698fe-e189-5ad5-abdd-14dcef8deffa', 'grade-4-mathematics-term-3-practice-test-2', 'Grade 4 Mathematics Term 3 Practice Test 2', 'CAPS-aligned Grade 4 Mathematics Term 3 Practice Test. Worth 50 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 4 Mathematics content for Term 3. It includes structured questions that assess conceptual understanding, practical skills, and problem-solving.

The test covers the following Mathematics topics:

- Length – estimating, measuring with a ruler, converting between millimetres, centimetres, metres and kilometres, and solving word problems involving distance

- Symmetry – identifying and drawing lines of symmetry on 2D shapes

- Time – reading and writing analogue and digital time, writing time in words, and solving real-life word problems involving time

- Common fractions – recognising fractions, sequencing fractions, fraction calculations, comparing fractions, and interpreting fractions using pictures

- Properties of 2D shapes – naming shapes, drawing basic polygons, and identifying curved and straight lines

Learners are required to show all working, interpret diagrams and clocks, convert units, and solve real-life word problems. The test includes a variety of question types such as estimation, measurement, diagram labelling, calculations, short answer questions, and problem-solving tasks.

A full memorandum is included to support marking and feedback.

Total: 50 marks

Duration: 1 hour

Format: PDF (not editable)', 60.00, 'Grade 4', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 50, '[{"id":"file-5087","label":"Test / Assessment PDF","filename":"grade-4-mathematics-term-3-practice-test-2.pdf","storageKey":"products/9e8698fe-e189-5ad5-abdd-14dcef8deffa/file-5087-grade-4-mathematics-term-3-practice-test-2.pdf"}]'::jsonb, false, true, 5087, '{"title":"Grade 4 Mathematics Term 3 Practice Test 2","description":"CAPS-aligned Grade 4 Mathematics Term 3 Practice Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('75e38d2a-16bb-57f8-ab97-9eec70cecada', 'grade-4-mathematics-term-3-practice-test', 'Grade 4 Mathematics Term 3 Practice Test', 'CAPS-aligned Grade 4 Mathematics Term 3 Practice Test. Worth 50 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 4 Mathematics content for Term 3. It includes structured questions that assess both conceptual understanding and problem-solving skills.

The test covers the following Mathematics topics:

- Common fractions – comparing fractions, equivalent fractions, fraction calculations, and word problems involving fractions

- Time – seconds, minutes, hours, weeks, reading analogue and digital clocks, calendars, and interpreting time in context

- Length – converting between millimetres, centimetres, metres and kilometres, ordering measurements, and solving word problems

- Properties of 2D shapes – identifying shapes, number of sides, polygons, curved and straight lines, and drawing basic shapes

Learners are required to show all working, interpret visual information, and solve real-life word problems. The test includes a variety of question types such as multiple choice, fill-in-the-blanks, diagram interpretation, short answer questions, and calculations.

A full memorandum is included to support marking and feedback.

Total: 50 marks

Duration: 1 hour

Format: PDF (not editable)', 60.00, 'Grade 4', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 50, '[{"id":"file-5083","label":"Test / Assessment PDF","filename":"grade-4-mathematics-term-3-practice-test.pdf","storageKey":"products/75e38d2a-16bb-57f8-ab97-9eec70cecada/file-5083-grade-4-mathematics-term-3-practice-test.pdf"}]'::jsonb, false, true, 5083, '{"title":"Grade 4 Mathematics Term 3 Practice Test","description":"CAPS-aligned Grade 4 Mathematics Term 3 Practice Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('0cfefd6f-6699-518e-a432-e1714672aec7', 'grade-4-natural-science-technology-term-3-practice-test', 'Grade 4 Natural Science & Technology Term 3 Practice Test', 'CAPS-aligned Grade 4 Natural Science & Technology Term 3 Practice Test. Worth 40 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 4 Natural Science & Technology content for Term 3. It includes multiple-choice questions, true or false questions, fill-in-the-missing-words, short answer questions, diagram-based questions, and an extended response section.

The test focuses on movement and energy and sound . Learners are assessed on concepts such as force, systems in motion, circular and back-and-forth movement, vibrations, how sound is produced, how sound travels, pitch (high and low sounds), materials that absorb sound, and the role of the ear and eardrum in hearing. Learners also interpret diagrams and draw a labelled diagram to show how vibrations create sound waves.

A full memorandum is included to support marking and feedback.

Total: 40 marks

Duration: 1 hour

Format: PDF (not editable)', 60.00, 'Grade 4', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 40, '[{"id":"file-5081","label":"Test / Assessment PDF","filename":"grade-4-natural-science-technology-term-3-practice-test.pdf","storageKey":"products/0cfefd6f-6699-518e-a432-e1714672aec7/file-5081-grade-4-natural-science-technology-term-3-practice-test.pdf"}]'::jsonb, false, true, 5081, '{"title":"Grade 4 Natural Science & Technology Term 3 Practice Test","description":"CAPS-aligned Grade 4 Natural Science & Technology Term 3 Practice Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('69646b1e-d426-5a9d-8927-18de9c0dd06c', 'grade-4-nst-term-3-practice-tests', 'Grade 4 Natural Science & Technology Term 3 Practice Tests', 'CAPS-aligned Grade 4 Natural Science & Technology Term 3 Practice Tests. Worth 15 marks each , includes full memo. Instant PDF download', 'This resource includes three CAPS-aligned Grade 4 Natural Science & Technology practice tests for Term 3 , designed to assess learners’ understanding of key concepts through short, focused assessments. Each test is marked out of 15 marks and includes a full memorandum.

Test 1 focuses on Energy and Energy Transfer and Energy Around Us . Learners are assessed on the meaning of energy, sources of energy, energy chains, types of energy, and how energy is transferred using diagrams and practical examples.

Test 2 focuses on Movement and Energy in a System and Energy and Sound . Learners explore vibrations, sound production, noise pollution, musical instruments, parts of the ear, and how humans hear sound. Diagram labelling and explanation questions are included.

Test 3 is a revision test covering all Term 3 topics . It assesses learners’ understanding of energy, movement, sound, and energy transfer through matching questions, short explanations, diagram drawing and labelling, and real-life applications.

The tests include a variety of question types such as multiple choice, true or false, matching, fill-in-the-blanks, diagram interpretation, and short written responses. They are clearly structured with instructions and mark allocation and assess lower-, middle- and higher-order thinking skills.

A full memorandum for each test is included to support marking and feedback.

Total: 3 tests (15 marks each)

Format: PDF (not editable)', 60.00, 'Grade 4', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 15, '[{"id":"file-5077","label":"Test / Assessment PDF","filename":"grade-4-nst-term-3-practice-tests.pdf","storageKey":"products/69646b1e-d426-5a9d-8927-18de9c0dd06c/file-5077-grade-4-nst-term-3-practice-tests.pdf"}]'::jsonb, false, true, 5077, '{"title":"Grade 4 Natural Science & Technology Term 3 Practice Tests","description":"CAPS-aligned Grade 4 Natural Science & Technology Term 3 Practice Tests. Worth 15 marks each , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('aa856112-3c06-5f1e-97b2-dea6805f6ce5', 'grade-4-geography-term-3-practice-test-2', 'Grade 4 Geography Term 3 Practice Test 2', 'CAPS-aligned Grade 4 Geography Term 3 Practice Test. Worth 25 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 4 Geography content for Term 3. It includes fill-in-the-missing-words questions, classification activities, picture-based source questions, short answer questions, a case study, and an extended paragraph writing task.

The test focuses on farming and food production . Learners explore concepts such as irrigation , soil quality , weather and its impact on crops , subsistence farming and commercial farming , as well as foods from animals and plants . Learners are required to interpret pictures, classify information, explain different types of farming, and apply their knowledge to a real-life case study.

The extended writing task requires learners to write a short paragraph explaining why farming is important for people living in both rural and urban areas , with reference to food, jobs, and products from farms.

A full memorandum is included to support marking and feedback.

Total: 25 marks

Duration: 45 minutes

Format: PDF (not editable)', 60.00, 'Grade 4', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','geography'], 25, '[{"id":"file-5075","label":"Test / Assessment PDF","filename":"grade-4-geography-term-3-practice-test-2.pdf","storageKey":"products/aa856112-3c06-5f1e-97b2-dea6805f6ce5/file-5075-grade-4-geography-term-3-practice-test-2.pdf"}]'::jsonb, false, true, 5075, '{"title":"Grade 4 Geography Term 3 Practice Test 2","description":"CAPS-aligned Grade 4 Geography Term 3 Practice Test. Worth 25 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('f5890755-eaab-5946-a145-00ae9a2a60e0', 'grade-4-geography-term-3-practice-test', 'Grade 4 Geography Term 3 Practice Test', 'CAPS-aligned Grade 4 Geography Term 3 Practice Test. Worth 25 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 4 Geography content for Term 3. It includes fill-in-the-missing-words questions, picture-based source questions, short answer questions, a case study, and map-work questions.

The test focuses on farming and food production . Learners explore types of farming such as commercial farming and subsistence farming , crops grown in different provinces of South Africa, and ways people obtain food in rural and urban areas. The test also covers livestock farming , food products from animals and plants, and interpreting a map of South Africa’s livestock farming to answer geographical questions.

Learners are required to recall factual knowledge, compare different types of farming, interpret visual sources and maps, explain ideas in their own words, and apply their understanding to real-life examples.

A full memorandum is included to support marking and feedback.

Total: 25 marks

Duration: 45 minutes

Format: PDF (not editable)', 60.00, 'Grade 4', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','geography'], 25, '[{"id":"file-5072","label":"Test / Assessment PDF","filename":"grade-4-geography-term-3-practice-test.pdf","storageKey":"products/f5890755-eaab-5946-a145-00ae9a2a60e0/file-5072-grade-4-geography-term-3-practice-test.pdf"}]'::jsonb, false, true, 5072, '{"title":"Grade 4 Geography Term 3 Practice Test","description":"CAPS-aligned Grade 4 Geography Term 3 Practice Test. Worth 25 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('35fbba70-efd6-5484-ba85-c536f90eeb2b', 'grade-4-history-term-3-practice-test-2', 'Grade 4 History Term 3 Practice Test 2', 'CAPS-aligned Grade 4 History Term 3 Practice Test. Worth 25 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 4 History content for Term 3. It includes short answer questions, sentence completion, matching activities, picture-based source questions, and extended written responses.

The test focuses on transport in the past and present . Learners explore different types of transport used long ago (such as ox-wagons, boats and animals), modern transport, and the main differences between past and present transport. Topics include the importance of rivers for transport, land, water and air transport, early flying machines, and reasons why travel took longer in the past.

Learners are required to recall factual knowledge, match types of transport to descriptions, interpret a visual source, explain historical changes over time, and write short paragraphs expressing their own ideas and opinions.

A full memorandum is included to support marking and feedback.

Total: 25 marks

Duration: 45 minutes

Format: PDF (not editable)', 60.00, 'Grade 4', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','history'], 25, '[{"id":"file-5068","label":"Test / Assessment PDF","filename":"grade-4-history-term-3-practice-test-2.pdf","storageKey":"products/35fbba70-efd6-5484-ba85-c536f90eeb2b/file-5068-grade-4-history-term-3-practice-test-2.pdf"}]'::jsonb, false, true, 5068, '{"title":"Grade 4 History Term 3 Practice Test 2","description":"CAPS-aligned Grade 4 History Term 3 Practice Test. Worth 25 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('eba33296-910c-52f5-b842-e7384c1ba102', 'grade-4-history-term-3-practice-test', 'Grade 4 History Term 3 Practice Test', 'CAPS-aligned Grade 4 History Term 3 Practice Test. Worth 25 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 4 History content for Term 3. It includes multiple-choice questions, true or false questions, short answer questions, picture-based source questions, and classification activities.

The test focuses on transport in the past and present . Learners explore different modes of transport (land, water and air), early forms of transportation, the invention and importance of the wheel, the use of animals for transport, and how transport has improved over time. The test also includes questions on famous historical inventions such as the Benz Patent-Motorwagen and the Model T Ford , as well as signs and signals used in transportation.

Learners are required to recall factual knowledge, interpret visual sources, explain changes over time, and classify types of transport correctly.

A full memorandum is included to support marking and feedback.

Total: 25 marks

Duration: 45 minutes

Format: PDF (not editable)', 60.00, 'Grade 4', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','history'], 25, '[{"id":"file-5066","label":"Test / Assessment PDF","filename":"grade-4-history-term-3-practice-test.pdf","storageKey":"products/eba33296-910c-52f5-b842-e7384c1ba102/file-5066-grade-4-history-term-3-practice-test.pdf"}]'::jsonb, false, true, 5066, '{"title":"Grade 4 History Term 3 Practice Test","description":"CAPS-aligned Grade 4 History Term 3 Practice Test. Worth 25 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('b6353d5a-1b3a-5de7-8c11-f0073d98206d', 'grade-4-life-skills-psw-term-3-assessment', 'Grade 4 Life Skills PSW Term 3 Assessment', 'CAPS-aligned Grade 4 Life Skills PSW Term 3 Assessment. Worth 30 marks , includes full memo. Instant PDF download', 'This assessment evaluates the key Grade 4 Life Skills: Personal and Social Well-being (PSW) content for Term 3. It is structured as a formal assessment and includes short questions and longer written responses across two sections.

Section A (Short Questions) includes multiple-choice questions, true or false questions, matching activities, and fill-in-the-blanks.

Section B (Long Questions) requires learners to answer in full sentences and apply their understanding to real-life situations and short case studies.

The assessment covers important PSW topics including cultures and cultural groups in South Africa , moral lessons , religions and religious symbols , places of worship , traditional foods , respect for diversity , and safety awareness , with a specific focus on water safety . Learners are required to recall factual knowledge, explain ideas in their own words, and show understanding through written responses.

A full memorandum is included to support accurate marking and feedback.

Total: 30 marks

Duration: 45 minutes

Format: PDF (not editable)', 60.00, 'Grade 4', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['life-skills','natural-science-and-technology'], 30, '[{"id":"file-5062","label":"Test / Assessment PDF","filename":"grade-4-life-skills-psw-term-3-assessment.pdf","storageKey":"products/b6353d5a-1b3a-5de7-8c11-f0073d98206d/file-5062-grade-4-life-skills-psw-term-3-assessment.pdf"}]'::jsonb, false, true, 5062, '{"title":"Grade 4 Life Skills PSW Term 3 Assessment","description":"CAPS-aligned Grade 4 Life Skills PSW Term 3 Assessment. Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('59977c67-099b-5377-82b0-c94b9f218f4e', 'grade-4-life-skills-term-3-practice-test', 'Grade 4 Life Skills PSW Term 3 Practice Test', 'CAPS-aligned Grade 4 Life Skills PSW Term 3 Practice Test. Worth 30 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 4 Life Skills: Personal and Social Well-being (PSW) content for Term 3. It includes True or False questions , matching activities , fill-in-the-blanks , and a case study–based comprehension section .

The test covers important PSW topics including cultures and cultural traditions , moral stories , cultural foods , religions and religious symbols , places of worship , and respect for different belief systems . Learners are required to identify and match cultures and religions, recall key facts, and show understanding of diversity and tolerance.

The case study section focuses on safety awareness , specifically water safety at a public pool . Learners answer questions that assess decision-making, responsibility, identifying unsafe behaviour, and explaining how to prevent accidents in real-life situations.

A full memorandum is included to support marking and feedback.

Total: 30 marks

Duration: 1 hour

Format: PDF (not editable)', 60.00, 'Grade 4', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['life-skills','natural-science-and-technology'], 30, '[{"id":"file-5059","label":"Test / Assessment PDF","filename":"grade-4-life-skills-term-3-practice-test.pdf","storageKey":"products/59977c67-099b-5377-82b0-c94b9f218f4e/file-5059-grade-4-life-skills-term-3-practice-test.pdf"}]'::jsonb, false, true, 5059, '{"title":"Grade 4 Life Skills PSW Term 3 Practice Test","description":"CAPS-aligned Grade 4 Life Skills PSW Term 3 Practice Test. Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('1e3ae312-25cc-5cbf-8f18-7ea7e10a1dbc', 'grade-4-afrikaans-first-additional-language-term-3-practice-test-2', 'Grade 4 Afrikaans First Additional Language Term 3 Practice Test 2', 'CAPS-aligned Grade 4 Afrikaans First Additional Language Term 3 Practice Test 2. Worth 40 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 4 Afrikaans First Additional Language skills for Term 3. It includes a Begripstoets (Reading Comprehension) , a Kreatiewe Skryfwerk (Creative Writing) task, and a Taalstrukture en Konvensies (Language Structures and Conventions) section.

The Begripstoets (Reading Comprehension) is based on a narrative text and assesses learners’ understanding of the story, characters and events, vocabulary in context, sequencing, synonyms, plural forms, diminutives, and answering questions in full sentences.

The Kreatiewe Skryfwerk (Creative Writing) task requires learners to write a short imaginative story of approximately 80–100 words. Learners are guided to structure their writing with a clear beginning, middle and end, and to use descriptive language, correct punctuation and capital letters. A clear writing rubric is included.

The Taalstrukture en Konvensies (Language Structures and Conventions) section covers key language skills including degrees of comparison, plural forms, prepositions, past tense, adjectives, synonyms and antonyms, negative form, direct and indirect speech, sentence types (simple and compound), and correct punctuation.

A full memorandum and writing rubric are included to support marking and feedback.

Total: 40 marks

Format: PDF (not editable)', 60.00, 'Grade 4', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['afrikaans-first-additional-language','natural-science-and-technology'], 40, '[{"id":"file-5057","label":"Test / Assessment PDF","filename":"grade-4-afrikaans-first-additional-language-term-3-practice-test-2.pdf","storageKey":"products/1e3ae312-25cc-5cbf-8f18-7ea7e10a1dbc/file-5057-grade-4-afrikaans-first-additional-language-term-3-practice-test-2.pdf"}]'::jsonb, false, true, 5057, '{"title":"Grade 4 Afrikaans First Additional Language Term 3 Practice Test 2","description":"CAPS-aligned Grade 4 Afrikaans First Additional Language Term 3 Practice Test 2. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('f118d74f-aacd-5312-b892-621aab472e22', 'grade-4-afrikaans-first-additional-language-term-3-practice-test', 'Grade 4 Afrikaans First Additional Language Term 3 Practice Test', 'CAPS-aligned Grade 4 Afrikaans First Additional Language Term 3 Practice Test. Worth 40 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 4 Afrikaans First Additional Language skills for Term 3. It includes a Begripstoets (Reading Comprehension) , a Visuele Teks (Visual Text) section, an Opsomming (Summary) task, and a Taal in Konteks (Language in Context) section.

The Begripstoets (Reading Comprehension) is based on a short non-literary text and assesses learners’ understanding of the text, main idea, detail questions, vocabulary in context, true or false statements, plural forms, and antonyms.

The Visuele Teks (Visual Text) section requires learners to interpret a picture by identifying details, colours, emotions, and drawing simple conclusions.

The Opsomming (Summary) task focuses on sequencing, where learners arrange sentences in the correct order to show logical progression of events.

The Taal in Konteks (Language in Context) section covers key language skills including plural forms, past and future tense, conjunctions, direct and indirect speech, opposites, intensive forms, and basic sentence construction.

A full memorandum is included to support marking and feedback.

Total: 40 marks

Format: PDF (not editable)', 60.00, 'Grade 4', 'Term 3', '2026', 'Individual Resource', 'Summary', array['afrikaans-first-additional-language','natural-science-and-technology'], 40, '[{"id":"file-5054","label":"Summary PDF","filename":"grade-4-afrikaans-first-additional-language-term-3-practice-test.pdf","storageKey":"products/f118d74f-aacd-5312-b892-621aab472e22/file-5054-grade-4-afrikaans-first-additional-language-term-3-practice-test.pdf"}]'::jsonb, false, true, 5054, '{"title":"Grade 4 Afrikaans First Additional Language Term 3 Practice Test","description":"CAPS-aligned Grade 4 Afrikaans First Additional Language Term 3 Practice Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('a81dec69-6ebf-591f-8b00-a4b36a8d4df9', 'grade-4-english-first-additional-language-term-3-practice-test-2', 'Grade 4 English First Additional Language Term 3 Practice Test 2', 'CAPS-aligned Grade 4 English First Additional Language Term 3 Practice Test 2. Worth 40 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 4 English First Additional Language skills for Term 3. It includes a Reading Comprehension based on a narrative text ( A Puppy for Sipho ), a Creative Writing task, and a Language Structures and Conventions section.

The Reading Comprehension assesses understanding of the story, characters and events, vocabulary in context, identifying feelings and emotive language, and answering both factual and inferential questions.

The Creative Writing section requires learners to write a short paragraph (5–7 sentences) about a time they experienced a strong feeling. Learners are guided to structure their writing with a clear beginning, middle, and end, and to use emotive words, correct punctuation, and capital letters.

The Language section covers a range of grammar and language skills, including prefixes and root words, past tense verbs, collective nouns, reflexive pronouns, simple sentences, conjunctions, subject–verb agreement, sentence types, figures of speech (simile and metaphor), idioms, capital letters and punctuation, use of a colon, and abbreviations.

A full memorandum and a creative writing rubric are included to support marking and feedback.

Total: 40 marks

Format: PDF (not editable)', 60.00, 'Grade 4', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['english-first-additional-language','natural-science-and-technology'], 40, '[{"id":"file-5050","label":"Test / Assessment PDF","filename":"grade-4-english-first-additional-language-term-3-practice-test-2.pdf","storageKey":"products/a81dec69-6ebf-591f-8b00-a4b36a8d4df9/file-5050-grade-4-english-first-additional-language-term-3-practice-test-2.pdf"}]'::jsonb, false, true, 5050, '{"title":"Grade 4 English First Additional Language Term 3 Practice Test 2","description":"CAPS-aligned Grade 4 English First Additional Language Term 3 Practice Test 2. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('775fc509-0e9c-5453-a691-31f4e9c83884', 'grade-4-english-first-additional-language-term-3-practice-test', 'Grade 4 English First Additional Language Term 3 Practice Test', 'CAPS-aligned Grade 4 English First Additional Language Term 3 Practice Test. Worth 40 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 4 English First Additional Language skills for Term 3. It includes a Reading Comprehension based on a narrative text, a Visual Literacy section using an advertisement, and a Language Structures and Conventions section.

The Reading Comprehension assesses understanding of the story, sequencing of events, vocabulary in context, identifying past tense verbs, collective nouns, adverbs, acronyms, word stems, and figurative language (simile). Learners answer a combination of factual and inferential questions.

The Visual Literacy section focuses on interpreting information from an advertisement, identifying key details such as dates, images and contact information, and expressing opinions with reasons.

The Language section covers grammar and language skills including simple and complex sentences, spelling and correction of errors, past tense verbs, punctuation, sentence types, conjunctions, and reflexive pronouns.

A full memorandum is included to support marking and feedback.

Total: 40 marks

Format: PDF (not editable)', 60.00, 'Grade 4', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['english-first-additional-language','natural-science-and-technology'], 40, '[{"id":"file-5047","label":"Test / Assessment PDF","filename":"grade-4-english-first-additional-language-term-3-practice-test.pdf","storageKey":"products/775fc509-0e9c-5453-a691-31f4e9c83884/file-5047-grade-4-english-first-additional-language-term-3-practice-test.pdf"}]'::jsonb, false, true, 5047, '{"title":"Grade 4 English First Additional Language Term 3 Practice Test","description":"CAPS-aligned Grade 4 English First Additional Language Term 3 Practice Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('0f647a1a-ae2e-5641-8c68-fbcda548d903', 'grade-4-english-home-language-term-3-practice-test-2', 'Grade 4 English Home Language Term 3 Practice Test 2', 'CAPS-aligned Grade 4 English Home Language Term 3 Practice Test 2. Worth 40 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 4 English Home Language skills for Term 3. It includes a Reading Comprehension based on a short narrative text ( A Puppy for Sipho ), a Creative Writing task, and a Language Structures and Conventions section.

The Reading Comprehension assesses understanding of characters, setting, emotions, vocabulary in context, emotive language, and interpreting meaning from the text. Learners answer a combination of factual, inferential, and opinion-based questions.

The Creative Writing section requires learners to write a short paragraph about a strong personal feeling, using emotive language and correct sentence structure, with a clear beginning, middle, and end.

The Language section covers a range of grammar and language skills, including prefixes and root words, verb tenses, collective nouns, reflexive pronouns, sentence types, conjunctions, figures of speech (simile and metaphor), idioms, punctuation (including capital letters and colons), abbreviations, and sentence rewriting.

A full memorandum and a creative writing rubric are included to support marking and feedback.

Total: 40 marks

Format: PDF (not editable)', 60.00, 'Grade 4', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['english-home-language','natural-science-and-technology'], 40, '[{"id":"file-5044","label":"Test / Assessment PDF","filename":"grade-4-english-home-language-term-3-practice-test-2.pdf","storageKey":"products/0f647a1a-ae2e-5641-8c68-fbcda548d903/file-5044-grade-4-english-home-language-term-3-practice-test-2.pdf"}]'::jsonb, false, true, 5044, '{"title":"Grade 4 English Home Language Term 3 Practice Test 2","description":"CAPS-aligned Grade 4 English Home Language Term 3 Practice Test 2. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('7d113f9d-dbf6-54a5-8f03-864ddd1b2e20', 'grade-4-english-hl-term-3-practice-test', 'Grade 4 English Home Language Term 3 Practice Test', 'CAPS-aligned Grade 4 English Home Language Term 3 Practice Test. Worth 40 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 4 English Home Language skills for Term 3. It includes a Reading Comprehension based on a legend, The Legend of the Whispering Tree , and a Language Structures and Conventions section.

The Reading Comprehension assesses understanding of text type, main character, setting, mood and theme, vocabulary in context, figurative language (metaphors), and drawing meaning from the text. Learners are also required to answer both factual and interpretive questions.

The Language section covers a range of grammar and language skills, including collective nouns, degrees of comparison, verb tenses (past and future), pronouns, punctuation, prepositions, conjunctions, and rewriting simple sentences into complex sentences.

A full memorandum is included to support marking and feedback.

Total: 40 marks

Format: PDF (not editable)', 60.00, 'Grade 4', 'Term 3', '2026', 'Individual Resource', 'Test / Assessment', array['english-home-language','natural-science-and-technology'], 40, '[{"id":"file-5008","label":"Test / Assessment PDF","filename":"grade-4-english-hl-term-3-practice-test.pdf","storageKey":"products/7d113f9d-dbf6-54a5-8f03-864ddd1b2e20/file-5008-grade-4-english-hl-term-3-practice-test.pdf"}]'::jsonb, false, true, 5008, '{"title":"Grade 4 English Home Language Term 3 Practice Test","description":"CAPS-aligned Grade 4 English Home Language Term 3 Practice Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('f272c737-e79c-5f03-827d-e96095e0b14b', 'grade-7-mathematics-june-test', 'Grade 7 Mathematics June Test', 'CAPS-aligned Grade 7 Mathematics June Test. Worth 100 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 7 Mathematics content for Term 2 and is suitable for June examination preparation. It includes structured questions across whole numbers, fractions and decimals, exponents, integers, numeric and geometric patterns, and functions and relationships.

The test covers important Mathematics skills including rounding off, HCF and LCM, prime factorisation, operations with whole numbers, fractions, decimals and percentages, exponent rules, calculations with integers, numeric and geometric patterns, writing and describing rules, number sentences, flow diagrams, and interpreting functions and input–output tables. Learners are required to show all working, apply reasoning, and explain their thinking in selected questions.

A full memorandum is included to support accurate marking and feedback.

Total: 100 marks

Duration: 1.5 hours

Format: PDF (not editable)', 60.00, 'Grade 7', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 100, '[{"id":"file-5005","label":"Test / Assessment PDF","filename":"grade-7-mathematics-june-test.pdf","storageKey":"products/f272c737-e79c-5f03-827d-e96095e0b14b/file-5005-grade-7-mathematics-june-test.pdf"}]'::jsonb, false, true, 5005, '{"title":"Grade 7 Mathematics June Test","description":"CAPS-aligned Grade 7 Mathematics June Test. Worth 100 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('146a1d68-74f1-5f45-b0c0-1f95d75cb18c', 'grade-7-mathematics-term-2-practice-test', 'Grade 7 Mathematics Term 2 Practice Test', 'CAPS-aligned Grade 7 Mathematics Term 2 Practice Test. Worth 80 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 7 Mathematics content for Term 2. It includes questions on whole numbers, exponents, integers, numeric and geometric patterns, and functions and relationships.

The test covers important Mathematics skills including prime factors, highest common factor (HCF) and lowest common multiple (LCM), multiples and factors, exponent rules, calculations with integers, number patterns, describing and extending numeric and geometric patterns, writing number sentences, working with simple formulas, completing tables, flow diagrams, and interpreting functions. Learners are required to show all working and explain their reasoning in selected questions.

A full memorandum is included to support accurate marking and feedback.

Total: 80 marks

Duration: 1.5 hours

Format: PDF (not editable)', 60.00, 'Grade 7', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 80, '[{"id":"file-5002","label":"Test / Assessment PDF","filename":"grade-7-mathematics-term-2-practice-test.pdf","storageKey":"products/146a1d68-74f1-5f45-b0c0-1f95d75cb18c/file-5002-grade-7-mathematics-term-2-practice-test.pdf"}]'::jsonb, false, true, 5002, '{"title":"Grade 7 Mathematics Term 2 Practice Test","description":"CAPS-aligned Grade 7 Mathematics Term 2 Practice Test. Worth 80 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('41245e0b-e608-54d9-a463-e68930cb09ff', 'grade-7-technology-june-test', 'Grade 7 Technology June Test', 'CAPS-aligned Grade 7 Technology June Test. Worth 60 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 7 Technology content for Term 2 and is suitable for June examination preparation. It includes classification questions, short answer questions, matching activities, source-based questions, diagram interpretation, a practical drawing task, and a design brief with a structured rubric.

The test covers important Technology topics including structures (frame, shell and solid structures), natural and man-made structures , design considerations , simple machines (with a focus on second-class levers and mechanical advantage), pulleys and gears , forces such as compression , pneumatic and hydraulic systems , and graphic communication through oblique drawing. Learners also complete a design task where they design a futuristic mobile phone, including specifications, labelled drawings, and evaluation using a formal rubric.

A full memorandum and detailed rubrics for the drawing and design sections are included to support accurate marking and meaningful feedback.

Total: 60 marks

Duration: 1.5 hours

Format: PDF (not editable)', 60.00, 'Grade 7', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 60, '[{"id":"file-4998","label":"Test / Assessment PDF","filename":"grade-7-technology-june-test.pdf","storageKey":"products/41245e0b-e608-54d9-a463-e68930cb09ff/file-4998-grade-7-technology-june-test.pdf"}]'::jsonb, false, true, 4998, '{"title":"Grade 7 Technology June Test","description":"CAPS-aligned Grade 7 Technology June Test. Worth 60 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('57924091-227d-5d10-aca9-54cfd489f2b5', 'grade-7-technology-term-2-practice-test', 'Grade 7 Technology Term 2 Practice Test', 'CAPS-aligned Grade 7 Technology Term 2 Practice Test. Worth 50 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 7 Technology content for Term 2. It includes multiple-choice questions, fill-in-the-missing-words questions, true or false questions, source-based questions, short answer questions, design-based questions, drawing and diagram interpretation, and extended responses.

The test covers important Technology topics including structures (frame, shell and solid structures), strengthening methods (triangulation and cross-bracing), materials used in construction , simple machines (levers and mechanical advantage), communication technology (landline and mobile phones), design skills and design briefs , graphic communication (oblique drawing and single-point perspective), and pneumatic systems (including real-life applications such as the jaws-of-life). Learners are required to recall knowledge, analyse designs, explain concepts, interpret images, and apply problem-solving and design thinking skills.

A full memorandum is included to support accurate marking and meaningful feedback.

Total: 50 marks

Duration: 1.5 hours

Format: PDF (not editable)', 60.00, 'Grade 7', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 50, '[{"id":"file-4995","label":"Test / Assessment PDF","filename":"grade-7-technology-term-2-practice-test.pdf","storageKey":"products/57924091-227d-5d10-aca9-54cfd489f2b5/file-4995-grade-7-technology-term-2-practice-test.pdf"}]'::jsonb, false, true, 4995, '{"title":"Grade 7 Technology Term 2 Practice Test","description":"CAPS-aligned Grade 7 Technology Term 2 Practice Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('748b5366-6c7e-59a6-a2b8-34aa6fd10054', 'grade-7-natural-science-june-test', 'Grade 7 Natural Science June Test', 'CAPS-aligned Grade 7 Natural Science June Test. Worth 70 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 7 Natural Sciences content for Term 2 and is suitable for June examination preparation. It includes multiple-choice questions, true or false questions, fill-in-the-blanks, short answer questions, diagram interpretation, matching activities, and extended written responses.

The test covers important Natural Sciences topics including the biosphere and biodiversity , biomes , pollination and sexual reproduction in plants and humans , the Periodic Table and properties of elements , metals, non-metals and semi-metals , states of matter and heating curves , methods of separating mixtures , and acids, bases and neutrals (including indicators and taste receptors). Learners are required to recall scientific knowledge, explain processes, interpret diagrams and graphs, and apply concepts to real-life situations.

A full memorandum is included to support accurate marking and meaningful feedback.

Total: 70 marks

Duration: 1 hour 30 minutes

Format: PDF (not editable)', 60.00, 'Grade 7', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 70, '[{"id":"file-4992","label":"Test / Assessment PDF","filename":"grade-7-natural-science-june-test.pdf","storageKey":"products/748b5366-6c7e-59a6-a2b8-34aa6fd10054/file-4992-grade-7-natural-science-june-test.pdf"}]'::jsonb, false, true, 4992, '{"title":"Grade 7 Natural Science June Test","description":"CAPS-aligned Grade 7 Natural Science June Test. Worth 70 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('08be577b-214c-5ad1-bee4-61e9745443c6', 'grade-7-natural-science-term-2-practice-test', 'Grade 7 Natural Science Term 2 Practice Test', 'CAPS-aligned Grade 7 Natural Science Term 2 Practice Test. Worth 50 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 7 Natural Science content for Term 2 and is suitable for June examination preparation. It includes multiple-choice questions, matching activities, true or false questions, short answer questions, diagram-based questions, and extended written responses.

The test covers important Natural Science topics including properties of materials , physical properties (such as strength, flexibility, density, boiling point and melting point), methods of physical separation , mixtures , acids, bases and neutrals , the pH scale , conductors and insulators , states of matter , taste receptors , and elements on the Periodic Table . Learners are also assessed on atomic structure , including valence electrons , element classification , and the role of specific elements in the human body.

A full memorandum is included to support accurate marking and feedback.

Total: 50 marks

Duration: 1.5 hours

Format: PDF (not editable)', 60.00, 'Grade 7', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 50, '[{"id":"file-4990","label":"Test / Assessment PDF","filename":"grade-7-natural-science-term-2-practice-test.pdf","storageKey":"products/08be577b-214c-5ad1-bee4-61e9745443c6/file-4990-grade-7-natural-science-term-2-practice-test.pdf"}]'::jsonb, false, true, 4990, '{"title":"Grade 7 Natural Science Term 2 Practice Test","description":"CAPS-aligned Grade 7 Natural Science Term 2 Practice Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('98bac942-055d-558d-8ac9-5d465d3d0485', 'grade-7-ems-june-test', 'Grade 7 Economic Management Sciences June Test', 'CAPS-aligned Grade 7 EMS June Test. Worth 100 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 7 Economic Management Sciences (EMS) content for Term 2 and is suitable for June examination preparation. It includes multiple-choice questions, true or false questions, matching activities, short answer questions, case studies, calculations, and extended reasoning questions.

The test covers important EMS topics including the history of money, bartering, needs and wants, goods and services, inequality and poverty, accounting concepts (assets, liabilities, capital and expenses), income and expenses, savings and investments, Statements of Net Worth, and budgeting. Learners are required to recall knowledge, apply financial concepts, analyse real-life scenarios, interpret data, and justify their answers using economic reasoning.

A full memorandum is included to support accurate marking and meaningful feedback.

Total: 100 marks

Duration: 90 minutes

Format: PDF (not editable)', 60.00, 'Grade 7', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','history'], 100, '[{"id":"file-4987","label":"Test / Assessment PDF","filename":"grade-7-ems-june-test.pdf","storageKey":"products/98bac942-055d-558d-8ac9-5d465d3d0485/file-4987-grade-7-ems-june-test.pdf"}]'::jsonb, false, true, 4987, '{"title":"Grade 7 Economic Management Sciences June Test","description":"CAPS-aligned Grade 7 EMS June Test. Worth 100 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('9c688cbe-17ca-5ea3-b8ad-5adbcb5eb270', 'grade-7-ems-term-2-practice-test', 'Grade 7 Economic Management Sciences Term 2 Practice Test', 'CAPS-aligned Grade 7 EMS Term 2 Practice Test. Worth 80 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 7 Economic Management Sciences (EMS) content for Term 2. It includes multiple-choice questions, column-matching activities, classifying accounts, short answer questions, a budgeting task, a case study, drawing up a Statement of Net Worth, and extended reasoning questions.

The test covers important EMS topics including basic economic concepts, needs and wants, fixed and variable expenses, budgeting, business ownership (sole proprietorships and franchises), market research, income and expenditure, classifying accounts, assets and liabilities, Statements of Net Worth, inequality and poverty, unemployment, the role of banks, and commonly used financial acronyms. Learners are required to recall knowledge, apply financial concepts, analyse real-life scenarios, and explain their reasoning clearly.

A full memorandum is included to support accurate marking and meaningful feedback.

Total: 80 marks

Duration: 90 minutes

Format: PDF (not editable)', 60.00, 'Grade 7', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 80, '[{"id":"file-4984","label":"Test / Assessment PDF","filename":"grade-7-ems-term-2-practice-test.pdf","storageKey":"products/9c688cbe-17ca-5ea3-b8ad-5adbcb5eb270/file-4984-grade-7-ems-term-2-practice-test.pdf"}]'::jsonb, false, true, 4984, '{"title":"Grade 7 Economic Management Sciences Term 2 Practice Test","description":"CAPS-aligned Grade 7 EMS Term 2 Practice Test. Worth 80 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('4f58f863-2aff-5311-ae65-9fbfd5d4bbff', 'grade-7-geography-june-test', 'Grade 7 Geography June Test', 'CAPS-aligned Grade 7 Geography June Test. Worth 50 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 7 Geography content for Term 2 and is suitable for June examination preparation. It includes map skills, mapwork questions, source-based questions, short answer questions, diagram interpretation, and an extended paragraph writing task.

The test covers important Geography topics including map skills (symbols, scale, contour lines and direction), earthquakes and volcanoes, tectonic plates and plate boundaries, the structure of the Earth, and flooding. Learners engage with real-world case studies, maps and diagrams, and are required to explain geographical processes, identify causes and effects, and apply knowledge to environmental issues.

A full memorandum is included to support accurate marking and meaningful feedback.

Total: 50 marks

Format: PDF (not editable)', 60.00, 'Grade 7', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','geography'], 50, '[{"id":"file-4981","label":"Test / Assessment PDF","filename":"grade-7-geography-june-test.pdf","storageKey":"products/4f58f863-2aff-5311-ae65-9fbfd5d4bbff/file-4981-grade-7-geography-june-test.pdf"}]'::jsonb, false, true, 4981, '{"title":"Grade 7 Geography June Test","description":"CAPS-aligned Grade 7 Geography June Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('cd829581-9520-577d-8625-88078614da31', 'grade-7-geography-term-2-practice-test', 'Grade 7 Geography Term 2 Practice Test', 'CAPS-aligned Grade 7 Geography Term 2 Practice Test. Worth 50 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 7 Geography content for Term 2. It includes multiple-choice questions, true or false questions, diagram labelling, map-work questions, source-based questions, short answer questions, and extended paragraph responses.

The test focuses on natural disasters and the structure of the Earth . Topics covered include earthquakes, volcanoes, floods and tsunamis, tectonic plates and plate movement, the layers of the Earth, magma and lava, batholiths, causes and effects of natural disasters, disaster preparedness, and ways communities can reduce risk. Learners are required to recall factual knowledge, interpret maps and diagrams, explain processes, justify answers, and apply geographical understanding to real-life case studies.

A full memorandum is included to support marking and feedback.

Total: 50 marks

Format: PDF (not editable)', 60.00, 'Grade 7', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','geography'], 50, '[{"id":"file-4978","label":"Test / Assessment PDF","filename":"grade-7-geography-term-2-practice-test.pdf","storageKey":"products/cd829581-9520-577d-8625-88078614da31/file-4978-grade-7-geography-term-2-practice-test.pdf"}]'::jsonb, false, true, 4978, '{"title":"Grade 7 Geography Term 2 Practice Test","description":"CAPS-aligned Grade 7 Geography Term 2 Practice Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('02cf82bf-38ca-5654-9566-eab26eba3de5', 'grade-7-history-june-test', 'Grade 7 History June Test', 'CAPS-aligned Grade 7 History June Test. Worth 50 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 7 History content for Term 2 and is suitable for June examination preparation. It includes source-based questions, fill-in-the-missing-words questions, matching activities, true or false questions, short answer questions, and an extended paragraph writing task.

The test covers important History topics including trade across the Sahara Desert , the Kingdom of Mali , the city of Timbuktu , and the transatlantic slave trade . Learners explore trade routes and goods, the leadership of Mansa Musa, the importance of Timbuktu as a centre of learning, slavery in the American South, resistance to slavery, the Underground Railroad, and key historical figures such as Harriet Tubman, John Brown, and Joseph Cinque. Learners are required to recall factual knowledge, interpret historical sources, explain cause and effect, and express understanding through structured written responses.

A full memorandum is included to support accurate marking and feedback.

Total: 50 marks

Format: PDF (not editable)', 60.00, 'Grade 7', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','history'], 50, '[{"id":"file-4974","label":"Test / Assessment PDF","filename":"grade-7-history-june-test.pdf","storageKey":"products/02cf82bf-38ca-5654-9566-eab26eba3de5/file-4974-grade-7-history-june-test.pdf"}]'::jsonb, false, true, 4974, '{"title":"Grade 7 History June Test","description":"CAPS-aligned Grade 7 History June Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('bc43236b-6201-5721-847f-45ffcb16e731', 'grade-7-history-term-2-practice-test', 'Grade 7 History Term 2 Practice Test', 'CAPS-aligned Grade 7 History Term 2 Practice Test. Worth 40 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 7 Life Orientation content for Term 2. It includes multiple-choice questions, fill-in-the-missing-words questions, definitions, matching columns, short answer questions, scenario-based questions, and case studies.

The test covers important Life Orientation topics including human rights and responsibilities, abuse and its effects on personal and social well-being, places of protection and support, peer pressure and assertive behaviour, conflict resolution and reconciliation, career fields, risky and threatening situations, fair play and respect in sport, and self-image and self-confidence. Learners are required to apply knowledge to real-life situations and reflect on personal and social issues.

The test is clearly structured with instructions, time allocation, and mark allocation and assesses lower-, middle-, and higher-order thinking skills in line with CAPS requirements. A full memorandum is included to support accurate marking and meaningful feedback.

Total: 40 marks

Format: PDF (not editable)', 60.00, 'Grade 7', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','history'], 40, '[{"id":"file-4970","label":"Test / Assessment PDF","filename":"grade-7-history-term-2-practice-test.pdf","storageKey":"products/bc43236b-6201-5721-847f-45ffcb16e731/file-4970-grade-7-history-term-2-practice-test.pdf"}]'::jsonb, false, true, 4970, '{"title":"Grade 7 History Term 2 Practice Test","description":"CAPS-aligned Grade 7 History Term 2 Practice Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('c25e3d7b-4bcd-5529-ad5f-d4fdf14f1109', 'grade-7-life-orientation-june-test', 'Grade 7 Life Orientation June Test', 'CAPS-aligned Grade 7 Life Orientation June Test. Worth 70 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 7 Life Orientation content for Term 2 and is suitable for June examination preparation. It includes multiple-choice questions, definitions, column-matching activities, short answer questions, case studies, longer paragraph responses, and extended questions.

The test covers important Life Orientation topics including puberty and hormonal changes, self-concept and self-esteem, peer pressure, abuse and risky situations, internet safety, conflict and conflict resolution, negotiation skills, human rights (with a focus on children’s rights), career fields, assertive behaviour, and peer mediation. Learners are required to apply knowledge to real-life scenarios and reflect critically on social and personal issues.

A full memorandum and assessment rubrics are included to support accurate marking and meaningful feedback.

Total: 70 marks

Format: PDF (not editable)', 60.00, 'Grade 7', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 70, '[{"id":"file-4967","label":"Test / Assessment PDF","filename":"grade-7-life-orientation-june-test.pdf","storageKey":"products/c25e3d7b-4bcd-5529-ad5f-d4fdf14f1109/file-4967-grade-7-life-orientation-june-test.pdf"}]'::jsonb, false, true, 4967, '{"title":"Grade 7 Life Orientation June Test","description":"CAPS-aligned Grade 7 Life Orientation June Test. Worth 70 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('451b6417-0b98-56f8-b58b-b122858d9ba3', 'grade-7-life-orientation-term-2-practice-test', 'Grade 7 Life Orientation Term 2 Practice Test', 'CAPS-aligned Grade 7 Life Orientation Term 2 Practice Test. Worth 40 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 7 Life Orientation content for Term 2. It includes multiple-choice questions, fill-in-the-missing-words questions, short answer questions, matching columns, scenario-based questions, and case studies.

The test covers important Life Orientation topics including human rights and responsibilities, abuse and its effects on personal and social well-being, places of protection and support, peer pressure, assertive behaviour, conflict resolution and reconciliation, career fields, risky and threatening situations, fair play and respect in sport, and self-image and self-confidence.

A full memorandum is included to support marking and feedback.

Total: 40 marks

Format: PDF (not editable)', 60.00, 'Grade 7', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 40, '[{"id":"file-4963","label":"Test / Assessment PDF","filename":"grade-7-life-orientation-term-2-practice-test.pdf","storageKey":"products/451b6417-0b98-56f8-b58b-b122858d9ba3/file-4963-grade-7-life-orientation-term-2-practice-test.pdf"}]'::jsonb, false, true, 4963, '{"title":"Grade 7 Life Orientation Term 2 Practice Test","description":"CAPS-aligned Grade 7 Life Orientation Term 2 Practice Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('de007ea5-44f8-5528-af1a-00573a9390fd', 'grade-7-afrikaans-first-additional-language-june-test', 'Grade 7 Afrikaans First Additional Language June Test', 'CAPS-aligned Grade 7 Afrikaans First Additional Language June Test. Worth 60 marks , includes full memo. Instant PDF download', 'Hierdie praktyktoets assesseer die kern Graad 7 Afrikaans Eerste Addisionele Taal vaardighede vir Kwartaal 2 en is geskik vir Junie-eksamenvoorbereiding. Dit sluit ’n begripstoets gebaseer op ’n nie-literêre teks , ’n visuele teks-afdeling , ’n opsommingstaak , en ’n Taalstrukture en Konvensies-afdeling in.

Die Taal-afdeling dek ’n wye reeks taalvaardighede, insluitend eienaam en soortnaam , meervoude en enkelvoude , byvoeglike naamwoorde en trappe van vergelyking , aanwysende voornaamwoorde , direkte en indirekte rede , verlede tyd , aktiewe en lydende vorm , sinsoorte , bywoorde , voorsetsels , antonieme , letterlike en figuurlike taal , leestekens , en basiese spelling en taalredigering .

’n Volledige memorandum en ’n gedetailleerde opsomming-nasienrubriek is ingesluit om nasien en terugvoer te ondersteun.

Totaal: 60 punte

Formaat: PDF (nie wysigbaar nie)', 60.00, 'Grade 7', 'Any Term', '2026', 'Individual Resource', 'Test / Assessment', array['afrikaans-first-additional-language','natural-science-and-technology'], 60, '[{"id":"file-4961","label":"Test / Assessment PDF","filename":"grade-7-afrikaans-first-additional-language-june-test.pdf","storageKey":"products/de007ea5-44f8-5528-af1a-00573a9390fd/file-4961-grade-7-afrikaans-first-additional-language-june-test.pdf"}]'::jsonb, false, true, 4961, '{"title":"Grade 7 Afrikaans First Additional Language June Test","description":"CAPS-aligned Grade 7 Afrikaans First Additional Language June Test. Worth 60 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('c1ddf029-132d-5f9e-8988-a49c71eaead6', 'grade-7-afrikaans-first-additional-language-term-2-practice-test', 'Grade 7 Afrikaans First Additional Language Term 2 Practice Test', 'CAPS-aligned Grade 7 Afrikaans First Additional Language Term 2 Practice Test. Worth 60 marks , includes full memo. Instant PDF download', 'Hierdie praktyktoets assesseer die kern Graad 7 Afrikaans Eerste Addisionele Taal vaardighede vir Kwartaal 2. Dit sluit ’n begripstoets gebaseer op ’n kortverhaal , ’n visuele teks-afdeling , ’n opsommingstaak , en ’n Taalstrukture en Konvensies-afdeling in.

Die Taal-afdeling dek ’n wye reeks taalvaardighede, insluitend alfabetiese volgorde , lettergrepe (oop en geslote) , verlede en toekomende tyd , sinonieme en antonieme , korrekte spelling , voornaamwoorde , onderwerp, gesegde en voorwerp , meervoude , homofone , direkte en indirekte rede , punktuasie , uitroep- en vraagsinne , infinitiewe , en letterlike en figuurlike taalgebruik .

’n Volledige memorandum en ’n gedetailleerde opsomming-nasienrubriek is ingesluit om nasien en terugvoer te ondersteun.

Totaal: 60 punte

Formaat: PDF (nie wysigbaar nie)', 60.00, 'Grade 7', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['afrikaans-first-additional-language','natural-science-and-technology'], 60, '[{"id":"file-4958","label":"Test / Assessment PDF","filename":"grade-7-afrikaans-first-additional-language-term-2-practice-test.pdf","storageKey":"products/c1ddf029-132d-5f9e-8988-a49c71eaead6/file-4958-grade-7-afrikaans-first-additional-language-term-2-practice-test.pdf"}]'::jsonb, false, true, 4958, '{"title":"Grade 7 Afrikaans First Additional Language Term 2 Practice Test","description":"CAPS-aligned Grade 7 Afrikaans First Additional Language Term 2 Practice Test. Worth 60 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('5f6414e0-1c79-5aa1-bf36-40992fa34ca6', 'grade-7-english-first-additional-language-june-test', 'Grade 7 English First Additional Language June Test', 'CAPS-aligned Grade 7 English First Additional Language June Test. Worth 60 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 7 English First Additional Language skills for Term 2 and is suitable for June examination preparation. It includes a Reading Comprehension based on an informational text, a Visual Literacy section using a newspaper article, a Summary Writing task, and a Language Structures and Conventions section.

The Language section covers a wide range of grammar and language skills, including verb tenses (present, past, and future), pronouns, possessive pronouns, articles, plural forms, degrees of comparison, figurative language (similes), prefixes and suffixes, collective nouns, sentence types (simple, compound, and complex), punctuation, adverbials, subject–verb agreement, and direct and indirect speech.

A full memorandum and a detailed summary writing rubric are included to support marking and feedback.

Total: 60 marks

Format: PDF (not editable)', 60.00, 'Grade 7', 'Term 2', '2026', 'Individual Resource', 'Summary', array['english-first-additional-language','natural-science-and-technology'], 60, '[{"id":"file-4955","label":"Summary PDF","filename":"grade-7-english-first-additional-language-june-test.pdf","storageKey":"products/5f6414e0-1c79-5aa1-bf36-40992fa34ca6/file-4955-grade-7-english-first-additional-language-june-test.pdf"}]'::jsonb, false, true, 4955, '{"title":"Grade 7 English First Additional Language June Test","description":"CAPS-aligned Grade 7 English First Additional Language June Test. Worth 60 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('4a0bc5c6-50be-5974-bcb3-b6a678f7a321', 'grade-7-english-first-additional-language-term-2-practice-test', 'Grade 7 English First Additional Language Term 2 Practice Test', 'CAPS-aligned Grade 7 English First Additional Language Term 2 Practice Test. Worth 60 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 7 English First Additional Language skills for Term 2. It includes a Reading Comprehension based on a narrative text, a Visual Literacy section using an advertisement and a cartoon, a Summary Writing task, and a Language Structures and Conventions section.

The Language section covers a range of grammar and language skills, including verb tenses (simple present and past), direct speech, plural forms, degrees of comparison, idioms, homophones, finite and auxiliary verbs, personal pronouns, articles, suffixes, abstract and concrete nouns, and identifying compound and complex sentences.

A full memorandum and a summary writing rubric are included to support marking and feedback.

Total: 60 marks

Format: PDF (not editable)', 60.00, 'Grade 7', 'Term 2', '2026', 'Individual Resource', 'Summary', array['english-first-additional-language','natural-science-and-technology'], 60, '[{"id":"file-4952","label":"Summary PDF","filename":"grade-7-english-first-additional-language-term-2-practice-test.pdf","storageKey":"products/4a0bc5c6-50be-5974-bcb3-b6a678f7a321/file-4952-grade-7-english-first-additional-language-term-2-practice-test.pdf"}]'::jsonb, false, true, 4952, '{"title":"Grade 7 English First Additional Language Term 2 Practice Test","description":"CAPS-aligned Grade 7 English First Additional Language Term 2 Practice Test. Worth 60 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('adca703b-dafa-58d1-a766-fe3b904d2503', 'grade-7-english-home-language-june-test', 'Grade 7 English Home Language June Test', 'CAPS-aligned Grade 7 English Home Language June Test. Worth 60 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 7 English Home Language skills for Term 2 and is suitable for June examination preparation. It includes a Reading Comprehension based on an informational text, a Visual Literacy section using a newspaper article, a Summary Writing task, and a Language Structures and Conventions section.

The Language section covers a wide range of grammar and language skills, including adjectives and verbs, pronouns, verb tenses, direct and indirect speech, punctuation, sentence types, figurative language (similes), prefixes and suffixes, relative pronouns, adverbials, articles, identifying root words, and simple, compound, and complex sentences.

A full memorandum and a detailed summary writing rubric are included to support marking and feedback.

Total: 60 marks

Format: PDF (not editable)', 60.00, 'Grade 7', 'Term 2', '2026', 'Individual Resource', 'Summary', array['english-home-language','natural-science-and-technology'], 60, '[{"id":"file-4949","label":"Summary PDF","filename":"grade-7-english-home-language-june-test.pdf","storageKey":"products/adca703b-dafa-58d1-a766-fe3b904d2503/file-4949-grade-7-english-home-language-june-test.pdf"}]'::jsonb, false, true, 4949, '{"title":"Grade 7 English Home Language June Test","description":"CAPS-aligned Grade 7 English Home Language June Test. Worth 60 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('46d10b9c-6973-597f-8ad3-6e59b904f0b8', 'grade-7-eng-hl-term-2-test', 'Grade 7 English Home Language Term 2 Practice Test', 'CAPS-aligned Grade 7 English Home Language Term 2 Practice Test. Worth 60 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 7 English Home Language skills for Term 2. It includes a Reading Comprehension based on a literary text, a Visual Literacy section using an advertisement, a Summary Writing task, and a Language Structures and Conventions section.

The Language section covers a range of grammar and language skills, including homophones, adjectives, figurative language, idioms, antonyms, gender forms, demonstrative and relative adjectives, direct and indirect speech, sentence types (simple and compound), prepositions, numerical adjectives, active and passive voice, clauses, punctuation (colon and semicolon), verb tenses, and identifying subject and predicate.

A full memorandum and a summary writing rubric are included to support marking and feedback.

Total: 60 marks

Format: PDF (not editable)', 60.00, 'Grade 7', 'Term 2', '2026', 'Individual Resource', 'Summary', array['english-home-language','natural-science-and-technology'], 60, '[{"id":"file-4905","label":"Summary PDF","filename":"grade-7-eng-hl-term-2-test.pdf","storageKey":"products/46d10b9c-6973-597f-8ad3-6e59b904f0b8/file-4905-grade-7-eng-hl-term-2-test.pdf"}]'::jsonb, false, true, 4905, '{"title":"Grade 7 English Home Language Term 2 Practice Test","description":"CAPS-aligned Grade 7 English Home Language Term 2 Practice Test. Worth 60 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('59858b06-7c21-5e31-9d21-ab4615cd64c1', 'grade-4-mathematics-term-1-fat-test-2026', 'Grade 4 Mathematics Term 1 FAT Test (2026)', 'CAPS-aligned Grade 4 Mathematics Term 1 FAT Test. Worth 50 marks , includes full memo. Instant PDF download', 'This Formal Assessment Task (FAT) Test assesses the key Grade 4 Mathematics content for Term 1 and is suitable for formal school-based assessment. Set to the 2026 ATP. It is designed as a timed test and includes Mental Maths, Number Sentences and Properties, Addition and Subtraction, Multiplication, and Problem Solving in context.

The test covers essential Mathematics skills including place value, ordering and comparing numbers, rounding off, odd and even numbers, number sentences, addition and subtraction strategies, multiplication calculations, estimation, working with money, and solving real-life word problems.

Memorandum included.

Total: 50 marks

Format: PDF (not editable)

Copyright © Designing Minds. This resource is for personal use only and may not be shared, distributed, or resold in any form.', 60.00, 'Grade 4', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 50, '[{"id":"file-4902","label":"Test / Assessment PDF","filename":"grade-4-mathematics-term-1-fat-test-2026.pdf","storageKey":"products/59858b06-7c21-5e31-9d21-ab4615cd64c1/file-4902-grade-4-mathematics-term-1-fat-test-2026.pdf"}]'::jsonb, false, true, 4902, '{"title":"Grade 4 Mathematics Term 1 FAT Test (2026)","description":"CAPS-aligned Grade 4 Mathematics Term 1 FAT Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('6bd634ad-528e-52ff-8e74-3eca6df959eb', 'grade-4-mathematics-term-1-fat-assessment', 'Grade 4 Mathematics Term 1 FAT Assessment (2026)', 'CAPS-aligned Grade 4 Mathematics Term 1 FAT Assessment. Worth 50 marks , includes full memo. Instant PDF download', 'This Formal Assessment Task (FAT) Assignment assesses the key Grade 4 Mathematics content for Term 1 and is designed as an extended assessment that can be completed over more than one lesson. Set to the 2026 ATP.

It includes Mental Maths, Number Concepts, Number Sentences and Properties, Addition and Subtraction, Multiplication, and Problem Solving and Reasoning.

The assignment covers essential Mathematics skills such as place value, ordering and comparing numbers, rounding off, number sentences, properties of numbers, addition and subtraction strategies, multiplication, estimation, and solving real-life word problems. Learners are required to show all working and explain their reasoning in selected questions.

Memorandum Included.

Total: 50 marks

Format: PDF (not editable)

Copyright © Designing Minds. This resource is for personal use only and may not be shared, distributed, or resold in any form.', 60.00, 'Grade 4', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 50, '[{"id":"file-4899","label":"Test / Assessment PDF","filename":"grade-4-mathematics-term-1-fat-assessment.pdf","storageKey":"products/6bd634ad-528e-52ff-8e74-3eca6df959eb/file-4899-grade-4-mathematics-term-1-fat-assessment.pdf"}]'::jsonb, false, true, 4899, '{"title":"Grade 4 Mathematics Term 1 FAT Assessment (2026)","description":"CAPS-aligned Grade 4 Mathematics Term 1 FAT Assessment. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('417d5a58-a510-5752-b40f-030c9981e241', 'grade-4-mathematics-term-1-practice-test-2', 'Grade 4 Mathematics Term 1 Practice Test 2 (2025)', 'CAPS-aligned Grade 4 Mathematics Term 1 Test 2. Worth 40 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 4 Mathematics content for Term 1. It includes questions on whole numbers, number sentences, addition and subtraction, estimation, and problem-solving. Set to the revised App of 2024/2025.

The test covers important Mathematics skills including writing numbers in words, ordering and comparing numbers, number sequences, rounding off to the nearest 10, 100 and 1 000, place value, odd and even numbers, number sentences, addition and subtraction calculations, estimation, and solving word problems in context.

Memorandum included.

Total: 40 marks

Format: PDF (not editable)

Copyright © Designing Minds. This resource is for personal use only and may not be shared, distributed, or resold in any form.', 60.00, 'Grade 4', 'Term 1', '2025', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 40, '[{"id":"file-4896","label":"Test / Assessment PDF","filename":"grade-4-mathematics-term-1-practice-test-2.pdf","storageKey":"products/417d5a58-a510-5752-b40f-030c9981e241/file-4896-grade-4-mathematics-term-1-practice-test-2.pdf"}]'::jsonb, false, true, 4896, '{"title":"Grade 4 Mathematics Term 1 Practice Test 2 (2025)","description":"CAPS-aligned Grade 4 Mathematics Term 1 Test 2. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('acd83f07-31a0-50db-9b72-754a17966cef', 'grade-4-mathematics-term-1-practice-test-1', 'Grade 4 Mathematics Term 1 Practice Test 1 (2025)', 'CAPS-aligned Grade 4 Mathematics Term 1 Test 1. Worth 40 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 4 Mathematics content for Term 1. It includes Mental Maths, Number Sentences, Addition and Subtraction, and Problem Solving questions. Aligned to the 2024/2025 ATP.

The test covers important Mathematics skills including place value, ordering and comparing numbers, number sequences, rounding off to the nearest 10, 100 and 1 000, value of digits, odd and even numbers, number sentences, addition and subtraction strategies, using a number line, working with money, and solving word problems in context.

Memorandum included.

Total: 40 marks

Format: PDF (not editable)

Copyright © Designing Minds. This resource is for personal use only and may not be shared, distributed, or resold in any form.', 60.00, 'Grade 4', 'Term 1', '2025', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 40, '[{"id":"file-4889","label":"Test / Assessment PDF","filename":"grade-4-mathematics-term-1-practice-test-1.pdf","storageKey":"products/acd83f07-31a0-50db-9b72-754a17966cef/file-4889-grade-4-mathematics-term-1-practice-test-1.pdf"}]'::jsonb, false, true, 4889, '{"title":"Grade 4 Mathematics Term 1 Practice Test 1 (2025)","description":"CAPS-aligned Grade 4 Mathematics Term 1 Test 1. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('161b4de1-a0c7-561e-af64-9d32bee53a7e', 'grade-4-natural-science-technology-term-1-practice-test-2', 'Grade 4 Natural Science & Technology Term 1 Practice Test 2', 'CAPS-aligned Grade 4 NST Term 1 Test 2. Worth 25 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 4 Natural Science and Technology content for Term 1. It includes fill-in-the-missing-words questions, diagram labelling, true or false questions, column-matching activities, and short answer questions.

The test covers important NST topics including living and non-living things, characteristics of living things, parts of plants and their functions, what plants need to grow, habitats of animals, and basic animal structures and functions.

Memorandum included.

Total: 25 marks

Format: PDF (not editable)

Copyright © Designing Minds. This resource is for personal use only and may not be shared, distributed, or resold in any form.', 60.00, 'Grade 4', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 25, '[{"id":"file-4886","label":"Test / Assessment PDF","filename":"grade-4-natural-science-technology-term-1-practice-test-2.pdf","storageKey":"products/161b4de1-a0c7-561e-af64-9d32bee53a7e/file-4886-grade-4-natural-science-technology-term-1-practice-test-2.pdf"}]'::jsonb, false, true, 4886, '{"title":"Grade 4 Natural Science & Technology Term 1 Practice Test 2","description":"CAPS-aligned Grade 4 NST Term 1 Test 2. Worth 25 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('b201b8e4-24dd-5133-a356-d145fc501714', 'grade-4-nst-term-1-practice-test-1', 'Grade 4 Natural Science & Technology Term 1 Practice Test 1', 'CAPS-aligned Grade 4 NST Term 1 Test 1. Worth 25 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 4 Natural Science and Technology content for Term 1. It includes multiple-choice questions, classification tasks, short answer questions, diagram labelling, and a column-matching activity.

The test covers important NST topics including living and non-living things, animal classification (mammals and reptiles), animal habitats and adaptations, parts of a plant and their functions, and basic plant processes such as photosynthesis.

Memorandum included.

Total: 25 marks

Format: PDF (not editable)

Copyright © Designing Minds. This resource is for personal use only and may not be shared, distributed, or resold in any form.', 60.00, 'Grade 4', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 25, '[{"id":"file-4883","label":"Test / Assessment PDF","filename":"grade-4-nst-term-1-practice-test-1.pdf","storageKey":"products/b201b8e4-24dd-5133-a356-d145fc501714/file-4883-grade-4-nst-term-1-practice-test-1.pdf"}]'::jsonb, false, true, 4883, '{"title":"Grade 4 Natural Science & Technology Term 1 Practice Test 1","description":"CAPS-aligned Grade 4 NST Term 1 Test 1. Worth 25 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('6a32fc84-0042-5b5e-9af6-89689ae14afd', 'grade-4-geography-term-1-practice-test-2', 'Grade 4 Geography Term 1 Practice Test 2', 'CAPS-aligned Grade 4 Geography Term 1 Test 2. Worth 25 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 4 Geography content for Term 1. It includes source-based questions on different jobs, a case study on settlements, map-drawing and labelling activities, and a paragraph writing task.

The test covers important Geography topics including types of settlements (farms, villages, towns and cities), jobs and buildings in communities, landmarks, basic needs such as water, food and shelter, map-drawing skills using keys and symbols, and comparing life in a city and a village.

Memorandum included.

Total: 25 marks

Format: PDF (not editable)

Copyright © Designing Minds. This resource is for personal use only and may not be shared, distributed, or resold in any form.', 60.00, 'Grade 4', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','geography'], 25, '[{"id":"file-4879","label":"Test / Assessment PDF","filename":"grade-4-geography-term-1-practice-test-2.pdf","storageKey":"products/6a32fc84-0042-5b5e-9af6-89689ae14afd/file-4879-grade-4-geography-term-1-practice-test-2.pdf"}]'::jsonb, false, true, 4879, '{"title":"Grade 4 Geography Term 1 Practice Test 2","description":"CAPS-aligned Grade 4 Geography Term 1 Test 2. Worth 25 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('bd127d66-3049-58b9-940b-aa4def0381b8', 'grade-4-geography-term-1-practice-test-1', 'Grade 4 Geography Term 1 Practice Test 1', 'CAPS-aligned Grade 4 Geography Term 1 Test 1. Worth 25 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 4 Geography content for Term 1. It includes multiple-choice questions, true or false questions, short answer questions, a case study, and a map-reading and directions task.

The test covers important Geography topics including different types of settlements (farms, villages, towns and cities), jobs and buildings in settlements, basic needs, landmarks, roads and footpaths, the importance of water and food, and giving directions using a simple map with landmarks.

Memorandum included.

Total: 25 marks

Format: PDF (not editable)

Copyright © Designing Minds. This resource is for personal use only and may not be shared, distributed, or resold in any form.', 60.00, 'Grade 4', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','geography'], 25, '[{"id":"file-4877","label":"Test / Assessment PDF","filename":"grade-4-geography-term-1-practice-test-1.pdf","storageKey":"products/bd127d66-3049-58b9-940b-aa4def0381b8/file-4877-grade-4-geography-term-1-practice-test-1.pdf"}]'::jsonb, false, true, 4877, '{"title":"Grade 4 Geography Term 1 Practice Test 1","description":"CAPS-aligned Grade 4 Geography Term 1 Test 1. Worth 25 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('766dcf55-bdec-5747-89e3-6fc5d5783707', 'grade-4-history-term-1-practice-test-2', 'Grade 4 History Term 1 Practice Test 2', 'CAPS-aligned Grade 4 History Term 1 Test 2. Worth 25 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 4 History content for Term 1. It includes fill-in-the-blanks questions, identifying methods of finding historical information, short answer questions, and a case study.

The test focuses on sources of historical information , including pictures, interviews, written records, stories, and artefacts. Learners are required to identify different sources, explain why multiple sources are important, and apply their understanding through a real-life case study based on a local history project.

Memorandum included.

Total: 25 marks

Format: PDF (not editable)

Copyright © Designing Minds. This resource is for personal use only and may not be shared, distributed, or resold in any form.', 60.00, 'Grade 4', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','history'], 25, '[{"id":"file-4874","label":"Test / Assessment PDF","filename":"grade-4-history-term-1-practice-test-2.pdf","storageKey":"products/766dcf55-bdec-5747-89e3-6fc5d5783707/file-4874-grade-4-history-term-1-practice-test-2.pdf"}]'::jsonb, false, true, 4874, '{"title":"Grade 4 History Term 1 Practice Test 2","description":"CAPS-aligned Grade 4 History Term 1 Test 2. Worth 25 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('80028eee-b999-5da6-b869-480ff6f5c842', 'grade-4-history-term-1-practice-test-1', 'Grade 4 History Term 1 Practice Test 1', 'CAPS-aligned Grade 4 History Term 1 Test 1. Worth 25 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 4 History content for Term 1. It includes multiple-choice questions, true or false questions, short answer questions, a column-matching activity, and a short paragraph writing task.

The test focuses on local history and covers sources of historical information such as photographs, written records, stories and interviews, and artefacts. Learners explore how these sources help us understand life in the past, technology used by people, and how communities have changed over time.

Memorandum included.

Total: 25 marks

Format: PDF (not editable)', 60.00, 'Grade 4', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','history'], 25, '[{"id":"file-4869","label":"Test / Assessment PDF","filename":"grade-4-history-term-1-practice-test-1.pdf","storageKey":"products/80028eee-b999-5da6-b869-480ff6f5c842/file-4869-grade-4-history-term-1-practice-test-1.pdf"}]'::jsonb, false, true, 4869, '{"title":"Grade 4 History Term 1 Practice Test 1","description":"CAPS-aligned Grade 4 History Term 1 Test 1. Worth 25 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('44230c45-6692-5e1c-aefc-e26ec3fd4c7d', 'grade-4-life-skills-psw-term-1-practice-test-2', 'Grade 4 Life Skills PSW Term 1 Practice Test 2', 'CAPS-aligned Grade 4 Life Skills PSW Term 1 Test 2. Worth 30 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 4 Life Skills Personal and Social Well-being (PSW) content for Term 1. It includes fill-in-the-missing-words questions, column-matching, true or false questions, short answer questions, and a case study.

The test covers important PSW topics including personal strengths and weaknesses, learning from experiences, achievements and success, respect and personal space, healthy living choices, conflict and conflict resolution, communication skills, role models, and making responsible decisions in social situations.

Memorandum included.

Total: 30 marks

Format: PDF (not editable)', 60.00, 'Grade 4', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['life-skills','natural-science-and-technology'], 30, '[{"id":"file-4867","label":"Test / Assessment PDF","filename":"grade-4-life-skills-psw-term-1-practice-test-2.pdf","storageKey":"products/44230c45-6692-5e1c-aefc-e26ec3fd4c7d/file-4867-grade-4-life-skills-psw-term-1-practice-test-2.pdf"}]'::jsonb, false, true, 4867, '{"title":"Grade 4 Life Skills PSW Term 1 Practice Test 2","description":"CAPS-aligned Grade 4 Life Skills PSW Term 1 Test 2. Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('06d680b5-9b2e-5393-9ef4-acf9ecf88e45', 'grade-4-life-skills-psw-term-1-practice-test-1', 'Grade 4 Life Skills PSW Term 1 Practice Test 1', 'CAPS-aligned Grade 4 Life Skills PSW Term 1 Test 1. Worth 30 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 4 Life Skills Personal and Social Well-being (PSW) content for Term 1. It includes multiple-choice questions, fill-in-the-blanks, short answer questions, a paragraph writing task, and a case study.

The test covers important PSW topics including personal hygiene, respecting your own body and others’ bodies, identifying personal strengths, successful and less successful experiences, conflict and conflict resolution, communication skills, and working respectfully with others.

Memorandum included.

Total: 30 marks

Format: PDF (not editable)', 60.00, 'Grade 4', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['life-skills','natural-science-and-technology'], 30, '[{"id":"file-4863","label":"Test / Assessment PDF","filename":"grade-4-life-skills-psw-term-1-practice-test-1.pdf","storageKey":"products/06d680b5-9b2e-5393-9ef4-acf9ecf88e45/file-4863-grade-4-life-skills-psw-term-1-practice-test-1.pdf"}]'::jsonb, false, true, 4863, '{"title":"Grade 4 Life Skills PSW Term 1 Practice Test 1","description":"CAPS-aligned Grade 4 Life Skills PSW Term 1 Test 1. Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('9085ecb5-2997-5f07-88a6-ba7d69d30470', 'grade-4-afrikaans-first-additional-language-term-1-practice-test-2', 'Grade 4 Afrikaans First Additional Language Term 1 Practice Test 2', 'CAPS-aligned Grade 4 Afrikaans FAL Term 1 Test 2. Worth 40 marks , includes full memo. Instant PDF download', 'This practice test assesses the core Grade 4 Afrikaans First Additional Language skills for Term 1. It includes a literary and non-literary comprehension test, a visual text section, and a Language in Context section.

The Language section covers a variety of language skills, including selfstandige naamwoorde , byvoeglike naamwoorde , meervoude , verkleinings , sinonieme en antonieme , sinsbou en sinsoorte , werkwoorde , voegwoorde , verlede en teenwoordige tyd , alfabetiese volgorde en leestekens .

Memorandum included.

Totaal: 40 punte

Formaat: PDF (non-editable)', 60.00, 'Grade 4', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['afrikaans-first-additional-language','natural-science-and-technology'], 40, '[{"id":"file-4861","label":"Test / Assessment PDF","filename":"grade-4-afrikaans-first-additional-language-term-1-practice-test-2.pdf","storageKey":"products/9085ecb5-2997-5f07-88a6-ba7d69d30470/file-4861-grade-4-afrikaans-first-additional-language-term-1-practice-test-2.pdf"}]'::jsonb, false, true, 4861, '{"title":"Grade 4 Afrikaans First Additional Language Term 1 Practice Test 2","description":"CAPS-aligned Grade 4 Afrikaans FAL Term 1 Test 2. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('4cfba57e-c520-5e97-b10f-de7e8cde039a', 'grade-4-afrikaans-first-additional-language-term-1-practice-test-1', 'Grade 4 Afrikaans First Additional Language Term 1 Practice Test 1', 'CAPS-aligned Grade 4 Afrikaans FAL Term 1 Test. Worth 40 marks , includes full memo. Instant PDF download', 'This practice test assesses the core Grade 4 Afrikaans First Additional Language skills for Term 1 . It includes a literary and non-literary comprehension test, a visual text section, and a Language in Context section.

The Language section covers a variety of language skills, including meervoude, werkwoorde, sinonieme en antonieme, alfabetiese volgorde, sinsbou, vergelykings, sinsoorte, leestekens, voegwoorde, verlede, hede en toekomende tyd, verkleinwoorde en voorsetsels.

Memorandum included.

Totaal: 40 punte

Formaat: PDF (non-editable)', 60.00, 'Grade 4', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['afrikaans-first-additional-language','natural-science-and-technology'], 40, '[{"id":"file-4858","label":"Test / Assessment PDF","filename":"grade-4-afrikaans-first-additional-language-term-1-practice-test-1.pdf","storageKey":"products/4cfba57e-c520-5e97-b10f-de7e8cde039a/file-4858-grade-4-afrikaans-first-additional-language-term-1-practice-test-1.pdf"}]'::jsonb, false, true, 4858, '{"title":"Grade 4 Afrikaans First Additional Language Term 1 Practice Test 1","description":"CAPS-aligned Grade 4 Afrikaans FAL Term 1 Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('c985d767-a9f3-570c-8bdb-43e6f68d6e94', 'grade-4-english-first-additional-language-term-1-practice-tests', 'Grade 4 English First Additional Language Term 1 Practice Tests', 'CAPS-aligned Grade 4 English FAL Term 1 Tests. Includes a narrative essay and practice test. Worth 40 marks , includes full memo. Instant PDF download', 'This practice resource assesses the key Grade 4 English First Additional Language skills for Term 1 and includes two assessment tasks : a Narrative Essay and a Language Test (Response to Texts).

The Narrative Essay task guides learners through planning, drafting, and writing a short narrative, supported by a clear marking rubric. Learners are required to write a structured essay with an introduction, body, and conclusion, using descriptive language and adverbs.

The Language Test includes a Reading Comprehension based on a narrative text, a Visual Text Analysis section using an advertisement, and a Language in Context section. Language skills assessed include verb tenses, nouns, pronouns, adjectives, prepositions, punctuation, sentence types, spelling, figurative language, and sentence rewriting.

Full memoranda and a writing rubric are included to support marking and feedback.

Total: 40 marks (Language Test) + 20 marks (Narrative Essay)

Format: PDF (not editable)', 60.00, 'Grade 4', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['english-first-additional-language','natural-science-and-technology'], 40, '[{"id":"file-4855","label":"Test / Assessment PDF","filename":"grade-4-english-first-additional-language-term-1-practice-tests.pdf","storageKey":"products/c985d767-a9f3-570c-8bdb-43e6f68d6e94/file-4855-grade-4-english-first-additional-language-term-1-practice-tests.pdf"}]'::jsonb, false, true, 4855, '{"title":"Grade 4 English First Additional Language Term 1 Practice Tests","description":"CAPS-aligned Grade 4 English FAL Term 1 Tests. Includes a narrative essay and practice test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('19ec96b3-1826-5145-9173-b903e33ba5d5', 'grade-4-english-home-language-term-1-practice-test-2', 'Grade 4 English Home Language Term 1 Practice Test 2', 'CAPS-aligned Grade 4 English HL Term 1 Test 2. Worth 40 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 4 English Home Language skills for Term 1. It includes a Reading Comprehension based on a narrative text, a Visual Literacy section using an advertisement, and a Language Structures and Conventions section.

The Language section covers a range of grammar and language skills, including articles, common and abstract nouns, verbs, adjectives, similes and metaphors, idioms, synonyms, punctuation, personal and possessive pronouns, sentence types, and forming simple and complex sentences.

A full memorandum is included to support marking and feedback.

Total: 40 marks

Format: PDF (not editable)', 60.00, 'Grade 4', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['english-home-language','natural-science-and-technology'], 40, '[{"id":"file-4852","label":"Test / Assessment PDF","filename":"grade-4-english-home-language-term-1-practice-test-2.pdf","storageKey":"products/19ec96b3-1826-5145-9173-b903e33ba5d5/file-4852-grade-4-english-home-language-term-1-practice-test-2.pdf"}]'::jsonb, false, true, 4852, '{"title":"Grade 4 English Home Language Term 1 Practice Test 2","description":"CAPS-aligned Grade 4 English HL Term 1 Test 2. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('c631ef3f-7b66-524e-88ff-1a0bd7d7a0e4', 'grade-4-english-home-language-test', 'Grade 4 English Home Language Term 1 Practice Test 1', 'CAPS-aligned Grade 4 English HL Term 1 Test. Worth 40 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 4 English Home Language skills for Term 1. It includes a Reading Comprehension based on a narrative text ( The Rainbow Fish ), a Visual Text section using an advertisement, and a Language Structures and Conventions section.

The Language section covers a range of grammar and language skills, including vocabulary in context, nouns, pronouns, verbs, adverbs, conjunctions, verb tenses (past, present, and future), punctuation, antonyms, and identifying figurative language such as alliteration and similes.

A full memorandum is included to support marking and feedback.

Total: 40 marks

Format: PDF (not editable)', 60.00, 'Grade 4', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['english-home-language','natural-science-and-technology'], 40, '[{"id":"file-4817","label":"Test / Assessment PDF","filename":"grade-4-english-home-language-test.pdf","storageKey":"products/c631ef3f-7b66-524e-88ff-1a0bd7d7a0e4/file-4817-grade-4-english-home-language-test.pdf"}]'::jsonb, false, true, 4817, '{"title":"Grade 4 English Home Language Term 1 Practice Test 1","description":"CAPS-aligned Grade 4 English HL Term 1 Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('b5ee0d87-c6dd-5c85-8d06-cc4b60fcc70e', 'grade-4-nst-june-test', 'Grade 4 Natural Science & Technology June Test', 'CAPS-aligned Grade 4 NST June Test. Worth 40 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 4 Natural Science and Technology content for Term 2 and is suitable for June examination preparation. It includes labelling activities, fill-in-the-blanks, true or false questions, short answer questions, diagram interpretation, and extended response questions.

The test covers important NST topics including living and non-living things, basic life processes, animal shelters, states of matter, raw materials and manufactured materials, the water cycle, properties of materials, and evaluating the strength and design of structures. Learners are required to explain concepts, interpret diagrams, and apply their understanding in context.

A full memorandum is included to support marking and feedback.

Total: 40 marks

Format: PDF (not editable)', 60.00, 'Grade 4', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 40, '[{"id":"file-4814","label":"Test / Assessment PDF","filename":"grade-4-nst-june-test.pdf","storageKey":"products/b5ee0d87-c6dd-5c85-8d06-cc4b60fcc70e/file-4814-grade-4-nst-june-test.pdf"}]'::jsonb, false, true, 4814, '{"title":"Grade 4 Natural Science & Technology June Test","description":"CAPS-aligned Grade 4 NST June Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('eb2efb79-5619-5ed9-ae3d-e7d9cd78acf4', 'grade-4-nst-term-2-practice-test', 'Grade 4 Natural Science & Technology Term 2 Practice Test', 'CAPS-aligned Grade 4 NST Term 2 Test. Worth 40 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 4 Natural Science and Technology content for Term 2. It includes multiple-choice questions, true or false questions, fill-in-the-blanks, labelling diagrams, matching activities, and short answer questions.

The test covers important NST topics including states of matter, properties of solids, liquids and gases, changes of state, the water cycle, raw materials and manufactured materials, properties of materials, and different types of structures (natural and man-made, frame and shell structures).

A full memorandum is included to support marking and feedback.

Total: 40 marks

Format: PDF (not editable)', 60.00, 'Grade 4', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 40, '[{"id":"file-4810","label":"Test / Assessment PDF","filename":"grade-4-nst-term-2-practice-test.pdf","storageKey":"products/eb2efb79-5619-5ed9-ae3d-e7d9cd78acf4/file-4810-grade-4-nst-term-2-practice-test.pdf"}]'::jsonb, false, true, 4810, '{"title":"Grade 4 Natural Science & Technology Term 2 Practice Test","description":"CAPS-aligned Grade 4 NST Term 2 Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('a89ca483-7626-51c7-be39-228e113c14fa', 'grade-4-mathematics-june-test', 'Grade 4 Mathematics June Test', 'CAPS-aligned Grade 4 Mathematics June Test. Worth 50 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 4 Mathematics content for Term 2 and is suitable for June examination preparation. It includes questions on number ordering, number patterns, rounding off, the four operations, numeric and geometric patterns, word problems, ratios, rate, and flow diagrams.

The test covers important Mathematics skills including whole numbers, place value, rounding to the nearest 10, 100 and 1 000, addition, subtraction, multiplication and division, identifying and describing patterns, ratio and rate problems, and solving real-life word problems. Learners are required to show working and apply reasoning across a range of question types.

A full memorandum is included to support marking and feedback.

Total: 50 marks

Format: PDF (not editable)', 60.00, 'Grade 4', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 50, '[{"id":"file-4808","label":"Test / Assessment PDF","filename":"grade-4-mathematics-june-test.pdf","storageKey":"products/a89ca483-7626-51c7-be39-228e113c14fa/file-4808-grade-4-mathematics-june-test.pdf"}]'::jsonb, false, true, 4808, '{"title":"Grade 4 Mathematics June Test","description":"CAPS-aligned Grade 4 Mathematics June Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('523c77bf-f6e6-525c-8833-70f6a484d955', 'grade-4-mathematics-term-2-practice-test', 'Grade 4 Mathematics Term 2 Practice Test', 'CAPS-aligned Grade 4 Mathematics Term 2 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 4 Mathematics content for Term 2. It includes questions on whole numbers, addition and subtraction, multiplication and division, numeric and geometric patterns, and word problems.

The test covers important Mathematics skills including place value, rounding off, number names, odd and even numbers, addition and subtraction strategies, multiplication and division methods (including doubling and halving), numeric and geometric patterns, and solving word problems in context. Learners are required to show all working and apply logical reasoning across a range of question types.

A full memorandum is included to support marking and feedback.

Total: 50 marks

Format: PDF (not editable)', 60.00, 'Grade 4', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 50, '[{"id":"file-4804","label":"Test / Assessment PDF","filename":"grade-4-mathematics-term-2-practice-test.pdf","storageKey":"products/523c77bf-f6e6-525c-8833-70f6a484d955/file-4804-grade-4-mathematics-term-2-practice-test.pdf"}]'::jsonb, false, true, 4804, '{"title":"Grade 4 Mathematics Term 2 Practice Test","description":"CAPS-aligned Grade 4 Mathematics Term 2 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('2cd7a230-ffb7-5d86-945a-96e68a76ae36', 'grade-4-geography-june-test', 'Grade 4 Geography June Test', 'CAPS-aligned Grade 4 Geography June Test. Worth 25 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 4 Geography content for Term 2 and is suitable for June examination preparation. It includes true or false questions, short answer questions, map-reading activities, interpreting a settlement map, identifying natural and man-made features, and a paragraph writing task.

The test covers important Geography topics including settlements (urban and rural), types of settlements, needs and services, map symbols and compass directions, provinces of South Africa, rivers and oceans, and describing differences between urban and rural areas. Learners are required to apply map skills, geographical knowledge, and written explanations.

A full memorandum is included to support marking and feedback.

Total: 25 marks

Format: PDF (not editable)', 60.00, 'Grade 4', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','geography'], 25, '[{"id":"file-4800","label":"Test / Assessment PDF","filename":"grade-4-geography-june-test.pdf","storageKey":"products/2cd7a230-ffb7-5d86-945a-96e68a76ae36/file-4800-grade-4-geography-june-test.pdf"}]'::jsonb, false, true, 4800, '{"title":"Grade 4 Geography June Test","description":"CAPS-aligned Grade 4 Geography June Test. Worth 25 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('a18266b1-8a30-5dfb-8de4-99433cb088be', 'grade-4-geography-term-2-practice-test', 'Grade 4 Geography Term 2 Practice Test', 'CAPS-aligned Grade 4 Geography Term 2 Test. Worth 30 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 4 Geography content for Term 2. It includes map work questions, drawing and interpreting maps, compass directions, continent identification, short answer questions, matching activities, and route description tasks.

The test covers important Term 2 Geography topics including map symbols and keys, compass directions, continents of the world, provinces of South Africa, enclaves, grid references, plan and side views, and giving directions using maps. Learners are required to apply their knowledge through practical map skills and real-life scenarios.

A full memorandum is included to support marking and feedback.

Total: 30 marks

Format: PDF (not editable)', 60.00, 'Grade 4', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','geography'], 30, '[{"id":"file-4796","label":"Test / Assessment PDF","filename":"grade-4-geography-term-2-practice-test.pdf","storageKey":"products/a18266b1-8a30-5dfb-8de4-99433cb088be/file-4796-grade-4-geography-term-2-practice-test.pdf"}]'::jsonb, false, true, 4796, '{"title":"Grade 4 Geography Term 2 Practice Test","description":"CAPS-aligned Grade 4 Geography Term 2 Test. Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('770185f7-0b66-5a22-b8a5-516756ba8cb8', 'grade-4-history-june-test', 'Grade 4 History June Test', 'CAPS-aligned Grade 4 History June Test. Worth 25 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 4 History content for Term 2 and is suitable for June examination preparation. It includes multiple-choice questions, true or false questions, short answer questions, a column-matching activity, and a paragraph writing task.

The test focuses on local history , covering sources of historical information such as photographs, written records, stories and interviews, and artefacts. Learners explore how these sources help us understand life in the past, technology and daily life, and the history of places in their local community.

A full memorandum is included to support marking and feedback.

Total: 25 marks

Format: PDF (not editable)', 60.00, 'Grade 4', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','history'], 25, '[{"id":"file-4794","label":"Test / Assessment PDF","filename":"grade-4-history-june-test.pdf","storageKey":"products/770185f7-0b66-5a22-b8a5-516756ba8cb8/file-4794-grade-4-history-june-test.pdf"}]'::jsonb, false, true, 4794, '{"title":"Grade 4 History June Test","description":"CAPS-aligned Grade 4 History June Test. Worth 25 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('8efa78c4-a433-5614-b0cf-e80a61cd6086', 'grade-4-history-term-2-practice-tes', 'Grade 4 History Term 2 Practice Test', 'CAPS-aligned Grade 4 History Term 2 Test. Worth 30 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 4 History content for Term 2. It includes multiple-choice questions, true or false questions, short answer questions, source-based questions, and a paragraph writing task.

The test covers important Term 2 History topics focusing on leadership and good leaders, including Nelson Mandela and Mahatma Gandhi. Learners explore leadership qualities, teamwork, courage and dedication, and apply their understanding through real-life scenarios and source-based activities.

A full memorandum is included to support marking and feedback.

Total: 30 marks

Format: PDF (not editable)', 60.00, 'Grade 4', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','history'], 30, '[{"id":"file-4791","label":"Test / Assessment PDF","filename":"grade-4-history-term-2-practice-tes.pdf","storageKey":"products/8efa78c4-a433-5614-b0cf-e80a61cd6086/file-4791-grade-4-history-term-2-practice-tes.pdf"}]'::jsonb, false, true, 4791, '{"title":"Grade 4 History Term 2 Practice Test","description":"CAPS-aligned Grade 4 History Term 2 Test. Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('0a3fe857-7817-5ddd-80aa-b34564177f5b', 'grade-4-life-skills-june-test', 'Grade 4 Life Skills PSW June Test', 'CAPS-aligned Grade 4 Life Skills PSW June Test. Worth 30 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 4 Life Skills Personal and Social Well-being (PSW) content for Term 2 and is suitable for June examination preparation. It includes matching activities, fill-in-the-blanks, short answer questions, and a case study.

The test covers important PSW topics including personal hygiene, sharing feelings, respect for others, strengths and challenges, children’s rights, healthy living, working in groups, and bullying awareness and prevention. Learners are required to apply their understanding through real-life scenarios and problem-solving questions.

A full memorandum is included to support marking and feedback.

Total: 30 marks

Format: PDF (not editable)', 60.00, 'Grade 4', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['life-skills','natural-science-and-technology'], 30, '[{"id":"file-4788","label":"Test / Assessment PDF","filename":"grade-4-life-skills-june-test.pdf","storageKey":"products/0a3fe857-7817-5ddd-80aa-b34564177f5b/file-4788-grade-4-life-skills-june-test.pdf"}]'::jsonb, false, true, 4788, '{"title":"Grade 4 Life Skills PSW June Test","description":"CAPS-aligned Grade 4 Life Skills PSW June Test. Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('7fcd8661-e7f2-5562-96d9-2461e8caef2a', 'grade-4-life-skills-psw-term-2-practice-test', 'Grade 4 Life Skills PSW Term 2 Practice Test', 'CAPS-aligned Grade 4 Life Skills PSW Term 2 Test. Worth 30 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 4 Life Skills Personal and Social Well-being (PSW) content for Term 2. It includes comprehension-based questions, short answer questions, scenario-based questions, and visual stimulus questions.

The test covers important PSW topics including emotions and feelings, dealing with frustration, conflict resolution, bullying and cyberbullying, expressing feelings in a healthy way, rights and responsibilities, and working effectively in groups.

A full memorandum is included to support marking and feedback.

Total: 30 marks

Format: PDF (not editable)', 60.00, 'Grade 4', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['life-skills','natural-science-and-technology'], 30, '[{"id":"file-4784","label":"Test / Assessment PDF","filename":"grade-4-life-skills-psw-term-2-practice-test.pdf","storageKey":"products/7fcd8661-e7f2-5562-96d9-2461e8caef2a/file-4784-grade-4-life-skills-psw-term-2-practice-test.pdf"}]'::jsonb, false, true, 4784, '{"title":"Grade 4 Life Skills PSW Term 2 Practice Test","description":"CAPS-aligned Grade 4 Life Skills PSW Term 2 Test. Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('1798612f-b97a-5995-a041-068751ba5b86', 'grade-4-afrikaans-fal-june-test', 'Grade 4 Afrikaans FAL June Test', 'CAPS-aligned Grade 4 Afrikaans FAL June Test. Worth 50 marks , includes full memo. Instant PDF download', 'This practice test assesses the core Grade 4 Afrikaans First Additional Language skills for Term 2 and is suitable for June examination preparation. It includes a literary and non-literary comprehension test, a visual text section, a summary task, and a Language in Context section. Set to the 2026 ATP.

The Language section covers a variety of language skills, including meervoude, voornaamwoorde, verlede en toekomende tyd, ontkennende vorme, verkleinwoorde, teenoorgesteldes, woordeskat, voorsetsels en basiese taalredigering.

Memorandum included.

Total: 50 marks

PDF Format (nion-editable)

Copyright © Designing Minds. This resource is for personal use only and may not be shared, distributed, or resold in any form.', 60.00, 'Grade 4', 'Term 2', '2026', 'Individual Resource', 'Summary', array['afrikaans-first-additional-language','natural-science-and-technology'], 50, '[{"id":"file-4781","label":"Summary PDF","filename":"grade-4-afrikaans-fal-june-test.pdf","storageKey":"products/1798612f-b97a-5995-a041-068751ba5b86/file-4781-grade-4-afrikaans-fal-june-test.pdf"}]'::jsonb, false, true, 4781, '{"title":"Grade 4 Afrikaans FAL June Test","description":"CAPS-aligned Grade 4 Afrikaans FAL June Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('7d70e66a-9c67-5d72-922b-260b158bf2df', 'grade-4-afrikaans-first-additional-language-term-2-practice-test', 'Grade 4 Afrikaans First Additional Language Term 2 Practice Test', 'CAPS-aligned Grade 4 Afrikaans FAL Term 2 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This practice test assesses the core Grade 4 Afrikaans First Additional Language skills for Term 2. It includes a literary and non-literary comprehension test, a visual text section, a summary activity, and a Language in Context section. Set to the 2026 ATP.

The Language section covers a variety of language skills, including meervoude, sinonieme en antonieme, voornaamwoorde, voegwoorde, bywoorde, leestekens, voorsetsels, spelling, ontkenning, verlede tyd, lidwoorde, trappe van vergelyking en byvoeglike naamwoorde.

Memorandum included.

Total: 50 marks

PDF format (non-editable)

Copyright © Designing Minds. This resource is for personal use only and may not be shared, distributed, or resold in any form.', 60.00, 'Grade 4', 'Term 2', '2026', 'Individual Resource', 'Summary', array['afrikaans-first-additional-language','natural-science-and-technology'], 50, '[{"id":"file-4779","label":"Summary PDF","filename":"grade-4-afrikaans-first-additional-language-term-2-practice-test.pdf","storageKey":"products/7d70e66a-9c67-5d72-922b-260b158bf2df/file-4779-grade-4-afrikaans-first-additional-language-term-2-practice-test.pdf"}]'::jsonb, false, true, 4779, '{"title":"Grade 4 Afrikaans First Additional Language Term 2 Practice Test","description":"CAPS-aligned Grade 4 Afrikaans FAL Term 2 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('d792e7b6-8c63-555e-a71c-7454631c13b0', 'grade-4-english-fal-june-test', 'Grade 4 English FAL June Test', 'CAPS-aligned Grade 4 English FAL June Test. Worth 40 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 4 English First Additional Language skills for Term 2 and is suitable for June examination preparation. It includes a Reading Comprehension based on a dialogue, a Visual Text section using a bar graph and a poster, a Summary Writing task, and a Language section.

The Language section covers a range of grammar and language skills, including verb tenses (past and future), direct speech and punctuation, capital letters and sentence punctuation, uncountable nouns, synonyms, transitive verbs, finite and infinite verbs, conjunctions, and identifying personification.

Memorandum included.

Total: 40 marks

Format: PDF (not editable)

Copyright © Designing Minds. This resource is for personal use only and may not be shared, distributed, or resold in any form.', 60.00, 'Grade 4', 'Term 2', '2026', 'Individual Resource', 'Summary', array['english-first-additional-language','natural-science-and-technology'], 40, '[{"id":"file-4776","label":"Summary PDF","filename":"grade-4-english-fal-june-test.pdf","storageKey":"products/d792e7b6-8c63-555e-a71c-7454631c13b0/file-4776-grade-4-english-fal-june-test.pdf"}]'::jsonb, false, true, 4776, '{"title":"Grade 4 English FAL June Test","description":"CAPS-aligned Grade 4 English FAL June Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('e8def2e6-2dc6-52c9-9329-4989a593aa3d', 'grade-4-english-first-add-language-term-2-practice-test', 'Grade 4 English First Additional Language Term 2 Practice Test', 'CAPS-aligned Grade 4 English FAL Term 2 Test. Worth 40 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 4 English First Additional Language skills for Term 2. It includes a Reading Comprehension based on a narrative text, a Visual Literacy section using an advertisement, a Summary Writing task, and a Language Structures and Conventions section.

The Language section covers a range of grammar and language skills, including punctuation, sentence types, direct speech, verb tenses (simple past and future), singular and plural nouns, conjunctions, subject–verb agreement, and identifying alliteration.

Memorandum included.

Total: 40 marks

Format: PDF (not editable)

Copyright © Designing Minds. This resource is for personal use only and may not be shared, distributed, or resold in any form.', 60.00, 'Grade 4', 'Term 2', '2026', 'Individual Resource', 'Summary', array['english-first-additional-language','natural-science-and-technology'], 40, '[{"id":"file-4772","label":"Summary PDF","filename":"grade-4-english-first-add-language-term-2-practice-test.pdf","storageKey":"products/e8def2e6-2dc6-52c9-9329-4989a593aa3d/file-4772-grade-4-english-first-add-language-term-2-practice-test.pdf"}]'::jsonb, false, true, 4772, '{"title":"Grade 4 English First Additional Language Term 2 Practice Test","description":"CAPS-aligned Grade 4 English FAL Term 2 Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('1942163b-461b-5082-8841-fdebcc427e03', 'grade-4-english-hl-june-test', 'Grade 4 English HL June Test', 'CAPS-aligned Grade 4 English HL June Test. Worth 40 marks , includes full memo. Instant PDF download', 'This practice test assesses the Language skills for Term 2 and is suitable for June examination preparation. It includes a Reading Comprehension based on a dialogue, a Visual Text section using a bar graph and a poster, a Summary Writing task, and a Language section. Set to the 2026 ATP.

The Language section covers a range of grammar and language skills, including verb tenses, articles, adjectives (degrees of comparison), possessive pronouns, punctuation, synonyms, uncountable nouns, identifying subjects and predicates, and recognising simple sentences.

Memorandum included.

Total: 40 marks

Format: PDF (not editable)

Copyright © Designing Minds. This resource is for personal use only and may not be shared, distributed, or resold in any form.', 60.00, 'Grade 4', 'Term 2', '2026', 'Individual Resource', 'Summary', array['english-home-language','natural-science-and-technology'], 40, '[{"id":"file-4769","label":"Summary PDF","filename":"grade-4-english-hl-june-test.pdf","storageKey":"products/1942163b-461b-5082-8841-fdebcc427e03/file-4769-grade-4-english-hl-june-test.pdf"}]'::jsonb, false, true, 4769, '{"title":"Grade 4 English HL June Test","description":"CAPS-aligned Grade 4 English HL June Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('d6e2f69c-bc96-52c9-9abf-14dda5dde39a', 'grade-4-english-hl-term-2-practice-test', 'Grade 4 English Home Language Term 2 Practice Test', 'CAPS-aligned Grade 4 English HL Term 2 Test. Worth 40 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 4 English Home Language skills for Term 2. It includes a Reading Comprehension based on a narrative text, a Visual Literacy section using an advertisement, a Summary Writing task, and a Language Structures and Conventions section.

Set to the 2026 ATP.

The Language section covers a range of grammar and language skills, including verb tenses (simple present, past and future), punctuation, transitive and intransitive verbs, proverbs and idioms, similes and metaphors, sentence types, and identifying finite and infinite verbs.

Memorandum included.

Total: 40 marks

Format: PDF (not editable)

Copyright © Designing Minds. This resource is for personal use only and may not be shared, distributed, or resold in any form.', 60.00, 'Grade 4', 'Term 2', '2026', 'Individual Resource', 'Summary', array['english-home-language','natural-science-and-technology'], 40, '[{"id":"file-4734","label":"Summary PDF","filename":"grade-4-english-hl-term-2-practice-test.pdf","storageKey":"products/d6e2f69c-bc96-52c9-9abf-14dda5dde39a/file-4734-grade-4-english-hl-term-2-practice-test.pdf"}]'::jsonb, false, true, 4734, '{"title":"Grade 4 English Home Language Term 2 Practice Test","description":"CAPS-aligned Grade 4 English HL Term 2 Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('e090ae4e-8959-5e15-89de-63b3c1706f4e', 'grade-6-mathematics-june-test', 'Grade 6 Mathematics June Test', 'CAPS-aligned Grade 6 Mathematics June Test. Worth 50 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 6 Mathematics content for Term 2 and is suitable for June examination preparation. It includes questions on whole numbers, fractions and decimals, numeric and geometric patterns, and word problems.

The test covers important Mathematics skills including calculations with whole numbers, operations with fractions and decimals, ordering and simplifying fractions, number sentences, pattern recognition, reasoning, and problem-solving in context. Learners are required to show working and apply their understanding across a range of question types.

A full memorandum is included to support marking and feedback.

Total: 50 marks

Format: PDF (not editable)', 60.00, 'Grade 6', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 50, '[{"id":"file-4731","label":"Test / Assessment PDF","filename":"grade-6-mathematics-june-test.pdf","storageKey":"products/e090ae4e-8959-5e15-89de-63b3c1706f4e/file-4731-grade-6-mathematics-june-test.pdf"}]'::jsonb, false, true, 4731, '{"title":"Grade 6 Mathematics June Test","description":"CAPS-aligned Grade 6 Mathematics June Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('7f429a21-66fc-534e-bec5-d0a7c0084c19', 'grade-6-mathematics-term-2-practice-test', 'Grade 6 Mathematics Term 2 Practice Test', 'CAPS-aligned Grade 6 Mathematics Term 2 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 6 Mathematics content for Term 2. It includes a range of question types such as multiple-choice questions, number line work, calculations, word problems, diagrams, and pattern investigations.

The test covers important Term 2 Mathematics topics including whole numbers and percentages, number lines, fractions and operations, fractions in context, decimals, and numeric and geometric patterns. Learners are required to apply calculation skills, show understanding of number concepts, and solve problems using reasoning and logical thinking.

A full memorandum is included to support marking and feedback.

Total: 50 marks

Format: PDF (not editable)', 60.00, 'Grade 6', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 50, '[{"id":"file-4727","label":"Test / Assessment PDF","filename":"grade-6-mathematics-term-2-practice-test.pdf","storageKey":"products/7f429a21-66fc-534e-bec5-d0a7c0084c19/file-4727-grade-6-mathematics-term-2-practice-test.pdf"}]'::jsonb, false, true, 4727, '{"title":"Grade 6 Mathematics Term 2 Practice Test","description":"CAPS-aligned Grade 6 Mathematics Term 2 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('7ba11421-04d4-5bab-b111-e0b3dae5d320', 'grade-6-nst-june-test', 'Grade 6 NST June Test', 'CAPS-aligned Grade 6 NST June Test. Worth 50 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 6 Natural Science and Technology content for Term 2 and is suitable for June examination preparation. It includes multiple-choice questions, true or false questions, fill-in-the-blanks, matching activities, short answer questions, diagrams, extended response questions, and a case study.

The test covers important NST topics including photosynthesis, nutrition and healthy living, states of matter and particle movement, mixtures and solutions, ecosystems and food webs, water pollution, and water purification processes. Learners are also required to apply their knowledge through explanations, diagrams, and real-life problem-solving questions.

A full memorandum is included to support marking and feedback.

Total: 50 marks

Format: PDF (not editable)', 60.00, 'Grade 6', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 50, '[{"id":"file-4724","label":"Test / Assessment PDF","filename":"grade-6-nst-june-test.pdf","storageKey":"products/7ba11421-04d4-5bab-b111-e0b3dae5d320/file-4724-grade-6-nst-june-test.pdf"}]'::jsonb, false, true, 4724, '{"title":"Grade 6 NST June Test","description":"CAPS-aligned Grade 6 NST June Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('aa9a364c-6f38-5c08-bf99-699a4493da42', 'grade-6-nst-term-2-practice-test', 'Grade 6 NST Term 2 Practice Test', 'CAPS-aligned Grade 6 NST Term 2 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 6 Natural Science and Technology content for Term 2. It includes multiple-choice questions, true or false questions, scientific terminology, short answer questions, diagrams, and extended response questions.

The test covers important Term 2 NST topics including states of matter, properties of solids, liquids and gases, mixtures and solutions, changes of state, water purification processes, food processing methods (such as drying and pickling), particle movement, and the importance of water resources.

A full memorandum is included to support marking and feedback.

Total: 50 marks

Format: PDF (not editable)', 60.00, 'Grade 6', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 50, '[{"id":"file-4721","label":"Test / Assessment PDF","filename":"grade-6-nst-term-2-practice-test.pdf","storageKey":"products/aa9a364c-6f38-5c08-bf99-699a4493da42/file-4721-grade-6-nst-term-2-practice-test.pdf"}]'::jsonb, false, true, 4721, '{"title":"Grade 6 NST Term 2 Practice Test","description":"CAPS-aligned Grade 6 NST Term 2 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('17154cc7-924e-5571-9150-a7237d5032f6', 'grade-6-geography-june-test', 'Grade 6 Geography June Test', 'CAPS-aligned Grade 6 Geography June Test. Worth 40 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 6 Geography content for Term 2 and is suitable for June examination preparation. It includes map skills questions, distance and scale calculations, hemispheres, trade and fair trade concepts, and a paragraph writing task.

The test covers important Geography topics including latitude and longitude, map scales, measuring distance using a map, hemispheres, trade and fair trade, raw materials and manufactured goods, and how trade contributes to economic development. Learners also engage with a real-world case study on fair trade and its impact on farmers.

A full memorandum is included to support marking and feedback.

Total: 40 marks

Format: PDF (not editable)', 60.00, 'Grade 6', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','geography'], 40, '[{"id":"file-4718","label":"Test / Assessment PDF","filename":"grade-6-geography-june-test.pdf","storageKey":"products/17154cc7-924e-5571-9150-a7237d5032f6/file-4718-grade-6-geography-june-test.pdf"}]'::jsonb, false, true, 4718, '{"title":"Grade 6 Geography June Test","description":"CAPS-aligned Grade 6 Geography June Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('d9af1aca-fdcb-5577-b49a-b767e2339111', 'grade-6-geography-term-2-practice-test', 'Grade 6 Geography Term 2 Practice Test', 'CAPS-aligned Grade 6 Geography Term 2 Test. Worth 40 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 6 Geography content for Term 2. It includes multiple-choice questions, short answer questions, matching columns, and case study–based questions.

The test covers important Term 2 Geography topics including trade concepts, imports and exports, primary, secondary and manufactured goods, raw materials, infrastructure, reasons for trade, and how resources change value through manufacturing. Learners also engage with real-world case studies related to trade and manufacturing.

The test is clearly structured with instructions and mark allocation and assesses lower-, middle-, and higher-order thinking skills. A full memorandum is included to support marking and feedback.

Total: 40 marks

Format: PDF (not editable)', 60.00, 'Grade 6', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','geography'], 40, '[{"id":"file-4715","label":"Test / Assessment PDF","filename":"grade-6-geography-term-2-practice-test.pdf","storageKey":"products/d9af1aca-fdcb-5577-b49a-b767e2339111/file-4715-grade-6-geography-term-2-practice-test.pdf"}]'::jsonb, false, true, 4715, '{"title":"Grade 6 Geography Term 2 Practice Test","description":"CAPS-aligned Grade 6 Geography Term 2 Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('63452eb9-32fd-500c-866f-b0d5f2bda5eb', 'grade-6-history-june-test', 'Grade 6 History June Test', 'CAPS-aligned Grade 6 History June Test. Worth 40 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 6 History content for Term 2 and is suitable for June examination preparation. It includes a range of source-based questions, picture matching, map-based questions, short answer questions, and a paragraph writing task.

The test covers important Term 2 History topics including early settlements in the Limpopo Valley, Mapungubwe and trade, the significance of the golden rhinoceros, European exploration and trade, Bartolomeu Dias, Vasco da Gama, and the impact of European exploration on global trade.

A full memorandum is included to support marking and feedback.

Total: 40 marks

Format: PDF (not editable)', 60.00, 'Grade 6', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','history'], 40, '[{"id":"file-4710","label":"Test / Assessment PDF","filename":"grade-6-history-june-test.pdf","storageKey":"products/63452eb9-32fd-500c-866f-b0d5f2bda5eb/file-4710-grade-6-history-june-test.pdf"}]'::jsonb, false, true, 4710, '{"title":"Grade 6 History June Test","description":"CAPS-aligned Grade 6 History June Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('00a56ea1-48e6-5787-b329-173a85f1407f', 'grade-6-history-term-2-practice-test', 'Grade 6 History Term 2 Practice Test', 'CAPS-aligned Grade 6 History Term 2 Test. Worth 40 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 6 History content for Term 2. It includes a range of question types such as multiple-choice questions, short answer questions, a case study, fill-in-the-missing-words, true or false questions, source-based questions, and a paragraph writing task.

The test covers important Term 2 History topics including the European Renaissance, inventions and religion, European exploration, Bartolomeu Dias and the Khoikhoi, Vasco da Gama, and Galileo Galilei.

The test is clearly structured with instructions and mark allocation and assesses lower-, middle-, and higher-order thinking skills. A full memorandum is included to support marking and feedback.

Total: 40 marks

Format: PDF (not editable)', 60.00, 'Grade 6', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','history'], 40, '[{"id":"file-4707","label":"Test / Assessment PDF","filename":"grade-6-history-term-2-practice-test.pdf","storageKey":"products/00a56ea1-48e6-5787-b329-173a85f1407f/file-4707-grade-6-history-term-2-practice-test.pdf"}]'::jsonb, false, true, 4707, '{"title":"Grade 6 History Term 2 Practice Test","description":"CAPS-aligned Grade 6 History Term 2 Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('de5c8605-bc20-5cca-999a-c7304a1697e4', 'grade-6-life-skills-psw-june-test', 'Grade 6 Life Skills PSW June Test', 'CAPS-aligned Grade 6 Life Skills June Test. Worth 30 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 6 Life Skills Personal and Social Well-being (PSW) content for Term 2 and is suitable for June examination preparation. It includes a variety of question types such as matching concepts, fill-in-the-blanks, short answer and multiple-choice questions, true or false questions, peer pressure scenarios, a case study, and a conflict-resolution comprehension section.

The test covers important PSW topics including self-esteem and body image, culture and rites of passage, bullying, responsibilities at school, peer pressure, decision-making, conflict resolution, mediation, and peacekeeping skills.

A full memorandum is included to support marking and feedback.

Total: 30 marks

Format: PDF (not editable)', 60.00, 'Grade 6', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['life-skills','natural-science-and-technology'], 30, '[{"id":"file-4704","label":"Test / Assessment PDF","filename":"grade-6-life-skills-psw-june-test.pdf","storageKey":"products/de5c8605-bc20-5cca-999a-c7304a1697e4/file-4704-grade-6-life-skills-psw-june-test.pdf"}]'::jsonb, false, true, 4704, '{"title":"Grade 6 Life Skills PSW June Test","description":"CAPS-aligned Grade 6 Life Skills June Test. Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('0d005042-cf0e-5d1f-89c8-847eafb33425', 'grade-6-life-skills-psw-term-2-practice-test', 'Grade 6 Life Skills PSW Term 2 Practice Test', 'CAPS-aligned Grade 6 Life Skills PSW Term 2 Test. Worth 30 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 6 Life Skills Personal and Social Well-being (PSW) content for Term 2. It includes a range of question types such as True/False questions, matching activities, short answer questions, a case study, and questions based on cultural and religious practices.

The test covers important PSW topics including bullying and conflict, rites of passage, self-awareness and responsibility, peer pressure, decision-making, and cultural and religious practices.

A full memorandum is included to support marking and feedback.

Total: 30 marks

Format: PDF (not editable)', 60.00, 'Grade 6', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['life-skills','natural-science-and-technology'], 30, '[{"id":"file-4701","label":"Test / Assessment PDF","filename":"grade-6-life-skills-psw-term-2-practice-test.pdf","storageKey":"products/0d005042-cf0e-5d1f-89c8-847eafb33425/file-4701-grade-6-life-skills-psw-term-2-practice-test.pdf"}]'::jsonb, false, true, 4701, '{"title":"Grade 6 Life Skills PSW Term 2 Practice Test","description":"CAPS-aligned Grade 6 Life Skills PSW Term 2 Test. Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('03b0cd97-d12d-5b13-b83b-198cca3e8f41', 'grade-6-afrikaans-first-additional-language-june-test', 'Grade 6 Afrikaans First Additional Language June Test', 'CAPS-aligned Grade 6 Afrikaans First Additional Language June Test. Worth 50 marks , includes full memo. Instant PDF download', 'Hierdie praktyktoets assesseer die kern Graad 6 Afrikaans Eerste Addisionele Taal vaardighede vir Kwartaal 2 en is geskik vir Junie-eksamenvoorbereiding. Dit sluit ’n Begrip-afdeling (literêr en nie-literêr), ’n Visuele Teks-afdeling, ’n Opsommingstaak en ’n Taal in Konteks-afdeling in.

Die Taal-afdeling dek verskeie taalvaardighede, insluitend werkwoorde, meervoude, verkleinings, byvoeglike naamwoorde, komma-gebruik, direkte en indirekte rede, verlede en toekomende tyd, sinssoorte en basiese taalredigering.

’n Volledige memorandum is ingesluit om nasien en terugvoer te ondersteun.

Totaal: 50 punte

Formaat: PDF (nie wysigbaar nie)', 60.00, 'Grade 6', 'Any Term', '2026', 'Individual Resource', 'Test / Assessment', array['afrikaans-first-additional-language','natural-science-and-technology'], 50, '[{"id":"file-4697","label":"Test / Assessment PDF","filename":"grade-6-afrikaans-first-additional-language-june-test.pdf","storageKey":"products/03b0cd97-d12d-5b13-b83b-198cca3e8f41/file-4697-grade-6-afrikaans-first-additional-language-june-test.pdf"}]'::jsonb, false, true, 4697, '{"title":"Grade 6 Afrikaans First Additional Language June Test","description":"CAPS-aligned Grade 6 Afrikaans First Additional Language June Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('be507752-8beb-5486-8405-941bf81b2011', 'grade-6-afrikaans-first-additional-language-term-2-practice-test', 'Grade 6 Afrikaans First Additional Language Term 2 Practice Test', 'CAPS-aligned Grade 6 Afrikaans First Additional Language Term 2 Test. Worth 50 marks , includes full memo. Instant PDF download', 'Hierdie praktyktoets assesseer die kern Graad 6 Afrikaans Eerste Addisionele Taal vaardighede vir Kwartaal 2. Dit sluit ’n Begrip-afdeling (literêr en nie-literêr), ’n Visuele Teks-afdeling, ’n Opsommingstaak en ’n Taal in Konteks-afdeling in.

Die Taal-afdeling dek verskeie taalvaardighede, insluitend werkwoorde, verkleinings, verlede en toekomende tyd, sinssoorte, trappe van vergelyking, lidwoorde, voornaamwoorde, intensiewe vorme en woordeskat in konteks.

’n Volledige memorandum is ingesluit om nasien en terugvoer te ondersteun.

Totaal: 50 punte

Formaat: PDF (nie wysigbaar nie)', 60.00, 'Grade 6', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['afrikaans-first-additional-language','natural-science-and-technology'], 50, '[{"id":"file-4694","label":"Test / Assessment PDF","filename":"grade-6-afrikaans-first-additional-language-term-2-practice-test.pdf","storageKey":"products/be507752-8beb-5486-8405-941bf81b2011/file-4694-grade-6-afrikaans-first-additional-language-term-2-practice-test.pdf"}]'::jsonb, false, true, 4694, '{"title":"Grade 6 Afrikaans First Additional Language Term 2 Practice Test","description":"CAPS-aligned Grade 6 Afrikaans First Additional Language Term 2 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('35c767ee-f819-5742-b348-ee2e42511620', 'grade-6-english-first-additional-language-term-june-test', 'Grade 6 English First Additional Language June Test', 'CAPS-aligned Grade 6 English First Additional Language June Test. Worth 50 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 6 English First Additional Language skills for Term 2 and is suitable for June examination preparation. It includes a Reading Comprehension based on a narrative text, a Visual Literacy section using an advertisement, a Summary Writing task, and a Language Structures and Conventions section.

The Language section covers a range of grammar and language skills, including singular and plural nouns, collective nouns, personal pronouns, degrees of comparison, verb tenses (past, present, and future), conjunctions, sentence types, subject and predicate, figurative language (personification), and sentence rewriting.

A full memorandum is included to support marking and feedback.

Total: 50 marks

Format: PDF (not editable)', 60.00, 'Grade 6', 'Term 2', '2026', 'Individual Resource', 'Summary', array['english-first-additional-language','natural-science-and-technology'], 50, '[{"id":"file-4690","label":"Summary PDF","filename":"grade-6-english-first-additional-language-term-june-test.pdf","storageKey":"products/35c767ee-f819-5742-b348-ee2e42511620/file-4690-grade-6-english-first-additional-language-term-june-test.pdf"}]'::jsonb, false, true, 4690, '{"title":"Grade 6 English First Additional Language June Test","description":"CAPS-aligned Grade 6 English First Additional Language June Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('aef75d96-86aa-556b-a421-c80920b98070', 'grade-6-english-first-additional-language-term-2-practice-test', 'Grade 6 English First Additional Language Term 2 Practice Test', 'CAPS-aligned Grade 6 English First Additional Language Term 2 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 6 English First Additional Language skills for Term 2. It includes a Reading Comprehension based on an informational text, a Visual Literacy section using an advertisement, a Summary Writing task, and a Language Structures and Conventions section.

The Language section covers a range of grammar and language skills, including punctuation, suffixes and word roots, auxiliary verbs, determiners, adverbs of time, direct and indirect speech, verb tenses (past, present, and future), simple sentences, transitive verbs, idioms, and different types of adjectives (attributive, interrogative, and demonstrative).

A full memorandum is included to support marking and feedback.

Total: 50 marks

Format: PDF (not editable)', 60.00, 'Grade 6', 'Term 2', '2026', 'Individual Resource', 'Summary', array['english-first-additional-language','natural-science-and-technology'], 50, '[{"id":"file-4688","label":"Summary PDF","filename":"grade-6-english-first-additional-language-term-2-practice-test.pdf","storageKey":"products/aef75d96-86aa-556b-a421-c80920b98070/file-4688-grade-6-english-first-additional-language-term-2-practice-test.pdf"}]'::jsonb, false, true, 4688, '{"title":"Grade 6 English First Additional Language Term 2 Practice Test","description":"CAPS-aligned Grade 6 English First Additional Language Term 2 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('4a89cbc2-c5ad-541e-a06d-0acae41603e0', 'grade-6-english-home-language-term-june-test', 'Grade 6 English Home Language June Test', 'CAPS-aligned Grade 6 English Home Language June Test. Worth 50 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 6 English Home Language skills for Term 2 and is suitable for June examination preparation. It includes a Reading Comprehension based on a narrative text, a Visual Literacy section using an advertisement, a Summary Writing task, and a Language section.

The Language section covers a range of grammar and language skills, including adjectives (degrees of comparison), pronouns, direct and indirect speech, proverbs and idioms, regular and irregular verbs, verb tenses (past continuous), determiners, and active and passive voice.

A full memorandum is included to support marking and feedback.

Total: 50 marks

Format: PDF (not editable)', 60.00, 'Grade 6', 'Term 2', '2026', 'Individual Resource', 'Summary', array['english-home-language','natural-science-and-technology'], 50, '[{"id":"file-4684","label":"Summary PDF","filename":"grade-6-english-home-language-term-june-test.pdf","storageKey":"products/4a89cbc2-c5ad-541e-a06d-0acae41603e0/file-4684-grade-6-english-home-language-term-june-test.pdf"}]'::jsonb, false, true, 4684, '{"title":"Grade 6 English Home Language June Test","description":"CAPS-aligned Grade 6 English Home Language June Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('4cc8c045-d8c4-5dc3-9773-08dba8122fab', 'grade-6-english-hl-term-2-test', 'Grade 6 English Home Language Term 2 Practice Test', 'CAPS-aligned Grade 6 English Home Language Term 2 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This practice test assesses the key Grade 6 English Home Language skills for Term 2. It includes a Reading Comprehension based on a narrative text, a Visual Literacy section using an advertisement, a Summary Writing task, and a Language section.

The Language section covers a range of grammar and language skills, including sentence types, parts of speech, verb tenses, possessive pronouns, prepositional phrases, finite and infinitive verbs, word stems, antonyms, and basic language editing skills.

The test is clearly structured with instructions and mark allocation and assesses both lower- and higher-order thinking skills. A full memorandum is included to support marking and feedback.

50 marks.

PDF format - not editable.', 60.00, 'Grade 6', 'Term 2', '2026', 'Individual Resource', 'Summary', array['english-home-language','natural-science-and-technology'], 50, '[{"id":"file-4648","label":"Summary PDF","filename":"grade-6-english-hl-term-2-test.pdf","storageKey":"products/4cc8c045-d8c4-5dc3-9773-08dba8122fab/file-4648-grade-6-english-hl-term-2-test.pdf"}]'::jsonb, false, true, 4648, '{"title":"Grade 6 English Home Language Term 2 Practice Test","description":"CAPS-aligned Grade 6 English Home Language Term 2 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('7d30b228-10f7-58f5-9e58-f9d7a5906385', 'grade-5-mathematics-june-test', 'Grade 5 Mathematics June Test', 'CAPS & ATP-aligned Grade 5 Mathematics June Test. Worth 50 marks , includes full memo. Instant PDF download', 'This CAPS-aligned Grade 5 Mathematics Term 2 June Practice Test is designed to prepare learners for the June assessment while strengthening calculation skills, number sense and problem-solving.

The test covers:

- Whole numbers (place value, ordering and expanded notation)

- Number sentences using all four operations

- Addition and subtraction , including estimating and calculating

- Multiplication and division , including word problems

- Numeric patterns and rules

- Geometric patterns and pattern descriptions

Learners are required to show all working out and apply reasoning skills across a range of structured and application-based questions.

✔️ Total: 50 marks

✔️ Duration: 60 minutes

✔️ No calculators allowed

✔️ Includes a fully worked memorandum

✔️ Cognitive levels balanced (40% Level 1, 40% Level 2, 20% Level 3)

✔️ Ideal for June exam preparation, revision or formal assessment practice

PDF format', 60.00, 'Grade 5', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 50, '[{"id":"file-4641","label":"Test / Assessment PDF","filename":"grade-5-mathematics-june-test.pdf","storageKey":"products/7d30b228-10f7-58f5-9e58-f9d7a5906385/file-4641-grade-5-mathematics-june-test.pdf"}]'::jsonb, false, true, 4641, '{"title":"Grade 5 Mathematics June Test","description":"CAPS & ATP-aligned Grade 5 Mathematics June Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('0614c1d8-f9fc-5ce8-8924-579001d768c4', 'grade-5-math-term-2-test', 'Grade 5 Mathematics Term 2 Test', 'CAPS & ATP-aligned Grade 5 Mathematics Term 2 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This CAPS-aligned Grade 5 Mathematics Term 2 Practice Test is designed to help learners consolidate key mathematical concepts and prepare confidently for formal assessment.

The test covers:

- Place value, number representation and number patterns

- Number lines and ordering

- Calculations (addition, subtraction, multiplication and division)

- Tables and number relationships

- Financial mathematics and time

- Patterns and rules

- 3D shapes, volume and nets

- Measurement and word problems

- Data handling using a pie chart

Learners are required to clearly show all working out and apply problem-solving and reasoning skills across a variety of question types.

✔️ Total: 50 marks

✔️ Duration: 90 minutes

✔️ No calculators allowed

✔️ Includes a fully worked memorandum

✔️ Cognitive levels balanced (Levels 1–3)

✔️ Ideal for Term 2 assessment preparation, revision or extra practice

This test provides structured, CAPS-aligned practice that helps learners build confidence, accuracy and mathematical understanding.

- PDF format', 60.00, 'Grade 5', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 50, '[{"id":"file-4637","label":"Test / Assessment PDF","filename":"grade-5-math-term-2-test.pdf","storageKey":"products/0614c1d8-f9fc-5ce8-8924-579001d768c4/file-4637-grade-5-math-term-2-test.pdf"}]'::jsonb, false, true, 4637, '{"title":"Grade 5 Mathematics Term 2 Test","description":"CAPS & ATP-aligned Grade 5 Mathematics Term 2 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('e8531fc0-cd7a-5f26-acec-ad4aba424163', 'grade-5-nst-june-test', 'Grade 5 NST June Test', 'CAPS & ATP-aligned Grade 5 June NST Test. Worth 50 marks , includes full memo. Instant PDF download', 'This CAPS-aligned Grade 5 NST Term 2 June Practice Test is designed to prepare learners for the June assessment while strengthening understanding across Life and Living and Matter and Materials .

The test includes:

Section A: Life and Living

- Plants and photosynthesis

- Animals, habitats and adaptations

- Food chains and producers/consumers

- Life cycle of a frog (drawing and labelling)

Section B: Matter and Materials

- Properties of metals and non-metals

- Magnets and magnetic fields

- Alloys, man-made fabrics and concrete

- Uses of materials and Plaster of Paris

Learners complete a range of question types, including multiple choice, true or false, short-answer questions, drawings and application-based responses.

✔️ Total: 50 marks

✔️ Duration: 1 hour

✔️ Includes a fully worked memorandum

✔️ Cognitive levels balanced (Recall, Understanding & Application & Reasoning)

✔️ Ideal for June exam preparation or assessment practice

PDF format.', 60.00, 'Grade 5', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 50, '[{"id":"file-4633","label":"Test / Assessment PDF","filename":"grade-5-nst-june-test.pdf","storageKey":"products/e8531fc0-cd7a-5f26-acec-ad4aba424163/file-4633-grade-5-nst-june-test.pdf"}]'::jsonb, false, true, 4633, '{"title":"Grade 5 NST June Test","description":"CAPS & ATP-aligned Grade 5 June NST Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('0abb02a5-c10b-5c50-a3df-751b8f71abe6', 'grade-5-nst-term-2-test', 'Grade 5 NST Term 2 Test', 'CAPS & ATP-aligned Grade 5 Term 2 NST Test. Worth 30 marks , includes full memo. Instant PDF download', 'This CAPS-aligned Grade 5 NST Term 2 Practice Test is designed to help learners consolidate key scientific concepts while preparing for formal assessment.

The test covers:

- Comparing metals and non-metals and their properties

- Magnetism and everyday uses of magnets

- Rusting and why certain materials rust

- Mixing materials and processing techniques

- Usefulness of materials and choosing the correct material for different purposes

Learners complete a variety of question types, including multiple choice, true or false, short-answer questions and application-based responses.

✔️ Total: 30 marks

✔️ Duration: 1 hour

✔️ Includes a fully worked memorandum

✔️ Balanced cognitive levels (Recall, Understanding & Application)

✔️ Ideal for Term 2 assessment preparation or revision

This test provides structured, CAPS-aligned practice that helps learners build understanding and confidence in Natural Sciences and Technology.

PDF format.', 60.00, 'Grade 5', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 30, '[{"id":"file-4630","label":"Test / Assessment PDF","filename":"grade-5-nst-term-2-test.pdf","storageKey":"products/0abb02a5-c10b-5c50-a3df-751b8f71abe6/file-4630-grade-5-nst-term-2-test.pdf"}]'::jsonb, false, true, 4630, '{"title":"Grade 5 NST Term 2 Test","description":"CAPS & ATP-aligned Grade 5 Term 2 NST Test. Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('cfac604d-b99c-5bbc-938b-139e75acbf98', 'grade-5-geography-june-test', 'Grade 5 Geography June Test', 'CAPS & ATP-aligned Grade 5 June Geography Test. Worth 30 marks , includes full memo. Instant PDF download', 'This CAPS-aligned Grade 5 Geography Term 2 June Practice Test is designed to prepare learners for the June assessment while strengthening map-reading and physical geography skills.

The test covers:

- Height above sea level and physical features

- A case study on dams and their impact on the physical environment

- Map work including oceans, seas, countries and islands

- Landforms , rivers and oceans

- Key geography definitions and concepts

Learners answer a variety of question types, including case-study questions, map-based questions, definitions and short written responses.

✔️ Total: 30 marks

✔️ Duration: 1 hour

✔️ Includes a fully worked memorandum

✔️ Balanced cognitive levels (Recall, Understanding & Application)

✔️ Ideal for June exam preparation, revision or assessment practice

This test offers structured, CAPS-aligned exam practice that builds confidence and deepens geographical understanding in a learner-friendly way.

PDF format.', 60.00, 'Grade 5', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','geography'], 30, '[{"id":"file-4627","label":"Test / Assessment PDF","filename":"grade-5-geography-june-test.pdf","storageKey":"products/cfac604d-b99c-5bbc-938b-139e75acbf98/file-4627-grade-5-geography-june-test.pdf"}]'::jsonb, false, true, 4627, '{"title":"Grade 5 Geography June Test","description":"CAPS & ATP-aligned Grade 5 June Geography Test. Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('81d9af4a-06d0-509a-84f0-28c0ee185a72', 'grade-5-geography-term-2-test', 'Grade 5 Geography Term 2 Test', 'CAPS & ATP-aligned Grade 5 Term 2 Geography Test. Worth 30 marks , includes full memo. Instant PDF download', 'This CAPS-aligned Grade 5 Geography Term 2 Practice Test helps learners revise key map skills and physical geography concepts while preparing for formal assessment.

The test covers:

- Map skills : direction, oceans, seas, rivers and height above sea level

- Rivers and landforms , including physical geography concepts

- Mountains and place names in South Africa

- Coastal landforms , focusing on capes and bays

✔️ Total: 30 marks

✔️ Duration: 1 hour

✔️ Includes a fully worked memorandum

✔️ Balanced cognitive levels (Recall, Understanding & Application)

✔️ Ideal for Term 2 assessment preparation or revision

This test provides structured, CAPS-aligned practice that strengthens map-reading skills and geographical understanding in a clear, learner-friendly way.

PDF format.', 60.00, 'Grade 5', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','geography'], 30, '[{"id":"file-4625","label":"Test / Assessment PDF","filename":"grade-5-geography-term-2-test.pdf","storageKey":"products/81d9af4a-06d0-509a-84f0-28c0ee185a72/file-4625-grade-5-geography-term-2-test.pdf"}]'::jsonb, false, true, 4625, '{"title":"Grade 5 Geography Term 2 Test","description":"CAPS & ATP-aligned Grade 5 Term 2 Geography Test. Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('cce1afb4-7356-5a70-9cc2-eaa78125357b', 'grade-5-history-june-test', 'Grade 5 History June Test', 'CAPS & ATP-aligned Grade 5 June History Test. Worth 30 marks , includes full memo. Instant PDF download', 'This CAPS-aligned Grade 5 History Term 2 June Practice Test is designed to prepare learners thoroughly for the June assessment while strengthening historical understanding and source-based skills.

The test covers:

- San beliefs and religion

- San and Khoikhoi lifestyles

- Comparisons between the San and Khoikhoi

- Early African farmers and settlements

- The South African coat of arms

- Tools, lifestyles and key historical concepts

Learners complete a variety of question types, including multiple choice, matching, short-answer questions, comparisons and source-based interpretation using images and written texts.

✔️ Total: 30 marks

✔️ Duration: 1 hour

✔️ Includes a fully worked memorandum

✔️ Cognitive levels balanced (Recall, Understanding & Application)

✔️ Ideal for June exam preparation, revision or formal assessment practice

This test offers clear, exam-focused practice that helps learners build confidence in History while developing critical thinking and comparison skills required in Social Sciences.

PDF format.', 60.00, 'Grade 5', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','social-sciences','history'], 30, '[{"id":"file-4621","label":"Test / Assessment PDF","filename":"grade-5-history-june-test.pdf","storageKey":"products/cce1afb4-7356-5a70-9cc2-eaa78125357b/file-4621-grade-5-history-june-test.pdf"}]'::jsonb, false, true, 4621, '{"title":"Grade 5 History June Test","description":"CAPS & ATP-aligned Grade 5 June History Test. Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('d7de629d-f244-5b8b-afab-51a3f328bc82', 'grade-5-history-term-2-test', 'Grade 5 History Term 2 Test', 'CAPS & ATP-aligned Grade 5 Term 2 History Test. Worth 30 marks , includes full memo. Instant PDF download', 'This CAPS-aligned Grade 5 History Term 2 Practice Test is designed to help learners consolidate key historical knowledge while developing source-based and critical thinking skills.

The test covers:

- Early African farmers through source-based questions

- Key concepts and definitions related to early farming communities

- Farming, crops and overgrazing

- Iron tools and technology and their importance in early societies

Learners are required to interpret written sources and images, explain concepts in their own words and apply historical knowledge to structured questions.

✔️ Total: 30 marks

✔️ Duration: 1 hour

✔️ Includes a fully worked memorandum

✔️ Balanced cognitive levels (Recall, Understanding & Application)

✔️ Suitable for revision, assessment practice or home learning

This test provides structured, CAPS-aligned practice that helps learners build confidence in History while strengthening their ability to work with sources and historical information.

PDF format.', 60.00, 'Grade 5', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','history'], 30, '[{"id":"file-4619","label":"Test / Assessment PDF","filename":"grade-5-history-term-2-test.pdf","storageKey":"products/d7de629d-f244-5b8b-afab-51a3f328bc82/file-4619-grade-5-history-term-2-test.pdf"}]'::jsonb, false, true, 4619, '{"title":"Grade 5 History Term 2 Test","description":"CAPS & ATP-aligned Grade 5 Term 2 History Test. Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('1f551591-26e0-560e-9fdd-f4ec6006e894', 'grade-5-life-skills-june-test', 'Grade 5 Life Skills PSW June Test', 'CAPS & ATP-aligned Grade 5 June Life Skills PSW Test. Worth 30 marks , includes full memo. Instant PDF download', 'This CAPS-aligned Grade 5 Life Skills PSW June Practice Test is designed to prepare learners for the Term 2 June assessment while strengthening emotional awareness, responsibility and respectful social behaviour.

The test includes:

- Multiple-choice questions on emotional well-being, responsibilities and healthy friendships

- Matching questions covering key PSW concepts

- True or false questions on rights, responsibilities and stereotypes

- Short-answer questions focusing on decision-making, friendships and child abuse

- A case study dealing with discrimination, inclusion and respect in a school context

✔️ Total: 30 marks

✔️ Duration: 1 hour

✔️ Includes a fully worked memorandum

✔️ Balanced cognitive levels (Recall, Understanding & Application)

✔️ Suitable for June exam preparation, revision or assessment practice

This test provides meaningful, real-life based questions that help learners apply Life Skills knowledge confidently while promoting empathy, inclusion and positive decision-making.

PDF format.', 60.00, 'Grade 5', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['life-skills','natural-science-and-technology'], 30, '[{"id":"file-4616","label":"Test / Assessment PDF","filename":"grade-5-life-skills-june-test.pdf","storageKey":"products/1f551591-26e0-560e-9fdd-f4ec6006e894/file-4616-grade-5-life-skills-june-test.pdf"}]'::jsonb, false, true, 4616, '{"title":"Grade 5 Life Skills PSW June Test","description":"CAPS & ATP-aligned Grade 5 June Life Skills PSW Test. Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('eb0a8f59-0388-5c66-b373-4ad6bd8473a3', 'grade-5-life-skills-term-2-test', 'Grade 5 Life Skills Term 2 Test', 'CAPS & ATP-aligned Grade 5 Term 2 Life Skills PSW Test. Worth 30 marks , includes full memo. Instant PDF download', 'This CAPS-aligned Grade 5 Life Skills PSW Term 2 Practice Test is designed to help learners develop awareness, empathy and problem-solving skills while preparing for formal assessment.

The test covers:

- Children’s rights, abuse and violence

- Age and gender roles in different cultures

- Discrimination and stereotypes

- A case study focusing on bullying, emotions and conflict resolution

The test includes a range of short-answer and application-based questions that encourage learners to think critically and apply Life Skills knowledge to real-life situations.

✔️ Total: 30 marks

✔️ Duration: 1 hour

✔️ Includes a fully worked memorandum

✔️ Cognitive levels clearly balanced (Recall, Understanding & Application)

✔️ Suitable for revision, assessment practice or home learning

This test provides meaningful, age-appropriate practice that supports emotional development and helps learners build confidence in discussing personal and social issues.

PDF format.', 60.00, 'Grade 5', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['life-skills','natural-science-and-technology'], 30, '[{"id":"file-4613","label":"Test / Assessment PDF","filename":"grade-5-life-skills-term-2-test.pdf","storageKey":"products/eb0a8f59-0388-5c66-b373-4ad6bd8473a3/file-4613-grade-5-life-skills-term-2-test.pdf"}]'::jsonb, false, true, 4613, '{"title":"Grade 5 Life Skills Term 2 Test","description":"CAPS & ATP-aligned Grade 5 Term 2 Life Skills PSW Test. Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('8fffa0a6-727d-5cbd-afc6-4553e0e4daa4', 'grade-5-afrikaans-fal-june-test', 'Grade 5 Afrikaans FAL June Test', 'CAPS & ATP-aligned Grade 5 Term 2 Afrikaans First Additional Language June Test. Worth 40 marks , includes full memo. Instant PDF download', 'Hierdie Graad 5 Afrikaans FAL Junie Oefentoets is ideaal vir voorbereiding vir die Junie-assessering en help leerders om hul lees-, skryf- en taalvaardighede verder te ontwikkel.

Die toets sluit die volgende in:

- Begripstoets gebaseer op ’n kort drama ( Die Groot Verrassing )

- Visuele teks met vrae oor ’n plakkaat vir ’n Afrikaanse geleentheid

- Opsomming van ’n verhalende teks oor ’n dag in die lewe van ’n skoolkind

- Taalwerk wat byvoeglike naamwoorde, trappe van vergelyking, meervoude, voorsetsels, indirekte rede, antonieme, sinsoorte en vergelykings dek

✔️ Totaal: 40 punte

✔️ Tydsduur: 1 uur

✔️ Volledige memorandum en opsommingsrubriek ingesluit

✔️ Kognitiewe vlakke gebalanseer (Vlakke 1–3)

✔️ Geskik vir Junie-eksamenvoorbereiding, hersiening of formele oefening

Hierdie toets bied gestruktureerde, eksamengerigte oefening wat leerders help om Afrikaans met meer selfvertroue en begrip te gebruik.

PDF format.', 60.00, 'Grade 5', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['afrikaans-first-additional-language','natural-science-and-technology'], 40, '[{"id":"file-4609","label":"Test / Assessment PDF","filename":"grade-5-afrikaans-fal-june-test.pdf","storageKey":"products/8fffa0a6-727d-5cbd-afc6-4553e0e4daa4/file-4609-grade-5-afrikaans-fal-june-test.pdf"}]'::jsonb, false, true, 4609, '{"title":"Grade 5 Afrikaans FAL June Test","description":"CAPS & ATP-aligned Grade 5 Term 2 Afrikaans First Additional Language June Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('decf9634-db84-5cff-bccf-3f9f88c59c97', 'grade-5-afrikaans-fal-term-2-test', 'Grade 5 Afrikaans FAL Term 2 Test', 'CAPS & ATP-aligned Grade 5 Term 2 Afrikaans First Additional Language Term 2 Test. Worth 40 marks , includes full memo. Instant PDF download', 'Hierdie Graad 5 Afrikaans FAL Kwartaal 2 Oefentoets is ontwerp om leerders te help om hul taalvaardighede te oefen en met selfvertroue vir formele assessering voor te berei.

Die toets sluit die volgende in:

- Begripstoets gebaseer op ’n verhalende teks ( ’n Bos Avontuur )

- Visuele teks met vrae oor ’n televisieprogram-advertensie

- Opsomming wat fokus op hoofgedagtes uit elke paragraaf

- Taalwerk wat voornaamwoorde, voorsetsels, trappe van vergelyking, verlede tyd, spelling, punktuasie, voegwoorde en alfabetiese volgorde dek

✔️ Totaal: 40 punte

✔️ Tydsduur: 1 uur

✔️ Volledig gememoriseer met memorandum ingesluit

✔️ Kognitiewe vlakke gebalanseer (Vlakke 1–3)

✔️ Ideaal vir hersiening, ekstra oefening of tuisassessering

Hierdie toets bied gestruktureerde, toeganklike oefening wat leerders help om begrip, woordeskat en taalgebruik te verbeter sonder om oorweldig te voel.

PDF format.', 60.00, 'Grade 5', 'Term 2', '2026', 'Individual Resource', 'Test / Assessment', array['afrikaans-first-additional-language','natural-science-and-technology'], 40, '[{"id":"file-4604","label":"Test / Assessment PDF","filename":"grade-5-afrikaans-fal-term-2-test.pdf","storageKey":"products/decf9634-db84-5cff-bccf-3f9f88c59c97/file-4604-grade-5-afrikaans-fal-term-2-test.pdf"}]'::jsonb, false, true, 4604, '{"title":"Grade 5 Afrikaans FAL Term 2 Test","description":"CAPS & ATP-aligned Grade 5 Term 2 Afrikaans First Additional Language Term 2 Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('3f46fbf0-2176-5588-a93f-a54fdb0c1e31', 'grade-5-english-fal-june-test', 'Grade 5 English FAL June Test', 'CAPS & ATP-aligned Grade 5 Term 2 English First Additional Language June Test. Worth 40 marks , includes full memo. Instant PDF download', 'This CAPS-aligned Grade 5 English FAL Term 2 June Practice Test is designed to help learners prepare confidently for the June controlled test while strengthening reading, writing and language skills.

The test includes:

- Reading Comprehension based on an informative text about the first video game console

- Visual Text Analysis using a real-life advertisement

- Summary writing focusing on both positive and negative effects of video games

- Language questions covering nouns, verbs, pronouns, adjectives, tenses, punctuation and sentence types

✔️ Total: 40 marks

✔️ Duration: 1.5 hours

✔️ Includes a fully worked memorandum

✔️ Cognitive levels clearly balanced (Levels 1–3)

✔️ Suitable for June exam preparation, revision or formal practice

This test provides clear, structured exam-style practice that helps English FAL learners build confidence and accuracy without being overwhelming.

PDF format.', 60.00, 'Grade 5', 'Term 2', '2026', 'Individual Resource', 'Summary', array['english-first-additional-language','natural-science-and-technology'], 40, '[{"id":"file-4602","label":"Summary PDF","filename":"grade-5-english-fal-june-test.pdf","storageKey":"products/3f46fbf0-2176-5588-a93f-a54fdb0c1e31/file-4602-grade-5-english-fal-june-test.pdf"}]'::jsonb, false, true, 4602, '{"title":"Grade 5 English FAL June Test","description":"CAPS & ATP-aligned Grade 5 Term 2 English First Additional Language June Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('34f090d1-b622-51e7-aa6b-b7ef412f44bd', 'grade-5-english-fal-term-2-test', 'Grade 5 English FAL Term 2 Test', 'CAPS & ATP-aligned Grade 5 Term 2 English First Additional Language Term 2 Test. Worth 40 marks , includes full memo. Instant PDF download', 'This CAPS-aligned Grade 5 English FAL Term 2 Practice Test is designed to support learners in developing confidence and accuracy in English while preparing for formal assessment.

The test includes:

- Reading Comprehension based on an informative article about a dinosaur discovery

- Visual Literacy using a real-life event poster

- Summary writing with clear sentence and word-count guidelines

- Language Structures and Conventions covering punctuation, tenses, conjunctions, verbs, prepositions, homophones and plurals

✔️ Total: 40 marks

✔️ Duration: 1 hour

✔️ Learners may use a dictionary

✔️ Includes a fully worked memorandum

✔️ Balanced cognitive levels (Levels 1–3)

✔️ Suitable for revision, practice or assessment at home

This test offers structured, manageable practice that helps English FAL learners strengthen comprehension, vocabulary and language skills without feeling overwhelmed.

PDF format.', 60.00, 'Grade 5', 'Term 2', '2026', 'Individual Resource', 'Summary', array['english-first-additional-language','natural-science-and-technology'], 40, '[{"id":"file-4598","label":"Summary PDF","filename":"grade-5-english-fal-term-2-test.pdf","storageKey":"products/34f090d1-b622-51e7-aa6b-b7ef412f44bd/file-4598-grade-5-english-fal-term-2-test.pdf"}]'::jsonb, false, true, 4598, '{"title":"Grade 5 English FAL Term 2 Test","description":"CAPS & ATP-aligned Grade 5 Term 2 English First Additional Language Term 2 Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('e7a49d92-c55d-5355-90f0-2df5f48c2fc3', 'grade-5-english-hl-june-test', 'Grade 5 English HL June Test', 'CAPS & ATP-aligned Grade 5 Term 2 English June Test. Worth 40 marks , includes full memo. Instant PDF download', 'This CAPS-aligned Grade 5 English HL June Practice Test is ideal for exam preparation and consolidation of Term 2 language skills.

The test includes:

- Reading Comprehension based on an informative text about the first video game console

- Visual Text Analysis using a detailed advertisement

- Summary writing with clear word-count and sentence requirements

- Language questions covering pronouns, tenses, figures of speech, passive voice, sentence types and more

✔️ Total: 40 marks

✔️ Duration: 90 minutes

✔️ Includes a fully worked memorandum

✔️ Balanced cognitive levels (Levels 1–3)

✔️ Suitable for June exam practice, revision or assessment at home

This test helps learners practise exam-style questions while building confidence, comprehension and language accuracy in a structured and manageable way.

PDF format.', 60.00, 'Grade 5', 'Term 2', '2026', 'Individual Resource', 'Summary', array['english-home-language','natural-science-and-technology'], 40, '[{"id":"file-4592","label":"Summary PDF","filename":"grade-5-english-hl-june-test.pdf","storageKey":"products/e7a49d92-c55d-5355-90f0-2df5f48c2fc3/file-4592-grade-5-english-hl-june-test.pdf"}]'::jsonb, false, true, 4592, '{"title":"Grade 5 English HL June Test","description":"CAPS & ATP-aligned Grade 5 Term 2 English June Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('2cd794f1-728f-56c3-bf48-2c6148fa88de', 'grade-5-english-hl-term-2-test', 'Grade 5 English HL Term 2 Test', 'CAPS & ATP-aligned Grade 5 Term 2 English HL Test. Worth 40 marks , includes full memo. Instant PDF download', 'This CAPS-aligned Grade 5 English HL Term 2 Practice Test is designed to help learners revise key language skills and prepare confidently for formal assessment.

The test includes:

- Reading Comprehension based on an age-appropriate story

- Visual Literacy using an advertisement

- Summary writing with clear word and sentence requirements

- Language Structures and Conventions covering verbs, tenses, pronouns, punctuation, prepositions, reported speech, idioms and more

✔️ Total: 40 marks

✔️ Time: 1 hour

✔️ Includes a fully worked memorandum

✔️ Cognitive levels clearly balanced (Levels 1–3)

✔️ Suitable for revision, exam preparation or practice at home

This test is ideal for parents and teachers who want meaningful practice that clearly shows learners where they are coping and where they need extra support.

PDF format.', 60.00, 'Grade 5', 'Term 2', '2026', 'Individual Resource', 'Summary', array['english-home-language','natural-science-and-technology'], 40, '[{"id":"file-4557","label":"Summary PDF","filename":"grade-5-english-hl-term-2-test.pdf","storageKey":"products/2cd794f1-728f-56c3-bf48-2c6148fa88de/file-4557-grade-5-english-hl-term-2-test.pdf"}]'::jsonb, false, true, 4557, '{"title":"Grade 5 English HL Term 2 Test","description":"CAPS & ATP-aligned Grade 5 Term 2 English HL Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('bcfa6fad-3223-5335-849b-31584d8d7fa0', 'grade-7-english-hl-term-1-fat-2026', 'Grade 7 English HL Term 1 FAT (2026)', 'CAPS & ATP-aligned Grade 7 Term 1 FAT 2 (Descriptive Essay) Worth 30 marks , includes full memo. Instant PDF download', 'This Grade 7 English Home Language Term 1 FAT 2 Descriptive Writing Task is a CAPS-aligned Formal Assessment Task (FAT) designed to assess learners’ creative writing, planning skills, language use, and editing process in line with CAPS requirements.

Learners are guided step by step through the full writing process , from planning and drafting to editing and producing a final polished essay.

What’s included:

- ✍️ Descriptive Essay Task

- Learners choose ONE creative descriptive topic

- Topics encourage imagination, reflection, and detailed sensory description

- 🧠 Structured Writing Process

- Mind map for planning

- Draft writing page

- Final neat copy page

- Clear instructions on word count (150–200 words) and paragraph structure

- 📚 Creative Writing Topics Include:

- The Day Everything Went Wrong – and Right

- A Door That Was Never Meant to Be Opened

- One Hour Without Any Rules

- 📊 Learner-Friendly Checklist (Rubric)

- Helps learners understand how they will be assessed

- Covers planning, structure, creativity, language, and editing

- 🧾 Teacher Analytic Rubric (30 marks)

- Detailed CAPS-aligned rubric

- Clear performance descriptors for moderation and marking

- 📝 Total: 30 marks | Duration: 1 hour

- 📈 CAPS cognitive levels clearly indicated

- ✅ Fully detailed memorandum included

This task is ideal for:

- CAPS Term 1 Formal Assessment requirements

- Classroom assessment or structured home-based tasks

- Developing confident, creative writers who understand the writing process

PDF format.', 60.00, 'Grade 7', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['english-home-language','natural-science-and-technology'], 30, '[{"id":"file-4553","label":"Test / Assessment PDF","filename":"grade-7-english-hl-term-1-fat-2026.pdf","storageKey":"products/bcfa6fad-3223-5335-849b-31584d8d7fa0/file-4553-grade-7-english-hl-term-1-fat-2026.pdf"}]'::jsonb, false, true, 4553, '{"title":"Grade 7 English HL Term 1 FAT (2026)","description":"CAPS & ATP-aligned Grade 7 Term 1 FAT 2 (Descriptive Essay) Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('b677c9fa-201e-5774-94d4-84f715939273', 'grade-7-english-hl-term-1-fat-2025', 'Grade 7 English HL Term 1 FAT (2025)', 'CAPS & ATP-aligned Grade 7 Term 1 FAT (Descriptive Essay) Worth 30 marks , includes full memo. Instant PDF download', 'This Grade 7 English Home Language Term 1 FAT 2 Descriptive Writing Task is a CAPS-aligned Formal Assessment Task (FAT) designed to assess learners’ creative writing, planning skills, language use, and editing process in line with CAPS requirements.

Learners are guided step by step through the full writing process , from planning and drafting to editing and producing a final polished essay.

What’s included:

- ✍️ Descriptive Essay Task

- Learners choose ONE creative descriptive topic

- Topics encourage imagination, reflection, and detailed sensory description

- 🧠 Structured Writing Process

- Mind map for planning

- Draft writing page

- Final neat copy page

- Clear instructions on word count (150–200 words) and paragraph structure

- 📚 Creative Writing Topics Include:

- The Day Everything Went Wrong – and Right

- A Door That Was Never Meant to Be Opened

- One Hour Without Any Rules

- 📊 Learner-Friendly Checklist (Rubric)

- Helps learners understand how they will be assessed

- Covers planning, structure, creativity, language, and editing

- 🧾 Teacher Analytic Rubric (30 marks)

- Detailed CAPS-aligned rubric

- Clear performance descriptors for moderation and marking

- 📝 Total: 30 marks | Duration: 1 hour

- 📈 CAPS cognitive levels clearly indicated

- ✅ Fully detailed memorandum included

This task is ideal for:

- CAPS Term 1 Formal Assessment requirements

- Classroom assessment or structured home-based tasks

- Developing confident, creative writers who understand the writing process

PDF format.', 60.00, 'Grade 7', 'Term 1', '2025', 'Individual Resource', 'Test / Assessment', array['english-home-language','natural-science-and-technology'], 30, '[{"id":"file-4549","label":"Test / Assessment PDF","filename":"grade-7-english-hl-term-1-fat-2025.pdf","storageKey":"products/b677c9fa-201e-5774-94d4-84f715939273/file-4549-grade-7-english-hl-term-1-fat-2025.pdf"}]'::jsonb, false, true, 4549, '{"title":"Grade 7 English HL Term 1 FAT (2025)","description":"CAPS & ATP-aligned Grade 7 Term 1 FAT (Descriptive Essay) Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('bb6f809f-7c2a-597d-9696-2d76ab7f6ad2', 'grade-7-mathematics-term-1-test-2', 'Grade 7 Mathematics Term 1 Test 2', 'CAPS & ATP-aligned Grade 7 Mathematics Term 1 Test. Worth 60 marks , includes full memo. Instant PDF download', 'This Grade 7 Mathematics Term 1 Practice Test 2 is a CAPS-aligned assessment designed to consolidate learners’ understanding of whole numbers, fractions, decimals, and financial mathematics , with a strong focus on accuracy, method, and problem-solving.

What’s included:

- 🔢 Whole Numbers (26 marks)

- Rounding to the nearest hundred

- Prime factors, highest common factor (HCF) and lowest common multiple (LCM)

- Order of operations

- Long multiplication and long division

- Multiples and factors

- 🍰 Common Fractions (9 marks)

- Ordering fractions

- Calculations with fractions

- Percentage decrease in real-life contexts

- 🔢 Decimals (15 marks)

- Rounding to one decimal place

- Converting fractions to decimals

- Calculations involving addition, multiplication and decimals

- 💰 Financial Mathematics (10 marks)

- Profit and loss

- Ratio and proportion

- Rate and time word problems

- Percentage increase

- 📝 Total: 60 marks | Duration: 90 minutes

- 📊 Content-area and cognitive-level weighting tables included

- ✅ Fully detailed memorandum included

This practice test is ideal for:

- Term 1 assessment or revision

- Classroom use or structured home practice

- Parents and teachers looking for high-quality, CAPS-aligned Grade 7 Mathematics resources

PDF format.', 60.00, 'Grade 7', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 60, '[{"id":"file-4546","label":"Test / Assessment PDF","filename":"grade-7-mathematics-term-1-test-2.pdf","storageKey":"products/bb6f809f-7c2a-597d-9696-2d76ab7f6ad2/file-4546-grade-7-mathematics-term-1-test-2.pdf"}]'::jsonb, false, true, 4546, '{"title":"Grade 7 Mathematics Term 1 Test 2","description":"CAPS & ATP-aligned Grade 7 Mathematics Term 1 Test. Worth 60 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('a96bea17-bace-5e2a-9bfa-bfd75a29dc87', 'grade-7-mathematics-term-1-test', 'Grade 7 Mathematics Term 1 Test', 'CAPS & ATP-aligned Grade 7 Mathematics Term 1 Test. Worth 60 marks , includes full memo. Instant PDF download', 'This Grade 7 Mathematics Term 1 Practice Test is a CAPS-aligned assessment designed to assess learners’ understanding of number concepts, operations, fractions, decimals, and financial mathematics through a balanced range of procedural and problem-solving questions.

What’s included:

- 🔢 Whole Numbers (7 marks)

- Ordering numbers

- Multiples and factors

- HCF and LCM

- Order of operations

- ➕➖✖️➗ Operations (14 marks)

- Addition, subtraction, multiplication and division of large numbers

- Clear layout and method marks

- 🍰 Fractions (16 marks)

- Converting fractions to decimals

- Comparing and ordering fractions

- Simplifying fractions

- Calculations involving addition, subtraction and multiplication of fractions

- 🔢 Decimals (7 marks)

- Ordering and comparing decimals

- Rounding to two decimal places

- Multiplication and division with decimals

- 💰 Financial Mathematics (16 marks)

- Ratio and sharing money

- Budgeting and calculations involving income and expenses

- Simple interest

- Percentage increase

- Calculating hourly rates

- 📝 Total: 60 marks | Duration: 90 minutes

- 📊 Content-area and cognitive-level weighting tables included

- ❌ No calculators permitted

- ✅ Fully detailed memorandum included

This practice test is ideal for:

- Term 1 assessment or revision

- Classroom use or structured home practice

- Parents and teachers looking for high-quality, CAPS-aligned Grade 7 Mathematics resources

PDF format.', 60.00, 'Grade 7', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 60, '[{"id":"file-4543","label":"Test / Assessment PDF","filename":"grade-7-mathematics-term-1-test.pdf","storageKey":"products/a96bea17-bace-5e2a-9bfa-bfd75a29dc87/file-4543-grade-7-mathematics-term-1-test.pdf"}]'::jsonb, false, true, 4543, '{"title":"Grade 7 Mathematics Term 1 Test","description":"CAPS & ATP-aligned Grade 7 Mathematics Term 1 Test. Worth 60 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('2ab8dd7b-467d-53b0-87f0-da2b0705e72c', 'grade-7-technology-term-1-test-2', 'Grade 7 Technology Term 1 Test 2', 'CAPS & ATP-aligned Grade 7 Technology Term 1 Test 2. Worth 60 marks , includes full memo. Instant PDF download', 'This Grade 7 Technology Term 1 Practice Test 2 is a CAPS-aligned assessment that focuses on levers, mechanical advantage, hydraulics and pneumatics, and the design process , with a strong emphasis on application, reasoning, and design thinking .

What’s included:

- ⚙️ Levers & Mechanical Systems

- True or False questions on lever classes

- Labelling the parts of a lever (fulcrum, load, effort) using real-life examples

- Identifying first-, second- and third-class levers in everyday tools

- Completing a table on lever type, fulcrum position, and use

- 📏 Mechanical Advantage

- Short-answer questions explaining mechanical advantage

- Understanding how fulcrum position affects effort and load

- 🔧 Lever Concepts – Fill in the Blanks

- Key terminology including fulcrum, effort, load, tweezers, nutcracker, and mechanical advantage

- 💧 Hydraulics & Pneumatics

- Short-answer questions comparing hydraulics and pneumatics

- Understanding force transfer using liquids and air

- 🛠️ Design Process – Design Brief (10 marks)

- Writing a structured design brief based on a real-life scenario

- Including purpose, materials, features, target user, and constraints

- 📝 Total: 60 marks | Duration: 1.5 hours

- 📊 Content-area and cognitive-level weighting tables included

- ✅ Fully detailed memorandum included

This practice test is ideal for:

- Term 1 formal assessment or revision

- Developing mechanical reasoning and design skills

- Classroom use or structured home practice

PDF format.', 60.00, 'Grade 7', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 60, '[{"id":"file-4541","label":"Test / Assessment PDF","filename":"grade-7-technology-term-1-test-2.pdf","storageKey":"products/2ab8dd7b-467d-53b0-87f0-da2b0705e72c/file-4541-grade-7-technology-term-1-test-2.pdf"}]'::jsonb, false, true, 4541, '{"title":"Grade 7 Technology Term 1 Test 2","description":"CAPS & ATP-aligned Grade 7 Technology Term 1 Test 2. Worth 60 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('faae4540-c654-5a02-b542-4fcbcf091613', 'grade-7-technology-term-1-test', 'Grade 7 Technology Term 1 Test', 'CAPS & ATP-aligned Grade 7 Technology Term 1 Test. Worth 60 marks , includes full memo. Instant PDF download', '-

This Grade 7 Technology Term 1 Practice Test is a CAPS-aligned assessment designed to develop learners’ understanding of mechanical systems, simple machines, graphic communication, and the design process through a balanced mix of theory, practical drawing, and design tasks.

What’s included:

- ⚙️ Mechanical Systems & Simple Machines

- Multiple-choice questions on levers, pulleys, gears, wheel and axle

- Identifying types and functions of simple machines

- ✔️ Technology Concepts & Graphics

- True / False questions on the design process and graphic conventions

- ✏️ Graphic Communication

- Identifying line types and their uses

- Scale drawing task (1:1) with construction lines and correct dimensions

- 🖼️ Image-Based Questions

- Classifying levers using diagrams

- 📘 Reading Comprehension

- Case study on the impact of technology on mechanical systems and control

- ✍️ Short-Answer Questions

- Explaining how pulleys and wheel-and-axle systems make work easier

- 🛠️ Design Task (Choose ONE)

- Designing a simple machine to lift a heavy object

- OR building and explaining a gear train to show change in direction of motion

- 📝 Total: 60 marks | Duration: 1.5 hours

- 📊 Content area and cognitive-level weighting tables included

- ✅ Fully detailed memorandum included

This practice test is ideal for:

- Term 1 assessment or revision

- Classroom use or structured home practice

- Parents and teachers looking for high-quality, CAPS-aligned Grade 7 Technology resources

PDF format.', 60.00, 'Grade 7', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 60, '[{"id":"file-4537","label":"Test / Assessment PDF","filename":"grade-7-technology-term-1-test.pdf","storageKey":"products/faae4540-c654-5a02-b542-4fcbcf091613/file-4537-grade-7-technology-term-1-test.pdf"}]'::jsonb, false, true, 4537, '{"title":"Grade 7 Technology Term 1 Test","description":"CAPS & ATP-aligned Grade 7 Technology Term 1 Test. Worth 60 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('21e0c271-ea9a-5feb-9c82-e243903cd34b', 'grade-7-natural-science-term-1-test-2', 'Grade 7 Natural Science Term 1 Test 2', 'CAPS & ATP-aligned Grade 7 Natural Science Term 1 Test 2. Worth 60 marks , includes full memo. Instant PDF download', 'This Grade 7 Natural Sciences Term 1 Practice Test 2 is a CAPS-aligned assessment designed to assess learners’ understanding of life and living, reproduction, biodiversity, ecosystems, and basic genetics , with a strong focus on scientific reasoning and real-life application .s.

What’s included:

- 🧬 Life & Living (10 marks)

- Multiple-choice and fill-in-the-blanks

- Key concepts such as biosphere, biodiversity, photosynthesis, pollination, oviparous animals

- 🌍 Earth Systems & Biodiversity (5 marks)

- Matching terms related to hydrosphere, biosphere, fertilisation, and ecosystems

- 🌱 Reproduction & Biodiversity (15 marks)

- Short-answer questions

- Importance of biodiversity

- Differences between sexual and asexual reproduction

- Arthropod classification using visual clues

- 🐟 Vertebrates Comparison (5 marks)

- Paragraph comparing the characteristics of fish and mammals

- 🌸 Plant Structure & Practical Skills (8 marks)

- Diagram labelling of a flower

- Labelling a monocotyledon plant with leaf, root, and stem features

- 🧬 Reproduction & Genetics (9 marks)

- Completing a passage on human reproduction

- Inherited characteristics, variation, and selection

- 🌳 Ecosystems & Conservation – Case Study (8 marks)

- Forest ecosystems

- Human impact on biodiversity

- Conservation strategies and the carbon cycle

- 📝 Total: 60 marks | Duration: 1 hour

- 📊 Content area and cognitive-level weighting tables included

- ✅ Fully detailed memorandum included

This practice test is ideal for:

- Term 1 formal assessment or revision

- Classroom use or structured home practice

- Parents and teachers looking for high-quality, CAPS-aligned Natural Sciences resources

PDF format.', 60.00, 'Grade 7', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 60, '[{"id":"file-4534","label":"Test / Assessment PDF","filename":"grade-7-natural-science-term-1-test-2.pdf","storageKey":"products/21e0c271-ea9a-5feb-9c82-e243903cd34b/file-4534-grade-7-natural-science-term-1-test-2.pdf"}]'::jsonb, false, true, 4534, '{"title":"Grade 7 Natural Science Term 1 Test 2","description":"CAPS & ATP-aligned Grade 7 Natural Science Term 1 Test 2. Worth 60 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('4e0c1d6c-a324-5b94-87e6-631ba3d8ba0c', 'grade-7-natural-science-term-1-test', 'Grade 7 Natural Science Term 1 Test', 'CAPS & ATP-aligned Grade 7 Natural Science Term 1 Test. Worth 60 marks , includes full memo. Instant PDF download', 'This Grade 7 Natural Sciences Term 1 Practice Test is a CAPS-aligned assessment designed to develop learners’ understanding of life processes, biodiversity, reproduction, ecosystems, and practical scientific skills through a balanced range of question types.

What’s included:

- 🧠 Key Concepts & Definitions (5 marks)

- Gametes, fertilisation, biosphere, ecosystem, endangered species

- 🐾 Classification & Habitats (10 marks)

- Vertebrates and invertebrates

- Animal classification and habitats (lithosphere, hydrosphere, atmosphere)

- 🌱 Biodiversity & Reproduction (12 marks)

- Importance of biodiversity

- Sexual reproduction and variation

- Arthropod classification

- 🖼️ Diagram Analysis (10 marks)

- Food chains (producers and consumers)

- Parts of a flower and pollination

- Earth’s spheres (biosphere, hydrosphere, atmosphere, geosphere)

- ✏️ Life Processes – Fill in the Blanks (6 marks)

- Biodiversity, survival, pollen, abiotic factors

- 🔬 Practical Skills (6 marks)

- Monocotyledon seeds

- Male reproductive organs

- 🔗 Scientific Concepts – Matching (6 marks)

- Pollination, decomposers, photosynthesis, sexual reproduction

- ✍️ Long Response (10 marks)

- Paragraph writing on the importance of plant reproduction

- 📝 Total: 60 marks | Duration: 1 hour

- 📊 Content area and cognitive-level weighting tables included

- ✅ Fully detailed memorandum included

This practice test is ideal for:

- Term 1 assessment or revision

- Classroom use or structured home practice

- Parents and teachers looking for high-quality, CAPS-aligned Natural Sciences resources

PDF format.', 60.00, 'Grade 7', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 60, '[{"id":"file-4531","label":"Test / Assessment PDF","filename":"grade-7-natural-science-term-1-test.pdf","storageKey":"products/4e0c1d6c-a324-5b94-87e6-631ba3d8ba0c/file-4531-grade-7-natural-science-term-1-test.pdf"}]'::jsonb, false, true, 4531, '{"title":"Grade 7 Natural Science Term 1 Test","description":"CAPS & ATP-aligned Grade 7 Natural Science Term 1 Test. Worth 60 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('ceb03ce1-852d-5bf0-9ac7-89e38b1bffb5', 'grade-7-geography-term-1-test-2', 'Grade 7 Geography Term 1 Test 2', 'CAPS & ATP-aligned Grade 7 Geography Term 1 Test 2. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 7 Geography Term 1 Practice Test is a CAPS-aligned assessment focused on strengthening map skills, scale, distance calculations, route directions, and geographical awareness of current world events .

What’s included:

- 🧭 Map Skills & Concepts (18 marks)

- Multiple-choice, matching and True/False questions

- Latitude and longitude

- Compass directions and magnetism

- Map keys, symbols, and scales

- 📏 Scale (Large & Small) (4 marks)

- Identifying and comparing map scales

- ✍️ Map Skills: Short Answer Questions (10 marks)

- Equinoxes

- Direct vs indirect distance

- Purpose of scale and map keys

- Measuring curved distances

- 🚶 Route Directions (7 marks)

- Drawing and describing a route using a street map

- Clear, step-by-step written directions

- 🗺️ Grid References & Distance Calculations (10 marks)

- Identifying locations using grid squares

- Interpreting map symbols

- Estimating distances using a map scale

- 🌍 Current Events Mapwork (9 marks)

- Linking recent global events to countries on a world map

- 📝 Total: 50 marks | Duration: 1 hour

- 📊 Content-area and cognitive-level weighting tables included

- ✅ Fully detailed memorandum included

This practice test is ideal for:

- Term 1 assessment or revision

- Developing strong mapwork and spatial thinking skills

- Classroom use or structured home practice

PDF format.', 60.00, 'Grade 7', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','geography'], 50, '[{"id":"file-4527","label":"Test / Assessment PDF","filename":"grade-7-geography-term-1-test-2.pdf","storageKey":"products/ceb03ce1-852d-5bf0-9ac7-89e38b1bffb5/file-4527-grade-7-geography-term-1-test-2.pdf"}]'::jsonb, false, true, 4527, '{"title":"Grade 7 Geography Term 1 Test 2","description":"CAPS & ATP-aligned Grade 7 Geography Term 1 Test 2. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('9886e2a8-f56f-52db-8c30-1489e292e47b', 'grade-7-geography-term-1-test', 'Grade 7 Geography Term 1 Test', 'CAPS & ATP-aligned Grade 7 Geography Term 1 Test. Worth 50 marks , includes full memo. Instant PDF download', '-

This Grade 7 Geography Term 1 Practice Test is a CAPS-aligned assessment designed to develop learners’ map skills, geographical knowledge, and practical mapwork abilities through structured questions and real-world map interpretation.

What’s included:

- 🗺️ Map Skills & Concepts (20 marks)

- Definitions of latitude, longitude, scale, and grid references

- Prime Meridian and map projections

- Physical vs political maps

- Contour lines and elevation

- 🌍 Africa: Physical Geography (5 marks)

- Key facts about Africa

- True/False questions on deserts, rivers, and landforms

- 🏙️ Street Maps & Map Conventions (10 marks)

- Interpreting a street map of Benoni

- Identifying landmarks, suburbs, symbols, and missing map conventions

- 🇿🇦 South Africa: Map Skills (10 marks)

- Small-scale vs large-scale maps

- Provinces and neighbouring countries

- Line scale to word scale conversions

- Distance calculations using a map

- ✏️ Mapwork Practical Task (5 marks)

- Designing a simple map using correct conventions

- Including landmarks, scale, compass, key, and street names

- Clear rubric provided

- 📝 Total: 50 marks | Duration: 1 hour

- 📊 Content area and cognitive-level weighting tables included

- ✅ Fully detailed memorandum included

This practice test is ideal for:

- Term 1 assessment or revision

- Classroom use or structured home practice

- Parents and teachers looking for high-quality, CAPS-aligned Grade 7 Geography resources

PDF format.', 60.00, 'Grade 7', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','geography'], 50, '[{"id":"file-4524","label":"Test / Assessment PDF","filename":"grade-7-geography-term-1-test.pdf","storageKey":"products/9886e2a8-f56f-52db-8c30-1489e292e47b/file-4524-grade-7-geography-term-1-test.pdf"}]'::jsonb, false, true, 4524, '{"title":"Grade 7 Geography Term 1 Test","description":"CAPS & ATP-aligned Grade 7 Geography Term 1 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('c05ed72e-07d6-51a2-937d-7c4b873aaaac', 'grade-7-history-term-1-test-2', 'Grade 7 History Term 1 Test 2', 'CAPS & ATP-aligned Grade 7 History Term 1 Test 2. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 7 History Term 1 Practice Test 2 is a CAPS-aligned assessment designed to deepen learners’ understanding of trade across the Sahara Desert, the Kingdom of Mali, and the city of Timbuktu as a centre of trade and learning .

What’s included:

- 🌍 Trade Across the Sahara Desert

- Multiple-choice questions

- Matching key concepts such as caravans, camels, salt, gold, and trade routes

- 👑 The Kingdom of Mali

- Fill-in-the-blanks on key facts and vocabulary

- Short-answer questions on Mansa Musa, the Niger River, and empire-building

- Explanation and opinion-based responses

- 🏙️ The City of Timbuktu – Case Study (10 marks)

- Source-based questions using a historical extract

- Interpreting the importance of Timbuktu as a centre of trade, wealth, education, and religion

- Extended responses requiring reasoning and imagination

- 🗺️ Source-Based Questions: Trade Routes & Geography (13 marks)

- Interpreting a map of the Mali Empire and trade routes

- Identifying key cities and routes

- Explaining how geography contributed to Mali’s wealth and culture

- Applying historical knowledge to real-life trade scenarios

- 📝 Total: 50 marks | Duration: 1 hour

- 📊 Content area and cognitive-level weighting tables included

- ✅ Fully detailed memorandum included

This practice test is ideal for:

- Term 1 formal assessment or revision

- Classroom use or structured home practice

- Parents and teachers looking for high-quality, CAPS-aligned Grade 7 History resources

PDF format.', 60.00, 'Grade 7', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','history','geography'], 50, '[{"id":"file-4520","label":"Test / Assessment PDF","filename":"grade-7-history-term-1-test-2.pdf","storageKey":"products/c05ed72e-07d6-51a2-937d-7c4b873aaaac/file-4520-grade-7-history-term-1-test-2.pdf"}]'::jsonb, false, true, 4520, '{"title":"Grade 7 History Term 1 Test 2","description":"CAPS & ATP-aligned Grade 7 History Term 1 Test 2. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('03cbdd57-6963-5bad-bf30-b314557b10bb', 'grade-7-history-term-1-test', 'Grade 7 History Term 1 Test', 'CAPS & ATP-aligned Grade 7 History Term 1 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 7 History Term 1 Practice Test is a CAPS-aligned assessment designed to develop learners’ understanding of trade across the Sahara Desert, the Kingdom of Mali, and the importance of Timbuktu as a centre of trade and learning .

What’s included:

- 🌍 Trade Across the Sahara Desert

- True or False questions

- Key facts about trade routes, salt and gold

- 📚 The Kingdom of Mali – Source-based Questions

- Extract from Ibn Battuta

- Map interpretation

- Explaining why Timbuktu was important

- 🧠 Key Concepts & Vocabulary

- Fill-in-the-blanks using historical terms such as Mansa Musa, griot, gold, salt, Sahara and Timbuktu

- ✍️ Paragraph Writing

- The influence of Islam on the Kingdom of Mali

- Focus on leadership, trade, education and learning

- Clear paragraph rubric included

- 🖼️ Picture Analysis

- Analysing features of the ancient city of Timbuktu

- Linking visuals to historical importance

- ✔️ Knowledge Recall

- Multiple choice / circle-the-correct-answer questions

- ✏️ Short Answer Questions

- Trade, wealth, and leadership in Mali

- 📝 Total: 50 marks | Duration: 1 hour

- 📊 Content and cognitive-level weighting tables included

- ✅ Fully detailed memorandum included

This practice test is ideal for:

- Term 1 assessment or revision

- Classroom use or structured home practice

- Parents and teachers looking for high-quality, CAPS-aligned Grade 7 History resources

PDF format.', 60.00, 'Grade 7', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','history'], 50, '[{"id":"file-4516","label":"Test / Assessment PDF","filename":"grade-7-history-term-1-test.pdf","storageKey":"products/03cbdd57-6963-5bad-bf30-b314557b10bb/file-4516-grade-7-history-term-1-test.pdf"}]'::jsonb, false, true, 4516, '{"title":"Grade 7 History Term 1 Test","description":"CAPS & ATP-aligned Grade 7 History Term 1 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('84037ee6-efac-571d-944a-ffad33c5e7d8', 'grade-7-life-orientation-term-1-written-task', 'Grade 7 Life Orientation Term 1 Written Task', 'CAPS & ATP-aligned Grade 7 Life Orientation Term 1 Written Task. Worth 70 marks , includes full memo. Instant PDF download', 'This Grade 7 Life Orientation Term 1 Written Task is a CAPS-aligned formal assessment designed to assess learners’ knowledge, understanding, and application of life skills through structured written responses and real-life case studies.

What’s included:

- 🧼 Hygiene & Self-Image (14 marks)

- Basic hygiene practices

- Understanding and improving self-image

- Respect for self and others

- 🌱 Puberty & Gender Constructs (21 marks)

- Physical and emotional changes in boys and girls

- Understanding puberty and its impact on relationships

- Extended case study with reflective and advice-based questions

- 👥 Peer Pressure – Case Study (15 marks)

- Defining peer pressure

- Identifying negative influences

- Assertive responses, negotiation skills, and sources of support

- Reflection on decision-making and self-image

- 🤝 Positive Peer Influence – Case Study (15 marks)

- Difference between positive and negative peer pressure

- How peers influence confidence, goal-setting, and behaviour

- Paragraph-length reflective responses

- ❤️ Appreciation & Acceptance of Self and Others (5 marks)

- Promoting respect, diversity, and acceptance

- 📝 Total: 70 marks | Duration: 1 hour

- 📊 Content area and cognitive level weighting tables included

- ✅ Fully detailed memorandum included

This written task is ideal for:

- CAPS formal assessment requirements

- Classroom use or structured home-based assessment

- Parents and teachers looking for high-quality, CAPS-aligned Life Orientation tasks

PDF format.', 60.00, 'Grade 7', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['life-skills','natural-science-and-technology'], 70, '[{"id":"file-4514","label":"Test / Assessment PDF","filename":"grade-7-life-orientation-term-1-written-task.pdf","storageKey":"products/84037ee6-efac-571d-944a-ffad33c5e7d8/file-4514-grade-7-life-orientation-term-1-written-task.pdf"}]'::jsonb, false, true, 4514, '{"title":"Grade 7 Life Orientation Term 1 Written Task","description":"CAPS & ATP-aligned Grade 7 Life Orientation Term 1 Written Task. Worth 70 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('843d70d0-85c1-531a-bbda-586e25b241aa', 'grade-7-life-orientation-term-1-test', 'Grade 7 Life Orientation Term 1 Test', 'CAPS & ATP-aligned Grade 7 Life Orientation Term 1 Test. Worth 70 marks , includes full memo. Instant PDF download', '-

This Grade 7 Life Orientation Term 1 Practice Test is a CAPS-aligned assessment designed to develop learners’ personal, social, and emotional skills through meaningful questions, real-life scenarios, and reflective thinking.

What’s included:

- 🍎 Healthy Lifestyle, Goals & Puberty

- Multiple-choice questions on healthy choices, goal setting, and physical changes

- ❤️ Personal & Emotional Health

- True/False questions focusing on emotional intelligence, cyberbullying, and well-being

- 🧼 Hygiene

- Fill-in-the-blanks on personal hygiene and health habits

- 🌱 Personal Skills & Development

- Short-answer questions on stress management, communication skills, self-image, respect, and personal growth

- 👥 Peer Pressure

- Scenario-based questions requiring advice, explanation, and reflection

- 💬 Self-image & Relationships

- Case study exploring family relationships, friendships, and self-esteem

- 🧠 Coping with Pressure

- Extended question on practical coping strategies and life skills

- 📝 Total: 70 marks | Duration: 1 hour

- 📊 Content and cognitive level weighting tables included

- ✅ Fully detailed memorandum included

This practice test is ideal for:

- Term 1 assessment or revision

- Classroom use or guided home practice

- Parents and teachers looking for structured, CAPS-aligned Life Orientation resources

PDF format.', 60.00, 'Grade 7', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['life-skills','natural-science-and-technology'], 70, '[{"id":"file-4511","label":"Test / Assessment PDF","filename":"grade-7-life-orientation-term-1-test.pdf","storageKey":"products/843d70d0-85c1-531a-bbda-586e25b241aa/file-4511-grade-7-life-orientation-term-1-test.pdf"}]'::jsonb, false, true, 4511, '{"title":"Grade 7 Life Orientation Term 1 Test","description":"CAPS & ATP-aligned Grade 7 Life Orientation Term 1 Test. Worth 70 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('49746dc8-1aaa-5918-8bba-a72e67eb35b8', 'grade-7-economic-management-sciences-term-1-test-2', 'Grade 7 Economic Management Sciences Term 1 Test 2', 'CAPS & ATP-aligned Grade 7 Economic Management Sciences Term 1 Test 2. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 7 Economic & Management Sciences Term 1 Practice Test 2 is a CAPS-aligned assessment designed to strengthen learners’ understanding of resources, needs and wants, money, economic concepts, and types of businesses through structured, real-life scenarios.

The test assesses a balanced range of lower-, middle-, and higher-order cognitive skills , requiring learners to recall key concepts, explain ideas, apply knowledge, and justify opinions.

What’s included:

- 💡 Resources, Needs & Wants

- Multiple-choice questions focusing on scarcity, budgeting, and decision-making

- 💰 History of Money & Key Concepts

- Barter trade, goods and services, entrepreneurs, and profit

- True/False and fill-in-the-blank questions

- 📊 Economic Concepts

- Matching key terms such as consumer, demand, business, needs, and wants

- 🧠 Needs & Wants Case Study (16 marks)

- Scenario-based questions

- Explaining concepts, giving reasons, and offering advice

- Opinion-based responses with justification

- 🏢 Formal and Informal Businesses

- Classifying different types of businesses

- Real-life South African examples

- 📝 Total: 50 marks | Duration: 1 hour

- 📊 Content area and cognitive level weighting tables included

- ✅ Fully detailed memorandum included

This practice test is ideal for:

- Term 1 assessment or revision

- Classroom use or structured home practice

- Parents and teachers looking for high-quality, CAPS-aligned EMS resources

PDF format.', 60.00, 'Grade 7', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','history'], 50, '[{"id":"file-4508","label":"Test / Assessment PDF","filename":"grade-7-economic-management-sciences-term-1-test-2.pdf","storageKey":"products/49746dc8-1aaa-5918-8bba-a72e67eb35b8/file-4508-grade-7-economic-management-sciences-term-1-test-2.pdf"}]'::jsonb, false, true, 4508, '{"title":"Grade 7 Economic Management Sciences Term 1 Test 2","description":"CAPS & ATP-aligned Grade 7 Economic Management Sciences Term 1 Test 2. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('4bb2aa74-f94f-5fbc-b2e0-e643ce56c6bb', 'grade-7-economic-management-sciences-term-1-test', 'Grade 7 Economic Management Sciences Term 1 Test', 'CAPS & ATP-aligned Grade 7 Economic Management Sciences Term 1 Test 2. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 7 Economic & Management Sciences Term 1 Practice Test is a CAPS-aligned assessment designed to build learners’ understanding of basic economic concepts , money, decision-making, and social issues that affect communities.

What’s included:

- 💰 History of Money (17 marks)

- Bartering, commodity money, and fiat money

- Characteristics of money

- Evolution of money from the past to the present

- Matching key economic concepts

- 🏠 Needs and Wants (9 marks)

- Definitions and classification

- Real-life scenario-based questions

- Budgeting and prioritising essentials

- 🛒 Goods and Services (17 marks)

- Difference between goods and services

- Producers and consumers

- Public vs private goods

- Case study on a small business

- True/False questions on economic concepts

- 🌍 Inequality and Poverty (7 marks)

- Causes of poverty in South Africa

- Effects on communities

- Suggesting solutions to reduce inequality

- 📝 Total: 50 marks | Duration: 1 hour

- 📊 Content area and cognitive level weighting tables included

- ✅ Fully detailed memorandum included

This practice test is ideal for:

- Term 1 assessment or revision

- Classroom use or home practice

- Parents and teachers looking for structured, CAPS-aligned EMS resources

PDF format.', 60.00, 'Grade 7', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','history'], 50, '[{"id":"file-4504","label":"Test / Assessment PDF","filename":"grade-7-economic-management-sciences-term-1-test.pdf","storageKey":"products/4bb2aa74-f94f-5fbc-b2e0-e643ce56c6bb/file-4504-grade-7-economic-management-sciences-term-1-test.pdf"}]'::jsonb, false, true, 4504, '{"title":"Grade 7 Economic Management Sciences Term 1 Test","description":"CAPS & ATP-aligned Grade 7 Economic Management Sciences Term 1 Test 2. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('2f86b77d-5ab5-52cf-ac63-0fc23992a11d', 'grade-7-afrikaans-fal-term-1-test-2', 'Grade 7 Afrikaans FAL Term 1 Test 2', 'CAPS & ATP-aligned Grade 7 Afrikaans First Additional Language Term 1 Test 2. Worth 60 marks , includes full memo. Instant PDF download', 'This Grade 7 Afrikaans First Additional Language Term 1 Practice Test is a CAPS-aligned assessment designed to strengthen learners’ reading comprehension, visual literacy, summary writing, and language skills in Afrikaans through clear, age-appropriate texts and questions.

The test is structured according to CAPS cognitive levels and provides a balanced assessment of knowledge recall, understanding, application, and higher-order thinking .

What’s included:

- 📖 Leesbegrip: Literêre / Nie-literêre teks (20 marks)

- Narrative text about a learner visiting the doctor

- Literal, inferential, and evaluative comprehension questions

- Vocabulary, synonyms and antonyms, diminutives, plurals, and verb identification

- 🖼️ Visuele Teks (10 marks)

- Medical form analysis

- Questions focusing on layout, information extraction, correctness, and purpose

- ✍️ Opsomming (10 marks)

- Informational text on a helicopter rescue operation

- Learners summarise key steps using their own words

- Clear instructions and analytic summary rubric included

- ✍️ Taalstrukture en Konvensies (20 marks), including:

- Byvoeglike naamwoorde

- Trappe van vergelyking

- Voorsetsels

- Lidwoorde

- Alfabetiese rangskikking

- Werkwoorde en tye (verlede en toekomende tyd)

- Sinsoorte (vraagsin en bevelsin)

- 📝 Total: 60 marks | Duration: 1 hour

- 📊 CAPS cognitive-level weighting included

- ✅ Fully detailed memorandum included

This practice test is ideal for:

- Term 1 assessment or revision

- Classroom use or structured home practice

- Parents and teachers looking for high-quality, CAPS-aligned Grade 7 Afrikaans FAL resources

PDF format.', 60.00, 'Grade 7', 'Term 1', '2026', 'Individual Resource', 'Summary', array['afrikaans-first-additional-language','natural-science-and-technology'], 60, '[{"id":"file-4501","label":"Summary PDF","filename":"grade-7-afrikaans-fal-term-1-test-2.pdf","storageKey":"products/2f86b77d-5ab5-52cf-ac63-0fc23992a11d/file-4501-grade-7-afrikaans-fal-term-1-test-2.pdf"}]'::jsonb, false, true, 4501, '{"title":"Grade 7 Afrikaans FAL Term 1 Test 2","description":"CAPS & ATP-aligned Grade 7 Afrikaans First Additional Language Term 1 Test 2. Worth 60 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('a6aa5d51-4f08-5d0e-8e44-04215acb2d31', 'grade-7-afrikaans-fal-term-1-test', 'Grade 7 Afrikaans FAL Term 1 Test 1', 'CAPS & ATP-aligned Grade 7 Afrikaans First Additional Language Term 1 Test. Worth 6 0 marks , includes full memo. Instant PDF download', 'This Grade 7 Afrikaans First Additional Language Term 1 Practice Test is CAPS Annual Teaching Plan (ATP) aligned and designed to help learners practise key language skills in a structured, exam-style format.

The test includes:

• Reading comprehension (literary or non-literary text)

• Visual text comprehension

• Summary writing

• Language structures and conventions

The paper assesses a balanced range of cognitive levels, including lower, middle and higher-order thinking skills, and is suitable for revision, assessment preparation, or extra practice at home.

What’s included:

• Full practice test (60 marks)

• Detailed memorandum

• Clear instructions and mark allocation

• PDF format – easy to print or use digitally

This resource is ideal for parents, teachers, and tutors looking for focused Afrikaans FAL practice that builds confidence and exam readiness.

ATP aligned | Grade 7 | Term 1 | PDF download', 60.00, 'Grade 7', 'Term 1', '2026', 'Individual Resource', 'Summary', array['afrikaans-first-additional-language','natural-science-and-technology'], 0, '[{"id":"file-4496","label":"Summary PDF","filename":"grade-7-afrikaans-fal-term-1-test.pdf","storageKey":"products/a6aa5d51-4f08-5d0e-8e44-04215acb2d31/file-4496-grade-7-afrikaans-fal-term-1-test.pdf"}]'::jsonb, false, true, 4496, '{"title":"Grade 7 Afrikaans FAL Term 1 Test 1","description":"CAPS & ATP-aligned Grade 7 Afrikaans First Additional Language Term 1 Test. Worth 6 0 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('189fa0f6-2c5c-5c16-9bbc-db3fee308cf1', 'grade-7-english-fal-term-1-test-2', 'Grade 7 English FAL Term 1 Test 2', 'CAPS & ATP-aligned Grade 7 English First Additional Language Term 1 Test 2. Worth 6 0 marks , includes full memo. Instant PDF download', 'This Grade 7 English First Additional Language Term 1 Practice Test 2 is a CAPS-aligned assessment designed to further develop learners’ reading comprehension, visual literacy, summary writing, and language skills through engaging and relevant content.

The test is carefully structured according to CAPS cognitive levels, ensuring a balanced focus on recall, application, and higher-order thinking , while supporting learners in building confidence and accuracy in English.

What’s included:

- 📖 Reading Comprehension (20 marks)

- Narrative text about a boy rescuing a baby dolphin

- Literal, inferential, and evaluative questions

- Vocabulary in context and extended written responses

- 🖼️ Visual Text (10 marks)

- Informational poster on Marine Protected Areas (MPAs)

- Questions on purpose, message, visuals, colour, and target audience

- ✍️ Summary Writing (10 marks)

- 40–50 word summary on the purpose and benefits of Marine Protected Areas

- Clear instructions and summary rubric included

- ✍️ Language Structures & Conventions (20 marks), including:

- Nouns, adjectives, verbs, pronouns, conjunctions, and prepositions

- Singular and plural forms

- Tenses (including past perfect)

- Direct and indirect speech

- Active and passive voice

- Antonyms

- Punctuation and sentence correction

- 📝 Total: 60 marks | Duration: 1.5 hours

- 📊 CAPS cognitive-level weighting included

- ✅ Fully detailed memorandum included

This practice test is ideal for:

- Term 1 assessment or revision

- Classroom use or structured home practice

- Parents and teachers looking for high-quality, CAPS-aligned Grade 7 English FAL resources

PDF format.', 60.00, 'Grade 7', 'Term 1', '2026', 'Individual Resource', 'Summary', array['english-first-additional-language','natural-science-and-technology'], 0, '[{"id":"file-4491","label":"Summary PDF","filename":"grade-7-english-fal-term-1-test-2.pdf","storageKey":"products/189fa0f6-2c5c-5c16-9bbc-db3fee308cf1/file-4491-grade-7-english-fal-term-1-test-2.pdf"}]'::jsonb, false, true, 4491, '{"title":"Grade 7 English FAL Term 1 Test 2","description":"CAPS & ATP-aligned Grade 7 English First Additional Language Term 1 Test 2. Worth 6 0 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('6d4706f2-7aab-5a07-898b-ce8caa0d5717', 'grade-7-english-fal-term-1-test', 'Grade 7 English FAL Term 1 Test', 'CAPS & ATP-aligned Grade 7 English First Additional Language Term 1 Test 1. Worth 6 0 marks , includes full memo. Instant PDF download', 'This Grade 7 English First Additional Language Term 1 Practice Test is a CAPS-aligned assessment designed to strengthen learners’ reading comprehension, visual literacy, summary writing, and language skills in a structured and accessible way.

The test is carefully set according to CAPS cognitive levels, ensuring a balanced mix of recall, application, and higher-order thinking , while supporting learners who are developing confidence in English as an additional language.

What’s included:

- 📖 Reading Comprehension (20 marks)

- Informational text on the Barbary Lion

- Literal, inferential, and opinion-based questions

- Vocabulary, subject and predicate, synonyms and antonyms

- 🖼️ Visual Text (10 marks)

- Advertisement analysis

- Questions on purpose, target audience, slogan, persuasive techniques, and layout

- ✍️ Summary Writing (10 marks)

- 50–60 word summary

- Clear step-by-step instructions

- Summary marking guideline included

- ✍️ Language Structures & Conventions (20 marks), including:

- Punctuation and sentence correction

- Coordinating conjunctions

- Tenses (past perfect, simple present)

- Active and passive voice

- Singular and plural forms

- Degrees of comparison

- Figurative language (simile and metaphor)

- Homophones and commonly confused words

- 📝 Total: 60 marks | Duration: 1.5 hours

- 📊 CAPS cognitive-level weighting included

- ✅ Fully detailed memorandum included

This practice test is ideal for:

- Term 1 assessment or revision

- Classroom use or structured home practice

- Parents and teachers looking for high-quality, CAPS-aligned Grade 7 English FAL resources

PDF format.', 60.00, 'Grade 7', 'Term 1', '2026', 'Individual Resource', 'Summary', array['english-first-additional-language','natural-science-and-technology'], 0, '[{"id":"file-4487","label":"Summary PDF","filename":"grade-7-english-fal-term-1-test.pdf","storageKey":"products/6d4706f2-7aab-5a07-898b-ce8caa0d5717/file-4487-grade-7-english-fal-term-1-test.pdf"}]'::jsonb, false, true, 4487, '{"title":"Grade 7 English FAL Term 1 Test","description":"CAPS & ATP-aligned Grade 7 English First Additional Language Term 1 Test 1. Worth 6 0 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('a36c0913-3ea0-5942-83d5-70b5e880dddd', 'grade-7-english-hl-term-1-test-2', 'Grade 7 English HL Term 1 Test 2', 'CAPS & ATP-aligned Grade 7 English Home Language Term 1 Test 2. Worth 6 0 marks , includes full memo. Instant PDF download', 'This Grade 7 English Home Language Term 1 Practice Test 2 is a CAPS-aligned assessment designed to further develop learners’ reading comprehension, visual literacy, summary writing, and language skills through meaningful, age-appropriate texts.

The test is carefully balanced across CAPS cognitive levels and encourages learners to think critically, express opinions clearly, and apply language knowledge in context.

What’s included:

- 📖 Reading Comprehension (20 marks)

- Narrative text about a boy rescuing a baby dolphin

- Literal, inferential, and evaluative questions

- Vocabulary in context, figurative language, and extended responses (including a short speech)

- 🖼️ Visual Text (10 marks)

- Informational poster on Marine Protected Areas (MPAs)

- Questions on purpose, visuals, colour, target audience, and persuasive techniques

- ✍️ Summary Writing (10 marks)

- 40–50 word summary on the purpose and benefits of Marine Protected Areas

- Clear instructions and summary rubric included

- ✍️ Language Structures & Conventions (20 marks), including:

- Nouns, adjectives, verbs, pronouns, conjunctions, and prepositions

- Singular and plural forms

- Tenses (past perfect)

- Direct and indirect speech

- Active and passive voice

- Punctuation and sentence correction

- 📝 Total: 60 marks | Duration: 1.5 hours

- 📊 CAPS cognitive-level weighting included

- ✅ Fully detailed memorandum included

This practice test is ideal for:

- Term 1 assessment or revision

- Classroom use or structured home practice

- Parents and teachers looking for high-quality, CAPS-aligned Grade 7 English HL resources

PDF format.', 60.00, 'Grade 7', 'Term 1', '2026', 'Individual Resource', 'Summary', array['english-home-language','natural-science-and-technology'], 0, '[{"id":"file-4483","label":"Summary PDF","filename":"grade-7-english-hl-term-1-test-2.pdf","storageKey":"products/a36c0913-3ea0-5942-83d5-70b5e880dddd/file-4483-grade-7-english-hl-term-1-test-2.pdf"}]'::jsonb, false, true, 4483, '{"title":"Grade 7 English HL Term 1 Test 2","description":"CAPS & ATP-aligned Grade 7 English Home Language Term 1 Test 2. Worth 6 0 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('ad844043-62ed-5620-b352-da8a7012d56e', 'grade-7-english-hl-term-1-test', 'Grade 7 English HL Term 1 Test', 'CAPS & ATP-aligned Grade 7 English Home Language Term 1 Test. Worth 6 0 marks , includes full memo. Instant PDF download', '-

This Grade 7 English Home Language Term 1 Practice Test is a CAPS-aligned assessment designed to develop learners’ reading comprehension, visual literacy, summarising skills, and language accuracy in a structured and balanced way. Set to the revised ATP.

The test is carefully set according to CAPS cognitive levels, encouraging learners to recall information, interpret texts, and apply higher-order thinking skills through analysis and opinion-based responses.

What’s included:

- 📖 Reading Comprehension (20 marks)

- Informational text on the Barbary Lion

- Literal, inferential, and evaluative questions

- Vocabulary, subject and predicate, synonyms and antonyms

- 🖼️ Visual Text (10 marks)

- Advertisement analysis

- Questions on purpose, target market, slogans, layout, and persuasive techniques

- ✍️ Summary Writing (10 marks)

- 50–60 word summary

- Clear instructions and analytic summary rubric included

- ✍️ Language Structures & Conventions (20 marks), including:

- Tenses (past perfect, simple present)

- Nouns (abstract and concrete)

- Pronouns and possessives

- Degrees of comparison

- Idioms and figures of speech (simile, personification)

- Punctuation and sentence correction

- 📝 Total: 60 marks | Duration: 1.5 hours

- 📊 Cognitive level weighting aligned to CAPS

- ✅ Fully detailed memorandum included

This practice test is ideal for:

- Term 1 assessment or revision

- Classroom use or structured home practice

- Parents and teachers looking for high-quality, CAPS-aligned Grade 7 English HL resources

PDF format.', 60.00, 'Grade 7', 'Term 1', '2026', 'Individual Resource', 'Summary', array['english-home-language','natural-science-and-technology'], 0, '[{"id":"file-4437","label":"Summary PDF","filename":"grade-7-english-hl-term-1-test.pdf","storageKey":"products/ad844043-62ed-5620-b352-da8a7012d56e/file-4437-grade-7-english-hl-term-1-test.pdf"}]'::jsonb, false, true, 4437, '{"title":"Grade 7 English HL Term 1 Test","description":"CAPS & ATP-aligned Grade 7 English Home Language Term 1 Test. Worth 6 0 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('e3d24b79-fa8d-5d0e-9322-56d4b75ab72b', 'grade-6-natural-science-technology-term-1-test-2', 'Grade 6 Natural Science & Technology Term 1 Test', 'CAPS & ATP-aligned Grade 6 Natural Science and Technology Term 1 Test. Worth 40 marks , includes full memo. Instant PDF download', 'This Grade 6 Natural Sciences & Technology Term 1 Practice Test 2 is a CAPS-aligned assessment designed to deepen learners’ understanding of life processes, nutrition, ecosystems, and food webs , while developing scientific reasoning and explanation skills.

The test is well balanced across lower-, middle-, and higher-order cognitive levels , requiring learners to recall facts, apply knowledge, and explain or predict outcomes using real-life contexts.

What’s included:

- 🌱 Photosynthesis

- Requirements for photosynthesis

- Chlorophyll and glucose

- Importance of sunlight

- 🍎 Nutrients in Food

- Classifying foods into carbohydrates, proteins, fats, and vitamins/minerals

- 🥗 Nutrition & Balanced Diets

- Analysing meal diaries

- Identifying healthy vs unhealthy eating habits

- Health risks linked to poor diets

- 🏭 Processing Food

- Reasons for food processing

- Methods used to extend shelf life

- 🌍 Ecosystems

- Producers, consumers, and decomposers

- Predicting the impact of changes in an ecosystem

- 🐟 Food Webs

- Energy and nutrient flow

- Predator–prey relationships

- Living vs non-living things

- 📝 Total: 40 marks | Duration: 1 hour

- 📊 Content and cognitive level weighting tables included

- ✅ Fully detailed memorandum included

This practice test is ideal for:

- Term 1 assessment or revision

- Classroom use or home practice

- Parents and teachers looking for structured, CAPS-aligned Natural Sciences & Technology resources

PDF format.', 60.00, 'Grade 6', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 40, '[{"id":"file-4433","label":"Test / Assessment PDF","filename":"grade-6-natural-science-technology-term-1-test-2.pdf","storageKey":"products/e3d24b79-fa8d-5d0e-9322-56d4b75ab72b/file-4433-grade-6-natural-science-technology-term-1-test-2.pdf"}]'::jsonb, false, true, 4433, '{"title":"Grade 6 Natural Science & Technology Term 1 Test","description":"CAPS & ATP-aligned Grade 6 Natural Science and Technology Term 1 Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('b20eb96c-e475-512d-9f0f-08c24d7e9146', 'grade-6-nst-term-1-test', 'Grade 6 Natural Science & Technology Term 1 Test', 'CAPS & ATP-aligned Grade 6 Natural Science and Technology Term 1 Test. Worth 40 marks , includes full memo. Instant PDF download', '-

This Grade 6 Natural Sciences & Technology Term 1 Practice Test is a CAPS-aligned assessment designed to assess learners’ understanding of nutrition, plants, ecosystems, and food chains , while developing scientific thinking and explanation skills.

The test includes a balanced mix of multiple-choice, short-answer, case study, source-based, and paragraph writing questions , with clear weighting across content areas and cognitive levels.

What’s included:

- 🔘 Multiple Choice Questions

- Nutrition and plants

- 🔗 Column Match

- Nutrients and their functions

- ✔️ True / False Questions

- Ecosystems and food chains

- 📘 Case Study

- Balanced diet, healthy eating choices, and lifestyle habits

- ✍️ Short Answer Questions

- Nutrients, food preservation, ecosystems, and food webs

- 🖼️ Picture Analysis

- Interpreting a food label and understanding nutritional information

- ✍️ Paragraph Writing

- Explaining food chains, producers, consumers, and decomposers

- 📝 Total: 40 marks | Duration: 1 hour

- 📊 Content and cognitive level weighting tables included

- ✅ Fully detailed memorandum included

This practice test is ideal for:

- Term 1 assessment or revision

- Classroom use or home practice

- Parents and teachers looking for structured, CAPS-aligned Natural Sciences & Technology resources

PDF format.', 60.00, 'Grade 6', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 40, '[{"id":"file-4430","label":"Test / Assessment PDF","filename":"grade-6-nst-term-1-test.pdf","storageKey":"products/b20eb96c-e475-512d-9f0f-08c24d7e9146/file-4430-grade-6-nst-term-1-test.pdf"}]'::jsonb, false, true, 4430, '{"title":"Grade 6 Natural Science & Technology Term 1 Test","description":"CAPS & ATP-aligned Grade 6 Natural Science and Technology Term 1 Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('99658ff3-44e7-5d35-8568-5a164253a465', 'grade-6-mathematics-term-1-written-task', 'Grade 6 Mathematics Term 1 Written Task', 'CAPS & ATP-aligned Grade 6 Mathematics Term 1 Written Task. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 6 Mathematics Term 1 Written Task is a CAPS-aligned assessment designed to formally assess learners’ understanding of number concepts, operations, and mathematical reasoning through structured written questions.

The task focuses on accuracy, problem-solving, and showing all working, with clear weighting across content areas and cognitive levels to ensure balanced assessment.

What’s included:

- 🔢 Counting, Ordering & Comparing (20 marks)

- Ascending and descending order

- Comparing numbers using &lt;, &gt; and =

- Place value

- Rounding to the nearest 1 000

- Expanded notation

- ➕➖ Addition & Subtraction (15 marks)

- Estimation using rounding

- Large number calculations

- Real-life word problems

- ✖️ Multiplication (15 marks)

- Factors, multiples, and prime numbers

- Written multiplication

- Context-based problem-solving

- 📝 Total: 50 marks | Duration: 1 hour

- ❌ No calculators (as per CAPS requirements)

- 📊 Content area and cognitive level weighting tables included

- 40% lower-order

- 40% middle-order

- 20% higher-order thinking

- ✅ Fully detailed memorandum included

This written task is ideal for:

- Term 1 formal Mathematics assessment

- Classroom use or controlled written tasks

- Parents and teachers looking for structured, CAPS-aligned Grade 6 Mathematics resources

PDF format.', 60.00, 'Grade 6', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 50, '[{"id":"file-4427","label":"Test / Assessment PDF","filename":"grade-6-mathematics-term-1-written-task.pdf","storageKey":"products/99658ff3-44e7-5d35-8568-5a164253a465/file-4427-grade-6-mathematics-term-1-written-task.pdf"}]'::jsonb, false, true, 4427, '{"title":"Grade 6 Mathematics Term 1 Written Task","description":"CAPS & ATP-aligned Grade 6 Mathematics Term 1 Written Task. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('7c5b8fa3-7292-52cb-89ff-7d3b970ff2fa', 'grade-6-mathematics-term-1-test', 'Grade 6 Mathematics Term 1 Test', 'CAPS & ATP-aligned Grade 6 Mathematics Term 1 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 6 Mathematics Term 1 Practice Test is a CAPS-aligned assessment designed to help learners revise and consolidate key mathematics concepts covered in Term 1 while building confidence for formal assessments.

The test places strong emphasis on number sense, accuracy, problem-solving, and showing all working , with a balanced spread across cognitive levels.

What’s included:

- 🔢 Whole Numbers

- Place value and value of digits

- Number lines

- Comparing numbers using &lt;, &gt; and =

- Prime numbers, factors and multiples

- Estimation and rounding (nearest 100 and 1 000)

- ➕➖ Addition & Subtraction

- Multi-digit calculations

- Word problems in real-life contexts

- Using inverse operations to check answers

- ✖️ Multiplication

- Written calculations

- Problem-solving and reasoning questions

- ➗ Division

- Short division

- Remainders

- Context-based word problems

- 📝 Total: 50 marks | Duration: 1 hour

- ❌ No calculators (as per CAPS requirements)

- 📊 Content area and cognitive level weighting tables included

- ✅ Fully detailed memorandum included

This practice test is ideal for:

- Term 1 revision and exam preparation

- Classroom use or home practice

- Parents and teachers looking for structured, CAPS-aligned Grade 6 Mathematics resources

PDF format.', 60.00, 'Grade 6', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 50, '[{"id":"file-4424","label":"Test / Assessment PDF","filename":"grade-6-mathematics-term-1-test.pdf","storageKey":"products/7c5b8fa3-7292-52cb-89ff-7d3b970ff2fa/file-4424-grade-6-mathematics-term-1-test.pdf"}]'::jsonb, false, true, 4424, '{"title":"Grade 6 Mathematics Term 1 Test","description":"CAPS & ATP-aligned Grade 6 Mathematics Term 1 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('b7572a43-8fe4-5555-a0dd-4dbd3edb2e83', 'grade-6-life-skills-psw-term-1-written-task', 'Grade 6 Life Skills PSW Term 1 Written Task', 'CAPS & ATP-aligned Grade 6 Life Skills PSW Term 1 Written Task. Worth 30 marks , includes full memo. Instant PDF download', 'This Grade 6 Life Skills PSW Term 1 Written Task is a CAPS-aligned assessment designed to assess learners’ ability to apply personal and social well-being concepts through a structured case study and extended written responses.

The task is based on a realistic scenario involving a Grade 6 learner and explores key Term 1 PSW topics such as basic hygiene, self-esteem, peer pressure, conflict resolution, and the influence of social media . Learners are required to reflect, analyse situations, and express their ideas clearly and thoughtfully.

What’s included:

- 📘 Case study-based written task

- ✍️ Questions covering:

- Basic hygiene habits and personal care

- Positive and negative self-esteem

- Peer pressure and decision-making

- Conflict resolution strategies

- Peer influence and social media awareness

- 🧠 Higher-order thinking , including reflection and a supportive letter-writing task

- 📝 Total: 30 marks | Duration: 45 minutes

- 📊 Content and cognitive level weighting tables included

- ✅ Fully detailed memorandum included

This written task is ideal for:

- Term 1 formal Life Skills assessment

- Classroom use or guided home practice

- Parents and teachers looking for structured, CAPS-aligned PSW written tasks

PDF format.', 60.00, 'Grade 6', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['life-skills','natural-science-and-technology'], 30, '[{"id":"file-4420","label":"Test / Assessment PDF","filename":"grade-6-life-skills-psw-term-1-written-task.pdf","storageKey":"products/b7572a43-8fe4-5555-a0dd-4dbd3edb2e83/file-4420-grade-6-life-skills-psw-term-1-written-task.pdf"}]'::jsonb, false, true, 4420, '{"title":"Grade 6 Life Skills PSW Term 1 Written Task","description":"CAPS & ATP-aligned Grade 6 Life Skills PSW Term 1 Written Task. Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('402e4be0-15e6-53fd-97e0-ed409a3266fb', 'grade-6-history-term-1-test-1', 'Grade 6 History Term 1 Test', 'CAPS & ATP-aligned Grade 6 History Term 1 Test. Worth 40 marks , includes full memo. Instant PDF download', 'This Grade 6 History Term 1 Practice Test is a CAPS-aligned assessment designed to assess learners’ understanding of early African societies, trade, and heritage , while developing essential historical thinking and writing skills.

The test focuses on the Mapungubwe Kingdom , early farming communities, trade networks, and historical figures, and includes a balanced mix of factual recall, source-based understanding, and extended writing.

What’s included:

- 🔘 Multiple Choice Questions to assess key historical facts

- ✍️ Short Questions on early farming settlements, trade, and movement

- 🧠 Fill in the Missing Words using historical vocabulary and concepts

- 📚 Short Answer Questions on historical figures (e.g. Marco Polo)

- ✍️ Paragraph Writing

- Significance of the Mapungubwe Kingdom

- Economic, social, and cultural achievements

- Clear marking guideline included

- 📝 Total: 40 marks | Duration: 1 hour

- 📊 Content and cognitive level weighting tables included

- ✅ Fully detailed memorandum included

This practice test is ideal for:

- Term 1 assessment or revision

- Classroom use or home practice

- Parents and teachers looking for structured, CAPS-aligned History resources

PDF format.', 60.00, 'Grade 6', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','history'], 40, '[{"id":"file-4418","label":"Test / Assessment PDF","filename":"grade-6-history-term-1-test-1.pdf","storageKey":"products/402e4be0-15e6-53fd-97e0-ed409a3266fb/file-4418-grade-6-history-term-1-test-1.pdf"}]'::jsonb, false, true, 4418, '{"title":"Grade 6 History Term 1 Test","description":"CAPS & ATP-aligned Grade 6 History Term 1 Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('701387f1-c54e-5eb3-9885-97a22c85b316', 'grade-6-ls-psw-term-1-test', 'Grade 6 Life Skills PSW Term 1 Test', 'CAPS & ATP-aligned Grade 6 Life Skills PSW Term 1 Test. Worth 30 marks , includes full memo. Instant PDF download', 'This Grade 6 Life Skills PSW Term 1 Practice Test is a CAPS-aligned assessment designed to help learners develop important personal, social, and decision-making skills through meaningful, age-appropriate questions.

The test focuses on self-esteem, self-image, peer pressure, conflict resolution, empathy, diversity, and personal goal-setting , encouraging learners to reflect, apply knowledge, and make responsible choices.

What’s included:

- 🔘 Multiple Choice Questions

- Self-esteem, body image, peer pressure, and personal strengths

- ✏️ Fill in the Blanks

- Key PSW vocabulary such as empathy, negotiation, calm behaviour, and safety awareness

- ✍️ Short Answer Questions

- Action plans, personal development, and improving abilities

- ✔️ True / False Questions

- Healthy self-image, diversity, and positive decision-making

- 📘 Case Study

- Real-life scenario on peer pressure and making responsible choices

- Learners explain decisions, suggest solutions, and reflect on values

- 📝 Total: 30 marks | Duration: 1 hour

- 📊 Content and cognitive level weighting tables included

- ✅ Fully detailed memorandum included

This practice test is ideal for:

- Term 1 assessment or revision

- Classroom use or home practice

- Parents and teachers looking for structured, CAPS-aligned Life Skills resources

This practice test is ideal for:

- Term 1 assessment or revision

- Classroom use or home practice

- Parents and teachers looking for structured, CAPS-aligned History resources

PDF format.', 60.00, 'Grade 6', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['life-skills','natural-science-and-technology','history'], 30, '[{"id":"file-4416","label":"Test / Assessment PDF","filename":"grade-6-ls-psw-term-1-test.pdf","storageKey":"products/701387f1-c54e-5eb3-9885-97a22c85b316/file-4416-grade-6-ls-psw-term-1-test.pdf"}]'::jsonb, false, true, 4416, '{"title":"Grade 6 Life Skills PSW Term 1 Test","description":"CAPS & ATP-aligned Grade 6 Life Skills PSW Term 1 Test. Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('83ae527e-bcad-5968-9723-3e836801135d', 'grade-6-history-term-1-test-2', 'Grade 6 History Term 1 Test', 'CAPS & ATP-aligned Grade 6 History Term 1 Test. Worth 40 marks , includes full memo. Instant PDF download', 'This Grade 6 History Term 1 Practice Test 2 is a CAPS-aligned assessment designed to deepen learners’ understanding of the Mapungubwe Kingdom , early African societies, and the importance of heritage, leadership, and trade.

The test places a strong emphasis on historical concepts, source-based thinking, and explanation skills , encouraging learners to recall knowledge, analyse visual sources, and express ideas clearly in written form.

What’s included:

- ✍️ One-Word Answers to assess key historical terminology

- 🔗 Column Match linking concepts, places, and people

- ✔️ True or False questions with corrections

- 🖼️ Picture Analysis

- Interpreting historical artefacts such as the golden sceptre

- Understanding symbolism, leadership, and cultural significance

- ✏️ Short Answer Questions covering:

- Leadership and social structure at Mapungubwe

- Trade networks and neighbouring regions

- Beliefs, heritage, and daily life

- 📝 Total: 40 marks | Duration: 1 hour

- 📊 Content and cognitive level weighting tables included

- ✅ Fully detailed memorandum included

This practice test is ideal for:

- Term 1 assessment or revision

- Classroom use or home practice

- Parents and teachers looking for structured, CAPS-aligned History resources

PDF format.', 60.00, 'Grade 6', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','history'], 40, '[{"id":"file-4407","label":"Test / Assessment PDF","filename":"grade-6-history-term-1-test-2.pdf","storageKey":"products/83ae527e-bcad-5968-9723-3e836801135d/file-4407-grade-6-history-term-1-test-2.pdf"}]'::jsonb, false, true, 4407, '{"title":"Grade 6 History Term 1 Test","description":"CAPS & ATP-aligned Grade 6 History Term 1 Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('28326c93-782e-53ef-aa2e-733f44c55bcb', 'grade-6-geography-term-1-test-2', 'Grade 6 Geography Term 1 Test', 'CAPS & ATP-aligned Grade 6 Geography Term 1 Test. Worth 40 marks , includes full memo. Instant PDF download', 'This Grade 6 Geography Term 1 Practice Test 2 is a CAPS-aligned assessment designed to further develop learners’ map skills, geographical knowledge, and application of latitude, longitude, and time concepts .

The test places strong emphasis on interpreting maps, applying geographical concepts, and explaining ideas in full sentences , while maintaining a balanced distribution across cognitive levels. Set to the revised ATP.

What’s included:

- ✔️ True or False questions to assess core geographical knowledge

- 🔗 Match the Columns

- Key concepts such as latitude, longitude, equator, hemispheres, scale, and the Prime Meridian

- 🌍 Latitude, Longitude & Time

- Identifying major latitude lines

- International Date Line and time zone reasoning

- Explaining why geographical lines are structured as they are

- 🗺️ Map Skills

- Interpreting map features (title, key/legend, compass rose, scale)

- Explaining the use of political maps

- 📊 Map Types & Features

- Interpreting population, rainfall, and vegetation maps

- Identifying global physical features such as rivers, deserts, and mountains

- 📝 Total: 40 marks | Duration: 1 hour

- 📊 Content and cognitive level weighting tables included

- ✅ Fully detailed memorandum included

This practice test is ideal for:

- Term 1 assessment or revision

- Classroom use or home practice

- Parents and teachers looking for structured, CAPS-aligned Geography resources

PDF format.', 60.00, 'Grade 6', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','geography'], 40, '[{"id":"file-4403","label":"Test / Assessment PDF","filename":"grade-6-geography-term-1-test-2.pdf","storageKey":"products/28326c93-782e-53ef-aa2e-733f44c55bcb/file-4403-grade-6-geography-term-1-test-2.pdf"}]'::jsonb, false, true, 4403, '{"title":"Grade 6 Geography Term 1 Test","description":"CAPS & ATP-aligned Grade 6 Geography Term 1 Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('44694749-c8b4-56ae-b2c6-662259b7baf1', 'grade-6-geography-term-1-test', 'Grade 6 Geography Term 1 Test', 'CAPS & ATP-aligned Grade 6 Geography Term 1 Test. Worth 40 marks , includes full memo. Instant PDF download', 'This Grade 6 Geography Term 1 Practice Test is a CAPS-aligned assessment designed to develop learners’ geographical knowledge, map skills, and ability to apply information from sources such as maps and atlases. Set to the revised ATP.

The test focuses on key Term 1 Geography concepts, including hemispheres, lines of latitude and longitude, map scales, atlases, global statistics, and case-study analysis . Learners are required to recall facts, interpret maps, calculate distances, and explain ideas using full sentences.

What’s included:

- ✔️ True or False questions to assess factual knowledge

- 🔘 Multiple Choice questions on key geographical concepts

- 🔗 Match the Columns (latitude, longitude, hemispheres, equator, meridian)

- 🗺️ Map Work :

- Word scales and line scales

- Distance calculations using maps

- Big scale vs small scale maps

- 🌍 Hemispheres and global positioning

- 📚 Case Study based on the use of an atlas and global statistics

- 📝 Total: 40 marks | Duration: 1 hour

- 📊 Content and cognitive level weighting tables included

- ✅ Fully detailed memorandum included

This practice test is ideal for:

- Term 1 assessment or revision

- Classroom use or home practice

- Parents and teachers looking for structured, CAPS-aligned Geography resources

PDF format.', 60.00, 'Grade 6', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','geography'], 40, '[{"id":"file-4401","label":"Test / Assessment PDF","filename":"grade-6-geography-term-1-test.pdf","storageKey":"products/44694749-c8b4-56ae-b2c6-662259b7baf1/file-4401-grade-6-geography-term-1-test.pdf"}]'::jsonb, false, true, 4401, '{"title":"Grade 6 Geography Term 1 Test","description":"CAPS & ATP-aligned Grade 6 Geography Term 1 Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('ad0ac3a9-ac2e-53c1-a250-02a442cd7b7f', 'grade-6-afrikaans-fal-term-1-test-2', 'Grade 6 Afrikaans FAL Term 1 Test', 'CAPS & ATP-aligned Grade 6 Afrikaans FAL Term 1 Test. Worth 50 marks , includes full memo. Instant PDF download', 'Hierdie Graad 6 Afrikaans Eerste Addisionele Taal Kwartaal 1 Oefentoets 2 is ’n CAPS-gebaseerde assessering wat leerders se leesbegrip, visuele geletterdheid en taalvaardighede verder ontwikkel deur middel van realistiese, alledaagse tekste. Set to the revised ATP.

Wat is ingesluit:

- 📰 Begripstoets: Koerantberig (20 punte)

- Nie-literêre teks oor ’n gemeenskapsgebeurtenis

- Letterlike, afleidende en interpretatiewe vrae

- Woordeskat, sinsoorte, voegwoorde, onderwerp en aksiewoorde

- 🖼️ Visuele teks (10 punte)

- Koerantvoorblad-analise

- Opskrifte, datums, temas, teikenmark en uitleg

- Interpretasie van kleur, lettergroottes en visuele impak

- ✍️ Taal in konteks (20 punte), insluitend:

- Meervoud en verkleinings

- Verlede, huidige en toekomende tyd

- Direkte en indirekte rede

- Voorsetsels en bywoorde

- Sinsoorte (stelsin, vraagsin, bevelsin)

- Beeldspraak (alliterasie)

- Punktuasie en sinskonstruksie

- 📝 Totaal: 50 punte | Tydsduur: 1 uur

- 📊 Inhouds- en kognitiewe vlak-tabelle ingesluit

- ✅ Volledige memorandum ingesluit

Hierdie oefentoets is ideaal vir:

- Kwartaal 1 assessering en hersiening

- Klaskamergebruik of tuisstudie

- Ouers en onderwysers wat gestruktureerde, CAPS-georiënteerde Afrikaans FAL hulpbronne soek

PDF format.', 60.00, 'Grade 6', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['afrikaans-first-additional-language','natural-science-and-technology'], 50, '[{"id":"file-4396","label":"Test / Assessment PDF","filename":"grade-6-afrikaans-fal-term-1-test-2.pdf","storageKey":"products/ad0ac3a9-ac2e-53c1-a250-02a442cd7b7f/file-4396-grade-6-afrikaans-fal-term-1-test-2.pdf"}]'::jsonb, false, true, 4396, '{"title":"Grade 6 Afrikaans FAL Term 1 Test","description":"CAPS & ATP-aligned Grade 6 Afrikaans FAL Term 1 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('0b53aac4-0d69-57bf-9522-cef2cd66d776', 'grade-6-afrikaans-fal-term-1-test', 'Grade 6 Afrikaans FAL Term 1 Test', 'CAPS & ATP-aligned Grade 6 Afrikaans FAL Term 1 Test. Worth 50 marks , includes full memo. Instant PDF download', 'Hierdie Graad 6 Afrikaans Eerste Addisionele Taal Kwartaal 1 Oefentoets is ’n CAPS-gebaseerde assessering wat leerders se leesbegrip, visuele geletterdheid en taalvaardighede op ’n gestruktureerde en ouderdomstoepaslike manier assesseer. Set to the revised ATP.

Wat is ingesluit:

- 📖 Begripstoets (20 punte)

- Literêre teks met letterlike, afleidende en opiniegebaseerde vrae

- Woordeskat, volgorde van gebeure en motivering van antwoorde

- 🖼️ Visuele teks (10 punte)

- Resep-gebaseerde teks (pannekoek)

- Interpretasie van inligting, stappe, alfabetiese rangskikking en persoonlike reaksies

- ✍️ Taal in konteks (20 punte), insluitend:

- Sinonieme en antonieme

- Meervoud en verkleining

- Verlede en toekomende tyd

- Sinsoorte (stelsin, vraagsin, bevelsin)

- Direkte en indirekte rede

- Beeldspraak (personifikasie, alliterasie)

- Idiome en punktuasie

- 📝 Totaal: 50 punte | Tydsduur: 1 uur

- 📊 Inhouds- en kognitiewe vlak-tabelle ingesluit

- ✅ Volledige memorandum ingesluit

Hierdie oefentoets is ideaal vir:

- Kwartaal 1 assessering en hersiening

- Klaskamergebruik of tuisstudie

- Ouers en onderwysers wat gestruktureerde, CAPS-georiënteerde Afrikaans FAL hulpbronne soek

PDF format.', 60.00, 'Grade 6', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['afrikaans-first-additional-language','natural-science-and-technology'], 50, '[{"id":"file-4394","label":"Test / Assessment PDF","filename":"grade-6-afrikaans-fal-term-1-test.pdf","storageKey":"products/0b53aac4-0d69-57bf-9522-cef2cd66d776/file-4394-grade-6-afrikaans-fal-term-1-test.pdf"}]'::jsonb, false, true, 4394, '{"title":"Grade 6 Afrikaans FAL Term 1 Test","description":"CAPS & ATP-aligned Grade 6 Afrikaans FAL Term 1 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('2ad4ccd4-c553-597b-b304-9a620dbec640', 'grade-6-english-fal-term-1-test-2', 'Grade 6 English FAL Term 1 Test', 'CAPS & ATP-aligned Grade 6 English FAL Term 1 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 6 English First Additional Language Term 1 Practice Test 2 is a CAPS-aligned assessment designed to further develop learners’ reading comprehension, visual literacy, and language accuracy through engaging, real-world content. Set to the revised ATP.

What’s included:

- 📰 Reading Comprehension (20 marks)

- Informational newspaper article on wildlife conservation

- Literal, inferential, and evaluative questions

- Vocabulary in context, matching events, true/false, and opinion-based responses

- 🖼️ Visual Literacy (10 marks)

- Magazine cover analysis

- Questions on title, layout, fonts, imagery, headlines, subheadings, and target audience

- Interpretation of visual impact and purpose

- ✍️ Language Structures & Conventions (20 marks), including:

- Nouns, adjectives, verbs, and prepositions

- Sentence types (statements, questions, exclamations)

- Singular and plural forms

- Tenses (past, present, future)

- Direct and indirect speech

- Figures of speech (simile)

- Punctuation and sentence correction

- 📝 Total: 50 marks | Duration: 1 hour

- 📊 Content and cognitive level weighting tables included

- ✅ Fully detailed memorandum included

This practice test is ideal for:

PDF format.', 60.00, 'Grade 6', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['english-first-additional-language','natural-science-and-technology'], 50, '[{"id":"file-4390","label":"Test / Assessment PDF","filename":"grade-6-english-fal-term-1-test-2.pdf","storageKey":"products/2ad4ccd4-c553-597b-b304-9a620dbec640/file-4390-grade-6-english-fal-term-1-test-2.pdf"}]'::jsonb, false, true, 4390, '{"title":"Grade 6 English FAL Term 1 Test","description":"CAPS & ATP-aligned Grade 6 English FAL Term 1 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('950fb985-03ed-5718-a9b1-5186c4fce8a2', 'grade-6-english-fal-term-1-test', 'Grade 6 English FAL Term 1 Test', 'CAPS & ATP-aligned Grade 6 English FAL Term 1 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 6 English First Additional Language Term 1 Test is a CAPS-aligned assessment designed to assess learners’ reading, writing, viewing, and language skills in a structured and learner-friendly way. Set to the revised ATP.

What’s included:

- ✍️ Descriptive Writing Task (20 marks)

- Writing a descriptive essay of 150–200 words

- Use of sensory language and figures of speech

- Planning with a mind map

- Analytic writing rubric included

- 📖 Reading Comprehension (20 marks)

- Narrative text with literal, inferential, and evaluative questions

- Vocabulary, synonyms, antonyms, conjunctions, tense, and punctuation

- 🖼️ Visual Literacy (10 marks)

- Invitation-based questions

- Interpreting information, purpose, and layout

- Short opinion-based responses

- ✍️ Language Structures & Conventions (integrated)

- Tenses (past, present, future)

- Pronouns, nouns, verbs, adjectives, and prepositions

- Direct and indirect speech

- Sentence construction and verb agreement

- 📝 Total: 50 marks | Duration: 1 hour

- 📊 Content and cognitive level weighting tables included

- ✅ Fully detailed memorandum included

This test is ideal for:

- Term 1 formal assessment or revision

- Classroom use or home practice

- Parents and teachers looking for structured, CAPS-aligned English FAL resources

PDF format.', 60.00, 'Grade 6', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['english-first-additional-language','natural-science-and-technology'], 50, '[{"id":"file-4388","label":"Test / Assessment PDF","filename":"grade-6-english-fal-term-1-test.pdf","storageKey":"products/950fb985-03ed-5718-a9b1-5186c4fce8a2/file-4388-grade-6-english-fal-term-1-test.pdf"}]'::jsonb, false, true, 4388, '{"title":"Grade 6 English FAL Term 1 Test","description":"CAPS & ATP-aligned Grade 6 English FAL Term 1 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('c90ef03a-3db6-5f7e-8178-38250cdf97f0', 'grade-6-english-hl-term-1-test-2', 'Grade 6 English HL Term 1 Test', 'CAPS & ATP-aligned Grade 6 English HL Term 1 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 6 English Home Language Term 1 Practice Test 2 is a CAPS-aligned assessment designed to further develop learners’ reading, viewing, and language skills through engaging, real-world texts.

What’s included:

- 📰 Reading Comprehension (newspaper report)

- Literal, inferential, and evaluative questions

- Vocabulary in context and parts of speech

- 🖼️ Visual Literacy

- Magazine cover analysis

- Purpose, layout, fonts, target audience, and visual impact

- ✍️ Language Structures & Conventions , including:

- Nouns, verbs, adjectives, and prepositions

- Sentence types and plurals

- Tenses (past, present, future)

- Direct and indirect speech

- Figures of speech (simile)

- Punctuation and sentence correction

- 📝 Total: 50 marks | Duration: 1 hour

- 📊 Content and cognitive level weighting tables included

- ✅ Fully detailed memorandum included

This practice test is ideal for:

- Term 1 assessment or revision

- Classroom use or home practice

- Parents and teachers looking for structured, CAPS-aligned English HL resources

PDF format.', 60.00, 'Grade 6', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['english-home-language','natural-science-and-technology'], 50, '[{"id":"file-4384","label":"Test / Assessment PDF","filename":"grade-6-english-hl-term-1-test-2.pdf","storageKey":"products/c90ef03a-3db6-5f7e-8178-38250cdf97f0/file-4384-grade-6-english-hl-term-1-test-2.pdf"}]'::jsonb, false, true, 4384, '{"title":"Grade 6 English HL Term 1 Test","description":"CAPS & ATP-aligned Grade 6 English HL Term 1 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('51caa409-4e22-5ea5-ac0c-4b77fcbce4c7', 'grade-5-englishhl-term-1-test', 'Grade 6 English HL Term 1 Test', 'CAPS & ATP-aligned Grade 6 English HL Term 1 Test. Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 6 English Home Language Term 1 Practice Test is a CAPS-aligned assessment designed to assess and strengthen learners’ reading, viewing, and language skills in a structured and age-appropriate way. Set to the revised ATP.

What’s included:

- 📖 Reading Comprehension based on an informational text

- Literal, inferential, and evaluative questions

- Vocabulary, synonyms, antonyms, and tense work

- 🖼️ Visual Literacy

- Advertisement analysis

- Target market, purpose, layout, fonts, and key information

- ✍️ Language Structures & Conventions , including:

- Tenses (past, present, future)

- Adjectives, conjunctions, pronouns, and homophones

- Figures of speech (simile, metaphor, hyperbole, alliteration)

- Direct and indirect speech

- Punctuation and sentence construction

- 📝 Total: 50 marks | Duration: 1 hour

- 📊 Content and cognitive level weighting tables included

- ✅ Fully detailed memorandum included

This practice test is ideal for:

- Term 1 assessment or revision

- Classroom use or home practice

- Parents and teachers looking for structured, CAPS-aligned English HL resources

PDF format.', 60.00, 'Grade 6', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['english-home-language','natural-science-and-technology'], 50, '[{"id":"file-4348","label":"Test / Assessment PDF","filename":"grade-5-englishhl-term-1-test.pdf","storageKey":"products/51caa409-4e22-5ea5-ac0c-4b77fcbce4c7/file-4348-grade-5-englishhl-term-1-test.pdf"}]'::jsonb, false, true, 4348, '{"title":"Grade 6 English HL Term 1 Test","description":"CAPS & ATP-aligned Grade 6 English HL Term 1 Test. Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('8293340d-1b57-59a7-8753-5c32b6122723', 'grade-5-mathematics-term-1-fat-test-2026', 'Grade 5 Mathematics Term 1 FAT (Test) (2026)', 'CAPS & ATP-aligned Grade 5 Mathematics FAT (Test) (2026) Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 5 Mathematics Term 1 Formal Assessment Task (Test) is a CAPS-aligned assessment developed in accordance with the 2026 ATP requirements . It is designed to formally assess learners’ understanding of key Term 1 mathematics concepts under controlled test conditions.

What’s included:

- 🧠 Mental Maths & Number Concepts

- Place value, ordering, rounding, counting patterns, odd and even numbers

- ✍️ Number Sentences & Properties

- Completing number sentences

- Writing number sentences from word problems

- Explaining number properties

- ➕➖ Addition & Subtraction

- Estimation and column method calculations

- Context-based word problems

- ✖️ Multiplication

- Doubling and halving

- Building up and breaking down numbers

- Real-life problem-solving

- 📝 Total: 50 marks | Duration: 1 hour

- ❌ No calculators (as per CAPS requirements)

- 📊 Content area and cognitive level weighting tables included

- ✅ Fully detailed memorandum included

This formal assessment test is ideal for:

- Term 1 CAPS FAT requirements

- Controlled classroom assessments

- Parents and teachers looking for structured, ATP-aligned Grade 5 Mathematics tests

PDF format.', 60.00, 'Grade 5', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 50, '[{"id":"file-4345","label":"Test / Assessment PDF","filename":"grade-5-mathematics-term-1-fat-test-2026.pdf","storageKey":"products/8293340d-1b57-59a7-8753-5c32b6122723/file-4345-grade-5-mathematics-term-1-fat-test-2026.pdf"}]'::jsonb, false, true, 4345, '{"title":"Grade 5 Mathematics Term 1 FAT (Test) (2026)","description":"CAPS & ATP-aligned Grade 5 Mathematics FAT (Test) (2026) Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('2358933f-a012-546f-b58d-c648eda256ad', 'grade-5-mathematics-term-1-fat-2026', 'Grade 5 Mathematics Term 1 FAT (Assignment) (2026)', 'CAPS & ATP-aligned Grade 5 Mathematics FAT (Assignment) (2026) Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 5 Mathematics Term 1 Formal Assessment Task (Assignment) is a CAPS-aligned assessment designed in line with the 2026 ATP requirements . It provides a structured way to assess learners’ understanding of key Term 1 mathematics concepts over more than one lesson.

What’s included:

- 🔢 Number Concepts & Mental Maths

- Place value, ordering, rounding, counting patterns, odd and even numbers

- ✍️ Number Sentences & Properties

- Completing number sentences

- Writing number sentences from word problems

- Identifying and correcting errors

- ➕➖ Addition & Subtraction

- Estimation and column method calculations

- Context-based word problems

- ✖️ Multiplication

- Doubling and halving

- Estimation before calculation

- Real-life problem-solving

- 📝 Total: 50 marks | Duration: 3 hours

- 📊 Content area and cognitive level weighting tables included

- ✅ Fully detailed memorandum included

This formal assessment task is ideal for:

- Term 1 CAPS FAT requirements

- Classroom assessment spread over multiple lessons

- Parents and teachers looking for structured, ATP-aligned Grade 5 Mathematics assignments

PDF format.', 60.00, 'Grade 5', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 50, '[{"id":"file-4342","label":"Test / Assessment PDF","filename":"grade-5-mathematics-term-1-fat-2026.pdf","storageKey":"products/2358933f-a012-546f-b58d-c648eda256ad/file-4342-grade-5-mathematics-term-1-fat-2026.pdf"}]'::jsonb, false, true, 4342, '{"title":"Grade 5 Mathematics Term 1 FAT (Assignment) (2026)","description":"CAPS & ATP-aligned Grade 5 Mathematics FAT (Assignment) (2026) Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('01ac8b23-9c3b-5a2d-a7e9-ff6845ae4373', 'grade-5-mathematics-term-1-test-2025', 'Grade 5 Mathematics Term 1 Test (2025)', 'CAPS & ATP-aligned Grade 5 Mathematics Test (2025) Worth 40 marks , includes full memo. Instant PDF download', 'This Grade 5 Mathematics Term 1 Practice Test is a CAPS-aligned assessment designed to help learners revise and consolidate key mathematics skills covered in Term 1 before formal assessments.

The test focuses on whole numbers, number sentences, addition and subtraction, and problem-solving , with an emphasis on showing all working and applying mathematical reasoning in real-life contexts.

What’s included:

- 🔢 Whole Numbers , including:

- Number patterns and sequences

- Place value and rounding off

- Comparing and ordering numbers

- ➕➖ Addition and Subtraction with multi-step calculations

- ✍️ Number Sentences , including:

- Writing number sentences from word problems

- Solving and completing number sentences

- 🧠 Problem-solving questions using real-life scenarios

- 📝 Total: 40 marks | Duration: 60 minutes

- ✅ Fully detailed memorandum included

This practice test is ideal for:

- Term 1 revision and exam preparation

- Classroom use or home practice

- Parents and teachers looking for structured, CAPS-aligned Mathematics resources

PDF format.', 60.00, 'Grade 5', 'Term 1', '2025', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 40, '[{"id":"file-4339","label":"Test / Assessment PDF","filename":"grade-5-mathematics-term-1-test-2025.pdf","storageKey":"products/01ac8b23-9c3b-5a2d-a7e9-ff6845ae4373/file-4339-grade-5-mathematics-term-1-test-2025.pdf"}]'::jsonb, false, true, 4339, '{"title":"Grade 5 Mathematics Term 1 Test (2025)","description":"CAPS & ATP-aligned Grade 5 Mathematics Test (2025) Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('ab713229-9140-5882-9d3a-a3862bffac45', 'grade-5-mathematics-fat-term-1', 'Grade 5 Mathematics Term 1 FAT (2025)', 'CAPS & ATP-aligned Grade 5 Mathematics FAT 1 (2025) Worth 50 marks , includes full memo. Instant PDF download', 'This Grade 5 Mathematics Term 1 Formal Assessment Task is a CAPS-aligned assessment designed to assess learners’ understanding of whole numbers and number sentences in a structured and comprehensive way. Set to the revised ATP of 2024/2025.

What’s included:

- 🔢 Whole Numbers , including:

- Ordering and comparing numbers

- Place value and expanded form

- Rounding off numbers

- ➕➖ Addition and Subtraction with multi-step calculations

- ✍️ Number Sentences , including:

- Writing number sentences from word problems

- Solving and completing number sentences

- Explaining reasoning and correcting errors

- 📝 Total: 50 marks | Duration: 3 hours

- ✅ Fully detailed memorandum included

This formal assessment task is ideal for:

- Term 1 FAT requirements

- Classroom assessment or controlled testing

- Parents and teachers looking for structured, CAPS-aligned Mathematics assessments

PDF format.', 60.00, 'Grade 5', 'Term 1', '2025', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 50, '[{"id":"file-4334","label":"Test / Assessment PDF","filename":"grade-5-mathematics-fat-term-1.pdf","storageKey":"products/ab713229-9140-5882-9d3a-a3862bffac45/file-4334-grade-5-mathematics-fat-term-1.pdf"}]'::jsonb, false, true, 4334, '{"title":"Grade 5 Mathematics Term 1 FAT (2025)","description":"CAPS & ATP-aligned Grade 5 Mathematics FAT 1 (2025) Worth 50 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('ec9d1f11-9e65-5a02-aafe-83350781dd1b', 'grade-5-natural-science-technology-term-1-test2', 'Grade 5 Natural Science & Technology Term 1 Test', 'CAPS & ATP-aligned Grade 5 Natural Science & Technology Term 1 Test. Worth 40 marks , includes full memo. Instant PDF download', 'This Grade 5 Natural Sciences & Technology Term 1 Practice Test 2 is a CAPS-aligned assessment designed to deepen learners’ understanding of ecosystems, plants and animals, materials, and energy , while developing observation, reasoning, and explanation skills.

The test focuses on how living and non-living things interact within ecosystems and includes a strong emphasis on food chains, plant structures, photosynthesis, habitats, and environmental balance .

What’s included:

- ✔️ True or False questions to assess scientific understanding

- ✏️ Fill in the Blanks using key scientific vocabulary

- 🔗 Match the Columns to reinforce concepts and definitions

- 🖼️ Picture and food chain analysis to test interpretation skills

- 🌱 Questions on plants, animals, decomposers, producers and consumers

- ✍️ Short-answer questions requiring explanation and application

- 📝 Total: 40 marks | Duration: 45 minutes

- ✅ Fully detailed memorandum included

This test is ideal for:

- Term 1 assessment or revision

- Classroom use or home practice

- Parents and teachers looking for structured, CAPS-aligned Natural Sciences resources

PDF format.', 60.00, 'Grade 5', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 40, '[{"id":"file-4331","label":"Test / Assessment PDF","filename":"grade-5-natural-science-technology-term-1-test2.pdf","storageKey":"products/ec9d1f11-9e65-5a02-aafe-83350781dd1b/file-4331-grade-5-natural-science-technology-term-1-test2.pdf"}]'::jsonb, false, true, 4331, '{"title":"Grade 5 Natural Science & Technology Term 1 Test","description":"CAPS & ATP-aligned Grade 5 Natural Science & Technology Term 1 Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('9e53a6ae-d9d8-56fa-8408-94649e9bcfdf', 'grade-5-nst-term-1-test', 'Grade 5 Natural Science & Technology Term 1 Test', 'CAPS & ATP-aligned Grade 5 Natural Science & Technology Term 1 Test. Worth 40 marks , includes full memo. Instant PDF download', 'This Grade 5 Natural Sciences & Technology Term 1 Practice Test is a CAPS-aligned assessment designed to assess learners’ understanding of life cycles, plants and animals, food chains, habitats, and basic scientific concepts .

The test encourages learners to observe, interpret diagrams, apply scientific vocabulary, and explain ideas using full sentences. It includes a balanced mix of factual recall, diagram interpretation, and reasoning questions.

What’s included:

- ✔️ True or False questions with corrections

- 🔗 Match the Columns to assess scientific terminology

- 🖼️ Diagram-based questions on life cycles and food chains

- 🌱 Concepts such as photosynthesis, producers and consumers, habitats, skeletons, and animal structures

- ✍️ Short and long response questions to develop scientific reasoning

- 📝 Total: 40 marks | Duration: 45 minutes

- ✅ Fully detailed memorandum included

This test is ideal for:

- Term 1 assessment or revision

- Classroom use or home practice

- Parents and teachers looking for structured, CAPS-aligned Natural Sciences resources

PDF format.', 60.00, 'Grade 5', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology'], 40, '[{"id":"file-4328","label":"Test / Assessment PDF","filename":"grade-5-nst-term-1-test.pdf","storageKey":"products/9e53a6ae-d9d8-56fa-8408-94649e9bcfdf/file-4328-grade-5-nst-term-1-test.pdf"}]'::jsonb, false, true, 4328, '{"title":"Grade 5 Natural Science & Technology Term 1 Test","description":"CAPS & ATP-aligned Grade 5 Natural Science & Technology Term 1 Test. Worth 40 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('8eb0b6c0-4936-5c9c-ab5f-2c02c3480790', 'grade-5-geography-term-1-test', 'Grade 5 Geography Term 1 Test', 'CAPS & ATP-aligned Grade 5 Geography Term 1 Test. Worth 30 marks , includes full memo. Instant PDF download', 'This Grade 5 Geography Term 1 Practice Test 2 is a CAPS-aligned assessment designed to strengthen learners’ understanding of Africa’s physical and political features , while developing essential map and source-based skills.

The test focuses on Africa as a continent , including oceans, deserts, rivers, mountains, countries, capital cities, and compass directions. Learners are required to interpret maps, apply geographical knowledge, and answer questions using visual and written sources.

What’s included:

- ✔️ True or False questions to assess key geographical facts

- ✏️ Fill in the Missing Words using correct geographical terms

- 🔗 Match the Columns on African features and definitions

- 🧭 Compass points and directional skills

- 🗺️ Map skills questions based on a physical map of Africa

- ✍️ Short-answer questions requiring explanation and application

- 📝 Total: 30 marks | Duration: 45 minutes

- ✅ Fully detailed memorandum included

This test is ideal for:

- Term 1 assessment or revision

- Classroom use or home practice

- Parents and teachers looking for structured, CAPS-aligned Geography resources

PDF format.', 60.00, 'Grade 5', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','geography'], 30, '[{"id":"file-4325","label":"Test / Assessment PDF","filename":"grade-5-geography-term-1-test.pdf","storageKey":"products/8eb0b6c0-4936-5c9c-ab5f-2c02c3480790/file-4325-grade-5-geography-term-1-test.pdf"}]'::jsonb, false, true, 4325, '{"title":"Grade 5 Geography Term 1 Test","description":"CAPS & ATP-aligned Grade 5 Geography Term 1 Test. Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('8cb65564-c3fe-58be-b8f5-a60e08730052', 'https-designingminds-co-za-wp-content-uploads-2026-01-grade-5-geography-term-1-test-1-memo-pdf', 'Grade 5 Geography Term 1 Test', 'CAPS & ATP-aligned Grade 5 Geography Term 1 Test. Worth 30 marks , includes full memo. Instant PDF download', 'This Grade 5 Geography Term 1 Practice Test is a CAPS-aligned assessment designed to help learners develop map skills, geographical knowledge, and the ability to interpret sources and physical features of South Africa.

The test focuses on key Term 1 Geography concepts such as maps, directions, latitude and longitude, landforms, relief, and rivers , with an emphasis on understanding South Africa’s physical landscape.

What’s included:

- ✏️ Fill in the Blanks to assess key geographical terms and concepts

- 🗺️ Source-based questions using maps and diagrams

- 🧠 Questions on landforms (plateau, escarpment, coastal plain, coastline)

- 🌍 Map interpretation of South African physical features

- 💧 River systems and catchment areas

- 📝 Total: 30 marks | Duration: 45 minutes

- ✅ Fully detailed memorandum included

This test is ideal for:

- Term 1 assessment or revision

- Classroom use or home practice

- Parents and teachers looking for structured, CAPS-aligned Geography resources

PDF format.', 60.00, 'Grade 5', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','geography'], 30, '[{"id":"file-4322","label":"Test / Assessment PDF","filename":"https-designingminds-co-za-wp-content-uploads-2026-01-grade-5-geography-term-1-test-1-memo-pdf.pdf","storageKey":"products/8cb65564-c3fe-58be-b8f5-a60e08730052/file-4322-https-designingminds-co-za-wp-content-uploads-2026-01-grade-5-geography-term-1-test-1-memo-pdf.pdf"}]'::jsonb, false, true, 4322, '{"title":"Grade 5 Geography Term 1 Test","description":"CAPS & ATP-aligned Grade 5 Geography Term 1 Test. Worth 30 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('4f8b41bb-6744-54a1-afaf-34b08a465577', 'https-designingminds-co-za-wp-content-uploads-2026-01-grade-5-history-term-1-test-2-memo-pdf', 'Grade 5 History Term 1 Test 2', 'CAPS & ATP-aligned Grade 5 History Term 1 Test. Worth 3 0 marks , includes full memo. Instant PDF download', 'This Grade 5 History Term 1 Practice Test 2 is a CAPS-aligned assessment designed to develop learners’ understanding of hunter-gatherer and herder societies through the use of historical sources, visual evidence, and extended writing.

The test explores how historians learn about the past through stories, objects, rock paintings, and living societies , with a strong focus on the San and Khoikhoi during the Later Stone Age.

What’s included:

- ✔️ True or False questions to assess factual understanding

- 🖼️ Source-based questions using rock paintings and images

- 📚 Questions on stories, objects, and ethnography

- 🧠 Short-answer questions on San and Khoikhoi societies

- ✍️ Paragraph writing (choice of two topics) to assess comparison and explanation skills

- 📝 Total: 30 marks | Duration: 45 minutes

- ✅ Fully detailed memorandum included

This test is ideal for:

- Term 1 assessment or revision

- Classroom use or home practice

- Parents and teachers looking for CAPS-aligned History resources that develop critical thinking

PDF format.', 60.00, 'Grade 5', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','history'], 0, '[{"id":"file-4319","label":"Test / Assessment PDF","filename":"https-designingminds-co-za-wp-content-uploads-2026-01-grade-5-history-term-1-test-2-memo-pdf.pdf","storageKey":"products/4f8b41bb-6744-54a1-afaf-34b08a465577/file-4319-https-designingminds-co-za-wp-content-uploads-2026-01-grade-5-history-term-1-test-2-memo-pdf.pdf"}]'::jsonb, false, true, 4319, '{"title":"Grade 5 History Term 1 Test 2","description":"CAPS & ATP-aligned Grade 5 History Term 1 Test. Worth 3 0 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('973e3e23-b820-5ec7-8dca-dec7f2f0cec9', 'https-designingminds-co-za-wp-content-uploads-2026-01-grade-5-history-term-1-test-1-memo-pdf', 'Grade 5 History Term 1 Test 1', 'CAPS & ATP-aligned Grade 5 History Term 1 Test. Worth 3 0 marks , includes full memo. Instant PDF download', 'This Grade 5 History Term 1 Practice Test is a CAPS-aligned assessment designed to help learners understand early societies in southern Africa and develop key historical thinking skills.

The test focuses on hunter-gatherers and herders , including the San and Khoikhoi , and explores how people lived, worked, communicated, and adapted to their environment. Learners are required to recall knowledge, interpret visual sources, and express ideas clearly in written form.

What’s included:

- 🔗 Match the Columns to assess key historical terms and concepts

- ✏️ Fill in the Blanks to test factual knowledge

- ✔️ True or False questions with corrections

- 🖼️ Picture Analysis to develop source-based and interpretive skills

- ✍️ Paragraph Question comparing hunter-gatherer and herding lifestyles

- 📝 Total: 30 marks | Duration: 45 minutes

- ✅ Fully detailed memorandum included

This test is ideal for:

- Term 1 assessment or revision

- Classroom use or home practice

- Parents and teachers looking for structured, CAPS-aligned History resources

PDF format.', 60.00, 'Grade 5', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['natural-science-and-technology','history'], 0, '[{"id":"file-4298","label":"Test / Assessment PDF","filename":"https-designingminds-co-za-wp-content-uploads-2026-01-grade-5-history-term-1-test-1-memo-pdf.pdf","storageKey":"products/973e3e23-b820-5ec7-8dca-dec7f2f0cec9/file-4298-https-designingminds-co-za-wp-content-uploads-2026-01-grade-5-history-term-1-test-1-memo-pdf.pdf"}]'::jsonb, false, true, 4298, '{"title":"Grade 5 History Term 1 Test 1","description":"CAPS & ATP-aligned Grade 5 History Term 1 Test. Worth 3 0 marks , includes full memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('c27357ce-8177-5ae5-8c7b-47eac96bceb1', 'grade-5-life-skills-psw-term-1-written-task', 'Grade 5 Life Skills PSW Term 1 Written Task', 'CAPS & ATP-aligned Grade 5 Life skills PSW Term 1 Written Task. Worth 3 0 marks , includes full rubric-based memo. Instant PDF download', 'This Grade 5 Life Skills PSW Term 1 Written Task is a CAPS-aligned assessment designed to assess learners’ ability to apply personal and social well-being concepts through a structured case study .

Learners engage with a realistic scenario that explores friendship, self-concept, empathy, emotional awareness, feedback, and dealing with teasing or bullying . The task encourages reflection, emotional understanding, and the ability to express thoughts clearly in written form.

What’s included:

- 📘 Case study-based written task

- ✍️ Questions that assess:

- Understanding of relationships and emotions

- Empathy and emotional regulation

- Positive vs negative feedback

- Safe and unsafe relationships

- Problem-solving and decision-making

- 🧠 Longer responses that develop reasoning and self-expression

- 📝 Total: 30 marks | Duration: 45 minutes

- ✅ Fully detailed memorandum included

This written task is ideal for:

- Term 1 formal assessment

- Life Skills projects or controlled tasks

- Classroom use or guided home practice

PDF format.', 60.00, 'Grade 5', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['life-skills','natural-science-and-technology'], 0, '[{"id":"file-4295","label":"Test / Assessment PDF","filename":"grade-5-life-skills-psw-term-1-written-task.pdf","storageKey":"products/c27357ce-8177-5ae5-8c7b-47eac96bceb1/file-4295-grade-5-life-skills-psw-term-1-written-task.pdf"}]'::jsonb, false, true, 4295, '{"title":"Grade 5 Life Skills PSW Term 1 Written Task","description":"CAPS & ATP-aligned Grade 5 Life skills PSW Term 1 Written Task. Worth 3 0 marks , includes full rubric-based memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('097ebab6-44ca-53e6-a470-b0315eb11bac', 'https-designingminds-co-za-wp-content-uploads-2026-01-grade-5-life-skills-psw-term-1-test-memo-pdf', 'Grade 5 Life Skills PSW Term 1 Test', 'CAPS & ATP-aligned Grade 5 Life skills PSW Term 1 Practice Test. Worth 3 0 marks , includes full rubric-based memo. Instant PDF download', 'The test focuses on key Term 1 topics such as relationships, self-concept, self-confidence, kindness, respect, honesty, and responsibility , while encouraging learners to reflect, think critically, and express their ideas clearly.

What’s included:

- ✔️ True or False questions to assess understanding of key concepts

- 🔗 Match the Columns to link values with real-life situations

- ✍️ Short Answer Questions requiring full sentences and examples

- 🧠 Case Study to assess empathy, problem-solving, and decision-making

- 📝 Total: 30 marks | Duration: 45 minutes

- ✅ Fully detailed memorandum included

This test is ideal for:

- Term 1 assessment or revision

- Classroom use or home practice

- Parents and teachers looking for structured, CAPS-aligned Life Skills resources

PDF format.', 60.00, 'Grade 5', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['life-skills','natural-science-and-technology'], 0, '[{"id":"file-4291","label":"Test / Assessment PDF","filename":"https-designingminds-co-za-wp-content-uploads-2026-01-grade-5-life-skills-psw-term-1-test-memo-pdf.pdf","storageKey":"products/097ebab6-44ca-53e6-a470-b0315eb11bac/file-4291-https-designingminds-co-za-wp-content-uploads-2026-01-grade-5-life-skills-psw-term-1-test-memo-pdf.pdf"}]'::jsonb, false, true, 4291, '{"title":"Grade 5 Life Skills PSW Term 1 Test","description":"CAPS & ATP-aligned Grade 5 Life skills PSW Term 1 Practice Test. Worth 3 0 marks , includes full rubric-based memo. Instant PDF download"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('720629cc-5057-5f94-9beb-b54815b8adbc', 'https-designingminds-co-za-wp-content-uploads-2026-01-grade-5-afrikaans-fal-term-1-test-2-memo-pdf', 'Grade 5 Afrikaans First Additional Language Term 1 Test 2', 'CAPS & ATP-aligned Grade 5 Afrikaans FAL Term 1 Practice Test. Worth 40 marks , covering Reading comprehension, Visual Literacy & Language. Includes full rubric-based memo. Instant PDF download', 'This Grade 5 Afrikaans First Additional Language Term 1 Practice Test 2 is a CAPS-aligned assessment designed to further develop learners’ reading comprehension, visual literacy, and language skills through engaging and relevant content.

The test includes a narrative comprehension passage based on a family visit to the Addo Olifantpark , allowing learners to practise understanding a story, recalling details, and applying vocabulary in context.

Wat is ingesluit:

- Begripstoets gebaseer op ’n storie

- Visuele teks met ’n advertensie en vrae oor belangrike inligting

- Taalwerk , insluitend:

- Werkwoorde en tye (verlede, teenwoordige en toekomstige tyd)

- Meervoud, verkleining en voorsetsels

- Byvoeglike naamwoorde (trappe van vergelyking)

- Lidwoorde en voegwoorde

- Leestekens en sinsoorte (enkelvoudig, saamgesteld, kompleks)

- 📝 Totaal: 40 punte | Tyd: 1 uur

- ✅ Volledige memorandum ingesluit

This practice test is ideal for:

- Exam and test preparation

- Homework, revision, or assessment practice

- Parents and teachers looking for high-quality, ready-to-use resources

PDF format.', 60.00, 'Grade 5', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['afrikaans-first-additional-language','natural-science-and-technology'], 40, '[{"id":"file-4287","label":"Test / Assessment PDF","filename":"https-designingminds-co-za-wp-content-uploads-2026-01-grade-5-afrikaans-fal-term-1-test-2-memo-pdf.pdf","storageKey":"products/720629cc-5057-5f94-9beb-b54815b8adbc/file-4287-https-designingminds-co-za-wp-content-uploads-2026-01-grade-5-afrikaans-fal-term-1-test-2-memo-pdf.pdf"}]'::jsonb, false, true, 4287, '{"title":"Grade 5 Afrikaans First Additional Language Term 1 Test 2","description":"CAPS & ATP-aligned Grade 5 Afrikaans FAL Term 1 Practice Test. Worth 40 marks , covering Reading comprehension, Visual Literacy & Language. Includes full rubric"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('b84922e7-c7db-5d16-bb62-6c87d2d0ad0c', 'https-designingminds-co-za-wp-content-uploads-2026-01-grade-5-afrikaans-fal-term-1-test-1-memo-pdf', 'Grade 5 Afrikaans First Additional Language Term 1 Test 1', 'CAPS & ATP-aligned Grade 5 Afrikaans FAL Term 1 Practice Test. Worth 40 marks , covering Reading comprehension, Visual Literacy & Language. Includes full rubric-based memo. Instant PDF download', 'This Grade 5 Afrikaans First Additional Language Term 1 Practice Test is a CAPS-aligned assessment designed to strengthen learners’ reading comprehension, visual literacy, and basic language skills in Afrikaans.

The test includes a short, engaging comprehension passage titled Die TikTok-Ouma , allowing learners to practise understanding a narrative text, answering literal and inferential questions, and expanding vocabulary in a familiar, modern context.

Wat is ingesluit:

- Begripstoets gebaseer op ’n storie

- Visuele teks met prentinterpretasie en woordkeuse

- Taalwerk , insluitend:

- Sinonieme en antonieme

- Meervoud en verkleining

- Verlede en toekomstige tyd

- Spelling en punktuasie

- Alfabetiese rangskikking

- 📝 Totaal: 40 punte | Tyd: 1 uur

- ✅ Volledige memorandum ingesluit

This practice test is ideal for:

- Exam and test preparation

- Homework, revision, or assessment practice

- Parents and teachers looking for high-quality, ready-to-use resources

PDF format.', 60.00, 'Grade 5', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['afrikaans-first-additional-language','natural-science-and-technology'], 40, '[{"id":"file-4271","label":"Test / Assessment PDF","filename":"https-designingminds-co-za-wp-content-uploads-2026-01-grade-5-afrikaans-fal-term-1-test-1-memo-pdf.pdf","storageKey":"products/b84922e7-c7db-5d16-bb62-6c87d2d0ad0c/file-4271-https-designingminds-co-za-wp-content-uploads-2026-01-grade-5-afrikaans-fal-term-1-test-1-memo-pdf.pdf"}]'::jsonb, false, true, 4271, '{"title":"Grade 5 Afrikaans First Additional Language Term 1 Test 1","description":"CAPS & ATP-aligned Grade 5 Afrikaans FAL Term 1 Practice Test. Worth 40 marks , covering Reading comprehension, Visual Literacy & Language. Includes full rubric"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('5c0f0eb4-fd81-5810-b1ac-a6b9b7d15155', 'grade-5-english-first-additional-language-term-1-test-2', 'Grade 5 English First Additional Language Term 1 Test 2', 'CAPS & ATP-aligned Grade 5 English FAL Term 1 Practice Test. Worth 40 marks , covering Reading comprehension, Visual Literacy & Language. Includes full rubric-based memo. Instant PDF download', 'This Grade 5 English First Additional Language Term 1 Test 2 is a CAPS-aligned assessment designed to further develop learners’ reading, visual literacy, and language skills using clear, age-appropriate content. Aligned to the 2026 ATP.

The test includes an informational reading comprehension titled The Clever Pangolin , helping learners practise extracting information from non-fiction texts while building vocabulary and environmental awareness.

What’s included:

- 📖 Reading Comprehension based on an informational text

- 🖼️ Visual Text Analysis using a real-world safari tour advertisement

- ✍️ Language Structures & Conventions , including:

- Sentence types and punctuation

- Common nouns, adjectives, and pronouns

- Singular and plural forms

- Tenses (past, present, future)

- Articles, conjunctions, and prepositions

- Figures of speech (similes)

- 📝 Total: 40 marks | Duration: 1.5 hours

- ✅ Fully detailed memorandum included

This practice test is ideal for:

- Exam and test preparation

- Homework, revision, or assessment practice

- Parents and teachers looking for high-quality, ready-to-use resources

PDF format.', 60.00, 'Grade 5', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['english-first-additional-language','natural-science-and-technology'], 40, '[{"id":"file-4268","label":"Test / Assessment PDF","filename":"grade-5-english-first-additional-language-term-1-test-2.pdf","storageKey":"products/5c0f0eb4-fd81-5810-b1ac-a6b9b7d15155/file-4268-grade-5-english-first-additional-language-term-1-test-2.pdf"}]'::jsonb, false, true, 4268, '{"title":"Grade 5 English First Additional Language Term 1 Test 2","description":"CAPS & ATP-aligned Grade 5 English FAL Term 1 Practice Test. Worth 40 marks , covering Reading comprehension, Visual Literacy & Language. Includes full rubric-b"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('1115965d-d4eb-56f4-af60-3b47f72507fe', 'grade-5-english-first-additional-language-term-1-test-1', 'Grade 5 English First Additional Language Term 1 Test 1', 'CAPS & ATP-aligned Grade 5 English FAL Term 1 Practice Test. Worth 40 marks , covering Reading comprehension, Visual Literacy & Language. Includes full rubric-based memo. Instant PDF download', 'This Grade 5 English First Additional Language Term 1 Test is a CAPS-aligned assessment designed to support learners in developing core reading, visual literacy, and language skills in a clear and accessible way.

The test includes a short narrative reading comprehension titled The Lost Puppy , allowing learners to practise understanding simple texts, answering literal and inferential questions, and building vocabulary.

What’s included:

- 📖 Reading Comprehension based on an age-appropriate story

- 🖼️ Visual Text Analysis using a missing dog poster

- ✍️ Language Structures & Conventions , including:

- Tenses (past, present, future)

- Adjectives, adverbs, and determiners

- Synonyms and antonyms

- Pronouns and reflexive pronouns

- Punctuation and sentence types

- Figures of speech (personification)

- 📝 Total: 40 marks | Duration: 1.5 hours

- ✅ Fully detailed memorandum included

This practice test is ideal for:

- Exam and test preparation

- Homework, revision, or assessment practice

- Parents and teachers looking for high-quality, ready-to-use resources

PDF format.', 60.00, 'Grade 5', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['english-first-additional-language','natural-science-and-technology'], 40, '[{"id":"file-4266","label":"Test / Assessment PDF","filename":"grade-5-english-first-additional-language-term-1-test-1.pdf","storageKey":"products/1115965d-d4eb-56f4-af60-3b47f72507fe/file-4266-grade-5-english-first-additional-language-term-1-test-1.pdf"}]'::jsonb, false, true, 4266, '{"title":"Grade 5 English First Additional Language Term 1 Test 1","description":"CAPS & ATP-aligned Grade 5 English FAL Term 1 Practice Test. Worth 40 marks , covering Reading comprehension, Visual Literacy & Language. Includes full rubric-b"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('d92689b8-56e4-5467-b753-2e58b3effc7a', 'grade-5-english-home-language-term-1-test-2', 'Grade 5 English Home Language Term 1 Test 2', 'CAPS & ATP-aligned Grade 5 English HL Term 1 Practice Test. Worth 40 marks , covering Reading comprehension, Visual Literacy & Language. Includes full rubric-based memo. Instant PDF download', 'This Grade 5 English Home Language Term 1 Practice Test 2 is a CAPS-aligned assessment designed to strengthen learners’ understanding of comprehension, visual literacy, and language skills through engaging and age-appropriate content.

The test includes an informational reading comprehension based on The Wonders of the African Elephant , encouraging learners to read for meaning, extract information, and apply vocabulary skills.

What’s included:

- Reading Comprehension (informational text)

- Visual Text analysis using a real-world event advertisement

- Language Structures & Conventions , including:

- Tenses (past, present, future)

- Adjectives and noun phrases

- Prefixes, articles, and conjunctions

- Direct and indirect speech

- Synonyms and antonyms

- Pronouns and prepositions

- 📝 Total: 40 marks | Duration: 1 hour

- ✅ Fully detailed memorandum included

This practice test is ideal for:

- Exam and test preparation

- Homework, revision, or assessment practice

- Parents and teachers looking for high-quality, ready-to-use resources

PDF format.', 60.00, 'Grade 5', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['english-home-language','natural-science-and-technology'], 40, '[{"id":"file-4260","label":"Test / Assessment PDF","filename":"grade-5-english-home-language-term-1-test-2.pdf","storageKey":"products/d92689b8-56e4-5467-b753-2e58b3effc7a/file-4260-grade-5-english-home-language-term-1-test-2.pdf"}]'::jsonb, false, true, 4260, '{"title":"Grade 5 English Home Language Term 1 Test 2","description":"CAPS & ATP-aligned Grade 5 English HL Term 1 Practice Test. Worth 40 marks , covering Reading comprehension, Visual Literacy & Language. Includes full rubric-ba"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('56a57fac-fb75-5577-a323-4ae88a825fdc', 'grade-5-english-home-language-term-1-test-1', 'Grade 5 English Home Language Term 1 Test 1', 'CAPS & ATP-aligned Grade 5 English HL Term 1 Practice Test. Worth 40 marks , covering Reading comprehension, Visual Literacy & Language. Includes full rubric-based memo. Instant PDF download', 'This Grade 5 English Home Language Term 1 Practice Test is carefully designed to help learners revise and consolidate key skills assessed in Term 1, while building confidence before formal assessments. Set to the latest ATP.

The test is CAPS-aligned and covers all the essential components of English HL through a balanced mix of comprehension, visual literacy, and language questions.

What’s included:

- Reading Comprehension based on a classic narrative text

- Visual Text analysis using an advertisement

- Language Structures & Conventions , including:

- Verbs and tenses

- Synonyms and antonyms

- Adjectives and conjunctions

- Pronouns and prepositions

- Direct and indirect speech

- Figures of speech

- 📝 Total: 40 marks | Duration: 1 hour

- ✅ Fully detailed memorandum included

This practice test is ideal for:

- Exam and test preparation

- Homework, revision, or assessment practice

- Parents and teachers looking for high-quality, ready-to-use resources

PDF format.', 60.00, 'Grade 5', 'Term 1', '2026', 'Individual Resource', 'Test / Assessment', array['english-home-language','natural-science-and-technology'], 40, '[{"id":"file-4248","label":"Test / Assessment PDF","filename":"grade-5-english-home-language-term-1-test-1.pdf","storageKey":"products/56a57fac-fb75-5577-a323-4ae88a825fdc/file-4248-grade-5-english-home-language-term-1-test-1.pdf"}]'::jsonb, false, true, 4248, '{"title":"Grade 5 English Home Language Term 1 Test 1","description":"CAPS & ATP-aligned Grade 5 English HL Term 1 Practice Test. Worth 40 marks , covering Reading comprehension, Visual Literacy & Language. Includes full rubric-ba"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('ce3b5634-0a36-5d98-b465-7dddfb792219', 'grade-4-term-4-test-bundle-2026', 'Grade 4 Term 4 Test Bundle (2026)', 'A complete Grade 4 Term 4 CAPS-aligned test bundle including two tests per subject, with full memorandums. Instant downloadable PDF pack.', 'Grade 4 Term 4 Test Bundle (2026)

Support your Grade 4 learner with this comprehensive Term 4 assessment bundle , designed according to the revised CAPS Annual Teaching Plan for 2026.

This bundle includes two tests per subject , making it ideal for revision, exam preparation, homeschooling, and extra practice at home. Each test is supplied with a full memorandum for easy and stress-free marking.

Subjects Included

✔ English HL / FAL ✔ Afrikaans FAL ✔ Mathematics ✔ Life Skills (PSW) ✔ History ✔ Geography ✔ Natural Science & Technology

All tests are aligned to the revised CAPS ATP (2026) . Tests are provided in PDF format and include memorandums .

What You Receive

-
All Grade 4 Term 4 tests

-
Two tests per subject

-
Full memorandums for every test

-
Unlimited downloads from your account

-
Instant access after purchase

-
🔍 Preview the Tests & Memos

Before purchasing, you can view a sample preview to see what each test and memorandum looks like, including the layout, question types, and marking format.

👉 [Click here to view the preview PDF]', 350.00, 'Grade 4', 'Term 4', '2026', 'Bundle', 'Test / Assessment', array['mathematics','english-home-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography'], null, '[]'::jsonb, false, true, 4211, '{"title":"Grade 4 Term 4 Test Bundle (2026)","description":"A complete Grade 4 Term 4 CAPS-aligned test bundle including two tests per subject, with full memorandums. Instant downloadable PDF pack."}'::jsonb, array[]::text[], 'Term', null, null, null, null, null, array['mathematics','english-home-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography'], array['Term 4']),
  ('cf5bce34-1174-5662-8843-627a6e8a3936', 'grade-4-term-3-test-bundle-2026', 'Grade 4 Term 3 Test Bundle (2026)', 'A complete Grade 4 Term 3 CAPS-aligned test bundle including two tests per subject, with full memorandums. Instant downloadable PDF pack.', 'Grade 4 Term 3 Test Bundle (2026)

Support your Grade 4 learner with this comprehensive Term 3 assessment bundle , designed according to the revised CAPS Annual Teaching Plan for 2026.

This bundle includes two tests per subject , making it ideal for revision, exam preparation, homeschooling, and extra practice at home. Each test is supplied with a full memorandum for easy and stress-free marking.

Subjects Included

✔ English HL / FAL ✔ Afrikaans FAL ✔ Mathematics ✔ Life Skills (PSW) ✔ History ✔ Geography ✔ Natural Science & Technology

All tests are aligned to the revised CAPS ATP (2026) . Tests are provided in PDF format and include memorandums . Cognitive levels are not stated.

What You Receive

-
All Grade 4 Term 3 tests

-
Two tests per subject

-
Full memorandums for every test

-
Unlimited downloads from your account

-
Instant access after purchase

-
🔍 Preview the Tests & Memos

Before purchasing, you can view a sample preview to see what each test and memorandum looks like, including the layout, question types, and marking format.

👉 [Click here to view the preview PDF]', 350.00, 'Grade 4', 'Term 3', '2026', 'Bundle', 'Test / Assessment', array['mathematics','english-home-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography'], null, '[]'::jsonb, false, true, 4195, '{"title":"Grade 4 Term 3 Test Bundle (2026)","description":"A complete Grade 4 Term 3 CAPS-aligned test bundle including two tests per subject, with full memorandums. Instant downloadable PDF pack."}'::jsonb, array[]::text[], 'Term', null, null, null, null, null, array['mathematics','english-home-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography'], array['Term 3']),
  ('6b7c5679-b703-5237-a535-e8124a0b07b1', 'grade-4-term-2-test-bundle-2026', 'Grade 4 Term 2 Test Bundle (2026)', 'A complete Grade 4 Term 2 CAPS-aligned test bundle including two tests per subject, with full memorandums. Instant downloadable PDF pack.', 'Grade 4 Term 1 Test Bundle (2026)

Get all your child’s CAPS-aligned Term 1 assessments in one easy downloadable bundle. This pack includes two tests per subject , each with a full memorandum for stress-free marking and revision.

Subjects Included:

✔ English HL & FAL ✔ Afrikaans FAL ✔ Life Skills PSW ✔ History ✔ Geography ✔ Natural Science & Technology ✔ Mathematics

All tests follow the 2026 CAPS ATP and are designed for home use, tutoring, and exam preparation.

PDF format (non-editable)

What You Receive:

-
All Term 1 tests for Grade 4

-
Full memos for every test

-
Unlimited downloads

-
Instant access after purchase

Preview the Tests & Memos

Before purchasing, you can view a sample preview to see what each test and memorandum looks like, including the layout, question types, and marking format.

👉 [Click here to view the preview PDF]', 350.00, 'Grade 4', 'Term 2', '2026', 'Bundle', 'Test / Assessment', array['mathematics','english-home-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography'], null, '[]'::jsonb, false, true, 3799, '{"title":"Grade 4 Term 2 Test Bundle (2026)","description":"A complete Grade 4 Term 2 CAPS-aligned test bundle including two tests per subject, with full memorandums. Instant downloadable PDF pack."}'::jsonb, array[]::text[], 'Term', null, null, null, null, null, array['mathematics','english-home-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography'], array['Term 2']),
  ('1a73175e-bdf4-5c57-9c27-b73e9166b230', 'grade-4-full-year-test-bundle-2026', 'Grade 4 Full-Year Test Bundle (2026)', 'All four Grade 4 Term Test Bundles in one complete pack. Fully CAPS-aligned, includes all subjects for Term 1–4, plus full memorandums. Instant downloadable PDFs. Download the previews in the description to see what is covered in EACH test!', 'Grade 4 Full-Year Test Bundle (2026)

Get all your Grade 4 CAPS-aligned tests for the entire 2026 school year in one convenient full-year bundle. This pack includes Term 1, Term 2, Term 3, and Term 4 assessment bundles , each containing two tests per subject and full marking memos.

Perfect for parents, tutors, and learners who want structured practice and confidence throughout the year.

What’s Included (All Subjects Per Term)

✔ English HL & FAL ✔ Afrikaans FAL ✔ Life Skills (PSW) ✔ History ✔ Geography ✔ Natural Science & Technology ✔ Mathematics

Each term includes:

-
Two tests per subject

-
Full memorandums

-
CAPS ATP-aligned content for 2026

-
Printable PDFs (non-editable)

Bundle Benefits

- Covers the entire school year

- You save R200

- Easy and convenient

-
Unlimited downloads

-
Instant access after purchase

-
Helps reduce exam stress and improve learner confidence

Have a look at the previews below:

Term 1 Preview: https://designingminds.co.za/wp-content/uploads/2026/02/Grade-4-Term-1-Test-Bundle-Preview.pdf

Term 2 Preview: https://designingminds.co.za/wp-content/uploads/2026/02/Grade-4-Term-2-Test-Bundle-Preview.pdf

Term 3 Preview: https://designingminds.co.za/wp-content/uploads/2026/02/Grade-4-Term-3-Test-Bundle-Preview.pdf

Term 4 Preview: https://designingminds.co.za/wp-content/uploads/2026/02/Grade-4-Term-4-Test-Bundle-Preview.pdf', 350.00, 'Grade 4', 'Term 1', '2026', 'Bundle', 'Test / Assessment', array['mathematics','english-home-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography'], null, '[]'::jsonb, false, true, 3793, '{"title":"Grade 4 Full-Year Test Bundle (2026)","description":"All four Grade 4 Term Test Bundles in one complete pack. Fully CAPS-aligned, includes all subjects for Term 1–4, plus full memorandums. Instant downloadable PDF"}'::jsonb, array[]::text[], 'Term', null, null, null, null, null, array['mathematics','english-home-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography'], array['Term 1']),
  ('a0ea90c2-204d-5697-bde2-06639154ebb0', 'grade-7-term-1-test-bundle-2026', 'Grade 7 Term 1 Test Bundle (2026)', 'A complete Term 1 test bundle including two tests per subject for Grade 7. Fully CAPS-aligned with memorandums. Instant digital download. PDF format.', 'Grade 7 Term 1 Test Bundle (2026)

Prepare your Grade 7 learner with this comprehensive Term 1 test bundle. Includes two tests per subject , covering all major Grade 7 subjects in accordance with the 2026 CAPS ATP. Full memos included for every test.

Subjects Included:

✔ English HL & FAL ✔ Afrikaans FAL ✔ Life Orientation ✔ History ✔ Geography ✔ Natural Sciences ✔ Technology ✔ EMS ✔ Mathematics

A preview PDF may be added for full topic breakdown. All tests include memos. Tests do not state cognitive levels. PDF format.

What You Receive:

-
All Grade 7 Term 1 assessments

-
Full memorandums

-
Unlimited downloads

-
Instant access after payment', 350.00, 'Grade 7', 'Term 1', '2026', 'Bundle', 'Test / Assessment', array['mathematics','english-home-language','afrikaans-first-additional-language','natural-science-and-technology','history','geography'], null, '[]'::jsonb, false, true, 3468, '{"title":"Grade 7 Term 1 Test Bundle (2026)","description":"A complete Term 1 test bundle including two tests per subject for Grade 7. Fully CAPS-aligned with memorandums. Instant digital download. PDF format."}'::jsonb, array[]::text[], 'Term', null, null, null, null, null, array['mathematics','english-home-language','afrikaans-first-additional-language','natural-science-and-technology','history','geography'], array['Term 1']),
  ('5480b621-d496-5774-9b62-9c2a74d91c1f', 'grade-6-term-1-test-bundle-2026', 'Grade 6 Term 1 Test Bundle (2026)', 'A complete CAPS-aligned Term 1 test bundle for Grade 6, including two tests per subject with full memorandums. Instant downloadable PDF pack.', 'Grade 6 Term 1 Test Bundle (2026)

Support your Grade 6 learner with this comprehensive Term 1 assessment pack. This bundle includes two CAPS-aligned tests per subject , each designed according to the 2026 ATP and created to help learners practice, revise, and gain confidence for the classroom.

Each test comes with a full memo , making marking easy for parents and tutors.

Subjects Included:

✔ English HL & FAL ✔ Afrikaans FAL ✔ Life Skills PSW ✔ History ✔ Geography ✔ Natural Sciences & Technology ✔ Mathematics

All assessments follow the 2026 CAPS Annual Teaching Plan. Tests are provided in PDF format . (non-editable)

Download the preview here: https://designingminds.co.za/wp-content/uploads/2026/02/Grade-6-Term-1-Test-Bundle-Preview.pdf

What You Receive:

-
All Grade 6 Term 1 tests

-
Full memorandums for each test

-
Unlimited downloads via your account

-
Instant digital access after payment', 350.00, 'Grade 6', 'Term 1', '2026', 'Bundle', 'Test / Assessment', array['mathematics','english-home-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography'], null, '[]'::jsonb, false, true, 3465, '{"title":"Grade 6 Term 1 Test Bundle (2026)","description":"A complete CAPS-aligned Term 1 test bundle for Grade 6, including two tests per subject with full memorandums. Instant downloadable PDF pack."}'::jsonb, array[]::text[], 'Term', null, null, null, null, null, array['mathematics','english-home-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography'], array['Term 1']),
  ('72582a22-1456-566a-b5cd-4e0473f26e16', 'grade-5-term-1-test-bundle-2026', 'Grade 5 Term 1 Test Bundle (2026)', 'Complete Term 1 test pack for Grade 5, including two CAPS-aligned tests per subject plus full memorandums. Instant PDF download.', 'Grade 5 Term 1 Test Bundle (2026)

Support your Grade 5 learner with a full set of Term 1 assessments across all subjects. Each subject includes two practice tests , aligned to the 2026 CAPS ATP and designed to build confidence.

Subjects Included:

✔ English HL / FAL ✔ Afrikaans FAL ✔ Life Skills PSW ✔ History ✔ Geography ✔ Natural Science & Technology ✔ Mathematics

A preview PDF can be included for a breakdown of topics covered. Tests include full memorandums. PDF format (non-editable)

Have a look at the preview here

https://designingminds.co.za/wp-content/uploads/2026/02/Grade-5-Term-1-Test-Bundle-Preview.pdf

What You Receive:

-
All Grade 5 Term 1 tests

-
Full memos for each test

-
Unlimited downloads

-
Instant access after checkout', 350.00, 'Grade 5', 'Term 1', '2026', 'Bundle', 'Test / Assessment', array['mathematics','english-home-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography'], null, '[]'::jsonb, false, true, 3461, '{"title":"Grade 5 Term 1 Test Bundle (2026)","description":"Complete Term 1 test pack for Grade 5, including two CAPS-aligned tests per subject plus full memorandums. Instant PDF download."}'::jsonb, array[]::text[], 'Term', null, null, null, null, null, array['mathematics','english-home-language','afrikaans-first-additional-language','life-skills','natural-science-and-technology','history','geography'], array['Term 1']),
  ('6f202022-ef22-51bc-932c-72662f0115b8', 'grade-4-term-1-test-bundle-2026-2', 'Grade 4 Term 1 Test Bundle (2026)', 'Two tests per subject, fully CAPS-aligned and including memorandums. Downloadable PDF bundle covering all Grade 4 Term 1 subjects.', 'Grade 4 Term 1 Test Bundle (2026)

Support your Grade 4 learner with this comprehensive Term 1 assessment bundle , developed according to the CAPS Annual Teaching Plan for 2026.

This bundle includes two tests per subject , covering all key Term 1 topics. It is ideal for revision, exam preparation, homeschooling, and additional practice at home. Each test is supplied with a full memorandum to assist parents and educators with marking.

All tests are provided in PDF format and are ready to download and print.

Subjects Included

- English Home Language

- English First Additional Language

- Afrikaans Additional Language

- Mathematics

- Life Skills PSW

- History

- Geography

- Natural Sciences & Technology

-

-

What You Receive

-
All Grade 4 Term 1 tests

-
Two tests per subject

-
Full memorandums for every test

-
CAPS-aligned

-
Unlimited downloads from your account

-
Instant access after purchase

Preview the Tests & Memorandums

Before purchasing, you can view a sample preview of this bundle to see the layout, structure, and types of questions included.

👉 [Click here to view the preview PDF]', 350.00, 'Grade 4', 'Term 1', '2026', 'Bundle', 'Test / Assessment', array['mathematics','english-home-language','english-first-additional-language','life-skills','natural-science-and-technology','history','geography'], null, '[]'::jsonb, false, true, 3457, '{"title":"Grade 4 Term 1 Test Bundle (2026)","description":"Two tests per subject, fully CAPS-aligned and including memorandums. Downloadable PDF bundle covering all Grade 4 Term 1 subjects."}'::jsonb, array[]::text[], 'Term', null, null, null, null, null, array['mathematics','english-home-language','english-first-additional-language','life-skills','natural-science-and-technology','history','geography'], array['Term 1']),
  ('02406986-2d55-5765-9005-02fda64e6bd3', 'grade-3-life-skills-term-4-assessment', 'Grade 3 Life Skills (PSW) – Term 4 Assessment (ATP Aligned)', 'CAPS & ATP-aligned Grade 3 Life Skills Term 4 Assessment. Worth 40 marks , covering Beginning Knowledge & PSW, Creative Arts, and Physical Education. Includes full rubric-based memo. Instant PDF download', 'Grade 3 Life Skills (PSW) – Term 4 Formal Assessment (ATP Aligned)

This Term 4 Life Skills assessment is fully CAPS & ATP aligned for the 2024/2025 year. The assessment totals 40 marks and includes Beginning Knowledge & PSW, Creative Arts, and Physical Education tasks with detailed rubrics and a marking memo. The downloadable PDF contains 12 pages of structured, learner-friendly content, including clear instructions and guided activities

What’s Included:

• Complete Term 4 formal Life Skills assessment ( 40 marks ) • Rubrics for Visual Arts, Performing Arts & Physical Education • Full marking memo with answers and expected responses • Clear breakdown of cognitive levels (Recall, Understanding, Application) • 12 pages | PDF format | Instant email download

SECTION 1: Beginning Knowledge & PSW – 20 marks

Covers:

-
Natural disasters

-
Bees and their role

-
Animals that help humans

-
Products made from natural resources

-
Safety actions during disasters

-
Sequencing of safety behaviours

-
True/false environmental and safety statements

-
Ways dogs help people

Total: 20 marks Pages 3–5 show the full question set with pictures and matching activities.

SECTION 2: Creative Arts – 10 marks

Includes:

-
Visual Art (5 marks) Draw an animal that helps people and add a pattern. Assessed using a 5-point rubric (overlap, proportion, anatomy, detail, pattern) as shown on page 7.

-
Performing Arts (5 marks) Create a dance sequence with a group; assessed on rhythm, movement quality, creativity, use of space, and participation (rubric on page 9).

Total: 10 marks

SECTION 3: Physical Education – 10 marks

Learners demonstrate:

-
Cricket batting & bowling actions

-
Balance activity

-
Gymnastic movement: handstand or headstand

-
Locomotor activity: three-legged race

Assessed using a 5-item rubric multiplied by 2 = 10 marks (as shown on page 10–11).

📘 Additional Details:

-
Fully aligned to the Revised ATP 2024/2025

-
Balanced mix of written, visual, performing & physical tasks

-
Ideal for teachers, tutors, and parents preparing learners for formal LS assessments

-
Cognitive levels are shown in the assessment table (Recall 14, Understanding 13, Application 13)

-
Memo includes correct responses for Section 1 and rubrics for Sections 2 & 3

📎 File Information:

Format: PDF Pages: 12 Delivery: Instant download link emailed to customer', 60.00, 'Grade 3', 'Term 4', '2024', 'Individual Resource', 'Test / Assessment', array['life-skills','natural-science-and-technology'], 40, '[{"id":"file-3449","label":"Test / Assessment PDF","filename":"grade-3-life-skills-term-4-assessment.pdf","storageKey":"products/02406986-2d55-5765-9005-02fda64e6bd3/file-3449-grade-3-life-skills-term-4-assessment.pdf"}]'::jsonb, false, true, 3449, '{"title":"Grade 3 Life Skills (PSW) – Term 4 Assessment (ATP Aligned)","description":"CAPS & ATP-aligned Grade 3 Life Skills Term 4 Assessment. Worth 40 marks , covering Beginning Knowledge & PSW, Creative Arts, and Physical Education. Includes f"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('ba84bc05-8f07-518d-a50b-fb7646714a1b', 'grade-3-maths-term-4-assessment', 'Grade 3 Mathematics – Term 4 Assessment', 'CAPS & ATP-aligned Grade 3 Mathematics Term 4 Assessment. Worth 75 marks , covering Numbers & Operations, Patterns, Space & Shape, Measurement, and Data Handling. Includes full memo. Instant PDF download.', 'Grade 3 Mathematics – Term 4 Formal Assessment (ATP Aligned)

This comprehensive Term 4 Mathematics assessment is fully CAPS and ATP aligned for 2024/2025. It includes clear instructions, all question sections, weighting breakdown, and a complete marking memorandum . The assessment totals 75 marks and consists of 16 pages of learner-friendly activities and solutions

What’s Included:

• Full Term 4 Maths Assessment ( 75 marks total ) • Detailed memorandum with complete answers • Five maths curriculum sections with correct weighting • 16 pages | Printable PDF | Instant download after checkout • Perfect for parents, tutors, and teachers

🧮 Section 1: Numbers, Operations & Relationships – 43 marks

Includes:

-
Counting forwards/backwards

-
Completing number patterns

-
Number symbols and number names

-
Ordering numbers

-
Comparing using &lt;, &gt;, =

-
Place value

-
Addition & subtraction

-
Multiplication & division

-
Word problems

-
Fractions

-
Fraction colouring activities (As shown on pages 2–7 of the PDF)

🔢 Section 2: Patterns, Functions & Algebra – 8 marks

Number pattern completion activities (page 8). Patterns include both ascending and descending sequences.

📐 Section 3: Space & Shape – 10 marks

Covers:

-
Naming 3D shapes

-
True/false geometric facts

-
Flat vs curved surface identification (See illustrations on pages 9–10 of the PDF)

⏱️ Section 4: Measurement – 11 marks

Learners answer:

-
Time on analogue clocks

-
Duration calculations

-
Calendar questions

-
Real-world time measurement (Pages 10–12)

📊 Section 5: Data Handling – 3 marks

Pictogram-based questions comparing number of books read (page 12).

Additional Details:

-
Fully aligned to the Revised ATP 2024/2025

-
Large variety of question types supporting exam practice

-
Ideal for revision, home-schooling, tutoring or classroom preparation

-
Memorandum includes worked-out answers for all sections

File Information:

Format: PDF Pages: 16 Delivery: Instant email after purchase', 60.00, 'Grade 3', 'Term 4', '2024', 'Individual Resource', 'Test / Assessment', array['mathematics','natural-science-and-technology'], 75, '[{"id":"file-3443","label":"Test / Assessment PDF","filename":"grade-3-maths-term-4-assessment.pdf","storageKey":"products/ba84bc05-8f07-518d-a50b-fb7646714a1b/file-3443-grade-3-maths-term-4-assessment.pdf"}]'::jsonb, false, true, 3443, '{"title":"Grade 3 Mathematics – Term 4 Assessment","description":"CAPS & ATP-aligned Grade 3 Mathematics Term 4 Assessment. Worth 75 marks , covering Numbers & Operations, Patterns, Space & Shape, Measurement, and Data Handlin"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('8d534d42-f779-5319-9484-1450c926e0da', 'grade-3-english-hl-term-4-assessment', 'Grade 3 English HL – Term 4 Assessment', 'CAPS & ATP-aligned Grade 3 English Home Language Term 4 Assessment. Worth 40 marks and includes a full memo and rubrics. Covers Listening & Speaking, Phonics, Reading, and Writing. Instant PDF download.', 'Grade 3 English Home Language – Term 4 Formal Assessment (ATP Aligned)

This printable Term 4 English HL assessment is fully CAPS & ATP aligned for 2024/2025. The PDF includes clear instructions, learner-friendly pages, all assessment sections, and a complete memorandum with marking guidelines. Based on the uploaded document, the assessment totals 40 marks and spans 9 pages

What’s Included:

• Full Term 4 Assessment ( 40 marks ) • Detailed marking memo and rubrics (Listening, Reading & Writing) • Sections clearly separated and weighted • Structured according to the Revised ATP (2024/2025) • 9 pages | PDF file | Instant download after purchase • Ideal for home learning, tutoring, or classroom preparation

Assessment Breakdown (from document pages 2–8)

🗣️ Section 1: Listening & Speaking – 16 marks

Includes:

-
Picture discussion rubric (5 marks)

-
Oral story summary rubric (5 marks)

-
Following instructions (6 marks) Content shown on pages 2–5 of the PDF

🔤 Section 2: Phonics – 10 marks

Activities include:

-
Change the word in brackets → correct verb/word form

-
Silent letter identification

-
Prefix and suffix use

-
Plurals

-
Opposites Shown on pages 5–6 of the PDF

📖 Section 3: Reading – 10 marks

Includes:

-
Comprehension: “The Lost Puppy” (5 marks)

-
Guided reading passage: “The Adventure Kite” + rubric (5 marks) Found on pages 6–8 of the PDF

✏️ Section 4: Writing – 4 marks

Learner writes a 6–8 sentence paragraph about their favourite day at school. Assessed using 4-mark writing rubric (page 8–9)

Additional Information:

-
Assessment does not indicate cognitive levels

-
Aligned to ATP for 2024/2025

-
Created to build confidence in core English HL skills

-
Suitable for parents, tutors, and teachers

File Details:

Format: PDF Pages: 9 Delivery: Instant email link after checkout', 60.00, 'Grade 3', 'Term 4', '2024', 'Individual Resource', 'Summary', array['english-home-language','natural-science-and-technology'], 40, '[{"id":"file-3435","label":"Summary PDF","filename":"grade-3-english-hl-term-4-assessment.pdf","storageKey":"products/8d534d42-f779-5319-9484-1450c926e0da/file-3435-grade-3-english-hl-term-4-assessment.pdf"}]'::jsonb, false, true, 3435, '{"title":"Grade 3 English HL – Term 4 Assessment","description":"CAPS & ATP-aligned Grade 3 English Home Language Term 4 Assessment. Worth 40 marks and includes a full memo and rubrics. Covers Listening & Speaking, Phonics, R"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('4d0f2a51-d15e-50c8-906d-8e911f31ac2f', 'grade-3-english-fal-term-4-assessment', 'Grade 3 English FAL Term 4 Assessment', 'CAPS & ATP-aligned Grade 3 English FAL Term 4 Assessment. Worth 40 marks and includes rubrics, memo, and tasks covering Listening & Speaking, Phonics, Reading, and Writing. Instant download in PDF format.', 'Grade 3 English First Additional Language – Term 4 Formal Assessment (ATP Aligned)

This printable Term 4 assessment is fully CAPS and ATP aligned (2024/2025) and designed to help Grade 3 learners practice English FAL in a structured, learner-friendly format. The PDF includes clear instructions, detailed rubrics, and a complete marking memorandum.

What’s Included:

• Full Term 4 Assessment – 40 marks total • Detailed rubrics and marking memo (Listening, Reading, Writing, etc.) • Learner-friendly layout with guided sections • 9 pages | PDF format • Instant download after purchase

Assessment Breakdown:

According to the test content and rubrics in the PDF

Grade 3 English FAL Term 4 Asse…

:

-
🗣️ Listening & Speaking – 16 marks Picture discussion, summarising, following instructions.

-
🔤 Phonics – 10 marks Change word forms, silent letters, sorting str– / scr– words.

-
📖 Reading – 10 marks Comprehension based on “Max, the Brave Firefighter” and guided reading of “The Busy Bee.”

-
✏️ Writing – 4 marks Paragraph of 6–8 sentences about a dream holiday.

Additional Details:

-
Assessment follows the revised ATP for 2024/2025

-
Designed for:

-
Parents practicing at home

-
Tutors

-
Teachers preparing learners for formal assessment

-
Copyright: Personal Use Only

-
Assessment does not include cognitive level indicators

File Details:

Format: PDF Pages: 9 Download: Instant email with secure link after checkout', 60.00, 'Grade 3', 'Term 4', '2024', 'Individual Resource', 'Test / Assessment', array['english-first-additional-language','natural-science-and-technology'], 40, '[{"id":"file-3431","label":"Test / Assessment PDF","filename":"grade-3-english-fal-term-4-assessment.pdf","storageKey":"products/4d0f2a51-d15e-50c8-906d-8e911f31ac2f/file-3431-grade-3-english-fal-term-4-assessment.pdf"}]'::jsonb, false, true, 3431, '{"title":"Grade 3 English FAL Term 4 Assessment","description":"CAPS & ATP-aligned Grade 3 English FAL Term 4 Assessment. Worth 40 marks and includes rubrics, memo, and tasks covering Listening & Speaking, Phonics, Reading, "}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('834cc8af-6495-5658-9cfc-be52cf921a16', 'grade-3-afrikaans-fal-term-4-assessment', 'Grade 3 Afrikaans FAL Term 4 Assessment', 'CAPS and ATP-aligned Grade 3 Afrikaans FAL Term 4 Assessment. Worth 40 marks and includes rubrics, memo, and structured tasks for comprehension, language, and writing.', 'Grade 3 Afrikaans First Additional Language – Term 4 Formal Assessment (ATP Aligned)

This printable assessment is CAPS and ATP aligned for 2024/2025 and designed to help learners prepare for formal Afrikaans FAL evaluations at school.

What’s Included: • Complete Term 4 Assessment – worth 40 marks • Detailed rubrics and marking memorandum • Clear instructions and learner-friendly layout • Structured according to the Revised ATP (2024/2025) • 9 pages | PDF format | Instant download after payment

Assessment Breakdown:

-
🧩 Begripstoets (Comprehension) – 14 marks

-
🔤 Klank (Language and Sounds) – 16 marks

-
✏️ Skryf (Writing Task) – 10 marks

Additional Details:

-
Assessment does not include cognitive levels

-
Perfect for home practice , tutoring , or classroom assessment preparation

-
All content is teacher-created and quality-checked

File Type: PDF Delivery: Instant email download after checkout Copyright: © Designing Minds – For personal use only', 60.00, 'Grade 3', 'Term 4', '2024', 'Individual Resource', 'Test / Assessment', array['afrikaans-first-additional-language','natural-science-and-technology'], 40, '[{"id":"file-2869","label":"Test / Assessment PDF","filename":"grade-3-afrikaans-fal-term-4-assessment.pdf","storageKey":"products/834cc8af-6495-5658-9cfc-be52cf921a16/file-2869-grade-3-afrikaans-fal-term-4-assessment.pdf"}]'::jsonb, false, true, 2869, '{"title":"Grade 3 Afrikaans FAL Term 4 Assessment","description":"CAPS and ATP-aligned Grade 3 Afrikaans FAL Term 4 Assessment. Worth 40 marks and includes rubrics, memo, and structured tasks for comprehension, language, and w"}'::jsonb, array[]::text[], null, null, null, null, null, null, null, null),
  ('23690c53-9eaf-5fd9-8828-6b6ec984c3c2', 'grade-5-mathematics-term-3-fractions-test-2025', 'Grade 5 Mathematics Term 3 Fractions Test (2025)', 'Grade 5 Mathematics Fractions Test (Term 3, 2025). Worth 50 marks. Includes memorandum. PDF format, 10 pages.', 'This CAPS-aligned Grade 5 Mathematics Fractions Test is set to the revised ATP for 2024/2025. Worth 50 marks and supplied with a full memorandum, it’s perfect for learners to practice exam-style questions at home.

Test covers: • Describing & ordering fractions • Calculations with fractions • Solving fractions • Equivalent fractions

Format: PDF, 10 pages. Note: This test is also included in the Grade 5 2025 Term 3 Test Bundle.', 350.00, 'Grade 5', 'Term 3', '2025', 'Bundle', 'Test / Assessment', array['mathematics'], 50, '[]'::jsonb, false, true, 2346, '{"title":"Grade 5 Mathematics Term 3 Fractions Test (2025)","description":"Grade 5 Mathematics Fractions Test (Term 3, 2025). Worth 50 marks. Includes memorandum. PDF format, 10 pages."}'::jsonb, array[]::text[], 'Term', null, null, null, null, null, array['mathematics'], array['Term 3']),
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
on conflict (id) do update set slug = excluded.slug, title = excluded.title, "shortDescription" = excluded."shortDescription", "fullDescription" = excluded."fullDescription", "priceZar" = excluded."priceZar", grade = excluded.grade, term = excluded.term, year = excluded.year, "productKind" = excluded."productKind", "resourceFormat" = excluded."resourceFormat", subjects = excluded.subjects, marks = excluded.marks, "purchasedFiles" = excluded."purchasedFiles", featured = excluded.featured, published = excluded.published, "sortOrder" = excluded."sortOrder", seo = excluded.seo, faqs = excluded.faqs, "bundleScope" = excluded."bundleScope", "accessPeriod" = excluded."accessPeriod", "includedGrades" = excluded."includedGrades", "deliveryRules" = excluded."deliveryRules", "renewalNotes" = excluded."renewalNotes", "includedProductSlugs" = excluded."includedProductSlugs", "includedSubjects" = excluded."includedSubjects", "includedTerms" = excluded."includedTerms";
