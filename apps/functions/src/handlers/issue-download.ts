import type { Product, ProductFile } from '@designing-minds/cms/types'
import { badRequest, ok, serverError, unauthorized, type Handler } from '../lib/http.ts'
import { requireVerifiedUser } from '../lib/auth.ts'
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
  items: { productSlug: string }[]
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
    user = await requireVerifiedUser(req.headers)
  } catch (error) {
    return unauthorized(error instanceof Error ? error.message : 'Authentication required.')
  }

  try {
    const supabase = createServiceClient()
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id,customerId,status,items')
      .eq('id', req.body.orderId)
      .single<OrderRow>()
    if (orderError) throw new Error(orderError.message)
    if (order.customerId !== user.id) return unauthorized('This order is not available on your account.')
    if (!['paid', 'fulfilled'].includes(order.status)) return unauthorized('Downloads unlock once payment succeeds.')

    const productSlugs = [...new Set(order.items.map((item) => item.productSlug))]
    const { data: products, error: productsError } = await supabase.from('products').select('*').in('slug', productSlugs)
    if (productsError) throw new Error(productsError.message)

    const file = findFile((products ?? []) as Product[], req.body.fileId)
    if (!file) return unauthorized('This file is not available on your order.')
    if (!file.storageKey) throw new Error('Product file is missing a storage key.')

    const storage = createSupabaseStorageProvider()
    const expiresInSeconds = 300
    const url = await storage.getSignedDownloadUrl(file.storageKey, expiresInSeconds, file.filename)
    return ok({ url, expiresInSeconds, filename: file.filename })
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Unable to issue download.')
  }
}
