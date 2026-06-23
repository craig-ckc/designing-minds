import { Link } from 'react-router-dom'
import { formatCurrency, type CmsSnapshot } from '@designing-minds/cms'
import { Icon, type IconName, PageHeader, Td, TableWrap, Th } from '../components/ui'
import { OrderStatusPill } from '../components/Badge'
import { CARD } from '../components/tokens'

function StatCard({ icon, value, label, to }: { icon: IconName; value: string; label: string; to: string }) {
  return (
    <Link to={to} className={`flex flex-col gap-3 p-5 transition hover:border-ink ${CARD}`}>
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

function countBy(snapshot: CmsSnapshot, key: 'grade' | 'productKind') {
  const counts = new Map<string, number>()
  for (const product of snapshot.products) {
    const value = product[key]
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
}

function Breakdown({ title, rows, total }: { title: string; rows: [string, number][]; total: number }) {
  return (
    <div className={`p-5 ${CARD}`}>
      <h4 className="mb-4">{title}</h4>
      <ul className="grid gap-3">
        {rows.map(([label, count]) => (
          <li key={label} className="grid gap-1.5">
            <div className="flex items-center justify-between text-[0.9rem]">
              <span className="text-ink-soft">{label}</span>
              <span className="text-muted">{count}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-sunk">
              <span className="block h-full bg-ink" style={{ width: `${total ? (count / total) * 100 : 0}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function DashboardPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const revenue = snapshot.orders.reduce((sum, order) => sum + order.totalZar, 0)
  const recent = [...snapshot.orders].slice(0, 5)

  return (
    <div className="px-6 py-5">
      <PageHeader eyebrow="Overview" title="Dashboard" description="Catalogue, collections, and operational records at a glance." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon="box" value={String(snapshot.stats.productCount)} label="Products" to="/products" />
        <StatCard icon="receipt" value={String(snapshot.stats.orderCount)} label="Orders" to="/orders" />
        <StatCard icon="users" value={String(snapshot.stats.customerCount)} label="Customers" to="/customers" />
        <StatCard icon="rand" value={formatCurrency(revenue)} label="Order value" to="/payments" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <StatCard icon="spark" value={String(snapshot.stats.subjectCount)} label="Subjects" to="/subjects" />
        <StatCard icon="box" value={String(snapshot.stats.bundleCount)} label="Bundles" to="/products" />
        <StatCard icon="box" value={String(snapshot.stats.accessPlanCount)} label="Access plans" to="/products" />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Breakdown title="Products by grade" rows={countBy(snapshot, 'grade')} total={snapshot.products.length} />
        <Breakdown title="Products by kind" rows={countBy(snapshot, 'productKind')} total={snapshot.products.length} />
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h3>Recent orders</h3>
          <Link to="/orders" className="text-[0.9rem] font-medium underline underline-offset-4">
            View all
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
                    <Link to={`/orders/${order.id}`} className="font-medium underline underline-offset-4">
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
