import type { CmsPage, CmsProduct, CmsSnapshot } from '../types'

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(amount)

export const toParagraphs = (value: string) =>
  value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

export const slugToPath = (slug: string) => (slug === 'home' ? '/' : `/${slug}`)

export const getPageBySlug = (snapshot: CmsSnapshot, slug: string) =>
  snapshot.pages.find((page) => page.slug === slug)

export const getProductBySlug = (snapshot: CmsSnapshot, slug: string) =>
  snapshot.products.find((product) => product.slug === slug)

export const getFeaturedProducts = (snapshot: CmsSnapshot, limit = 8) =>
  [...snapshot.products]
    .sort((left, right) => new Date(right.modified).getTime() - new Date(left.modified).getTime())
    .slice(0, limit)

export interface ProductFilterState {
  grade: string
  term: string
  subject: string
  type: string
  query: string
}

export const defaultProductFilters: ProductFilterState = {
  grade: 'All grades',
  term: 'All terms',
  subject: 'All subjects',
  type: 'All formats',
  query: '',
}

export const filterProducts = (products: CmsProduct[], filters: ProductFilterState) => {
  const query = filters.query.trim().toLowerCase()

  return products.filter((product) => {
    if (filters.grade !== 'All grades' && product.grade !== filters.grade) {
      return false
    }

    if (filters.term !== 'All terms' && product.term !== filters.term) {
      return false
    }

    if (filters.subject !== 'All subjects' && !product.subjects.includes(filters.subject)) {
      return false
    }

    if (filters.type !== 'All formats' && product.type !== filters.type) {
      return false
    }

    if (!query) {
      return true
    }

    const haystack = `${product.title} ${product.excerpt} ${product.primarySubject}`.toLowerCase()
    return haystack.includes(query)
  })
}

export const cloneSnapshot = (snapshot: CmsSnapshot): CmsSnapshot =>
  structuredClone(snapshot)

export const updatePageInSnapshot = (snapshot: CmsSnapshot, page: CmsPage): CmsSnapshot => ({
  ...snapshot,
  generatedAt: new Date().toISOString(),
  pages: snapshot.pages
    .map((entry) => (entry.id === page.id ? page : entry))
    .sort((left, right) => left.menuOrder - right.menuOrder || left.title.localeCompare(right.title)),
})

export const updateProductInSnapshot = (snapshot: CmsSnapshot, product: CmsProduct): CmsSnapshot => ({
  ...snapshot,
  generatedAt: new Date().toISOString(),
  products: snapshot.products
    .map((entry) => (entry.id === product.id ? product : entry))
    .sort((left, right) => new Date(right.modified).getTime() - new Date(left.modified).getTime()),
})
