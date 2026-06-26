-- Seed public FAQ content from the extracted Designing Minds contact page.
-- Safe to re-run: rows are upserted by stable FAQ ids.

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
