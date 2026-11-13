import { promotionValidation } from '../lib/promotions.ts'
import { customizationRulesValidation, physicalConfigurationValidation, type PhysicalProduct } from '../lib/physical-products.ts'
import { physicalPricingValidation, type PhysicalCatalogProduct, type PhysicalVariantDraft } from '../lib/commerce.ts'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type {
  Bundle,
  CmsRepository,
  CmsSnapshot,
  ContactSubmission,
  Coupon,
  Customer,
  DeletableCollection,
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
  catalogFaqs: 'catalog_faqs',
  testimonials: 'testimonials',
  catalogTestimonials: 'catalog_testimonials',
  // Account profiles live in the `users` table (see docs/decisions.md).
  // The snapshot still exposes them under `customers` as the operational Customer list.
  customers: 'users',
  orders: 'orders',
  payments: 'payments',
  formContact: 'form_contact',
  formNewsletter: 'form_newsletter',
  valueLists: 'value_lists',
  coupons: 'coupons',
  slugRedirects: 'active_slug_redirects',
  physicalCatalog: 'catalog_physical_products',
  commerceContext: 'commerce_public_context',
  physicalVariants: 'product_variants',
  physicalInventory: 'product_inventory',
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

/**
 * What a save may send. The live copy and the flags derived from it belong to
 * public.publish_site_content() alone — the database guard ignores them on
 * write anyway, so leaving them out just keeps a save from shipping a second,
 * stale copy of the record back to the server.
 */
const writable = <T extends { updatedAt: string }>(record: T): T => {
  const { live: _live, published: _published, publishedAt: _publishedAt, ...rest } = record as T & {
    live?: unknown
    published?: unknown
    publishedAt?: unknown
  }
  return stamped(rest as T)
}

/** Admin rows arrive with their live copy attached; nothing downstream reads it. */
const withoutLive = <T>(row: T): T => {
  if (!row || typeof row !== 'object' || !('live' in row)) return row
  const { live: _live, ...rest } = row as T & { live?: unknown }
  return rest as T
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

const numberizeProduct = (product: Product): Product => ({ ...product, priceZar: Number(product.priceZar), salePriceZar: product.salePriceZar == null ? null : Number(product.salePriceZar) })
const numberizePhysicalProduct = (product: PhysicalProduct): PhysicalProduct => ({
  ...product,
  priceZar: Number(product.priceZar),
  salePriceZar: product.salePriceZar == null ? null : Number(product.salePriceZar),
  pricingMode: product.pricingMode ?? 'fixed',
  pricingFieldKey: product.pricingFieldKey ?? null,
  billableCharacters: product.billableCharacters ?? null,
  variantOptions: product.variantOptions ?? [],
  leadTimeDays: product.leadTimeDays ?? null,
  previewTemplate: product.previewTemplate ?? null,
  variants: product.variants?.map((variant) => ({ ...variant, inventoryPolicy: variant.inventoryPolicy ?? 'tracked', _persisted: true, _savedOptionValues: { ...variant.optionValues } })),
})

interface OptionalRows {
  data: unknown
  error: { code?: string; message: string } | null
}

/** Older databases keep digital commerce working until the additive migration is applied. */
const commerceRows = <T>(result: OptionalRows): T[] => {
  if (result.error) {
    if (result.error.code === 'PGRST205' || result.error.code === '42P01') return []
    throw new Error(result.error.message)
  }
  return (result.data as T[] | null) ?? []
}

const numberizePhysicalCatalog = (product: PhysicalCatalogProduct): PhysicalCatalogProduct => ({
  ...product,
  priceZar: Number(product.priceZar),
  salePriceZar: product.salePriceZar == null ? null : Number(product.salePriceZar),
  variants: (product.variants ?? []).map((variant) => ({ ...variant, unitPriceZar: variant.unitPriceZar == null ? null : Number(variant.unitPriceZar) })),
  variantOptions: product.variantOptions ?? [],
  leadTimeDays: product.leadTimeDays ?? null,
  previewTemplate: product.previewTemplate ?? null,
})
const numberizeBundle = (bundle: Bundle): Bundle => ({
  ...bundle,
  priceZar: Number(bundle.priceZar),
  salePriceZar: bundle.salePriceZar == null ? null : Number(bundle.salePriceZar),
  includedProductIds: bundle.includedProductIds ?? [],
  includedProductSlugs: bundle.includedProductSlugs ?? [],
})
const numberizeOrder = (order: Order): Order => ({
  ...order,
  totalZar: Number(order.totalZar),
  subtotalZar: order.subtotalZar == null ? null : Number(order.subtotalZar),
  discountZar: Number(order.discountZar ?? 0),
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

/** Table per deletable collection — see `DeletableCollection` in ../types. */
const DELETABLE_TABLES: Record<DeletableCollection, string> = {
  products: TABLES.products,
  bundles: TABLES.bundles,
  faqs: TABLES.faqs,
  testimonials: TABLES.testimonials,
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
  productCount: snapshot.products.length + (snapshot.physicalProducts?.length ?? 0),
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
  // FAQs and testimonials have no public table policy any more: visitors read
  // the live copies through their catalog views, like products and bundles.
  const faqReadTable = isPublic ? TABLES.catalogFaqs : TABLES.faqs
  const testimonialReadTable = isPublic ? TABLES.catalogTestimonials : TABLES.testimonials

  return {
    mode: 'supabase',
    canWrite: audience === 'admin',
    async getSnapshot() {
      const [products, bundles, faqs, testimonials, customers, orders, payments, formContact, formNewsletter, valueLists, coupons, physicalCatalog, commerceContext, physicalVariants, physicalInventory] =
        await Promise.all([
          client.from(productReadTable).select('*'),
          client.from(bundleReadTable).select(bundleSelect),
          client.from(faqReadTable).select('*'),
          client.from(testimonialReadTable).select('*'),
          // Public catalogue readers have no operational table privileges.
          // Do not request private data and rely on RLS to return empty rows:
          // a fresh database correctly rejects those requests before RLS.
          isPublic ? Promise.resolve({ data: [], error: null }) : client.from(TABLES.customers).select('*'),
          isPublic ? Promise.resolve({ data: [], error: null }) : client.from(TABLES.orders).select('*'),
          isPublic ? Promise.resolve({ data: [], error: null }) : client.from(TABLES.payments).select('*'),
          isPublic ? Promise.resolve({ data: [], error: null }) : client.from(TABLES.formContact).select('*'),
          isPublic ? Promise.resolve({ data: [], error: null }) : client.from(TABLES.formNewsletter).select('*'),
          client.from(TABLES.valueLists).select('*'),
          isPublic ? Promise.resolve({ data: [], error: null }) : client.from(TABLES.coupons).select('*'),
          client.from(TABLES.physicalCatalog).select('*'),
          client.from(TABLES.commerceContext).select('*'),
          isPublic ? Promise.resolve({ data: [], error: null }) : client.from(TABLES.physicalVariants).select('*'),
          isPublic ? Promise.resolve({ data: [], error: null }) : client.from(TABLES.physicalInventory).select('*'),
        ])

      // Core tables must exist; any error is fatal.
      const firstError = [products, bundles, faqs, testimonials, customers, orders, payments, valueLists, coupons].find((r) => r.error)
      if (firstError?.error) {
        throw new Error(firstError.error.message)
      }

      // The existing storefront contract is digital. Physical drafts stay in
      // the same database collection, but must never be treated as resources
      // with grades, download entitlements, or slug-only checkout lines.
      const productRows = (products.data as (Product | PhysicalProduct)[] | null) ?? []
      const digitalProducts = productRows.filter((row): row is Product => row.productType !== 'physical')
      const physicalProducts = productRows.filter((row): row is PhysicalProduct => row.productType === 'physical')
      const contextRows = commerceRows<{ enabled: boolean; localPreview: boolean }>(commerceContext)
      const context = contextRows[0]
      const catalogue = commerceRows<PhysicalCatalogProduct>(physicalCatalog)
      const variants = commerceRows<PhysicalVariantDraft>(physicalVariants)
      const inventory = new Map(commerceRows<{ variantId: string; onHand: number }>(physicalInventory).map((entry) => [entry.variantId, Number(entry.onHand)]))

      const base = {
        generatedAt: new Date().toISOString(),
        source: 'supabase',
        ...(isPublic ? {} : { coupons: ((coupons.data as Coupon[] | null) ?? []).map((row) => ({ ...row, value: Number(row.value) })) }),
        ...(isPublic ? {} : { physicalProducts: physicalProducts.map((row) => ({
          ...numberizePhysicalProduct(withoutLive(row)),
          variants: variants.filter((variant) => variant.productId === row.id).map((variant) => ({
            ...withoutLive(variant),
            _persisted: true,
            _savedOptionValues: { ...variant.optionValues },
            inventoryPolicy: variant.inventoryPolicy ?? 'tracked',
            unitPriceZar: variant.unitPriceZar == null ? null : Number(variant.unitPriceZar),
            onHand: inventory.get(variant.id) ?? 0,
          })),
        })) }),
        physicalCatalog: context?.enabled === true ? catalogue.map(numberizePhysicalCatalog) : [],
        commerceReady: !commerceContext.error && !physicalCatalog.error,
        localCommercePreview: context?.enabled === true && context.localPreview === true,
        valueLists: rowsToValueLists(valueLists.data as ValueListRow[] | null),
        products: digitalProducts.map((row) => numberizeProduct(withoutLive(row))),
        bundles: (bundles.data ?? []).map((row) => numberizeBundle(toBundle(withoutLive(row as unknown as BundleRow)))),
        faqs: ((faqs.data as Faq[] | null) ?? []).map(withoutLive),
        testimonials: ((testimonials.data as Testimonial[] | null) ?? []).map(withoutLive),
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
    /**
     * Deletes by id, then verifies. `.select()` on a delete returns the rows
     * that were actually removed, which is the only way to tell a successful
     * delete from one row-level security quietly refused — an RLS denial on
     * DELETE sets no error and reports no rows.
     */
    async deleteRecords(collection: DeletableCollection, ids: string[]) {
      if (ids.length === 0) return
      const table = DELETABLE_TABLES[collection]
      const res = await client.from(table).delete().in('id', ids).select('id')
      if (res.error) throw new Error(res.error.message)
      const removed = (res.data as { id: string }[] | null)?.length ?? 0
      if (removed !== ids.length) {
        throw new Error(
          `Deleted ${removed} of ${ids.length} ${collection}. The rest were already gone, ` +
            'or this account is not allowed to delete them.',
        )
      }
    },

    async saveProduct(product: Product) {
      if ((product as { productType?: unknown }).productType === 'physical') {
        throw new Error('Physical drafts must use savePhysicalProduct.')
      }
      const problem = promotionValidation('products', product as unknown as Record<string, unknown>)
      if (problem) throw new Error(problem)
      const res = await client.from(TABLES.products).upsert(writable(product)).select().single()
      if (res.error) throw new Error(res.error.message)
      return withoutLive(res.data as Product)
    },

    async savePhysicalProduct(product: PhysicalProduct) {
      if (product.productType !== 'physical') throw new Error('A physical product type is required.')
      const problem = customizationRulesValidation(product.customizationRules)
        ?? physicalConfigurationValidation(product.variantOptions ?? [], product.customizationRules, product.pricingFieldKey)
        ?? physicalPricingValidation(product)
        ?? promotionValidation('products', product as unknown as Record<string, unknown>)
      if (problem) throw new Error(problem)
      const { variants = [], ...record } = product
      const res = await client.rpc('save_physical_product', { p_product: writable(record), p_variants: variants })
      if (res.error) throw new Error(res.error.message)
      return numberizePhysicalProduct(withoutLive(res.data as PhysicalProduct))
    },

    /**
     * Two writes, deliberately ordered: the bundle row first, then its
     * membership through set_bundle_products (which replaces the whole set in
     * one statement pair). The row must exist before members can reference it.
     * Derived read-only fields never go back to the server.
     */
    async saveBundle(bundle: Bundle) {
      const problem = promotionValidation('bundles', bundle as unknown as Record<string, unknown>)
      if (problem) throw new Error(problem)
      const { includedProductIds, includedProductSlugs, ...row } = bundle
      const res = await client.from(TABLES.bundles).upsert(writable(row as Bundle)).select().single()
      if (res.error) throw new Error(res.error.message)

      const { error: membershipError } = await client.rpc('set_bundle_products', {
        p_bundle_id: bundle.id,
        p_product_ids: includedProductIds ?? [],
      })
      if (membershipError) throw new Error(membershipError.message)

      return numberizeBundle({
        ...withoutLive(res.data as Bundle),
        includedProductIds: includedProductIds ?? [],
        includedProductSlugs: includedProductSlugs ?? [],
      })
    },
    async saveCoupon(coupon: Coupon) {
      const problem = promotionValidation('coupons', coupon as unknown as Record<string, unknown>)
      if (problem) throw new Error(problem)
      const row = stamped({ ...coupon, code: coupon.code.trim().toUpperCase() })
      const res = await client.from(TABLES.coupons).upsert(row).select().single()
      if (res.error) throw new Error(res.error.message)
      return { ...res.data, value: Number(res.data.value) } as Coupon
    },
    async saveFaq(faq: Faq) {
      const res = await client.from(TABLES.faqs).upsert(writable(faq)).select().single()
      if (res.error) throw new Error(res.error.message)
      return withoutLive(res.data as Faq)
    },
    async saveTestimonial(testimonial: Testimonial) {
      const res = await client.from(TABLES.testimonials).upsert(writable(testimonial)).select().single()
      if (res.error) throw new Error(res.error.message)
      return withoutLive(res.data as Testimonial)
    },
  }
}
