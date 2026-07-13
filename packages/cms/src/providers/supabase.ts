import { createClient } from '@supabase/supabase-js'
import type {
  CmsRepository,
  CmsSnapshot,
  ContactSubmission,
  Customer,
  Faq,
  NewsletterSubmission,
  Order,
  Payment,
  Product,
  SlugRedirect,
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
  faqs: 'faqs',
  testimonials: 'testimonials',
  // Account profiles live in the `users` table (see docs/decisions.md).
  // The snapshot still exposes them under `customers` as the operational Customer list.
  customers: 'users',
  orders: 'orders',
  payments: 'payments',
  formContact: 'form_contact',
  formNewsletter: 'form_newsletter',
  valueLists: 'value_lists',
  slugRedirects: 'active_slug_redirects',
} as const

const DEFAULT_VALUE_LISTS: ValueLists = {
  grades: [],
  terms: [],
  years: [],
  productKinds: [],
  resourceFormats: [],
  subjects: [],
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

/**
 * Extract rows, tolerating a not-yet-migrated table: a missing relation
 * (PostgREST PGRST205 / Postgres 42P01) yields [] with a warning; any other
 * error is real and rethrown. Used for newer, non-critical tables so a forgotten
 * SQL patch can't break the whole snapshot (and thus the public build).
 */
const tolerateMissingTable = <T>(
  result: { data: unknown; error: { code?: string; message: string } | null },
  label: string,
): T[] => {
  if (result.error) {
    if (result.error.code === 'PGRST205' || result.error.code === '42P01') {
      console.warn(`[cms] ${label} not found — treating as empty. Apply the form-submissions SQL patch.`)
      return []
    }
    throw new Error(result.error.message)
  }
  return (result.data as T[] | null) ?? []
}

const buildStats = (snapshot: Omit<CmsSnapshot, 'stats'>): CmsSnapshot['stats'] => ({
  productCount: snapshot.products.length,
  subjectCount: snapshot.valueLists.subjects.length,
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
      const [products, faqs, testimonials, customers, orders, payments, formContact, formNewsletter, valueLists] =
        await Promise.all([
          client.from(productReadTable).select('*'),
          client.from(TABLES.faqs).select('*'),
          client.from(TABLES.testimonials).select('*'),
          client.from(TABLES.customers).select('*'),
          client.from(TABLES.orders).select('*'),
          client.from(TABLES.payments).select('*'),
          // Admin-only via RLS: returns [] for the public/customer client, rows for admins.
          client.from(TABLES.formContact).select('*'),
          client.from(TABLES.formNewsletter).select('*'),
          client.from(TABLES.valueLists).select('*'),
        ])

      // Core tables must exist; any error is fatal.
      const firstError = [products, faqs, testimonials, customers, orders, payments, valueLists].find((r) => r.error)
      if (firstError?.error) {
        throw new Error(firstError.error.message)
      }

      const base = {
        generatedAt: new Date().toISOString(),
        source: 'supabase',
        valueLists: rowsToValueLists(valueLists.data as ValueListRow[] | null),
        products: ((products.data as Product[] | null) ?? []).map(numberizeProduct),
        faqs: (faqs.data as Faq[] | null) ?? [],
        testimonials: (testimonials.data as Testimonial[] | null) ?? [],
        customers: (customers.data as Customer[] | null) ?? [],
        orders: ((orders.data as Order[] | null) ?? []).map(numberizeOrder),
        payments: ((payments.data as Payment[] | null) ?? []).map(numberizePayment),
        // Admin-only + newer than the core schema: tolerate a not-yet-migrated
        // project so a missing form table never breaks the public web build.
        formContact: tolerateMissingTable<ContactSubmission>(formContact, TABLES.formContact),
        formNewsletter: tolerateMissingTable<NewsletterSubmission>(formNewsletter, TABLES.formNewsletter),
      }
      return { ...base, stats: buildStats(base) }
    },
    async getSlugRedirects() {
      const res = await client.from(TABLES.slugRedirects).select('*')
      if (res.error) {
        // Tolerate a not-yet-migrated project: if the redirects view is absent
        // (PostgREST PGRST205 / Postgres 42P01), there are simply no redirects
        // yet — don't fail the build. Any other error is real and rethrown.
        if (res.error.code === 'PGRST205' || res.error.code === '42P01') {
          console.warn(`[cms] ${TABLES.slugRedirects} not found — treating as no redirects. Apply the slug-redirects SQL patch.`)
          return []
        }
        throw new Error(res.error.message)
      }
      return ((res.data as SlugRedirect[] | null) ?? []).map((row) => ({
        ...row,
        statusCode: Number(row.statusCode) as SlugRedirect['statusCode'],
      }))
    },
    async saveProduct(product: Product) {
      const res = await client.from(TABLES.products).upsert({ ...product, updatedAt: new Date().toISOString() }).select().single()
      if (res.error) throw new Error(res.error.message)
      return res.data as Product
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
