/**
 * Typed catalogue fixtures shared by tests. Each factory returns a COMPLETE
 * record for the current `@designing-minds/cms` types, so when a type gains a
 * required field `npm run typecheck` fails here once instead of drifting
 * silently across dozens of hand-rolled literals.
 */
import type { Bundle, CmsSnapshot, Product } from '../../packages/cms/src/types.ts'

export const makeProduct = (overrides: Partial<Product> & Pick<Product, 'slug'>): Product => ({
  id: overrides.slug,
  title: overrides.slug,
  shortDescription: '',
  fullDescription: '',
  priceZar: 0,
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
  status: 'published',
  sortOrder: 0,
  seo: { title: '', description: '' },
  faqs: [],
  updatedAt: '2026-01-01',
  ...overrides,
})

export const makeBundle = (overrides: Partial<Bundle> & Pick<Bundle, 'slug'>): Bundle => ({
  id: overrides.slug,
  title: overrides.slug,
  shortDescription: '',
  fullDescription: '',
  priceZar: 0,
  grade: 'Grade 3',
  term: 'Term 1',
  year: '2026',
  bundleScope: 'Term',
  galleryImages: [],
  previewPdfs: [],
  featured: false,
  published: true,
  status: 'published',
  sortOrder: 0,
  seo: { title: '', description: '' },
  faqs: [],
  updatedAt: '2026-01-01',
  includedProductIds: [],
  includedProductSlugs: [],
  ...overrides,
})

/** A complete (empty by default) snapshot; pass only the collections a test cares about. */
export const makeSnapshot = (overrides: Partial<CmsSnapshot> = {}): CmsSnapshot => ({
  generatedAt: '2026-01-01',
  source: 'test',
  valueLists: {
    grades: ['Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'],
    terms: ['Any Term', 'Term 1', 'Term 2', 'Term 3', 'Term 4'],
    years: ['2026'],
    subjects: ['Mathematics'],
    resourceFormats: ['Test / Assessment', 'Summary'],
  },
  products: [],
  bundles: [],
  faqs: [],
  testimonials: [],
  customers: [],
  orders: [],
  payments: [],
  formContact: [],
  formNewsletter: [],
  stats: { productCount: 0, subjectCount: 0, gradeCount: 0, bundleCount: 0, orderCount: 0, customerCount: 0 },
  ...overrides,
})
