import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatCurrency, type CmsSnapshot } from '@designing-minds/cms'
import { PageHeader, SelectField, Td, TableWrap, Th } from '../components/ui'
import { OrderStatusPill } from '../components/Badge'

export function OrdersPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const [status, setStatus] = useState('All statuses')
  const statuses = ['All statuses', 'pending', 'paid', 'fulfilled', 'failed', 'refunded']
  const visible = useMemo(
    () => snapshot.orders.filter((o) => status === 'All statuses' || o.status === status),
    [snapshot.orders, status],
  )

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Orders"
        description="System-generated purchase records. Core purchase facts are read-only."
      />
      <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-dashed border-line-strong px-3 py-1.5 text-[0.78rem] uppercase tracking-[0.08em] text-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-muted" />
        Read-mostly — admins manage limited operational fields, not items or totals
      </p>

      <div className="mb-5 max-w-[220px]">
        <SelectField label="Status" value={status} options={statuses} onChange={setStatus} />
      </div>

      <TableWrap>
        <table className="w-full border-collapse">
          <thead className="border-b border-line bg-surface-alt">
            <tr>
              <Th>Reference</Th>
              <Th>Customer</Th>
              <Th>Date</Th>
              <Th>Items</Th>
              <Th>Status</Th>
              <Th className="text-right">Total</Th>
              <Th />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {visible.map((order) => (
              <tr key={order.id} className="hover:bg-surface-alt">
                <Td>
                  <Link to={`/orders/${order.id}`} className="font-medium underline underline-offset-4">
                    {order.reference}
                  </Link>
                </Td>
                <Td>{order.customerName}</Td>
                <Td>{order.placedAt.slice(0, 10)}</Td>
                <Td>{order.items.length}</Td>
                <Td>
                  <OrderStatusPill status={order.status} />
                </Td>
                <Td className="text-right">{formatCurrency(order.totalZar)}</Td>
                <Td>
                  <Link to={`/orders/${order.id}`} className="text-[0.88rem] underline underline-offset-4">
                    View
                  </Link>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </>
  )
}
