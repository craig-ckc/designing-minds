import type { Order } from '@designing-minds/cms'

export interface PaymentOrderState {
  customerId: string
  orderId: string
  order: Order | null
  error: string | null
}

/** A previous route or account result must never be displayed by the simulator. */
export function matchingPaymentState(state: PaymentOrderState | null, customerId: string | undefined, orderId: string | undefined): PaymentOrderState | null {
  if (!state || state.customerId !== customerId || state.orderId !== orderId) return null
  if (state.order && (state.order.id !== orderId || state.order.customerId !== customerId)) return null
  return state
}
