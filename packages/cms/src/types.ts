/* -------------------------------------------------------------------------
   Designing Minds content model.

   Mirrors docs/content-map.md:
   - Collections  : Products, Subjects, FAQs, Testimonials
   - Value lists  : Grades, Terms, Years, Product Kinds, Resource Formats
   - Operational  : Customers, Orders, Order Items, Payments

   Pages are intentionally NOT modelled here — static pages are owned by the
   website (see CONTEXT.md), not the CMS.
   ------------------------------------------------------------------------- */

export type CmsProviderMode = 'seed' | 'local' | 'supabase'

/* -------------------------------- Value lists -------------------------- */

export type Grade = 'Grade 3' | 'Grade 4' | 'Grade 5' | 'Grade 6' | 'Grade 7'
export type Term = 'Term 1' | 'Term 2' | 'Term 3' | 'Term 4'
export type ProductKind = 'Individual Resource' | 'Bundle' | 'Access Plan'
export type ResourceFormat = 'Test / Assessment' | 'Summary'

/**
 * Database-sourced allowed-value lists that certain Product fields draw from.
 * Edited directly in the database (see ADR 0002) — the admin shows them as
 * fixed select options and never writes to them.
 */
export interface ValueLists {
  grades: Grade[]
  terms: Term[]
  years: string[]
  productKinds: ProductKind[]
  resourceFormats: ResourceFormat[]
}

/* --------------------------------- Shared ------------------------------ */

export interface SeoMeta {
  title: string
  description: string
}

/** A file attached to a Product. Files live on Products, not a separate collection. */
export interface ProductFile {
  id: string
  label: string
  filename: string
}

/* ------------------------------- Collections --------------------------- */

export type BundleScope = 'Term' | 'Full Year'
export type AccessPeriod = 'Term' | 'Year'

export interface Product {
  id: string
  slug: string
  title: string
  shortDescription: string
  fullDescription: string
  priceZar: number
  grade: Grade
  term: Term
  year: string
  productKind: ProductKind
  resourceFormat: ResourceFormat
  /** Subject slugs. Required multi-select: at least one. */
  subjects: string[]
  marks: number | null
  previewFiles: ProductFile[]
  purchasedFiles: ProductFile[]
  featured: boolean
  published: boolean
  sortOrder: number
  seo: SeoMeta
  /** FAQ ids referenced by this product. */
  faqs: string[]
  updatedAt: string

  /* Bundle-only fields (Product Kind = Bundle). */
  bundleScope?: BundleScope
  /* Access Plan-only fields (Product Kind = Access Plan). */
  accessPeriod?: AccessPeriod
  includedGrades?: Grade[]
  deliveryRules?: string
  renewalNotes?: string

  /* Shared by Bundle and Access Plan. Included products are Individual Resources only. */
  includedProductSlugs?: string[]
  includedSubjects?: string[]
  includedTerms?: Term[]
}

export interface Subject {
  id: string
  slug: string
  name: string
  shortLabel: string
  description: string
  sortOrder: number
  visible: boolean
  /** Optional FAQ ids referenced by this subject. */
  faqs: string[]
  accent?: string
  seo?: SeoMeta
}

export interface Faq {
  id: string
  question: string
  answer: string
  category: string
  sortOrder: number
  published: boolean
}

export interface Testimonial {
  id: string
  customerName: string
  quote: string
  context: string
  learnerGrade: Grade | null
  sourceDate: string
  featured: boolean
  sortOrder: number
  published: boolean
}

/* ----------------------------- Operational records --------------------- */

export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded'
export type OrderStatus = 'pending' | 'paid' | 'fulfilled' | 'refunded' | 'failed'

export interface Customer {
  id: string
  name: string
  email: string
  createdAt: string
  orderIds: string[]
}

export interface OrderItem {
  id: string
  productSlug: string
  title: string
  productKind: ProductKind
  priceZar: number
}

export interface Payment {
  id: string
  orderId: string
  status: PaymentStatus
  provider: string
  reference: string
  amountZar: number
  createdAt: string
}

export interface Order {
  id: string
  reference: string
  customerId: string
  customerName: string
  customerEmail: string
  status: OrderStatus
  items: OrderItem[]
  totalZar: number
  paymentId: string
  placedAt: string
}

/* --------------------------------- Snapshot ---------------------------- */

export interface CmsStats {
  productCount: number
  subjectCount: number
  gradeCount: number
  bundleCount: number
  accessPlanCount: number
  orderCount: number
  customerCount: number
}

export interface CmsSnapshot {
  generatedAt: string
  source: string
  valueLists: ValueLists
  products: Product[]
  subjects: Subject[]
  faqs: Faq[]
  testimonials: Testimonial[]
  customers: Customer[]
  orders: Order[]
  payments: Payment[]
  stats: CmsStats
}

/* -------------------------------- Repository --------------------------- */

export interface CmsRepository {
  mode: CmsProviderMode
  canWrite: boolean
  getSnapshot: () => Promise<CmsSnapshot>
  saveProduct: (product: Product) => Promise<Product>
  saveSubject: (subject: Subject) => Promise<Subject>
  saveFaq: (faq: Faq) => Promise<Faq>
  saveTestimonial: (testimonial: Testimonial) => Promise<Testimonial>
  reset?: () => Promise<void>
}
