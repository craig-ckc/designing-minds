-- Designing Minds — replace all testimonials with the client's latest list.
-- Source: Designing-Minds-Testimonials.txt (13 quotes, July 2026).
--
-- This patch deletes every existing testimonial row and inserts the new set.
-- Idempotent: wrapped in a transaction; delete-all + fixed ids make re-runs safe.
--
-- Data notes:
--   - Quotes are kept verbatim apart from light copyedits: 'recieved' -> 'received'
--     (Ciara), '..' -> '.' (Michelle), mid-sentence 'Te' -> 'te' (Lizaan), and
--     'designing minds' capitalised (Nasreen).
--   - Nasreen's quote is trimmed for the website: the sentences about stopping
--     Ritalin and about an attached report card are omitted (medical detail /
--     references an attachment the site can't show).
--   - context strings are editorial one-liners derived from each quote (the web
--     renders 'Name · context', so every row needs one).
--   - sortOrder drives display order; the first published row is the homepage
--     lead quote and the next three fill the homepage cards.
--   - learnerGrade is set only where the quote states the grade; sourceDate is
--     unknown for all rows and left null.

begin;

delete from public.testimonials;

insert into public.testimonials
  (id, "customerName", quote, context, "learnerGrade", "sourceDate", featured, "sortOrder", published)
values
  (
    '5f0c2a4e-8f5d-4a1b-9c3e-2d7b61a04c11',
    'Ndiweni',
    'My daughter’s mathematics mark improved from 20% to 52%! Thank you!',
    'Mathematics up from 20% to 52%',
    null, null, true, 10, true
  ),
  (
    'a3d81f76-2c4b-4e0a-b5d9-8e1f4c72a322',
    'Amoré',
    'Thank you so much. My son did super well for term 1. Got 76 overall. The papers really did wonders. Of course studying first goes a long way, but he knew what was expected of him for tests.',
    'Son averaged 76 in term 1',
    null, null, true, 20, true
  ),
  (
    'c9e54b18-6a7f-4d2c-8b0e-5f3a92d1e433',
    'Lusanda',
    'Just to brag, my son got 100% in his English HL exam. The question papers are really assisting him.',
    '100% in English HL',
    null, null, true, 30, true
  ),
  (
    '2b7e91c5-4d3a-4f8b-a6c1-9e0d57f2b544',
    'Sifungile',
    'Thank you so much for your bundles! Our son did very well in his exams thanks to your bundles for Grade 6.',
    'Grade 6 exam success',
    'Grade 6', null, true, 40, true
  ),
  (
    'e1a63d29-7b5c-4c0d-9f4a-3c8e16b0d655',
    'Nasreen',
    'I just wanted to share some amazing news with you. My daughter is 10 and in grade 4. She has been diagnosed at the age of 7 with ADHD and low grade Autism. This is her first year of exams (keeping in mind she is at a mainstream school - not a special needs institution). Because of Designing Minds, she was able to write her first exams in June with confidence and for term 3... hit us with a bunch of 7s. Thank you for all that you do🙏🏻',
    'Grade 4 learner writing her first exams with confidence',
    'Grade 4', null, false, 50, true
  ),
  (
    '7c4f28e6-9d1b-4a5e-b2c8-6f0a35d9e766',
    'Ciara',
    'I ordered and received mine. Must say it really helps my grade 5 daughter. The learning material is of the highest quality.',
    'Grade 5 parent',
    'Grade 5', null, false, 60, true
  ),
  (
    '4e9b57a3-1f6d-4c2b-8a0e-7d5c94f1a877',
    'Livhuwani',
    'The term 2 test really helped my son, I saw huge improvements in his marks. Thank you!',
    'Big improvement in term 2',
    null, null, false, 70, true
  ),
  (
    'b6d19f42-3e8a-4b7c-9d5f-1a2e60c3b988',
    'Nonhle',
    'The tests really work. My son did so well in term 2. Thank you so much',
    'Strong term 2 results',
    null, null, false, 80, true
  ),
  (
    '8a2c46d7-5b9e-4f1a-a3d6-4c7b08e5f099',
    'Michelle',
    'I must tell you, my daughter does very well but she did extra well. All thanks to you and what you have provided.',
    'From doing well to doing extra well',
    null, null, false, 90, true
  ),
  (
    'f5e07b31-8c2d-4a6f-b9e4-2d1a53c8f100',
    'Busi',
    'Thank you for this, it has really helped my daughter drastically. I really appreciate you and the efforts you put into this.',
    'Daughter improved drastically',
    null, null, false, 100, true
  ),
  (
    '3d8a15c9-6e4b-4d0a-8f2c-9b7e42a6d211',
    'Sabrina',
    'Can highly recommend this team and their resources!',
    'Recommends the team and resources',
    null, null, false, 110, true
  ),
  (
    '9b3e62f8-4a7c-4e5d-b1a9-5e0c87d4f322',
    'Lizaan',
    'Ek het iewers verlede kwartaal al julle goedjies gekoop en dit was amazing om te gebruik saam ons sin dit maak dit makliker om dan julle toets en ons sin saam te blend basies',
    'Blends the tests with their own material',
    null, null, false, 120, true
  ),
  (
    '1c6d94b5-2f8e-4b3a-9c7d-8a4f16e0b433',
    'Jade Durrant',
    'Would highly recommend! The test pack really helped my nephew with his final exams last year!',
    'Test pack helped with final exams',
    null, null, false, 130, true
  );

commit;
