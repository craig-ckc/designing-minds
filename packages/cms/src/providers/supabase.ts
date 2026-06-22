import { createClient } from '@supabase/supabase-js'
import { cloneSnapshot } from '../lib/formatters'
import { fixtureSnapshot } from '../fixtures'
import type {
  CmsRepository,
  CmsSnapshot,
  Customer,
  Faq,
  Order,
  Payment,
  Product,
  Subject,
  Testimonial,
} from '../types'

interface SupabaseRepositoryOptions {
  url: string
  anonKey: string
}

const TABLES = {
  products: 'products',
  subjects: 'subjects',
  faqs: 'faqs',
  testimonials: 'testimonials',
  customers: 'customers',
  orders: 'orders',
  payments: 'payments',
} as const

const buildStats = (snapshot: Omit<CmsSnapshot, 'stats'>): CmsSnapshot['stats'] => ({
  productCount: snapshot.products.length,
  subjectCount: snapshot.subjects.length,
  gradeCount: snapshot.valueLists.grades.length,
  bundleCount: snapshot.products.filter((p) => p.productKind === 'Bundle').length,
  accessPlanCount: snapshot.products.filter((p) => p.productKind === 'Access Plan').length,
  orderCount: snapshot.orders.length,
  customerCount: snapshot.customers.length,
})

/**
 * Shared-content provider. Reads the documented collections + operational
 * records from Supabase tables; value lists come from the wireframe fixtures
 * until a value-list table exists. Not exercised by the wireframe (web
 * defaults to seed, admin to local), but kept type-correct.
 */
export const createSupabaseRepository = ({ url, anonKey }: SupabaseRepositoryOptions): CmsRepository => {
  const client = createClient(url, anonKey)

  return {
    mode: 'supabase',
    canWrite: true,
    async getSnapshot() {
      const [products, subjects, faqs, testimonials, customers, orders, payments] = await Promise.all([
        client.from(TABLES.products).select('*'),
        client.from(TABLES.subjects).select('*'),
        client.from(TABLES.faqs).select('*'),
        client.from(TABLES.testimonials).select('*'),
        client.from(TABLES.customers).select('*'),
        client.from(TABLES.orders).select('*'),
        client.from(TABLES.payments).select('*'),
      ])

      const firstError = [products, subjects, faqs, testimonials, customers, orders, payments].find((r) => r.error)
      if (firstError?.error) {
        throw new Error(firstError.error.message)
      }

      const base = {
        generatedAt: new Date().toISOString(),
        source: 'supabase',
        valueLists: fixtureSnapshot.valueLists,
        products: (products.data as Product[] | null) ?? [],
        subjects: (subjects.data as Subject[] | null) ?? [],
        faqs: (faqs.data as Faq[] | null) ?? [],
        testimonials: (testimonials.data as Testimonial[] | null) ?? [],
        customers: (customers.data as Customer[] | null) ?? [],
        orders: (orders.data as Order[] | null) ?? [],
        payments: (payments.data as Payment[] | null) ?? [],
      }
      return { ...base, stats: buildStats(base) }
    },
    async saveProduct(product: Product) {
      const res = await client.from(TABLES.products).upsert({ ...product, updatedAt: new Date().toISOString() }).select().single()
      if (res.error) throw new Error(res.error.message)
      return res.data as Product
    },
    async saveSubject(subject: Subject) {
      const res = await client.from(TABLES.subjects).upsert(subject).select().single()
      if (res.error) throw new Error(res.error.message)
      return res.data as Subject
    },
    async saveFaq(faq: Faq) {
      const res = await client.from(TABLES.faqs).upsert(faq).select().single()
      if (res.error) throw new Error(res.error.message)
      return res.data as Faq
    },
    async saveTestimonial(testimonial: Testimonial) {
      const res = await client.from(TABLES.testimonials).upsert(testimonial).select().single()
      if (res.error) throw new Error(res.error.message)
      return res.data as Testimonial
    },
    async reset() {
      const seed = cloneSnapshot(fixtureSnapshot)
      const results = await Promise.all([
        client.from(TABLES.products).upsert(seed.products),
        client.from(TABLES.subjects).upsert(seed.subjects),
        client.from(TABLES.faqs).upsert(seed.faqs),
        client.from(TABLES.testimonials).upsert(seed.testimonials),
      ])
      const failed = results.find((r) => r.error)
      if (failed?.error) throw new Error(failed.error.message)
    },
  }
}
