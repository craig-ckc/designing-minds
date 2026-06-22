import type { OrderStatus, PaymentStatus } from '@designing-minds/cms/types'
import { badRequest, ok, type Handler } from '../lib/http.ts'
// import { createServiceClient } from '../lib/supabase.ts'

interface WebhookInput {
  reference: string
  status: PaymentStatus
}

function isWebhookInput(value: unknown): value is WebhookInput {
  return typeof value === 'object' && value !== null && typeof (value as WebhookInput).reference === 'string'
}

/** A successful payment unlocks downloads on the Order Detail; a failed one does not. */
const orderStatusForPayment = (status: PaymentStatus): OrderStatus => {
  if (status === 'succeeded') return 'fulfilled'
  if (status === 'refunded') return 'refunded'
  if (status === 'failed') return 'failed'
  return 'pending'
}

/**
 * Provider → server webhook. Verifies the event, updates the Payment, and
 * derives the Order status (digital fulfillment, no shipping).
 *
 * WALL VERSION: outlines the mapping. Real signature verification and
 * persistence come later.
 */
export const paymentWebhook: Handler = async (req) => {
  if (req.method !== 'POST') return badRequest('Use POST.')
  if (!isWebhookInput(req.body)) return badRequest('Expected { reference, status }.')

  // TODO: verify the provider signature from req.headers before trusting this.
  const { reference, status } = req.body
  const nextOrderStatus = orderStatusForPayment(status)

  // const supabase = createServiceClient()
  // TODO: find payment by reference, update its status, then set the order status.
  return ok({ reference, paymentStatus: status, orderStatus: nextOrderStatus })
}
