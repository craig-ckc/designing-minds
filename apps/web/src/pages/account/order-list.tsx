import { Link } from 'react-router-dom'
import { type Order, priceLabel } from '@designing-minds/cms'
import { Card } from '../../components/ui/card'
import { Icon } from '../../components/ui/icon'
import { OrderStatusBadge } from './order-status-badge'

/** Orders as a single card with divider-separated rows — shared by the account
 *  dashboard (recent orders) and the full order-history page. */
export function OrderList({ orders }: { orders: Order[] }) {
  return (
    <Card variant="surface" pad="none">
      <ul className="divide-y divide-line overflow-clip rounded-card">
        {orders.map((order) => (
          <li key={order.id}>
            <Link
              to={`/account/orders/${order.id}`}
              className="group flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-4 transition-colors hover:bg-surface-alt sm:px-6"
            >
              <span className="min-w-0">
                <strong className="block transition-colors group-hover:text-primary">{order.reference}</strong>
                <span className="text-label text-muted">
                  {order.placedAt.slice(0, 10)} · {order.items.length} item{order.items.length === 1 ? '' : 's'}
                </span>
              </span>
              <span className="flex items-center gap-4">
                <OrderStatusBadge status={order.status} />
                <strong className="tabular-nums">{priceLabel(order.totalZar)}</strong>
                <span className="text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary">
                  <Icon name="arrow" size={16} />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}
