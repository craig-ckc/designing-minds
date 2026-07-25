import type {
  CmsSnapshot,
  Faq,
  Order,
  Product,
  ProductKind,
  ResourceFormat,
  Testimonial,
} from '../types'

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(amount)

export const priceLabel = (amount: number) => formatCurrency(amount)

export const toParagraphs = (value: string) =>
  value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

/* --------------------------------- Lookups ----------------------------- */

export const getProductBySlug = (snapshot: CmsSnapshot, slug: string) =>
  snapshot.products.find((product) => product.slug === slug)

export const getFaqsByIds = (snapshot: CmsSnapshot, ids: string[]): Faq[] =>
  ids
    .map((id) => snapshot.faqs.find((faq) => faq.id === id))
    .filter((faq): faq is Faq => Boolean(faq))

export const getProductsBySlugs = (snapshot: CmsSnapshot, slugs: string[]): Product[] =>
  slugs
    .map((slug) => snapshot.products.find((product) => product.slug === slug))
    .filter((product): product is Product => Boolean(product))

export const publishedProducts = (snapshot: CmsSnapshot) =>
  snapshot.products.filter((product) => product.published)

export const getFeaturedProducts = (snapshot: CmsSnapshot, limit = 6) =>
  publishedProducts(snapshot)
    .filter((product) => product.featured)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, limit)

export const individualResources = (snapshot: CmsSnapshot) =>
  publishedProducts(snapshot).filter((p) => p.productKind === 'Single')

export const bundleProducts = (snapshot: CmsSnapshot) =>
  publishedProducts(snapshot).filter((p) => p.productKind === 'Bundle')

export const accessPlanProducts = (snapshot: CmsSnapshot) =>
  publishedProducts(snapshot).filter((p) => p.productKind === 'Access Plan')

export type BundleTierScope = 'Term' | 'Full Year'

export interface BundleTier {
  scope: BundleTierScope
  title: string
  fromPriceZar: number
  gradeCount: number
  featured: boolean
}

/** Summarise the published term and full-year bundles for catalogue entry points. */
export const bundleTiers = (snapshot: CmsSnapshot): BundleTier[] => {
  const bundles = bundleProducts(snapshot)
  const tiers: BundleTier[] = []
  const add = (scope: BundleTierScope, title: string, fromPriceZar: number) => {
    const subset = bundles.filter((product) => product.bundleScope === scope)
    if (subset.length === 0) return
    tiers.push({
      scope,
      title,
      fromPriceZar,
      gradeCount: new Set(subset.map((product) => product.grade)).size,
      featured: scope === 'Full Year',
    })
  }
  add('Term', 'Term bundles', 350)
  add('Full Year', 'Full-year bundles', 1200)
  return tiers
}

export type AccessPlanTierKey = 'essential' | 'premium'

export interface AccessPlanTier {
  tier: AccessPlanTierKey
  title: string
  period: 'Term' | 'Year'
  fromPriceZar: number
  gradeCount: number
  featured: boolean
}

/**
 * Collapse the per-grade (and per-term) Access Plan products into the two
 * marketed tiers for homepage/nav entry points. Each Access Plan is one grade
 * now (see docs/decisions.md), so a single "Essential" or "Premium" card can't be one
 * product — it summarises its tier and deep-links to /packages filtered by it.
 */
export const accessPlanTiers = (snapshot: CmsSnapshot): AccessPlanTier[] => {
  const plans = accessPlanProducts(snapshot)
  const tiers: AccessPlanTier[] = []
  const add = (tier: AccessPlanTierKey, period: 'Term' | 'Year', title: string) => {
    const subset = plans.filter((p) => p.accessPeriod === period)
    if (subset.length === 0) return
    tiers.push({
      tier,
      title,
      period,
      fromPriceZar: Math.min(...subset.map((p) => p.priceZar)),
      gradeCount: new Set(subset.map((p) => p.grade)).size,
      featured: tier === 'premium',
    })
  }
  add('essential', 'Term', 'Essential Access')
  add('premium', 'Year', 'Premium Access')
  return tiers
}

export const productsForGrade = (snapshot: CmsSnapshot, grade: string) =>
  publishedProducts(snapshot).filter((p) => p.grade === grade)

/** The published Bundles and Access Plans that cover one grade, cheapest first. */
export const packagesForGrade = (snapshot: CmsSnapshot, grade: string) =>
  productsForGrade(snapshot, grade)
    .filter((p) => p.productKind === 'Bundle' || p.productKind === 'Access Plan')
    .sort((a, b) => a.priceZar - b.priceZar)

/** The published Bundles / Access Plans that include a given Single, cheapest first. */
export const packagesContaining = (snapshot: CmsSnapshot, product: Product) =>
  publishedProducts(snapshot)
    .filter((p) => (p.includedProductSlugs ?? []).includes(product.slug))
    .sort((a, b) => a.priceZar - b.priceZar)

export interface PackageValue {
  /** Included Single products that are published and priced. */
  itemCount: number
  /** What the same resources cost bought one at a time. */
  singlesTotalZar: number
  /** singlesTotalZar - priceZar, floored at 0. */
  savingZar: number
  /** Whole-percent discount against buying singly. */
  savingPercent: number
  /** Distinct subjects the package covers. */
  subjects: string[]
  /** Distinct terms the package covers. */
  terms: string[]
  /** Downloadable files across the included resources, when the CMS lists them. */
  fileCount: number
}

/**
 * What a Bundle or Access Plan is actually worth, derived from the products it
 * includes — no new CMS fields. Returns null when the package lists nothing (or
 * nothing published), so callers render the real "still being finalised" state
 * instead of a fabricated R0 saving.
 */
export const packageValue = (snapshot: CmsSnapshot, product: Product): PackageValue | null => {
  const included = getProductsBySlugs(snapshot, product.includedProductSlugs ?? []).filter((p) => p.published)
  if (included.length === 0) return null
  const singlesTotalZar = included.reduce((total, entry) => total + entry.priceZar, 0)
  const savingZar = Math.max(0, singlesTotalZar - product.priceZar)
  return {
    itemCount: included.length,
    singlesTotalZar,
    savingZar,
    savingPercent: singlesTotalZar > 0 ? Math.round((savingZar / singlesTotalZar) * 100) : 0,
    subjects: [...new Set(included.flatMap((entry) => entry.subjects))].sort(),
    terms: [...new Set(included.map((entry) => entry.term))].sort(),
    fileCount: included.reduce((total, entry) => total + entry.purchasedFiles.length, 0),
  }
}

export const relatedProducts = (snapshot: CmsSnapshot, product: Product, limit = 3) =>
  publishedProducts(snapshot)
    .filter((p) => p.slug !== product.slug && p.subjects.some((s) => product.subjects.includes(s)))
    .slice(0, limit)

/* --------------------------------- Filters ----------------------------- */

export interface ProductFilterState {
  grade: string
  term: string
  subject: string
  resourceFormat: string
  kind: string
  query: string
}

export const ALL = 'All'

export const defaultProductFilters: ProductFilterState = {
  grade: ALL,
  term: ALL,
  subject: ALL,
  resourceFormat: ALL,
  kind: ALL,
  query: '',
}

export const filterProducts = (products: Product[], filters: ProductFilterState) => {
  const query = filters.query.trim().toLowerCase()
  return products.filter((product) => {
    if (filters.grade !== ALL && product.grade !== filters.grade) return false
    if (filters.term !== ALL && product.term !== filters.term) return false
    if (filters.subject !== ALL && !product.subjects.includes(filters.subject)) return false
    if (filters.resourceFormat !== ALL && product.resourceFormat !== filters.resourceFormat) return false
    if (filters.kind !== ALL && product.productKind !== (filters.kind as ProductKind)) return false
    if (!query) return true
    const haystack = `${product.title} ${product.shortDescription} ${product.subjects.join(' ')}`.toLowerCase()
    return haystack.includes(query)
  })
}

export const resourceFormatLabel = (value: ResourceFormat) => value

/* ----------------------------- Operational lookups --------------------- */

export const getOrderById = (snapshot: CmsSnapshot, id: string) =>
  snapshot.orders.find((order) => order.id === id || order.reference === id)

export const getCustomerById = (snapshot: CmsSnapshot, id: string) =>
  snapshot.customers.find((customer) => customer.id === id)

export const paymentForOrder = (snapshot: CmsSnapshot, order: Order) =>
  snapshot.payments.find((payment) => payment.id === order.paymentId)

export const ordersForCustomer = (snapshot: CmsSnapshot, customerId: string) =>
  snapshot.orders.filter((order) => order.customerId === customerId)

/* -------------------------------- Mutations ---------------------------- */

export const cloneSnapshot = (snapshot: CmsSnapshot): CmsSnapshot => structuredClone(snapshot)

const upsert = <T extends { id: string }>(items: T[], next: T): T[] => {
  const exists = items.some((item) => item.id === next.id)
  return exists ? items.map((item) => (item.id === next.id ? next : item)) : [...items, next]
}

export const updateProductInSnapshot = (snapshot: CmsSnapshot, product: Product): CmsSnapshot => ({
  ...snapshot,
  products: upsert(snapshot.products, product).sort((a, b) => a.sortOrder - b.sortOrder),
})

export const updateFaqInSnapshot = (snapshot: CmsSnapshot, faq: Faq): CmsSnapshot => ({
  ...snapshot,
  faqs: upsert(snapshot.faqs, faq).sort((a, b) => a.sortOrder - b.sortOrder),
})

export const updateTestimonialInSnapshot = (snapshot: CmsSnapshot, testimonial: Testimonial): CmsSnapshot => ({
  ...snapshot,
  testimonials: upsert(snapshot.testimonials, testimonial).sort((a, b) => a.sortOrder - b.sortOrder),
})
