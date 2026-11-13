import { logEvent } from '../lib/diagnostics.ts'
import type { ProductFile } from '@designing-minds/cms/types'
import { badRequest, ok, serverError, unauthorized, type Handler } from '../lib/http.ts'
import { requireUser } from '../lib/auth.ts'
import { createServiceClient } from '../lib/supabase.ts'
import { createSupabaseStorageProvider } from '../lib/storage.ts'
import { isDownloadableOrderStatus, resolveOrderEntitlements, servedFiles, type EntitlementOrderLine } from '../lib/order-entitlements.ts'

interface DownloadInput {
  orderId: string
  fileId: string
}

interface OrderRow {
  id: string
  customerId: string
  status: string
  placedAt?: string | null
  items: EntitlementOrderLine[]
}

function isDownloadInput(value: unknown): value is DownloadInput {
  const v = value as DownloadInput
  return typeof value === 'object' && value !== null && typeof v.orderId === 'string' && typeof v.fileId === 'string'
}

export const issueDownload: Handler = async (req) => {
  if (req.method !== 'POST') return badRequest('Use POST.')
  if (!isDownloadInput(req.body)) return badRequest('Expected { orderId, fileId }.')
  const { orderId, fileId } = req.body

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
      .select('id,customerId,status,placedAt,items')
      .eq('id', orderId)
      .maybeSingle<OrderRow>()
    if (orderError) throw new Error(orderError.message)
    // Treat "not found" and "not yours" identically so order ids can't be enumerated.
    if (!order || order.customerId !== user.id) return unauthorized('This order is not available on your account.')
    // payment_review means the payment succeeded but physical stock needs a
    // decision; the digital lines are paid for either way.
    if (!isDownloadableOrderStatus(order.status)) return unauthorized('Downloads unlock once payment succeeds.')

    const entitlements = await resolveOrderEntitlements(supabase, order)
    let file: ProductFile | undefined
    for (const line of entitlements) {
      for (const product of line.products) {
        file = servedFiles(product).find((entry) => entry.id === fileId)
        if (file) break
      }
      if (file) break
    }
    if (!file) return unauthorized('This file is not available on your order.')
    if (!file.storageKey) throw new Error('Product file is missing a storage key.')

    const storage = createSupabaseStorageProvider()
    const expiresInSeconds = 300
    const url = await storage.getSignedDownloadUrl(file.storageKey, expiresInSeconds, file.filename)
    return ok({ url, expiresInSeconds, filename: file.filename })
  } catch (error) {
    logEvent('download.failed', { errorKind: error instanceof Error ? error.name : 'Error', code: error && typeof error === 'object' && 'code' in error ? error.code : undefined })
    return serverError('Unable to issue download.')
  }
}
