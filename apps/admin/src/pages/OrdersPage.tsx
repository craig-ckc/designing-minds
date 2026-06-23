import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatCurrency, type CmsSnapshot, type OrderStatus } from '@designing-minds/cms'
import { Td, Th } from '../components/ui'
import { CollectionListLayout } from '../components/CollectionListLayout'
import { OrderStatusPill } from '../components/Badge'

const FILTER_SELECT =
  'min-h-[42px] rounded-md border border-line-strong bg-surface px-3 text-[0.92rem] focus:outline focus:outline-2 focus:outline-ink focus:-outline-offset-1'

const ORDER_STATUSES: OrderStatus[] = ['pending', 'paid', 'fulfilled', 'refunded', 'failed']

export function OrdersPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All statuses')
  const statuses = ['All statuses', ...ORDER_STATUSES]

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return snapshot.orders.filter((o) => {
      if (status !== 'All statuses' && o.status !== status) return false
      return !q || `${o.reference} ${o.customerName} ${o.customerEmail}`.toLowerCase().includes(q)
    })
  }, [snapshot.orders, query, status])

  return (
    <CollectionListLayout
      title="Orders"
      count={visible.length}
      query={query}
      onQueryChange={setQuery}
      filters={
        <select className={FILTER_SELECT} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by order status">
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      }
    >
      <table className="w-full border-collapse">
        <thead className="border-b border-line bg-surface-alt">
          <tr>
            <Th>Reference</Th>
            <Th className="w-full">Customer</Th>
            <Th>Date</Th>
            <Th>Items</Th>
            <Th>Status</Th>
            <Th className="text-right">Total</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {visible.map((order) => (
            <tr key={order.id} className="cursor-pointer hover:bg-surface-alt">
              <Td>
                <Link to={`/orders/${order.id}`} className="font-medium underline-offset-4 hover:underline">
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
            </tr>
          ))}
          {visible.length === 0 ? (
            <tr>
              <Td className="text-muted" colSpan={6}>
                No orders match.
              </Td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </CollectionListLayout>
  )
}
