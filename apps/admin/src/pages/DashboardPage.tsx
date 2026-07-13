import { Link } from 'react-router-dom'
import { formatCurrency, type CmsSnapshot } from '@designing-minds/cms'
import { Icon, type IconName, PageHeader, Td, TableWrap, Th } from '../components/ui'
import { OrderStatusPill } from '../components/Badge'
import { CARD } from '../components/tokens'

function StatCard({ icon, value, label, to }: { icon: IconName; value: string; label: string; to: string }) {
  return (
    <Link to={to} className={`flex flex-col gap-3 p-5 transition hover:border-primary ${CARD}`}>
      <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-surface-sunk text-ink-soft">
        <span className="h-5 w-5">
          <Icon name={icon} />
        </span>
      </span>
      <div>
        <strong className="block text-[1.9rem] font-semibold tracking-[-0.03em]">{value}</strong>
        <span className="text-[0.9rem] text-muted">{label}</span>
      </div>
    </Link>
  )
}

export function DashboardPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const revenue = snapshot.orders.reduce((sum, order) => sum + order.totalZar, 0)
  const recent = [...snapshot.orders].sort((a, b) => b.placedAt.localeCompare(a.placedAt)).slice(0, 5)

  return (
    <div className="px-6 py-5">
      <PageHeader eyebrow="Overview" title="Dashboard" description="Catalogue, collections, and operational records at a glance." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon="box" value={String(snapshot.stats.productCount)} label="Products" to="/products" />
        <StatCard icon="receipt" value={String(snapshot.stats.orderCount)} label="Orders" to="/orders" />
        <StatCard icon="users" value={String(snapshot.stats.customerCount)} label="Customers" to="/customers" />
        <StatCard icon="rand" value={formatCurrency(revenue)} label="Order value" to="/payments" />
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h3>Recent orders</h3>
          <Link
            to="/orders"
            className="inline-flex items-center gap-1 text-[0.9rem] font-medium text-ink-soft transition hover:text-primary"
          >
            View all
            <span className="h-3.5 w-3.5">
              <Icon name="arrow" />
            </span>
          </Link>
        </div>
        <TableWrap>
          <table className="w-full border-collapse">
            <thead className="border-b border-line bg-surface-alt">
              <tr>
                <Th>Reference</Th>
                <Th>Customer</Th>
                <Th>Items</Th>
                <Th>Status</Th>
                <Th className="text-right">Total</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {recent.map((order) => (
                <tr key={order.id} className="hover:bg-surface-alt">
                  <Td>
                    <Link
                      to={`/orders/${order.id}`}
                      className="font-medium underline-offset-4 transition hover:text-primary hover:underline"
                    >
                      {order.reference}
                    </Link>
                  </Td>
                  <Td>{order.customerName}</Td>
                  <Td>{order.items.length}</Td>
                  <Td>
                    <OrderStatusPill status={order.status} />
                  </Td>
                  <Td className="text-right">{formatCurrency(order.totalZar)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </div>
    </div>
  )
}
