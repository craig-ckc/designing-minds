import { Link } from 'react-router-dom'
import { type Order, priceLabel } from '@designing-minds/cms'
import { Icon } from '../../components/ui/icon'
import { OrderStatusBadge } from './order-status-badge'
import { formatDisplayDate } from '../../lib/format-date'

/** One order: reference, date · item count, status, total and a chevron link (code twin of Figma's OrderRow).
 *  From `sm` the status (120px) and total (72px) sit in right-aligned minimum-width slots so rows line up as columns. */
export function OrderRow({ order }: { order: Order }) {
  return (
    <Link
      to={`/account/orders/${order.id}`}
      className="group flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-4 transition-colors hover:bg-surface-sunk sm:px-6"
    >
      <span className="grid min-w-0 gap-1">
        <strong className="block text-body font-semibold">{order.reference}</strong>
        <span className="text-caption text-muted">
          {formatDisplayDate(order.placedAt)} · {order.items.length} item{order.items.length === 1 ? '' : 's'}
        </span>
      </span>
      <span className="flex items-center gap-6">
        <span className="flex justify-end sm:min-w-30">
          <OrderStatusBadge status={order.status} />
        </span>
        <strong className="whitespace-nowrap text-right text-body font-semibold tabular-nums sm:min-w-18">{priceLabel(order.totalZar)}</strong>
        <span className="text-ink transition-transform group-hover:translate-x-0.5">
          <Icon name="arrow" size={24} />
        </span>
      </span>
    </Link>
  )
}
