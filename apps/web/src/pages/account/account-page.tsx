import { Link } from 'react-router-dom'
import { type CmsSnapshot, ordersForCustomer, priceLabel } from '@designing-minds/cms'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { SpecRow } from '../../components/ui/spec-row'
import { SummaryRow } from '../../components/ui/summary-row'
import { useAuth } from '../../lib/auth'
import { AccountShell, SignedOut } from './account-shell'
import { isReadyOrder, summariseOrders } from './account-summary'
import { OrderList } from './order-list'
import { OrderStatusBadge } from './order-status-badge'
import { formatDisplayDate } from '../../lib/format-date'

export function AccountPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const { customer } = useAuth()
  if (!customer) {
    return <SignedOut />
  }
  const orders = [...ordersForCustomer(snapshot, customer.id)].sort((a, b) => b.placedAt.localeCompare(a.placedAt))
  const recent = orders.slice(0, 3)
  const latest = orders[0]
  const summary = summariseOrders(orders)

  return (
    <AccountShell title={`Welcome back, ${customer.name.split(' ')[0]}`} intro="Your orders and account details in one place.">
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10">
        <div className="grid gap-8">
          {latest && isReadyOrder(latest) ? (
            <Card variant="surfaceAlt" pad="md" className="grid gap-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-h5">Your latest order is ready to download</h2>
                  <p className="mt-1 text-label text-muted">
                    {latest.reference} · {formatDisplayDate(latest.placedAt)} · {latest.items.length} item{latest.items.length === 1 ? '' : 's'}
                  </p>
                </div>
                <OrderStatusBadge status={latest.status} />
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Button to={`/account/orders/${latest.id}#order-downloads`} variant="solid">
                  Go to downloads
                </Button>
                <Link to={`/account/orders/${latest.id}`} className="text-body text-ink underline underline-offset-4">
                  View order
                </Link>
              </div>
            </Card>
          ) : null}

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-h5">Recent orders</h2>
              <Link to="/account/orders" className="text-body text-ink underline underline-offset-4">
                View all
              </Link>
            </div>
            {recent.length > 0 ? (
              <OrderList orders={recent} />
            ) : (
              <Card variant="surface" pad="md" className="text-center">
                <p className="text-muted">You have no orders yet.</p>
                <div className="mt-3 flex justify-center">
                  <Button to="/shop" variant="solid" size="sm">
                    Browse resources
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>

        <aside className="grid gap-4">
          <Card variant="surface" pad="md">
            <h2 className="mb-4 text-h6">Account details</h2>
            <ul className="grid gap-3">
              <SpecRow label="Name" value={customer.name} />
              <SpecRow label="Email" value={customer.email} />
              <SpecRow label="Member since" value={formatDisplayDate(customer.createdAt)} last />
            </ul>
          </Card>
          <Card variant="surface" pad="md">
            <h2 className="mb-4 text-h6">Summary</h2>
            <div className="grid gap-3">
              <SummaryRow label="Total orders" value={String(summary.totalOrders)} />
              <SummaryRow label="Ready to download" value={String(summary.readyToDownload)} />
              <SummaryRow label="Lifetime spend" value={priceLabel(summary.lifetimeSpendZar)} />
            </div>
          </Card>
          <p className="text-label text-muted">
            Question about an order?{' '}
            <Link to="/help" className="text-ink underline underline-offset-4">
              Visit support
            </Link>
          </p>
        </aside>
      </div>
    </AccountShell>
  )
}
