import type { Order, OrderItem, Payment } from '@designing-minds/cms/types'
import { badRequest, created, type Handler } from '../lib/http.ts'
// import { createServiceClient } from '../lib/supabase.ts'

interface CheckoutInput {
  customerId: string
  items: { productSlug: string }[]
}

function isCheckoutInput(value: unknown): value is CheckoutInput {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as CheckoutInput).customerId === 'string' &&
    Array.isArray((value as CheckoutInput).items)
  )
}

/**
 * Create an Order + a single pending Payment, then hand off to the payment
 * provider. Access Plans are one-time charges (ADR 0001) — no recurring mandate.
 *
 * WALL VERSION: validates shape and sketches the flow. Real product lookups,
 * total calculation, persistence, and provider redirect URLs come later.
 */
export const checkout: Handler = async (req) => {
  if (req.method !== 'POST') return badRequest('Use POST.')
  if (!isCheckoutInput(req.body)) return badRequest('Expected { customerId, items[] }.')

  const input = req.body
  if (input.items.length === 0) return badRequest('Cart is empty.')

  // const supabase = createServiceClient()
  // TODO: load products by slug, confirm published + price, sum totals.
  const orderId = `o-${Date.now()}`
  const items: OrderItem[] = input.items.map((item, index) => ({
    id: `oi-${index}`,
    productSlug: item.productSlug,
    title: '(resolved from product)',
    productKind: 'Individual Resource',
    priceZar: 0,
  }))
  const totalZar = items.reduce((sum, item) => sum + item.priceZar, 0)

  const payment: Payment = {
    id: `pay-${Date.now()}`,
    orderId,
    status: 'pending',
    provider: 'Payfast',
    reference: '(set by provider)',
    amountZar: totalZar,
    createdAt: new Date().toISOString(),
  }

  const order: Order = {
    id: orderId,
    reference: `DM-${orderId.slice(-4)}`,
    customerId: input.customerId,
    customerName: '(resolved from customer)',
    customerEmail: '(resolved from customer)',
    status: 'pending',
    items,
    totalZar,
    paymentId: payment.id,
    placedAt: new Date().toISOString(),
  }

  // TODO: persist order + payment, then build the provider redirect URL.
  return created({ orderId: order.id, paymentId: payment.id, redirectUrl: `/checkout/redirect/${order.id}` })
}
