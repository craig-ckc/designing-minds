/* -------------------------------------------------------------------------
   Hand-authored wireframe fixtures.

   These are placeholder records of the documented content model — enough to
   exercise every page and admin screen at wireframe fidelity. They deliberately
   do NOT come from the extracted-content seed pipeline (scripts/sync-content),
   which targets a different, legacy shape. Real data is a later concern.
   ------------------------------------------------------------------------- */
import type {
  CmsSnapshot,
  ValueLists,
  Customer,
  Faq,
  Order,
  Payment,
  Product,
  Subject,
  Testimonial,
} from './types'

const STAMP = '2026-01-01T00:00:00.000Z'

const valueLists: ValueLists = {
  grades: ['Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'],
  terms: ['Term 1', 'Term 2', 'Term 3', 'Term 4'],
  years: ['2024', '2025', '2026'],
  productKinds: ['Individual Resource', 'Bundle', 'Access Plan'],
  resourceFormats: ['Test / Assessment', 'Summary'],
}

const subjects: Subject[] = [
  { id: 'sub-mat', slug: 'mathematics', name: 'Mathematics', shortLabel: 'Maths', description: 'Number, operations, and problem solving aligned to CAPS.', sortOrder: 1, visible: true, faqs: ['faq-caps'], accent: '#d9d9de' },
  { id: 'sub-eng', slug: 'english-hl', name: 'English Home Language', shortLabel: 'English', description: 'Reading, writing, and language structure.', sortOrder: 2, visible: true, faqs: [] },
  { id: 'sub-afr', slug: 'afrikaans-fal', name: 'Afrikaans First Additional Language', shortLabel: 'Afrikaans', description: 'Taalstrukture, begripstoetse en skryfwerk.', sortOrder: 3, visible: true, faqs: [] },
  { id: 'sub-nst', slug: 'natural-sciences', name: 'Natural Sciences & Technology', shortLabel: 'NS & Tech', description: 'Life, matter, energy, and systems.', sortOrder: 4, visible: true, faqs: [] },
  { id: 'sub-sst', slug: 'social-sciences', name: 'Social Sciences', shortLabel: 'Social Sci', description: 'History and geography.', sortOrder: 5, visible: false, faqs: [] },
]

const faqs: Faq[] = [
  { id: 'faq-caps', question: 'Are the tests CAPS-aligned?', answer: 'Yes — every resource follows the latest CAPS Annual Teaching Plan for its grade.', category: 'CAPS alignment', sortOrder: 1, published: true },
  { id: 'faq-download', question: 'How do I get my files after paying?', answer: 'Your printable PDFs unlock on the order page in your account the moment payment succeeds.', category: 'Downloads', sortOrder: 2, published: true },
  { id: 'faq-print', question: 'Can I print from a phone or tablet?', answer: 'Yes. Every file is a PDF you can download and print from any device with a printer.', category: 'Printing', sortOrder: 3, published: true },
  { id: 'faq-account', question: 'Do I need an account to buy?', answer: 'You can browse and add to cart freely, but you create or sign in to a Customer Account at checkout so your downloads are saved.', category: 'Accounts', sortOrder: 4, published: true },
  { id: 'faq-licence', question: 'Can I reuse a test for more than one child?', answer: 'Yes, within your household. Teachers and tutors should contact us for classroom licensing.', category: 'Licensing', sortOrder: 5, published: true },
  { id: 'faq-refund', question: 'What is your refund policy on digital files?', answer: 'Because files are delivered instantly, refunds are limited to duplicate or accidental purchases — see the Refund Policy.', category: 'Refunds', sortOrder: 6, published: true },
  { id: 'faq-plan', question: 'What is the difference between Term and Year access?', answer: 'Essential covers one term; Premium covers the full year. Each is a one-time purchase — nothing auto-renews.', category: 'Access plans', sortOrder: 7, published: true },
]

const file = (id: string, label: string, filename: string) => ({ id, label, filename })

const products: Product[] = [
  {
    id: 'p-001', slug: 'grade-4-maths-term-1-test', title: 'Grade 4 Mathematics — Term 1 Test',
    shortDescription: 'CAPS-aligned Term 1 maths assessment with memo.',
    fullDescription: 'A full Term 1 mathematics assessment for Grade 4, covering number, operations, and patterns. Includes a complete marking memorandum.',
    priceZar: 49, grade: 'Grade 4', term: 'Term 1', year: '2026',
    productKind: 'Individual Resource', resourceFormat: 'Test / Assessment',
    subjects: ['mathematics'], marks: 50,
    previewFiles: [file('f-p1', 'Sample page (PDF)', 'g4-maths-t1-sample.pdf')],
    purchasedFiles: [file('f-d1', 'Test (PDF)', 'g4-maths-t1-test.pdf'), file('f-d2', 'Memo (PDF)', 'g4-maths-t1-memo.pdf')],
    featured: true, published: true, sortOrder: 1,
    seo: { title: 'Grade 4 Maths Term 1 Test', description: 'Printable CAPS-aligned Grade 4 maths Term 1 test and memo.' },
    faqs: ['faq-caps', 'faq-print'], updatedAt: STAMP,
  },
  {
    id: 'p-002', slug: 'grade-5-english-term-2-test', title: 'Grade 5 English HL — Term 2 Test',
    shortDescription: 'Comprehension, language, and writing assessment.',
    fullDescription: 'Term 2 English Home Language assessment for Grade 5: comprehension, language structures, and a short writing task, with memo.',
    priceZar: 49, grade: 'Grade 5', term: 'Term 2', year: '2026',
    productKind: 'Individual Resource', resourceFormat: 'Test / Assessment',
    subjects: ['english-hl'], marks: 40,
    previewFiles: [file('f-p2', 'Sample page (PDF)', 'g5-eng-t2-sample.pdf')],
    purchasedFiles: [file('f-d3', 'Test (PDF)', 'g5-eng-t2-test.pdf'), file('f-d4', 'Memo (PDF)', 'g5-eng-t2-memo.pdf')],
    featured: true, published: true, sortOrder: 2,
    seo: { title: 'Grade 5 English Term 2 Test', description: 'Printable Grade 5 English HL Term 2 test and memo.' },
    faqs: ['faq-caps'], updatedAt: STAMP,
  },
  {
    id: 'p-003', slug: 'grade-6-afrikaans-term-3-summary', title: 'Grade 6 Afrikaans FAL — Term 3 Summary',
    shortDescription: 'Opsomming van Kwartaal 3 taalstrukture.',
    fullDescription: 'A concise Term 3 study summary for Grade 6 Afrikaans First Additional Language, covering the term’s core language structures and vocabulary.',
    priceZar: 35, grade: 'Grade 6', term: 'Term 3', year: '2026',
    productKind: 'Individual Resource', resourceFormat: 'Summary',
    subjects: ['afrikaans-fal'], marks: null,
    previewFiles: [file('f-p3', 'Sample page (PDF)', 'g6-afr-t3-sample.pdf')],
    purchasedFiles: [file('f-d5', 'Summary (PDF)', 'g6-afr-t3-summary.pdf')],
    featured: false, published: true, sortOrder: 3,
    seo: { title: 'Grade 6 Afrikaans Term 3 Summary', description: 'Grade 6 Afrikaans FAL Term 3 study summary.' },
    faqs: [], updatedAt: STAMP,
  },
  {
    id: 'p-004', slug: 'grade-7-natural-sciences-term-1-test', title: 'Grade 7 Natural Sciences — Term 1 Test',
    shortDescription: 'Senior-phase NS & Tech assessment with memo.',
    fullDescription: 'Term 1 Natural Sciences & Technology assessment for Grade 7, with a full marking memorandum.',
    priceZar: 55, grade: 'Grade 7', term: 'Term 1', year: '2026',
    productKind: 'Individual Resource', resourceFormat: 'Test / Assessment',
    subjects: ['natural-sciences'], marks: 60,
    previewFiles: [file('f-p4', 'Sample page (PDF)', 'g7-ns-t1-sample.pdf')],
    purchasedFiles: [file('f-d6', 'Test (PDF)', 'g7-ns-t1-test.pdf'), file('f-d7', 'Memo (PDF)', 'g7-ns-t1-memo.pdf')],
    featured: false, published: true, sortOrder: 4,
    seo: { title: 'Grade 7 Natural Sciences Term 1 Test', description: 'Printable Grade 7 NS & Tech Term 1 test and memo.' },
    faqs: ['faq-caps'], updatedAt: STAMP,
  },
  {
    id: 'p-005', slug: 'grade-3-maths-term-4-test', title: 'Grade 3 Mathematics — Term 4 Test',
    shortDescription: 'Foundation-phase maths assessment with memo.',
    fullDescription: 'A gentle Term 4 mathematics assessment for Grade 3 to build early confidence, with memo.',
    priceZar: 39, grade: 'Grade 3', term: 'Term 4', year: '2026',
    productKind: 'Individual Resource', resourceFormat: 'Test / Assessment',
    subjects: ['mathematics'], marks: 30,
    previewFiles: [file('f-p5', 'Sample page (PDF)', 'g3-maths-t4-sample.pdf')],
    purchasedFiles: [file('f-d8', 'Test (PDF)', 'g3-maths-t4-test.pdf'), file('f-d9', 'Memo (PDF)', 'g3-maths-t4-memo.pdf')],
    featured: false, published: false, sortOrder: 5,
    seo: { title: 'Grade 3 Maths Term 4 Test', description: 'Printable Grade 3 maths Term 4 test and memo.' },
    faqs: [], updatedAt: STAMP,
  },
  {
    id: 'p-100', slug: 'grade-4-term-1-bundle', title: 'Grade 4 — Term 1 Bundle',
    shortDescription: 'Every Grade 4 Term 1 test and summary in one pack.',
    fullDescription: 'A term bundle gathering all Grade 4 Term 1 resources across core subjects into a single discounted purchase.',
    priceZar: 129, grade: 'Grade 4', term: 'Term 1', year: '2026',
    productKind: 'Bundle', resourceFormat: 'Test / Assessment',
    subjects: ['mathematics', 'english-hl'], marks: null,
    previewFiles: [], purchasedFiles: [],
    featured: true, published: true, sortOrder: 10,
    seo: { title: 'Grade 4 Term 1 Bundle', description: 'All Grade 4 Term 1 CAPS resources in one bundle.' },
    faqs: ['faq-plan'], updatedAt: STAMP,
    bundleScope: 'Term',
    includedProductSlugs: ['grade-4-maths-term-1-test'],
    includedSubjects: ['mathematics', 'english-hl'],
    includedTerms: ['Term 1'],
  },
  {
    id: 'p-101', slug: 'grade-7-full-year-bundle', title: 'Grade 7 — Full Year Bundle',
    shortDescription: 'All four terms of Grade 7 resources, once-off.',
    fullDescription: 'A full-year bundle covering every Grade 7 test and summary across all four terms, sold once-off at a saving over buying separately.',
    priceZar: 399, grade: 'Grade 7', term: 'Term 1', year: '2026',
    productKind: 'Bundle', resourceFormat: 'Test / Assessment',
    subjects: ['natural-sciences', 'mathematics'], marks: null,
    previewFiles: [], purchasedFiles: [],
    featured: true, published: true, sortOrder: 11,
    seo: { title: 'Grade 7 Full Year Bundle', description: 'Every Grade 7 CAPS resource for the year in one bundle.' },
    faqs: ['faq-plan'], updatedAt: STAMP,
    bundleScope: 'Full Year',
    includedProductSlugs: ['grade-7-natural-sciences-term-1-test'],
    includedSubjects: ['natural-sciences', 'mathematics'],
    includedTerms: ['Term 1', 'Term 2', 'Term 3', 'Term 4'],
  },
  {
    id: 'p-200', slug: 'essential-term-access', title: 'Essential Access — One Term',
    shortDescription: 'One-time term access to a grade’s resources.',
    fullDescription: 'Essential Access grants a single term of resources for your chosen grade. Purchased once for that term — it does not auto-renew.',
    priceZar: 350, grade: 'Grade 5', term: 'Term 1', year: '2026',
    productKind: 'Access Plan', resourceFormat: 'Test / Assessment',
    subjects: ['mathematics', 'english-hl'], marks: null,
    previewFiles: [], purchasedFiles: [],
    featured: false, published: true, sortOrder: 20,
    seo: { title: 'Essential Term Access', description: 'One-time term access plan for a grade.' },
    faqs: ['faq-plan'], updatedAt: STAMP,
    accessPeriod: 'Term',
    includedGrades: ['Grade 5'],
    includedSubjects: ['mathematics', 'english-hl'],
    includedTerms: ['Term 1'],
    includedProductSlugs: ['grade-5-english-term-2-test'],
    deliveryRules: 'All current Term resources for the selected grade are available to download immediately on the order page.',
    renewalNotes: 'Covers one term. When the term ends, purchase again for the next term — there is no automatic charge.',
  },
  {
    id: 'p-201', slug: 'premium-year-access', title: 'Premium Access — Full Year',
    shortDescription: 'One-time full-year access to a grade’s resources.',
    fullDescription: 'Premium Access grants a full year of resources for your chosen grade, across all four terms. Purchased once for the year — it does not auto-renew.',
    priceZar: 1200, grade: 'Grade 5', term: 'Term 1', year: '2026',
    productKind: 'Access Plan', resourceFormat: 'Test / Assessment',
    subjects: ['mathematics', 'english-hl', 'natural-sciences'], marks: null,
    previewFiles: [], purchasedFiles: [],
    featured: true, published: true, sortOrder: 21,
    seo: { title: 'Premium Year Access', description: 'One-time full-year access plan for a grade.' },
    faqs: ['faq-plan'], updatedAt: STAMP,
    accessPeriod: 'Year',
    includedGrades: ['Grade 5'],
    includedSubjects: ['mathematics', 'english-hl', 'natural-sciences'],
    includedTerms: ['Term 1', 'Term 2', 'Term 3', 'Term 4'],
    includedProductSlugs: ['grade-5-english-term-2-test'],
    deliveryRules: 'All resources for the selected grade across the year are available to download on the order page.',
    renewalNotes: 'Covers the full school year. Purchase again next year — there is no automatic charge.',
  },
]

const testimonials: Testimonial[] = [
  { id: 't-001', customerName: 'Amoré', quote: 'My son’s Afrikaans mark improved from 42% to 84%. Thank you!', context: 'Parent, Grade 6', learnerGrade: 'Grade 6', sourceDate: '2026-04-02', featured: true, sortOrder: 1, published: true },
  { id: 't-002', customerName: 'Lizaan', quote: 'So much easier than hunting for practice papers every term.', context: 'Parent, Afrikaans FAL', learnerGrade: 'Grade 5', sourceDate: '2026-03-18', featured: true, sortOrder: 2, published: true },
  { id: 't-003', customerName: 'Thabo', quote: 'The memos make marking at home painless.', context: 'Parent, Grade 4', learnerGrade: 'Grade 4', sourceDate: '2026-02-27', featured: false, sortOrder: 3, published: true },
]

const customers: Customer[] = [
  { id: 'c-001', name: 'Amoré van Wyk', email: 'amore@example.com', createdAt: '2026-01-15T09:00:00.000Z', orderIds: ['o-1001', 'o-1003'] },
  { id: 'c-002', name: 'Thabo Mokoena', email: 'thabo@example.com', createdAt: '2026-02-02T11:30:00.000Z', orderIds: ['o-1002'] },
]

const payments: Payment[] = [
  { id: 'pay-1', orderId: 'o-1001', status: 'succeeded', provider: 'Payfast', reference: 'PF-9A2C71', amountZar: 98, createdAt: '2026-01-16T10:05:00.000Z' },
  { id: 'pay-2', orderId: 'o-1002', status: 'succeeded', provider: 'Payfast', reference: 'PF-22B0E4', amountZar: 399, createdAt: '2026-02-03T14:20:00.000Z' },
  { id: 'pay-3', orderId: 'o-1003', status: 'pending', provider: 'Payfast', reference: 'PF-771FA0', amountZar: 1200, createdAt: '2026-03-01T08:10:00.000Z' },
]

const orders: Order[] = [
  {
    id: 'o-1001', reference: 'DM-1001', customerId: 'c-001', customerName: 'Amoré van Wyk', customerEmail: 'amore@example.com',
    status: 'fulfilled', totalZar: 98, paymentId: 'pay-1', placedAt: '2026-01-16T10:05:00.000Z',
    items: [
      { id: 'oi-1', productSlug: 'grade-4-maths-term-1-test', title: 'Grade 4 Mathematics — Term 1 Test', productKind: 'Individual Resource', priceZar: 49 },
      { id: 'oi-2', productSlug: 'grade-5-english-term-2-test', title: 'Grade 5 English HL — Term 2 Test', productKind: 'Individual Resource', priceZar: 49 },
    ],
  },
  {
    id: 'o-1002', reference: 'DM-1002', customerId: 'c-002', customerName: 'Thabo Mokoena', customerEmail: 'thabo@example.com',
    status: 'fulfilled', totalZar: 399, paymentId: 'pay-2', placedAt: '2026-02-03T14:20:00.000Z',
    items: [
      { id: 'oi-3', productSlug: 'grade-7-full-year-bundle', title: 'Grade 7 — Full Year Bundle', productKind: 'Bundle', priceZar: 399 },
    ],
  },
  {
    id: 'o-1003', reference: 'DM-1003', customerId: 'c-001', customerName: 'Amoré van Wyk', customerEmail: 'amore@example.com',
    status: 'pending', totalZar: 1200, paymentId: 'pay-3', placedAt: '2026-03-01T08:10:00.000Z',
    items: [
      { id: 'oi-4', productSlug: 'premium-year-access', title: 'Premium Access — Full Year', productKind: 'Access Plan', priceZar: 1200 },
    ],
  },
]

export const fixtureSnapshot: CmsSnapshot = {
  generatedAt: STAMP,
  source: 'wireframe-fixtures',
  valueLists,
  products,
  subjects,
  faqs,
  testimonials,
  customers,
  orders,
  payments,
  stats: {
    productCount: products.length,
    subjectCount: subjects.length,
    gradeCount: valueLists.grades.length,
    bundleCount: products.filter((p) => p.productKind === 'Bundle').length,
    accessPlanCount: products.filter((p) => p.productKind === 'Access Plan').length,
    orderCount: orders.length,
    customerCount: customers.length,
  },
}
