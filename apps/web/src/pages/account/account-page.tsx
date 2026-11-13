import { Link } from 'react-router-dom'
import { type CmsSnapshot, type OrderItem, ordersForCustomer, priceLabel } from '@designing-minds/cms'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Icon } from '../../components/ui/icon'
import { IncludedProduct } from '../../components/ui/included-product'
import { SpecRow } from '../../components/ui/spec-row'
import { useAuth } from '../../lib/auth'
import { AccountShell, SignedOut } from './account-shell'
import { isReadyOrder, summariseOrders } from './account-summary'
import { OrderList } from './order-list'
import { OrderStatusBadge } from './order-status-badge'
import { formatDisplayDate } from '../../lib/format-date'

const isDigitalItem = (item: OrderItem) => item.productType !== 'physical' && item.productKind !== 'Physical'

export function AccountPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const { customer } = useAuth()
  if (!customer) {
    return <SignedOut />
  }
  const orders = [...ordersForCustomer(snapshot, customer.id)].sort((a, b) => b.placedAt.localeCompare(a.placedAt))
  const recent = orders.slice(0, 3)
  const latest = orders[0]
  // The download prompt lists the latest order's digital lines; a physical-only
  // order has nothing to download, so it gets no prompt.
  const latestFiles = latest && isReadyOrder(latest) ? latest.items.filter(isDigitalItem) : []
  const summary = summariseOrders(orders)

  return (
    <AccountShell title={`Welcome back, ${customer.name.split(' ')[0]}`} intro="Your orders and account details in one place.">
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
        <div className="grid gap-8 lg:gap-10">
          {latest && latestFiles.length > 0 ? (
            <Card variant="surfaceAlt" pad="md" className="grid gap-5 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="grid gap-1">
                  <h2 className="text-h4">Your latest order is ready to download</h2>
                  <p className="text-body text-muted">
                    {latest.reference} · {formatDisplayDate(latest.placedAt)} · {latest.items.length} item{latest.items.length === 1 ? '' : 's'}
                  </p>
                </div>
                <OrderStatusBadge status={latest.status} />
              </div>
              <ul aria-label="Included files" className="grid gap-2">
                {latestFiles.map((item) => (
                  <li key={item.id}>
                    <IncludedProduct product={item} />
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-center gap-4">
                <Button to={`/account/orders/${latest.id}#order-downloads`} variant="solid">
                  <Icon name="download" size={16} />
                  Download files
                </Button>
                <Link to={`/account/orders/${latest.id}`} className="text-body text-ink underline underline-offset-4">
                  View order
                </Link>
              </div>
            </Card>
          ) : null}

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-h4">Recent orders</h2>
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

        <aside className="grid gap-6">
          <Card variant="outline" pad="md" className="grid gap-3">
            <h2 className="text-h5">Account details</h2>
            <ul className="grid gap-3">
              <SpecRow label="Name" value={customer.name} />
              <SpecRow label="Email" value={customer.email} />
              <SpecRow label="Member since" value={formatDisplayDate(customer.createdAt)} last />
            </ul>
          </Card>
          <Card variant="outline" pad="md" className="grid gap-3">
            <h2 className="text-h5">Summary</h2>
            <ul className="grid gap-3">
              <SpecRow label="Total orders" value={String(summary.totalOrders)} />
              <SpecRow label="Ready to download" value={String(summary.readyToDownload)} />
              <SpecRow label="Lifetime spend" value={priceLabel(summary.lifetimeSpendZar)} last />
            </ul>
          </Card>
          <p className="text-body text-muted">
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
