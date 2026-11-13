import { logEvent } from '../lib/diagnostics.ts'
import { badRequest, ok, serverError, unauthorized, type Handler } from '../lib/http.ts'
import { requireUser } from '../lib/auth.ts'
import { createServiceClient } from '../lib/supabase.ts'
import { isDownloadableOrderStatus, resolveOrderEntitlements, servedFiles, servedTitle, type EntitlementOrderLine } from '../lib/order-entitlements.ts'

interface OrderRow {
  id: string
  customerId: string
  status: string
  placedAt?: string | null
  items: EntitlementOrderLine[]
}

/** One downloadable file as the account page lists it. Never carries a storage key. */
export interface OrderFileEntry {
  id: string
  label: string
  productTitle: string
}

export interface OrderFilesResponse {
  lines: { index: number; files: OrderFileEntry[] }[]
}

const isOrderFilesInput = (value: unknown): value is { orderId: string } =>
  typeof value === 'object' && value !== null && typeof (value as { orderId?: unknown }).orderId === 'string'
  && (value as { orderId: string }).orderId.length > 0 && (value as { orderId: string }).orderId.length <= 64

/**
 * POST /api/order-files — the files each line of the caller's paid order
 * unlocks, resolved exactly as /api/issue-download authorises them. The
 * account page lists these instead of matching the public catalogue by slug,
 * so a renamed, archived or unpublished resource still shows its downloads.
 */
export const orderFiles: Handler = async (req) => {
  if (req.method !== 'POST') return badRequest('Use POST.')
  if (!isOrderFilesInput(req.body)) return badRequest('Expected { orderId }.')

  let user
  try {
    user = await requireUser(req.headers)
  } catch (error) {
    return unauthorized(error instanceof Error ? error.message : 'Authentication required.')
  }

  try {
    const supabase = createServiceClient()
    const { data: order, error } = await supabase
      .from('orders')
      .select('id,customerId,status,placedAt,items')
      .eq('id', req.body.orderId)
      .maybeSingle<OrderRow>()
    if (error) throw new Error(error.message)
    if (!order || order.customerId !== user.id) return unauthorized('This order is not available on your account.')
    if (!isDownloadableOrderStatus(order.status)) return unauthorized('Downloads unlock once payment succeeds.')

    const entitlements = await resolveOrderEntitlements(supabase, order)
    const body: OrderFilesResponse = {
      lines: entitlements.map(({ index, products }) => ({
        index,
        files: products.flatMap((product) => servedFiles(product).map((file) => ({
          id: file.id,
          label: file.label,
          productTitle: servedTitle(product),
        }))),
      })),
    }
    return ok(body)
  } catch (error) {
    logEvent('download.failed', { errorKind: error instanceof Error ? error.name : 'Error', code: error && typeof error === 'object' && 'code' in error ? error.code : undefined })
    return serverError('Unable to list order files.')
  }
}
