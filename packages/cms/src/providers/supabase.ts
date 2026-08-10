import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type {
  CmsRepository,
  CmsSnapshot,
  ContactSubmission,
  Customer,
  Bundle,
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
  client?: SupabaseClient
  audience: 'public' | 'admin'
}

const TABLES = {
  products: 'products',
  catalogProducts: 'catalog_products',
  bundles: 'bundles',
  catalogBundles: 'catalog_bundles',
  bundleProducts: 'bundle_products',
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
  resourceFormats: [],
  subjects: [],
}

/**
 * Stamp a record's `updatedAt` at save time. The database has a
 * `set_updated_at` trigger on every editable table, but that only fires on
 * UPDATE — and a blank `updatedAt` on a freshly created record is not a valid
 * timestamptz. Stamping here makes both paths explicit and gives the caller
 * back a record it can immediately compare against the deployed site's content
 * timestamp (see the admin's publish state).
 */
const stamped = <T extends { updatedAt: string }>(record: T): T => ({
  ...record,
  updatedAt: new Date().toISOString(),
})

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
const numberizeBundle = (bundle: Bundle): Bundle => ({
  ...bundle,
  priceZar: Number(bundle.priceZar),
  includedProductIds: bundle.includedProductIds ?? [],
  includedProductSlugs: bundle.includedProductSlugs ?? [],
})
const numberizeOrder = (order: Order): Order => ({
  ...order,
  totalZar: Number(order.totalZar),
  items: order.items.map((item) => ({ ...item, priceZar: Number(item.priceZar) })),
})
const numberizePayment = (payment: Payment): Payment => ({ ...payment, amountZar: Number(payment.amountZar) })

/**
 * A bundle row as read from either source.
 *
 * `catalog_bundles` aggregates membership into arrays and hides unpublished
 * members; the base table needs the embedded join rows. Normalising here means
 * everything downstream sees one `Bundle` shape regardless of audience.
 */
type BundleRow = Omit<Bundle, 'includedProductIds' | 'includedProductSlugs'> & {
  includedProductIds?: string[] | null
  includedProductSlugs?: string[] | null
  bundle_products?: { sortOrder: number; products: { id: string; slug: string } | null }[] | null
}

const toBundle = (row: BundleRow): Bundle => {
  const { bundle_products: members, ...bundle } = row
  if (!members) {
    return {
      ...bundle,
      includedProductIds: row.includedProductIds ?? [],
      includedProductSlugs: row.includedProductSlugs ?? [],
    }
  }
  const ordered = members
    .filter((member): member is { sortOrder: number; products: { id: string; slug: string } } => Boolean(member.products))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.products.slug.localeCompare(b.products.slug))
  return {
    ...bundle,
    includedProductIds: ordered.map((member) => member.products.id),
    includedProductSlugs: ordered.map((member) => member.products.slug),
  }
}

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
  bundleCount: snapshot.bundles.length,
  orderCount: snapshot.orders.length,
  customerCount: snapshot.customers.length,
})

/**
 * Shared-content provider. Reads the documented collections + operational
 * records from Supabase tables. Browser clients use the publishable key plus the
 * stored Supabase session, so RLS determines whether operational rows and
 * catalogue writes are available.
 */
export const createSupabaseRepository = ({ url, publishableKey, client: providedClient, audience }: SupabaseRepositoryOptions): CmsRepository => {
  // Browser apps inject their auth client so repository reads share the same
  // session and storage lock. Build-time callers can still create an isolated
  // client from URL + publishable key.
  const client = providedClient ?? createClient(url, publishableKey)
  const isPublic = audience === 'public'
  const productReadTable = isPublic ? TABLES.catalogProducts : TABLES.products

  // The public view aggregates membership for us and hides unpublished
  // members. The admin needs the real, complete membership, so it reads the
  // base table and embeds the join rows.
  const bundleReadTable = isPublic ? TABLES.catalogBundles : TABLES.bundles
  const bundleSelect = isPublic ? '*' : `*, ${TABLES.bundleProducts}(sortOrder, products(id, slug))`

  return {
    mode: 'supabase',
    canWrite: audience === 'admin',
    async getSnapshot() {
      const [products, bundles, faqs, testimonials, customers, orders, payments, formContact, formNewsletter, valueLists] =
        await Promise.all([
          client.from(productReadTable).select('*'),
          client.from(bundleReadTable).select(bundleSelect),
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
      const firstError = [products, bundles, faqs, testimonials, customers, orders, payments, valueLists].find((r) => r.error)
      if (firstError?.error) {
        throw new Error(firstError.error.message)
      }

      const base = {
        generatedAt: new Date().toISOString(),
        source: 'supabase',
        valueLists: rowsToValueLists(valueLists.data as ValueListRow[] | null),
        products: ((products.data as Product[] | null) ?? []).map(numberizeProduct),
        bundles: (bundles.data ?? []).map((row) => numberizeBundle(toBundle(row as unknown as BundleRow))),
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
      const res = await client.from(TABLES.products).upsert(stamped(product)).select().single()
      if (res.error) throw new Error(res.error.message)
      return res.data as Product
    },

    /**
     * Two writes, deliberately ordered: the bundle row first, then its
     * membership through set_bundle_products (which replaces the whole set in
     * one statement pair). The row must exist before members can reference it.
     * Derived read-only fields never go back to the server.
     */
    async saveBundle(bundle: Bundle) {
      const { includedProductIds, includedProductSlugs, ...row } = bundle
      const res = await client.from(TABLES.bundles).upsert(stamped(row as Bundle)).select().single()
      if (res.error) throw new Error(res.error.message)

      const { error: membershipError } = await client.rpc('set_bundle_products', {
        p_bundle_id: bundle.id,
        p_product_ids: includedProductIds ?? [],
      })
      if (membershipError) throw new Error(membershipError.message)

      return numberizeBundle({
        ...(res.data as Bundle),
        includedProductIds: includedProductIds ?? [],
        includedProductSlugs: includedProductSlugs ?? [],
      })
    },
    async saveFaq(faq: Faq) {
      const res = await client.from(TABLES.faqs).upsert(stamped(faq)).select().single()
      if (res.error) throw new Error(res.error.message)
      return res.data as Faq
    },
    async saveTestimonial(testimonial: Testimonial) {
      const res = await client.from(TABLES.testimonials).upsert(stamped(testimonial)).select().single()
      if (res.error) throw new Error(res.error.message)
      return res.data as Testimonial
    },
  }
}
