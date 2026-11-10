import { type OrderStatus } from '@designing-minds/cms'
import { Badge } from '../../components/ui/badge'

const TONE: Record<OrderStatus, 'solid' | 'outline' | 'neutral'> = {
  fulfilled: 'solid',
  paid: 'solid',
  pending: 'outline',
  failed: 'neutral',
  refunded: 'neutral',
  payment_review: 'outline',
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={TONE[status]}>{status === 'payment_review' ? 'Payment under review' : status}</Badge>
}
