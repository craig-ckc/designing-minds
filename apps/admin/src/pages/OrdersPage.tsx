import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { formatCurrency } from '@designing-minds/cms'
import {
  customerName,
  getOrderById,
  orderItemCount,
  orderTotal,
  sampleOrders,
  type Order,
} from '../data/sampleOrders'
import { getCustomerById } from '../data/sampleCustomers'
import {
  Icon,
  PageHeader,
  Placeholder,
  SampleNote,
  StatusBadge,
  Td,
  TableWrap,
  Th,
} from '../components/ui'
import { CARD } from '../components/tokens'

const FILTERS = ['All', 'Paid', 'Pending', 'Refunded'] as const

export function OrdersPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const selected = id ? getOrderById(id) ?? null : null
  const [statusFilter, setStatusFilter] = useState<(typeof FILTERS)[number]>('All')

  const visible = sampleOrders.filter((order) => statusFilter === 'All' || order.status === statusFilter)

  return (
    <>
      <PageHeader
        eyebrow="Store"
        title="Orders"
        description="Recent purchases. Click a row to view line items."
        actions={<SampleNote />}
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setStatusFilter(filter)}
            className={`rounded-full border px-3.5 py-1.5 text-[0.85rem] transition ${
              statusFilter === filter
                ? 'border-ink bg-ink text-white'
                : 'border-line text-ink-soft hover:border-ink hover:text-ink'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.6fr_1fr]">
        <section>
          <TableWrap>
            <table className="w-full border-collapse">
              <thead className="border-b border-line bg-surface-alt">
                <tr>
                  <Th>Order #</Th>
                  <Th>Customer</Th>
                  <Th>Date</Th>
                  <Th className="text-right">Items</Th>
                  <Th className="text-right">Total</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {visible.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className={`cursor-pointer border-b border-line last:border-0 hover:bg-surface-alt ${
                      selected?.id === order.id ? 'bg-surface-alt' : ''
                    }`}
                  >
                    <Td className="font-medium">{order.id}</Td>
                    <Td>{customerName(order.customerId)}</Td>
                    <Td className="text-muted">{order.date}</Td>
                    <Td className="text-right tabular-nums">{orderItemCount(order)}</Td>
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

        <aside>
          {selected ? (
            <OrderDetail order={selected} onClose={() => navigate('/orders')} />
          ) : (
            <div className={`grid place-items-center p-10 text-center text-muted ${CARD}`}>
              <span className="mb-3 h-8 w-8 text-line-strong">
                <Icon name="receipt" />
              </span>
              <p className="text-[0.92rem]">Select an order to see its line items.</p>
            </div>
          )}
        </aside>
      </div>
    </>
  )
}

function OrderDetail({ order, onClose }: { order: Order; onClose: () => void }) {
  const customer = getCustomerById(order.customerId)
  return (
    <div className={`grid gap-5 p-6 ${CARD} xl:sticky xl:top-24`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-muted">Order</p>
          <h3 className="text-[1.5rem]">{order.id}</h3>
        </div>
        <button type="button" onClick={onClose} className="text-[0.85rem] text-muted underline underline-offset-4 hover:text-ink">
          Close
        </button>
      </div>

      <div className="flex items-center gap-3 border-y border-line py-4">
        <Placeholder circle className="h-11 w-11 flex-none" />
        <div>
          <strong className="block text-[0.95rem] font-medium">{customer?.name ?? 'Unknown customer'}</strong>
          <span className="text-[0.85rem] text-muted">{customer?.email ?? '—'}</span>
        </div>
        <span className="ml-auto">
          <StatusBadge status={order.status} />
        </span>
      </div>

      <ul className="grid gap-3">
        {order.items.map((item, index) => (
          <li key={index} className="flex items-start justify-between gap-3 text-[0.92rem]">
            <span>
              <span className="block">{item.title}</span>
              <span className="text-[0.8rem] text-muted">
                {item.grade} · {item.qty} × {formatCurrency(item.priceZar)}
              </span>
            </span>
            <span className="font-medium tabular-nums">{formatCurrency(item.priceZar * item.qty)}</span>
          </li>
        ))}
      </ul>

      <div className="grid gap-2 border-t border-line pt-4 text-[0.92rem]">
        <div className="flex justify-between text-muted">
          <span>Items</span>
          <span className="tabular-nums">{orderItemCount(order)}</span>
        </div>
        <div className="flex justify-between text-muted">
          <span>Date</span>
          <span>{order.date}</span>
        </div>
        <div className="flex justify-between text-[1.05rem] font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{formatCurrency(orderTotal(order))}</span>
        </div>
      </div>
    </div>
  )
}
