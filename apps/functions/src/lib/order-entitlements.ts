import type { ProductFile } from '@designing-minds/cms/types'
import { resourceUnlockedByBundle } from '@designing-minds/cms/entitlements'
import type { createServiceClient } from './supabase.ts'

/**
 * Which resources each line of a paid order unlocks.
 *
 * Order lines are JSON snapshots. Lines written since 2026-11-12 carry the
 * product or bundle id; older lines only carry the slug they were bought
 * under, and a slug can change afterwards. A legacy slug is therefore read
 * through the slug history (`slug_redirects`):
 *
 *   1. an explicit `productId` / `bundleId` on the line wins;
 *   2. a redirect away from the slug that was created AFTER the order means
 *      the bought item was renamed later, so the redirect's entity is the one;
 *   3. otherwise the record currently using the slug;
 *   4. otherwise a redirect's entity (renamed, and the slug never reused).
 *
 * Files come from the published copy when there is one, so a draft file
 * replacement never reaches buyers; a record with no live copy (archived after
 * purchase) still serves its working files, because buyers keep what they paid
 * for.
 */

type Client = ReturnType<typeof createServiceClient>

export interface EntitlementOrderLine {
  productSlug: string
  productId?: string
  bundleId?: string
  productType?: string
  productKind?: string
}

export interface EntitlementOrder {
  items: EntitlementOrderLine[]
  placedAt?: string | null
}

/** A product row as read with the service key: the working copy plus its live copy. */
export interface EntitledProduct {
  id?: string
  slug: string
  title?: string
  purchasedFiles: ProductFile[]
  live?: { title?: string; purchasedFiles?: ProductFile[] } | null
}

interface BundleRow {
  id: string
  slug: string
  bundle_products: { products: EntitledProduct | null }[] | null
}

interface RedirectRow {
  entityType: 'product' | 'bundle'
  entityId: string | null
  fromPath: string
  createdAt: string | null
}

export interface LineEntitlement {
  /** Position of the line in `order.items`. */
  index: number
  products: EntitledProduct[]
}

/** The only product columns an entitlement check needs (no descriptions, SEO or gallery). */
export const ENTITLEMENT_PRODUCT_COLUMNS = 'id,slug,title,purchasedFiles,live'
const BUNDLE_COLUMNS = `id,slug,bundle_products(products(${ENTITLEMENT_PRODUCT_COLUMNS}))`

export const isDigitalOrderLine = (line: EntitlementOrderLine): boolean =>
  line.productType !== 'physical' && line.productKind !== 'Physical'

/** The files a buyer is served: the PUBLISHED ones, or the working ones when nothing is live. */
export const servedFiles = (product: EntitledProduct): ProductFile[] => product.live?.purchasedFiles ?? product.purchasedFiles ?? []

export const servedTitle = (product: EntitledProduct): string => product.live?.title ?? product.title ?? product.slug

const shopPath = (slug: string) => `/shop/${slug}`

type Target =
  | { kind: 'product'; id?: string; row?: EntitledProduct }
  | { kind: 'bundle'; id?: string; row?: BundleRow }

function chooseLegacyTarget(placedAt: number, redirect: RedirectRow | undefined, direct: Target | undefined): Target | undefined {
  const renamedLater = redirect?.entityId && redirect.createdAt && Number.isFinite(placedAt) && placedAt < Date.parse(redirect.createdAt)
  if (redirect?.entityId && (renamedLater || !direct)) return { kind: redirect.entityType, id: redirect.entityId }
  if (direct) return direct
  return undefined
}

async function rows<T>(query: PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<T[]> {
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as T[]
}

/**
 * Slug history improves matching but must never block a download: if it
 * cannot be read (missing grant, older database), match by slug as before.
 */
async function optionalRows<T>(query: PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<T[]> {
  try {
    const { data, error } = await query
    return error ? [] : (data ?? []) as T[]
  } catch {
    return []
  }
}

export async function resolveOrderEntitlements(supabase: Client, order: EntitlementOrder): Promise<LineEntitlement[]> {
  const lines = order.items.map((line, index) => ({ line, index })).filter(({ line }) => isDigitalOrderLine(line))
  const placedAt = order.placedAt ? Date.parse(order.placedAt) : Number.NaN

  const legacySlugs = [...new Set(lines.filter(({ line }) => !line.productId && !line.bundleId).map(({ line }) => line.productSlug))]
  const [redirects, slugProducts, slugBundles] = legacySlugs.length
    ? await Promise.all([
      optionalRows<RedirectRow>(supabase.from('slug_redirects').select('entityType,entityId,fromPath,createdAt').in('fromPath', legacySlugs.map(shopPath))),
      rows<EntitledProduct>(supabase.from('products').select(ENTITLEMENT_PRODUCT_COLUMNS).in('slug', legacySlugs)),
      rows<BundleRow>(supabase.from('bundles').select(BUNDLE_COLUMNS).in('slug', legacySlugs)),
    ])
    : [[], [], []]

  const targets = new Map<number, Target>()
  for (const { line, index } of lines) {
    if (line.productId) { targets.set(index, { kind: 'product', id: line.productId }); continue }
    if (line.bundleId) { targets.set(index, { kind: 'bundle', id: line.bundleId }); continue }
    const product = slugProducts.find((row) => row.slug === line.productSlug)
    const bundle = slugBundles.find((row) => row.slug === line.productSlug)
    const direct: Target | undefined = product ? { kind: 'product', id: product.id, row: product } : bundle ? { kind: 'bundle', id: bundle.id, row: bundle } : undefined
    const redirect = redirects.find((row) => row.fromPath === shopPath(line.productSlug))
    const target = chooseLegacyTarget(placedAt, redirect, direct)
    if (target) targets.set(index, target)
  }

  const knownProducts = new Map(slugProducts.filter((row) => row.id).map((row) => [row.id!, row]))
  const knownBundles = new Map(slugBundles.map((row) => [row.id, row]))
  const missingIds = (kind: Target['kind'], known: Map<string, unknown>) =>
    [...new Set([...targets.values()].filter((t) => t.kind === kind && !t.row && t.id && !known.has(t.id)).map((t) => t.id!))]
  const missingProductIds = missingIds('product', knownProducts)
  const missingBundleIds = missingIds('bundle', knownBundles)
  const [byIdProducts, byIdBundles] = await Promise.all([
    missingProductIds.length ? rows<EntitledProduct>(supabase.from('products').select(ENTITLEMENT_PRODUCT_COLUMNS).in('id', missingProductIds)) : Promise.resolve([]),
    missingBundleIds.length ? rows<BundleRow>(supabase.from('bundles').select(BUNDLE_COLUMNS).in('id', missingBundleIds)) : Promise.resolve([]),
  ])
  for (const row of byIdProducts) if (row.id) knownProducts.set(row.id, row)
  for (const row of byIdBundles) knownBundles.set(row.id, row)

  return lines.map(({ index }) => {
    const target = targets.get(index)
    if (!target) return { index, products: [] }
    if (target.kind === 'product') {
      const product = target.row ?? (target.id ? knownProducts.get(target.id) : undefined)
      return { index, products: product ? [product] : [] }
    }
    const bundle = target.row ?? (target.id ? knownBundles.get(target.id) : undefined)
    if (!bundle) return { index, products: [] }
    // PostgREST types a nested embed loosely; route membership through the
    // shared rule so the account UI and the download gate cannot drift apart.
    const members = (bundle.bundle_products ?? []).map((member) => member.products).filter((product): product is EntitledProduct => Boolean(product))
    const rule = { includedProductSlugs: members.map((member) => member.slug) }
    return { index, products: members.filter((member) => resourceUnlockedByBundle(rule, member)) }
  })
}

/** Order statuses whose digital lines have been paid for. */
export const DOWNLOADABLE_ORDER_STATUSES = ['paid', 'fulfilled', 'payment_review'] as const
export const isDownloadableOrderStatus = (status: string): boolean => (DOWNLOADABLE_ORDER_STATUSES as readonly string[]).includes(status)
