import { createClient } from '@supabase/supabase-js'
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
  ValueLists,
} from '../types'

interface SupabaseRepositoryOptions {
  url: string
  publishableKey: string
  audience: 'public' | 'admin'
}

const TABLES = {
  products: 'products',
  catalogProducts: 'catalog_products',
  subjects: 'subjects',
  faqs: 'faqs',
  testimonials: 'testimonials',
  // Account profiles live in the `users` table (renamed from `customers`, ADR 0006).
  // The snapshot still exposes them under `customers` as the operational Customer list.
  customers: 'users',
  orders: 'orders',
  payments: 'payments',
  valueLists: 'value_lists',
} as const

const DEFAULT_VALUE_LISTS: ValueLists = {
  grades: [],
  terms: [],
  years: [],
  productKinds: [],
  resourceFormats: [],
}

interface ValueListRow {
  key: keyof ValueLists
  values: string[]
}

const rowsToValueLists = (rows: ValueListRow[] | null): ValueLists =>
  (rows ?? []).reduce<ValueLists>(
    (lists, row) => ({
      ...lists,
      [row.key]: row.values,
    }),
    DEFAULT_VALUE_LISTS,
  ) as ValueLists

const numberizeProduct = (product: Product): Product => ({ ...product, priceZar: Number(product.priceZar) })
const numberizeOrder = (order: Order): Order => ({
  ...order,
  totalZar: Number(order.totalZar),
  items: order.items.map((item) => ({ ...item, priceZar: Number(item.priceZar) })),
})
const numberizePayment = (payment: Payment): Payment => ({ ...payment, amountZar: Number(payment.amountZar) })

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
 * records from Supabase tables. Browser clients use the publishable key plus the
 * stored Supabase session, so RLS determines whether operational rows and
 * catalogue writes are available.
 */
export const createSupabaseRepository = ({ url, publishableKey, audience }: SupabaseRepositoryOptions): CmsRepository => {
  const client = createClient(url, publishableKey)
  const productReadTable = audience === 'public' ? TABLES.catalogProducts : TABLES.products

  return {
    mode: 'supabase',
    canWrite: audience === 'admin',
    async getSnapshot() {
      const [products, subjects, faqs, testimonials, customers, orders, payments, valueLists] = await Promise.all([
        client.from(productReadTable).select('*'),
        client.from(TABLES.subjects).select('*'),
        client.from(TABLES.faqs).select('*'),
        client.from(TABLES.testimonials).select('*'),
        client.from(TABLES.customers).select('*'),
        client.from(TABLES.orders).select('*'),
        client.from(TABLES.payments).select('*'),
        client.from(TABLES.valueLists).select('*'),
      ])

      const firstError = [products, subjects, faqs, testimonials, customers, orders, payments, valueLists].find((r) => r.error)
      if (firstError?.error) {
        throw new Error(firstError.error.message)
      }

      const base = {
        generatedAt: new Date().toISOString(),
        source: 'supabase',
        valueLists: rowsToValueLists(valueLists.data as ValueListRow[] | null),
        products: ((products.data as Product[] | null) ?? []).map(numberizeProduct),
        subjects: (subjects.data as Subject[] | null) ?? [],
        faqs: (faqs.data as Faq[] | null) ?? [],
        testimonials: (testimonials.data as Testimonial[] | null) ?? [],
        customers: (customers.data as Customer[] | null) ?? [],
        orders: ((orders.data as Order[] | null) ?? []).map(numberizeOrder),
        payments: ((payments.data as Payment[] | null) ?? []).map(numberizePayment),
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
  }
}
