/* -------------------------------------------------------------------------
   Designing Minds content model.

   Mirrors docs/site-and-content-model.md:
   - Collections  : Products, FAQs, Testimonials
   - Value lists  : Grades, Terms, Years, Product Kinds, Resource Formats, Subjects
   - Operational  : Users, User Roles, Carts, Orders, Order Items, Payments

   Pages are intentionally NOT modelled here — static pages are owned by the
   website (see CONTEXT.md), not the CMS.
   ------------------------------------------------------------------------- */

export type CmsProviderMode = 'seed' | 'local' | 'supabase'

/* -------------------------------- Value lists -------------------------- */

export type Grade = 'Grade 3' | 'Grade 4' | 'Grade 5' | 'Grade 6' | 'Grade 7'
export type Term = 'Any Term' | 'Term 1' | 'Term 2' | 'Term 3' | 'Term 4'
export type ProductKind = 'Single' | 'Bundle' | 'Access Plan'
export type ResourceFormat = 'Test / Assessment' | 'Summary'

/**
 * Database-sourced allowed-value lists that certain Product fields draw from.
 * Edited directly in the database (see docs/decisions.md) — the admin shows them as
 * fixed select options and never writes to them.
 *
 * `subjects` is the controlled subject vocabulary (display names). Subjects are a
 * value list, not a table — a Product carries its subject names directly in
 * `Product.subjects`, so there is nothing to join.
 */
export interface ValueLists {
  grades: Grade[]
  terms: Term[]
  years: string[]
  productKinds: ProductKind[]
  resourceFormats: ResourceFormat[]
  subjects: string[]
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
  /** Provider-neutral private storage key, never a public URL. */
  storageKey?: string
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
  /** Subject display names, drawn from value_lists.subjects. Required: at least one. */
  subjects: string[]
  marks: number | null
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

  /* Shared by Bundle and Access Plan. Included products must have Product Kind `Single`. */
  includedProductSlugs?: string[]
  /** Subject display names (value_lists.subjects), matching Product.subjects. */
  includedSubjects?: string[]
  includedTerms?: Term[]
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
}

export interface OrderItem {
  id: string
  productSlug: string
  title: string
  productKind: ProductKind
  priceZar: number
  /**
   * The grade this line item grants. For an Access Plan it is the grade chosen
   * at checkout; for other products it is the product's own grade. Optional for
   * orders placed before grade capture existed.
   */
  grade?: Grade
}

export interface Payment {
  id: string
  orderId: string
  status: PaymentStatus
  provider: string
  reference: string
  pfPaymentId?: string | null
  amountZar: number
  createdAt: string
  processedAt?: string | null
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

/* ----------------------------- Slug redirects -------------------------- */

/**
 * A system-managed permanent redirect from a historical product URL to the
 * current canonical URL. Created automatically when a product slug changes (see
 * the products slug-change trigger). Never an admin-editable collection.
 */
export interface SlugRedirect {
  id: string
  entityType: 'product'
  entityId: string | null
  fromPath: string
  toPath: string
  statusCode: 301 | 308
  createdAt: string
  createdBy?: string | null
}

/* ----------------------------- Form submissions ------------------------ */

/**
 * A public form submission. Persisted only by the trusted functions app; the
 * browser never writes these. Stable identity/metadata live in columns; the
 * variable per-form fields live in `data` so new fields need no schema change.
 * One interface per form table (form_<name>).
 */
interface FormSubmissionBase {
  id: string
  /** The submitted, non-promoted form fields. */
  data: Record<string, unknown>
  /** Page the form was submitted from (Referer), if known. */
  sourceUrl: string | null
  userAgent: string | null
  createdAt: string
}

export interface ContactSubmission extends FormSubmissionBase {
  name: string | null
  email: string | null
}

export interface NewsletterSubmission extends FormSubmissionBase {
  email: string | null
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
  faqs: Faq[]
  testimonials: Testimonial[]
  customers: Customer[]
  orders: Order[]
  payments: Payment[]
  /** Contact-form submissions (admin-only; empty in the public snapshot). */
  formContact: ContactSubmission[]
  /** Newsletter signups (admin-only; empty in the public snapshot). */
  formNewsletter: NewsletterSubmission[]
  stats: CmsStats
}

/* -------------------------------- Repository --------------------------- */

export interface CmsRepository {
  mode: CmsProviderMode
  canWrite: boolean
  getSnapshot: () => Promise<CmsSnapshot>
  /** System-managed redirects whose target is a currently-published product. */
  getSlugRedirects: () => Promise<SlugRedirect[]>
  saveProduct: (product: Product) => Promise<Product>
  saveFaq: (faq: Faq) => Promise<Faq>
  saveTestimonial: (testimonial: Testimonial) => Promise<Testimonial>
}
