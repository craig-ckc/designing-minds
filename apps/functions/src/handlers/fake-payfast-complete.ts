import { badRequest, forbidden, ok, serverError, unauthorized, type Handler } from '../lib/http.ts'
import { createServiceClient } from '../lib/supabase.ts'
import { requireUser } from '../lib/auth.ts'

interface FakePayfastInput {
  orderId: string
}

interface OrderRow {
  id: string
  customerId: string
  paymentId: string | null
  status: string
}

const isFakePayfastInput = (value: unknown): value is FakePayfastInput =>
  typeof value === 'object' && value !== null && typeof (value as FakePayfastInput).orderId === 'string'

export const fakePayfastComplete: Handler = async (req) => {
  if (req.method !== 'POST') return badRequest('Use POST.')
  if (process.env.FAKE_PAYFAST_ENABLED !== 'true') return forbidden('Fake PayFast is disabled.')
  if (!isFakePayfastInput(req.body)) return badRequest('Expected { orderId }.')

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
      .select('id,customerId,paymentId,status')
      .eq('id', req.body.orderId)
      .maybeSingle<OrderRow>()
    if (orderError) throw new Error(orderError.message)
    if (!order) return badRequest('Order not found.')
    if (order.customerId !== user.id) return forbidden('This order belongs to another customer.')
    if (!order.paymentId) return badRequest('Order has no payment record.')
    if (order.status === 'paid' || order.status === 'fulfilled') return ok({ orderId: order.id, status: order.status })
    if (order.status !== 'pending') return badRequest(`Cannot complete an order with status ${order.status}.`)

    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        status: 'succeeded',
        pfPaymentId: `fake-${crypto.randomUUID()}`,
        processedAt: new Date().toISOString(),
      })
      .eq('id', order.paymentId)
      .eq('orderId', order.id)
      .eq('status', 'pending')
    if (paymentError) throw new Error(paymentError.message)

    const { error: updateOrderError } = await supabase.from('orders').update({ status: 'paid' }).eq('id', order.id).eq('status', 'pending')
    if (updateOrderError) throw new Error(updateOrderError.message)

    return ok({ orderId: order.id, status: 'paid' })
  } catch (error) {
    console.error('fake PayFast completion failed:', error instanceof Error ? error.message : error)
    return serverError('Unable to complete fake PayFast payment.')
  }
}
