import type {
  Bundle,
  CmsSnapshot,
  Faq,
  Order,
  Product,
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

export const getBundleBySlug = (snapshot: CmsSnapshot, slug: string) =>
  snapshot.bundles.find((bundle) => bundle.slug === slug)

/**
 * Resolve a /shop/<slug> path, which both Collections share. Returns the kind
 * alongside the record so callers branch on data rather than on which lookup
 * happened to return something.
 */
export type CatalogItem =
  | { kind: 'product'; product: Product }
  | { kind: 'bundle'; bundle: Bundle }

export const getCatalogItemBySlug = (snapshot: CmsSnapshot, slug: string): CatalogItem | undefined => {
  const product = getProductBySlug(snapshot, slug)
  if (product) return { kind: 'product', product }
  const bundle = getBundleBySlug(snapshot, slug)
  if (bundle) return { kind: 'bundle', bundle }
  return undefined
}

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

/** Every published resource. Products are individual resources now, so this is
 *  just publishedProducts — kept as the name the site reads by. */
export const individualResources = (snapshot: CmsSnapshot) => publishedProducts(snapshot)

export const publishedBundles = (snapshot: CmsSnapshot) => snapshot.bundles.filter((bundle) => bundle.published)

export const getFeaturedBundles = (snapshot: CmsSnapshot, limit = 6) =>
  publishedBundles(snapshot)
    .filter((bundle) => bundle.featured)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, limit)

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
  const bundles = publishedBundles(snapshot)
  const tiers: BundleTier[] = []
  const add = (scope: BundleTierScope, title: string, fallbackPriceZar: number) => {
    const subset = bundles.filter((bundle) => bundle.bundleScope === scope)
    if (subset.length === 0) return
    tiers.push({
      scope,
      title,
      // The real cheapest, not a hardcoded marketing number — the fallback
      // only covers a tier whose bundles are all unpriced.
      fromPriceZar: Math.min(...subset.map((bundle) => bundle.priceZar)) || fallbackPriceZar,
      gradeCount: new Set(subset.map((bundle) => bundle.grade)).size,
      featured: scope === 'Full Year',
    })
  }
  add('Term', 'Term bundles', 350)
  add('Full Year', 'Full-year bundles', 1200)
  return tiers
}

export const productsForGrade = (snapshot: CmsSnapshot, grade: string) =>
  publishedProducts(snapshot).filter((p) => p.grade === grade)

/** The published bundles covering one grade, cheapest first. */
export const bundlesForGrade = (snapshot: CmsSnapshot, grade: string) =>
  publishedBundles(snapshot)
    .filter((bundle) => bundle.grade === grade)
    .sort((a, b) => a.priceZar - b.priceZar)

/** The published bundles that include a given resource, cheapest first. */
export const bundlesContaining = (snapshot: CmsSnapshot, product: Product) =>
  publishedBundles(snapshot)
    .filter((bundle) => bundle.includedProductSlugs.includes(product.slug))
    .sort((a, b) => a.priceZar - b.priceZar)

export interface BundleValue {
  /** Included resources that are published and priced. */
  itemCount: number
  /** What the same resources cost bought one at a time. */
  singlesTotalZar: number
  /** singlesTotalZar - priceZar, floored at 0. */
  savingZar: number
  /** Whole-percent discount against buying singly. */
  savingPercent: number
  /** Distinct subjects the bundle covers. */
  subjects: string[]
  /** Distinct terms the bundle covers. */
  terms: string[]
  /** Downloadable files across the included resources, when the CMS lists them. */
  fileCount: number
}

/**
 * What a bundle is actually worth, derived from the resources it includes — no
 * separate CMS fields to fall out of sync. Returns null when the bundle lists
 * nothing (or nothing published), so callers render the real "still being
 * finalised" state instead of a fabricated R0 saving.
 */
export const bundleValue = (snapshot: CmsSnapshot, bundle: Bundle): BundleValue | null => {
  const included = getProductsBySlugs(snapshot, bundle.includedProductSlugs).filter((p) => p.published)
  if (included.length === 0) return null
  const singlesTotalZar = included.reduce((total, entry) => total + entry.priceZar, 0)
  const savingZar = Math.max(0, singlesTotalZar - bundle.priceZar)
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

/** The resources inside a bundle, published only, in the bundle's own order. */
export const bundleContents = (snapshot: CmsSnapshot, bundle: Bundle): Product[] =>
  getProductsBySlugs(snapshot, bundle.includedProductSlugs).filter((p) => p.published)

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
  query: string
}

export const ALL = 'All'

export const defaultProductFilters: ProductFilterState = {
  grade: ALL,
  term: ALL,
  subject: ALL,
  resourceFormat: ALL,
  query: '',
}

export const filterProducts = (products: Product[], filters: ProductFilterState) => {
  const query = filters.query.trim().toLowerCase()
  return products.filter((product) => {
    if (filters.grade !== ALL && product.grade !== filters.grade) return false
    if (filters.term !== ALL && product.term !== filters.term) return false
    if (filters.subject !== ALL && !product.subjects.includes(filters.subject)) return false
    if (filters.resourceFormat !== ALL && product.resourceFormat !== filters.resourceFormat) return false
    if (!query) return true
    const haystack = `${product.title} ${product.shortDescription} ${product.subjects.join(' ')}`.toLowerCase()
    return haystack.includes(query)
  })
}

/**
 * Bundles under the same filters the resource grid uses.
 *
 * A bundle has no subjects or format of its own — they come from its members
 * — so those facets match when ANY included resource matches. Filtering by
 * subject therefore keeps a bundle that contains that subject rather than
 * hiding it, which is what a shopper filtering to "Mathematics" expects.
 */
export const filterBundles = (snapshot: CmsSnapshot, bundles: Bundle[], filters: ProductFilterState) => {
  const query = filters.query.trim().toLowerCase()
  return bundles.filter((bundle) => {
    if (filters.grade !== ALL && bundle.grade !== filters.grade) return false

    const needsMembers =
      filters.subject !== ALL || filters.resourceFormat !== ALL || filters.term !== ALL
    const members = needsMembers ? bundleContents(snapshot, bundle) : []

    if (filters.term !== ALL && bundle.term !== filters.term && !members.some((m) => m.term === filters.term)) return false
    if (filters.subject !== ALL && !members.some((m) => m.subjects.includes(filters.subject))) return false
    if (filters.resourceFormat !== ALL && !members.some((m) => m.resourceFormat === filters.resourceFormat)) return false

    if (!query) return true
    return `${bundle.title} ${bundle.shortDescription}`.toLowerCase().includes(query)
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

export const updateBundleInSnapshot = (snapshot: CmsSnapshot, bundle: Bundle): CmsSnapshot => ({
  ...snapshot,
  bundles: upsert(snapshot.bundles, bundle).sort((a, b) => a.sortOrder - b.sortOrder),
})

export const updateFaqInSnapshot = (snapshot: CmsSnapshot, faq: Faq): CmsSnapshot => ({
  ...snapshot,
  faqs: upsert(snapshot.faqs, faq).sort((a, b) => a.sortOrder - b.sortOrder),
})

export const updateTestimonialInSnapshot = (snapshot: CmsSnapshot, testimonial: Testimonial): CmsSnapshot => ({
  ...snapshot,
  testimonials: upsert(snapshot.testimonials, testimonial).sort((a, b) => a.sortOrder - b.sortOrder),
})
