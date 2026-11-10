import type { SupabaseClient } from '@supabase/supabase-js'
import type { Order, Payment } from '@designing-minds/cms'

export interface CustomerAccountData {
  orders: Order[]
  payments: Payment[]
}

const ORDER_COLUMNS = 'id,reference,customerId,customerName,customerEmail,status,items,totalZar,subtotalZar,discountZar,couponCode,paymentId,placedAt'
const COMMERCE_COLUMNS = 'hasPhysical,shippingZar,shippingMethod,delivery,fulfillmentStatus,trackingNumber,trackingUrl,reservationExpiresAt'

/** Account routes load only this customer's records; catalogue data stays static. */
export async function loadCustomerAccount(client: Pick<SupabaseClient, 'from'>, customerId: string): Promise<CustomerAccountData> {
  if (!customerId) throw new Error('Authentication required.')

  let orders: { data: unknown; error: { code?: string; message: string } | null } = await client.from('orders')
    .select(`${ORDER_COLUMNS},${COMMERCE_COLUMNS}`)
    .eq('customerId', customerId)
  // Old deployments keep digital order history working before the additive
  // commerce migration. Permission and other database failures remain fatal.
  if (orders.error?.code === '42703' || orders.error?.code === 'PGRST204') {
    orders = await client.from('orders').select(ORDER_COLUMNS).eq('customerId', customerId)
  }
  if (orders.error) throw new Error(orders.error.message)

  const normalizedOrders = ((orders.data ?? []) as unknown as Order[]).map((order) => ({
    ...order,
    totalZar: Number(order.totalZar),
    subtotalZar: order.subtotalZar == null ? order.subtotalZar : Number(order.subtotalZar),
    discountZar: Number(order.discountZar ?? 0),
    shippingZar: Number(order.shippingZar ?? 0),
  }))
  if (normalizedOrders.length === 0) return { orders: [], payments: [] }

  const payments = await client.from('payments')
    .select('id,orderId,status,provider,reference,pfPaymentId,amountZar,createdAt,processedAt')
    .in('orderId', normalizedOrders.map((order) => order.id))
  if (payments.error) throw new Error(payments.error.message)

  return {
    orders: normalizedOrders,
    payments: ((payments.data ?? []) as unknown as Payment[]).map((payment) => ({ ...payment, amountZar: Number(payment.amountZar) })),
  }
}
