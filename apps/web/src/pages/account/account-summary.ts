import { type Order } from '@designing-minds/cms'

/** Orders whose files the customer can download. */
export const isReadyOrder = (order: Pick<Order, 'status'>) => order.status === 'paid' || order.status === 'fulfilled'

/** Dashboard summary. Lifetime spend counts only paid and fulfilled orders:
 *  pending, failed, refunded and under-review orders are not money received. */
export function summariseOrders(orders: Pick<Order, 'status' | 'totalZar'>[]) {
  const ready = orders.filter(isReadyOrder)
  return {
    totalOrders: orders.length,
    readyToDownload: ready.length,
    lifetimeSpendZar: ready.reduce((sum, order) => sum + order.totalZar, 0),
  }
}
