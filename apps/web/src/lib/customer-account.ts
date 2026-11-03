import type { SupabaseClient } from '@supabase/supabase-js'
import type { Order, Payment } from '@designing-minds/cms'

export interface CustomerAccountData {
  orders: Order[]
  payments: Payment[]
}

/** Account routes load only this customer's records; catalogue data stays static. */
export async function loadCustomerAccount(client: Pick<SupabaseClient, 'from'>, customerId: string): Promise<CustomerAccountData> {
  if (!customerId) throw new Error('Authentication required.')

  const orders = await client.from('orders')
    .select('id,reference,customerId,customerName,customerEmail,status,items,totalZar,subtotalZar,discountZar,couponCode,paymentId,placedAt')
    .eq('customerId', customerId)
  if (orders.error) throw new Error(orders.error.message)

  const normalizedOrders = ((orders.data ?? []) as unknown as Order[]).map((order) => ({
    ...order,
    totalZar: Number(order.totalZar),
    subtotalZar: order.subtotalZar == null ? order.subtotalZar : Number(order.subtotalZar),
    discountZar: Number(order.discountZar ?? 0),
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
