import { Link } from 'react-router-dom'
import { type CmsSnapshot, ordersForCustomer, priceLabel } from '@designing-minds/cms'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../lib/auth'
import { AccountShell, SignedOut } from './AccountShell'
import { OrderStatusBadge } from './OrderStatusBadge'

export function OrderHistoryPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const { customer } = useAuth()
  if (!customer) {
    return <SignedOut />
  }
  const orders = ordersForCustomer(snapshot, customer.id)

  return (
    <AccountShell title="Order history" intro="Every order on your account. Open an order to download its files.">
      {orders.length > 0 ? (
        <ul className="grid gap-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                to={`/account/orders/${order.id}`}
                className="grid gap-3 border border-line bg-surface px-5 py-4 hover:border-primary sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <span>
                  <strong className="block">{order.reference}</strong>
                  <span className="text-[0.88rem] text-muted">
                    {order.placedAt.slice(0, 10)} ·{' '}
                    {order.items.map((item) => item.title).join(', ')}
                  </span>
                </span>
                <span className="flex items-center gap-4 sm:justify-end">
                  <OrderStatusBadge status={order.status} />
                  <strong>{priceLabel(order.totalZar)}</strong>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="card p-6 text-center">
          <p className="text-muted">You have no orders yet.</p>
          <div className="mt-3 flex justify-center">
            <Button to="/shop" variant="solid" size="sm">
              Browse resources
            </Button>
          </div>
        </div>
      )}
    </AccountShell>
  )
}
