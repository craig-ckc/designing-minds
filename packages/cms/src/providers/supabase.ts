import { createClient } from '@supabase/supabase-js'
import { seedSnapshot } from '../generated/seed'
import type { CmsPage, CmsProduct, CmsRepository, CmsSnapshot } from '../types'

interface SupabaseRepositoryOptions {
  url: string
  anonKey: string
}

const PAGES_TABLE = 'cms_pages'
const PRODUCTS_TABLE = 'cms_products'

const buildSnapshot = (pages: CmsPage[], products: CmsProduct[]): CmsSnapshot => {
  const filters = {
    grades: [...new Set(products.map((product) => product.grade))].sort((left, right) =>
      left.localeCompare(right, undefined, { numeric: true }),
    ),
    terms: [...new Set(products.map((product) => product.term))].sort((left, right) =>
      left.localeCompare(right, undefined, { numeric: true }),
    ),
    subjects: [...new Set(products.flatMap((product) => product.subjects))].sort(),
    productTypes: [...new Set(products.map((product) => product.type))].sort(),
  }

  return {
    ...seedSnapshot,
    generatedAt: new Date().toISOString(),
    filters,
    stats: {
      pageCount: pages.length,
      productCount: products.length,
      gradeCount: filters.grades.length,
      subjectCount: filters.subjects.length,
    },
    pages,
    products,
  }
}

export const createSupabaseRepository = ({
  url,
  anonKey,
}: SupabaseRepositoryOptions): CmsRepository => {
  const client = createClient(url, anonKey)

  return {
    mode: 'supabase',
    canWrite: true,
    async getSnapshot() {
      const [pagesResponse, productsResponse] = await Promise.all([
        client.from(PAGES_TABLE).select('*').order('menuOrder').order('title'),
        client.from(PRODUCTS_TABLE).select('*').order('modified', { ascending: false }),
      ])

      if (pagesResponse.error || productsResponse.error) {
        throw new Error(pagesResponse.error?.message || productsResponse.error?.message || 'Unable to load CMS data from Supabase.')
      }

      const pages = (pagesResponse.data as CmsPage[] | null) ?? []
      const products = (productsResponse.data as CmsProduct[] | null) ?? []
      return buildSnapshot(pages, products)
    },
    async savePage(page: CmsPage) {
      const payload = { ...page, modified: new Date().toISOString() }
      const response = await client.from(PAGES_TABLE).upsert(payload).select().single()
      if (response.error) {
        throw new Error(response.error.message)
      }
      return response.data as CmsPage
    },
    async saveProduct(product: CmsProduct) {
      const payload = {
        ...product,
        modified: new Date().toISOString(),
        priceLabel: `R${product.priceZar.toLocaleString('en-ZA')}`,
      }
      const response = await client.from(PRODUCTS_TABLE).upsert(payload).select().single()
      if (response.error) {
        throw new Error(response.error.message)
      }
      return response.data as CmsProduct
    },
    async reset() {
      const pageRows = seedSnapshot.pages.map((page) => ({
        ...page,
      }))
      const productRows = seedSnapshot.products.map((product) => ({
        ...product,
      }))

      const pageResult = await client.from(PAGES_TABLE).upsert(pageRows)
      const productResult = await client.from(PRODUCTS_TABLE).upsert(productRows)

      if (pageResult.error || productResult.error) {
        throw new Error(pageResult.error?.message || productResult.error?.message || 'Unable to reset Supabase content.')
      }
    },
  }
}
