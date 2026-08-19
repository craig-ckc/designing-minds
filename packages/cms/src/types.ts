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
export type ResourceFormat = 'Test / Assessment' | 'Summary'

/**
 * What a catalogue line refers to. Products and Bundles are separate
 * Collections but share the /shop/<slug> URL space and the cart, so anything
 * generic over both carries this.
 *
 * Order history records it too: `orders.items[].productKind` is a snapshot of
 * what was bought, so historical values ('Single', 'Bundle', and the retired
 * 'Access Plan') stay readable even though only the first two can be created.
 */
export type CatalogItemKind = 'product' | 'bundle'

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
  resourceFormats: ResourceFormat[]
  subjects: string[]
}

/* --------------------------------- Shared ------------------------------ */

export interface SeoMeta {
  title: string
  description: string
}

/**
 * An image in a catalogue record's preview gallery.
 *
 * Public by construction: unlike `ProductFile`, which is paid content behind a
 * signed URL, a gallery image is marketing shown to anonymous visitors. It
 * lives in the public media bucket and carries its permanent `url` inline so
 * the prerendered static HTML can reference it without minting anything.
 */
export interface ProductImage {
  id: string
  /** Provider-neutral key inside the PUBLIC media bucket. */
  storageKey: string
  /** Permanent public URL for the object — safe to bake into static HTML. */
  url: string
  /** Original filename at upload time. Shown in the admin, never to a visitor. */
  filename: string
  /** Author-supplied alternative text. Empty means "decorative". */
  alt: string
  sizeBytes?: number
  contentType?: string
  /** Intrinsic pixel size, measured in the browser at upload time, so the
   *  gallery can reserve the right box and avoid layout shift. */
  width?: number
  height?: number
}

/** A file attached to a Product. Files live on Products, not a separate collection. */
export interface ProductFile {
  id: string
  label: string
  filename: string
  /** Provider-neutral private storage key, never a public URL. */
  storageKey?: string
  /** Size at upload time, so the admin can show it without fetching the object. */
  sizeBytes?: number
  /** MIME type reported by the browser at upload time. */
  contentType?: string
}

/* ------------------------------- Collections --------------------------- */

export type BundleScope = 'Term' | 'Full Year'

/** An individual resource. Bundles are a separate Collection — see `Bundle`. */
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
  resourceFormat: ResourceFormat
  /** Subject display names, drawn from value_lists.subjects. Required: at least one. */
  subjects: string[]
  marks: number | null
  purchasedFiles: ProductFile[]
  /** Preview gallery shown after the generated cover on the Product Detail. */
  galleryImages: ProductImage[]
  featured: boolean
  published: boolean
  sortOrder: number
  seo: SeoMeta
  /** FAQ ids referenced by this product. */
  faqs: string[]
  updatedAt: string
}

/**
 * A priced package of individual resources.
 *
 * Membership is explicit: `includedProductSlugs` / `includedProductIds` are the
 * whole of what a bundle contains. There is no rule-based inclusion — a bundle
 * that "covers Grade 3 Maths" lists those resources, so what a buyer gets is
 * always exactly what the page showed them.
 *
 * Subjects, terms, file count and monetary value are DERIVED from the members
 * (see `bundleValue`), never stored, so a bundle can't disagree with itself.
 */
export interface Bundle {
  id: string
  slug: string
  title: string
  shortDescription: string
  fullDescription: string
  priceZar: number
  grade: Grade
  term: Term
  year: string
  bundleScope?: BundleScope
  /** Preview gallery shown after the generated cover stack on the Product Detail. */
  galleryImages: ProductImage[]
  featured: boolean
  published: boolean
  sortOrder: number
  seo: SeoMeta
  /** FAQ ids referenced by this bundle. */
  faqs: string[]
  updatedAt: string
  /** Member product ids, in display order. */
  includedProductIds: string[]
  /** Member product slugs, in the same order — the public snapshot keys on slug. */
  includedProductSlugs: string[]
}

export interface Faq {
  id: string
  question: string
  answer: string
  category: string
  sortOrder: number
  published: boolean
  updatedAt: string
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
  updatedAt: string
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
  /** Slug of the product or bundle. Both live in the /shop/<slug> space. */
  productSlug: string
  title: string
  /**
   * What was bought, as recorded at the time. A historical snapshot, not a
   * live reference — old orders still read 'Single' and 'Access Plan' even
   * though neither can be created any more.
   */
  productKind: 'Single' | 'Bundle' | 'Access Plan'
  priceZar: number
  /**
   * The grade this line item grants — the product's or bundle's own grade.
   * Optional for orders placed before grade capture existed.
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
  orderCount: number
  customerCount: number
}

export interface CmsSnapshot {
  generatedAt: string
  source: string
  valueLists: ValueLists
  products: Product[]
  bundles: Bundle[]
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
  /** System-managed redirects whose target is a currently-published product or bundle. */
  getSlugRedirects: () => Promise<SlugRedirect[]>
  saveProduct: (product: Product) => Promise<Product>
  /**
   * Saves the bundle and replaces its membership. Membership goes through the
   * set_bundle_products RPC so the row and its members can't end up disagreeing
   * — the browser admin has no transaction of its own.
   */
  saveBundle: (bundle: Bundle) => Promise<Bundle>
  saveFaq: (faq: Faq) => Promise<Faq>
  saveTestimonial: (testimonial: Testimonial) => Promise<Testimonial>
}
