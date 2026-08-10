import type { Grade, Product, ProductFile } from '@designing-minds/cms/types'
import { resourceUnlockedByBundle } from '@designing-minds/cms/entitlements'
import { badRequest, ok, serverError, unauthorized, type Handler } from '../lib/http.ts'
import { requireUser } from '../lib/auth.ts'
import { createServiceClient } from '../lib/supabase.ts'
import { createSupabaseStorageProvider } from '../lib/storage.ts'

interface DownloadInput {
  orderId: string
  fileId: string
}

interface OrderRow {
  id: string
  customerId: string
  status: string
  items: { productSlug: string; grade?: Grade }[]
}

/** A bundle plus its member resources, as embedded by PostgREST. */
interface BundleRow {
  id: string
  slug: string
  bundle_products: { products: Product | null }[] | null
}

function isDownloadInput(value: unknown): value is DownloadInput {
  const v = value as DownloadInput
  return typeof value === 'object' && value !== null && typeof v.orderId === 'string' && typeof v.fileId === 'string'
}

const findFile = (products: Product[], fileId: string): ProductFile | null => {
  for (const product of products) {
    const file = product.purchasedFiles.find((entry) => entry.id === fileId)
    if (file) return file
  }
  return null
}

export const issueDownload: Handler = async (req) => {
  if (req.method !== 'POST') return badRequest('Use POST.')
  if (!isDownloadInput(req.body)) return badRequest('Expected { orderId, fileId }.')

  let user
  try {
    user = await requireUser(req.headers)
  } catch (error) {
    return unauthorized(error instanceof Error ? error.message : 'Authentication required.')
  }

  try {
    const supabase = createServiceClient()
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id,customerId,status,items')
      .eq('id', req.body.orderId)
      .maybeSingle<OrderRow>()
    if (orderError) throw new Error(orderError.message)
    // Treat "not found" and "not yours" identically so order ids can't be enumerated.
    if (!order || order.customerId !== user.id) return unauthorized('This order is not available on your account.')
    if (!['paid', 'fulfilled'].includes(order.status)) return unauthorized('Downloads unlock once payment succeeds.')

    // An order line is a slug in the shared /shop space; it may name either
    // Collection, so both are resolved.
    const slugs = [...new Set(order.items.map((item) => item.productSlug))]

    const [purchasedProducts, purchasedBundles] = await Promise.all([
      supabase.from('products').select('*').in('slug', slugs),
      // Membership is embedded, so a bundle's contents come back with it and
      // no full-catalogue scan is needed. Unpublished bundles resolve too:
      // retired Access Plans still owe their buyers downloads.
      supabase.from('bundles').select('id,slug,bundle_products(products(*))').in('slug', slugs),
    ])
    if (purchasedProducts.error) throw new Error(purchasedProducts.error.message)
    if (purchasedBundles.error) throw new Error(purchasedBundles.error.message)

    const entitled = new Map<string, Product>()
    for (const product of (purchasedProducts.data ?? []) as Product[]) {
      entitled.set(product.slug, product)
    }

    // PostgREST types a nested embed loosely, so the shape is asserted once here.
    for (const row of (purchasedBundles.data ?? []) as unknown as BundleRow[]) {
      const members = (row.bundle_products ?? [])
        .map((member) => member.products)
        .filter((product): product is Product => Boolean(product))

      // Route through the shared rule rather than trusting the join directly,
      // so the account UI and this endpoint can never drift apart.
      const bundle = { includedProductSlugs: members.map((member) => member.slug) }
      for (const member of members) {
        if (resourceUnlockedByBundle(bundle, member)) entitled.set(member.slug, member)
      }
    }

    const file = findFile([...entitled.values()], req.body.fileId)
    if (!file) return unauthorized('This file is not available on your order.')
    if (!file.storageKey) throw new Error('Product file is missing a storage key.')

    const storage = createSupabaseStorageProvider()
    const expiresInSeconds = 300
    const url = await storage.getSignedDownloadUrl(file.storageKey, expiresInSeconds, file.filename)
    return ok({ url, expiresInSeconds, filename: file.filename })
  } catch (error) {
    console.error('issue-download failed:', error instanceof Error ? error.message : error)
    return serverError('Unable to issue download.')
  }
}
