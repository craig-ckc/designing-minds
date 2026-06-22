import { Link, useParams } from 'react-router-dom'
import { formatCurrency, getOrderById, paymentForOrder, type CmsSnapshot } from '@designing-minds/cms'
import { Eyebrow, StatePanel, Td, TableWrap, Th } from '../components/ui'
import { OrderStatusPill, PaymentStatusPill } from '../components/Badge'
import { CollectionEditorLayout } from '../components/CollectionEditorLayout'
import { CARD } from '../components/tokens'

export function OrderDetailPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const { id } = useParams()
  const order = id ? getOrderById(snapshot, id) : undefined
  const items = snapshot.orders.map((o) => ({ id: o.id, label: o.reference, sublabel: o.customerName }))

  if (!order) {
    return (
      <CollectionEditorLayout title="Orders" basePath="/orders" items={items}>
        <StatePanel eyebrow="404" title="Order not found" />
      </CollectionEditorLayout>
    )
  }

  const payment = paymentForOrder(snapshot, order)
  const customer = snapshot.customers.find((c) => c.id === order.customerId)

  return (
    <CollectionEditorLayout title="Orders" basePath="/orders" items={items}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Order</Eyebrow>
          <div className="flex items-center gap-3">
            <h2>{order.reference}</h2>
            <OrderStatusPill status={order.status} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="grid gap-6">
          <TableWrap>
            <table className="w-full border-collapse">
              <thead className="border-b border-line bg-surface-alt">
                <tr>
                  <Th>Item</Th>
                  <Th>Kind</Th>
                  <Th className="text-right">Price</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <Td className="whitespace-normal">{item.title}</Td>
                    <Td>{item.productKind}</Td>
                    <Td className="text-right">{formatCurrency(item.priceZar)}</Td>
                  </tr>
                ))}
                <tr className="bg-surface-alt font-semibold">
                  <Td>Total</Td>
                  <Td />
                  <Td className="text-right">{formatCurrency(order.totalZar)}</Td>
                </tr>
              </tbody>
            </table>
          </TableWrap>
        </div>

        <aside className="grid content-start gap-4">
          <div className={`grid gap-3 p-5 ${CARD}`}>
            <h4>Customer</h4>
            {customer ? (
              <Link to={`/customers/${customer.id}`} className="underline underline-offset-4">
                {order.customerName}
              </Link>
            ) : (
              <span>{order.customerName}</span>
            )}
            <span className="text-[0.9rem] text-muted">{order.customerEmail}</span>
          </div>

          <div className={`grid gap-3 p-5 ${CARD}`}>
            <h4>Payment</h4>
            {payment ? (
              <div className="grid gap-2 text-[0.92rem]">
                <Row label="Provider" value={payment.provider} />
                <Row label="Reference" value={payment.reference} />
                <Row label="Amount" value={formatCurrency(payment.amountZar)} />
                <div className="flex items-center justify-between">
                  <span className="text-muted">Status</span>
                  <PaymentStatusPill status={payment.status} />
                </div>
              </div>
            ) : (
              <p className="text-muted">No payment record.</p>
            )}
          </div>

          <p className="rounded-md border border-dashed border-line-strong px-3 py-2.5 text-[0.82rem] text-muted">
            Items, totals, and payment evidence are read-only purchase facts.
          </p>
        </aside>
      </div>
    </CollectionEditorLayout>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span>{value}</span>
    </div>
  )
}
