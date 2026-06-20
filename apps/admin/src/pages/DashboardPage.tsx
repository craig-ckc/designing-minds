import { Link } from 'react-router-dom'
import { formatCurrency, type CmsSnapshot } from '@designing-minds/cms'
import {
  customerName,
  orderItemCount,
  orderTotal,
  sampleOrders,
  totalRevenue,
} from '../data/sampleOrders'
import { sampleCustomers } from '../data/sampleCustomers'
import {
  Icon,
  type IconName,
  PageHeader,
  SampleNote,
  StatusBadge,
  Td,
  TableWrap,
  Th,
} from '../components/ui'
import { CARD } from '../components/tokens'

function StatCard({ icon, value, label, note }: { icon: IconName; value: string; label: string; note?: string }) {
  return (
    <div className={`flex flex-col gap-3 p-5 ${CARD}`}>
      <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-surface-sunk text-ink-soft">
        <span className="h-5 w-5">
          <Icon name={icon} />
        </span>
      </span>
      <div>
        <strong className="block text-[1.9rem] font-semibold tracking-[-0.03em]">{value}</strong>
        <span className="text-[0.9rem] text-muted">{label}</span>
      </div>
      {note ? <span className="text-[0.75rem] uppercase tracking-[0.08em] text-muted">{note}</span> : null}
    </div>
  )
}

function countBy(snapshot: CmsSnapshot, key: 'grade' | 'type') {
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
              <span className="font-medium tabular-nums">{count}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-sunk">
              <div
                className="h-full rounded-full bg-ink"
                style={{ width: `${total > 0 ? Math.round((count / total) * 100) : 0}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function DashboardPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const recent = sampleOrders.slice(0, 6)
  const byGrade = countBy(snapshot, 'grade')
  const byType = countBy(snapshot, 'type')

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="A snapshot of your catalogue and store activity."
        actions={<SampleNote />}
      />

      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon="box" value={String(snapshot.stats.productCount)} label="Products in catalogue" note="From snapshot" />
        <StatCard icon="receipt" value={String(sampleOrders.length)} label="Total orders" note="Sample" />
        <StatCard icon="rand" value={formatCurrency(totalRevenue())} label="Revenue (paid)" note="Sample" />
        <StatCard icon="users" value={String(sampleCustomers.length)} label="Customers" note="Sample" />
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.5fr_1fr]">
        <section>
          <div className="mb-4 flex items-center justify-between gap-4">
            <h3 className="text-[1.35rem]">Recent orders</h3>
            <Link
              to="/orders"
              className="text-[0.9rem] font-medium text-ink underline underline-offset-4 hover:opacity-70"
            >
              View all
            </Link>
          </div>
          <TableWrap>
            <table className="w-full border-collapse">
              <thead className="border-b border-line bg-surface-alt">
                <tr>
                  <Th>Order #</Th>
                  <Th>Customer</Th>
                  <Th>Date</Th>
                  <Th className="text-right">Total</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {recent.map((order) => (
                  <tr key={order.id} className="border-b border-line last:border-0 hover:bg-surface-alt">
                    <Td>
                      <Link
                        to={`/orders/${order.id}`}
                        className="font-medium underline underline-offset-4 hover:opacity-70"
                      >
                        {order.id}
                      </Link>
                    </Td>
                    <Td>{customerName(order.customerId)}</Td>
                    <Td className="text-muted">{order.date}</Td>
                    <Td className="text-right font-medium tabular-nums">{formatCurrency(orderTotal(order))}</Td>
                    <Td>
                      <StatusBadge status={order.status} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </section>

        <section>
          <h3 className="mb-4 text-[1.35rem]">Catalogue at a glance</h3>
          <div className="grid gap-5">
            <Breakdown title="By grade" rows={byGrade} total={snapshot.stats.productCount} />
            <Breakdown title="By type" rows={byType} total={snapshot.stats.productCount} />
          </div>
        </section>
      </div>

      <p className="mt-6 text-[0.82rem] text-muted">
        Orders, revenue, and customers shown here are sample / wireframe data. Product counts are derived from the live
        content snapshot ({orderItemCount(recent[0] ?? sampleOrders[0])} items in the latest order).
      </p>
    </>
  )
}
