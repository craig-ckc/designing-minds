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
