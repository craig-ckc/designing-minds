import { Link } from 'react-router-dom'
import { type CmsSnapshot, ordersForCustomer, priceLabel } from '@designing-minds/cms'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../lib/auth'
import { AccountShell, SignedOut } from './AccountShell'
import { OrderStatusBadge } from './OrderStatusBadge'

export function AccountPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const { customer } = useAuth()
  if (!customer) {
    return <SignedOut />
  }
  const orders = [...ordersForCustomer(snapshot, customer.id)].sort((a, b) => b.placedAt.localeCompare(a.placedAt))
  const recent = orders.slice(0, 3)
  const downloadable = orders.filter((o) => o.status === 'paid' || o.status === 'fulfilled').length

  return (
    <AccountShell title={`Welcome back, ${customer.name.split(' ')[0]}`} intro="Your orders and account details in one place.">
      <div className="grid gap-8">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
          {[
            { value: String(orders.length), label: 'Total orders' },
            { value: String(downloadable), label: 'Ready to download' },
            { value: priceLabel(orders.reduce((sum, o) => sum + o.totalZar, 0)), label: 'Lifetime spend' },
          ].map((stat) => (
            <div key={stat.label} className="bg-surface px-5 py-5">
              <strong className="block text-[1.6rem] font-semibold tracking-[-0.02em]">{stat.value}</strong>
              <span className="text-[0.88rem] text-muted">{stat.label}</span>
            </div>
          ))}
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3>Recent orders</h3>
            <Link to="/account/orders" className="text-[0.9rem] font-medium underline underline-offset-4">
              View all
            </Link>
          </div>
          {recent.length > 0 ? (
            <ul className="grid gap-3">
              {recent.map((order) => (
                <li key={order.id}>
                  <Link
                    to={`/account/orders/${order.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 border border-line bg-surface px-5 py-4 hover:border-primary"
                  >
                    <span>
                      <strong className="block">{order.reference}</strong>
                      <span className="text-[0.88rem] text-muted">
                        {order.items.length} item{order.items.length === 1 ? '' : 's'} · {order.placedAt.slice(0, 10)}
                      </span>
                    </span>
                    <span className="flex items-center gap-4">
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
        </div>

        <div>
          <h3 className="mb-4">Account details</h3>
          <div className="card grid gap-3 p-6">
            <Detail label="Name" value={customer.name} />
            <Detail label="Email" value={customer.email} />
            <Detail label="Member since" value={customer.createdAt.slice(0, 10)} last />
          </div>
        </div>
      </div>
    </AccountShell>
  )
}

function Detail({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${last ? '' : 'border-b border-line pb-3'}`}>
      <span className="text-muted">{label}</span>
      <span>{value}</span>
    </div>
  )
}
