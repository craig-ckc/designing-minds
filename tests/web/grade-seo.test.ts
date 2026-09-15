import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import type { Product } from '../../packages/cms/src/types.ts'
import { gradePageMeta, PSW_SUBJECT, subjectsForGrade } from '../../apps/web/src/lib/subject-labels.ts'

const read = (path: string) => readFileSync(new URL(`../../apps/web/src/${path}`, import.meta.url), 'utf8')

const product = (overrides: Partial<Product> & Pick<Product, 'slug'>): Product => ({
  id: overrides.slug,
  title: overrides.slug,
  shortDescription: '',
  fullDescription: '',
  priceZar: 60,
  grade: 'Grade 3',
  term: 'Term 1',
  year: '2026',
  resourceFormat: 'Test / Assessment',
  subjects: ['Mathematics'],
  marks: null,
  purchasedFiles: [],
  galleryImages: [],
  previewPdfs: [],
  featured: false,
  published: true,
  sortOrder: 0,
  seo: { title: '', description: '' },
  faqs: [],
  updatedAt: '2026-01-01',
  ...overrides,
})

/* ----------------------------- subjectsForGrade ------------------------- */

test('subjectsForGrade orders by product count, ties alphabetical, and ignores other grades/unpublished', () => {
  const products = [
    product({ slug: 'm1', grade: 'Grade 3', subjects: ['Mathematics'] }),
    product({ slug: 'm2', grade: 'Grade 3', subjects: ['Mathematics'] }),
    product({ slug: 'geo', grade: 'Grade 3', subjects: ['Geography'] }),
    product({ slug: 'afr', grade: 'Grade 3', subjects: ['Afrikaans First Additional Language'] }),
    product({ slug: 'draft', grade: 'Grade 3', subjects: ['History'], published: false }),
    product({ slug: 'other-grade', grade: 'Grade 4', subjects: ['Life Orientation'] }),
  ]

  assert.deepEqual(subjectsForGrade({ products }, 'Grade 3'), [
    'Mathematics',
    'Afrikaans First Additional Language',
    'Geography',
  ])
})

/* ------------------------------- gradePageMeta --------------------------- */

test('PSW is hoisted to the front of the title teaser and kept in full in the description', () => {
  const products = [
    product({ slug: 'm1', grade: 'Grade 5', subjects: ['Mathematics'] }),
    product({ slug: 'm2', grade: 'Grade 5', subjects: ['Mathematics'] }),
    product({ slug: 'e1', grade: 'Grade 5', subjects: ['English Home Language'] }),
    product({ slug: 'psw1', grade: 'Grade 5', subjects: [PSW_SUBJECT] }),
    product({ slug: 'geo1', grade: 'Grade 5', subjects: ['Geography'] }),
  ]

  const meta = gradePageMeta({ grade: 'Grade 5', blurb: 'fallback', products })

  assert.equal(meta.title, 'Grade 5 CAPS tests & memos: PSW, Maths, English & more | Designing Minds')
  // The description spells PSW out in full so the expansion-bearing phrase can match the query.
  assert.match(meta.description, /Life Skills \(PSW\)/)
  assert.ok(meta.description.length <= 160)
})

test('the title head stays inside the ~60-character snippet budget and names each language once', () => {
  const products = [
    product({ slug: 'afr', grade: 'Grade 3', subjects: ['Afrikaans First Additional Language'] }),
    product({ slug: 'efal', grade: 'Grade 3', subjects: ['English First Additional Language'] }),
    product({ slug: 'ehl', grade: 'Grade 3', subjects: ['English Home Language'] }),
    product({ slug: 'ls', grade: 'Grade 3', subjects: ['Life Skills'] }),
    product({ slug: 'm', grade: 'Grade 3', subjects: ['Mathematics'] }),
  ]

  const { title } = gradePageMeta({ grade: 'Grade 3', blurb: 'fallback', products })
  const head = title.replace(/ \| Designing Minds$/, '')

  // Three labels would run to 66 characters, so the teaser drops to two.
  assert.equal(head, 'Grade 3 CAPS tests & memos: Afrikaans, English & more')
  assert.ok(head.length <= 60, `${head.length} chars`)
  // "English HL" and "English FAL" collapse to one "English" in the title.
  assert.equal((title.match(/English/g) ?? []).length, 1)
})

test('a grade without PSW never mentions it', () => {
  const products = [
    product({ slug: 'm1', grade: 'Grade 3', subjects: ['Mathematics'] }),
    product({ slug: 'e1', grade: 'Grade 3', subjects: ['English Home Language'] }),
  ]

  const meta = gradePageMeta({ grade: 'Grade 3', blurb: 'fallback', products })

  assert.doesNotMatch(meta.title, /PSW/)
  assert.doesNotMatch(meta.description, /PSW/)
})

test('the description switches wording when a summary format is present', () => {
  const testsOnly = gradePageMeta({
    grade: 'Grade 3',
    blurb: 'fallback',
    products: [product({ slug: 'm1', grade: 'Grade 3', subjects: ['Mathematics'] })],
  })
  assert.match(testsOnly.description, /tests and memos/)
  assert.doesNotMatch(testsOnly.description, /summaries/)

  const withSummary = gradePageMeta({
    grade: 'Grade 6',
    blurb: 'fallback',
    products: [
      product({ slug: 'm1', grade: 'Grade 6', subjects: ['Mathematics'], resourceFormat: 'Summary' }),
      product({ slug: 'e1', grade: 'Grade 6', subjects: ['English Home Language'] }),
    ],
  })
  assert.match(withSummary.description, /tests, memos and summaries/)
})

test('a long subject list is truncated to fit 160 characters, ending "& more." cleanly', () => {
  const overlyLongSubject =
    'Advanced Interdisciplinary Studies in Applied Critical and Analytical Reasoning Skills for Young Learners'
  const products = [
    product({ slug: 'm1', grade: 'Grade 4', subjects: ['Mathematics'] }),
    product({ slug: 'm2', grade: 'Grade 4', subjects: ['Mathematics'] }),
    product({ slug: 'm3', grade: 'Grade 4', subjects: ['Mathematics'] }),
    product({ slug: 'e1', grade: 'Grade 4', subjects: ['English Home Language'] }),
    product({ slug: 'e2', grade: 'Grade 4', subjects: ['English Home Language'] }),
    product({ slug: 'long', grade: 'Grade 4', subjects: [overlyLongSubject] }),
    product({ slug: 'afr', grade: 'Grade 4', subjects: ['Afrikaans First Additional Language'] }),
    product({ slug: 'ems', grade: 'Grade 4', subjects: ['Economic Management Sciences (EMS)'] }),
    product({ slug: 'engfal', grade: 'Grade 4', subjects: ['English First Additional Language'] }),
    product({ slug: 'geo', grade: 'Grade 4', subjects: ['Geography'] }),
    product({ slug: 'hist', grade: 'Grade 4', subjects: ['History'] }),
    product({ slug: 'lo', grade: 'Grade 4', subjects: ['Life Orientation'] }),
    product({ slug: 'nst', grade: 'Grade 4', subjects: ['Natural Science and Technology'] }),
  ]

  // 10 distinct subjects — well past what fits in a 160-char snippet.
  assert.equal(subjectsForGrade({ products }, 'Grade 4').length, 10)

  const meta = gradePageMeta({ grade: 'Grade 4', blurb: 'fallback', products })

  assert.ok(meta.description.length <= 160, `expected <= 160 chars, got ${meta.description.length}`)
  assert.match(meta.description, /: Maths, English HL & more\. Instant PDF download; print at home\.$/)
})

test('no published products falls back to the blurb and a generic title', () => {
  const meta = gradePageMeta({ grade: 'Grade 7', blurb: 'CAPS-aligned tests and summaries for Grade 7.', products: [] })

  assert.deepEqual(meta, {
    title: 'Grade 7 CAPS resources | Designing Minds',
    description: 'CAPS-aligned tests and summaries for Grade 7.',
  })
})

/* --------------------------------- seo.ts wiring -------------------------- */

test('seo.ts wires the grade branch through gradePageMeta', () => {
  const seo = read('seo.ts')
  assert.match(seo, /gradePageMeta\(\{/)
})

test('the /packages static meta talks about bundles, not retired plans', () => {
  const seo = read('seo.ts')
  assert.match(seo, /'\/packages':\s*\{\s*title:\s*'Bundles \| Designing Minds'/)
  assert.doesNotMatch(seo, /Essential|Premium|Plans/)
  assert.match(seo, /'\/packages':\s*'Bundles',/)
})

test('the grade page ItemList carries structured Product entries, not bare URLs', () => {
  const seo = read('seo.ts')
  assert.match(seo, /const productItemList[\s\S]*?'@type': 'Product'[\s\S]*?priceCurrency: 'ZAR'/)
  assert.match(seo, /productItemList\(canonicalSiteUrl, `\$\{grade\} CAPS resources`, products\)/)
  // The /shop ItemList (333 items) is untouched — still the plain URL-list helper.
  assert.match(seo, /itemList\(canonicalSiteUrl, 'CAPS-aligned resources', products\.map/)
})

/* ----------------------------- grade-detail-page.tsx ---------------------- */

test('the grade page renders a subject nav that links into the filtered shop', () => {
  const page = read('pages/grade-detail-page.tsx')

  assert.match(page, /aria-label=\{`Subjects in \$\{grade\}`\}/)
  assert.match(page, /subjectsForGrade\(snapshot, grade\)/)
  assert.match(page, /subjectAcronymsIn\(subjects\.join\(' '\)\)/)
  assert.match(page, /\/shop\?grade=\$\{encodeURIComponent\(grade\)\}&subject=\$\{encodeURIComponent\(subject\)\}/)
})

/* -------------------------------- grades-page.tsx ------------------------- */

test('grades-page.tsx says bundles, not bundles and plans', () => {
  const page = read('pages/grades-page.tsx')
  assert.doesNotMatch(page, /and plans/)
  assert.match(page, /resources and bundles/)
})
