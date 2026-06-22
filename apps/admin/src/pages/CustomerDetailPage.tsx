import { Link, useParams } from 'react-router-dom'
import { formatCurrency, getCustomerById, ordersForCustomer, type CmsSnapshot } from '@designing-minds/cms'
import { Eyebrow, StatePanel, Td, TableWrap, Th } from '../components/ui'
import { OrderStatusPill } from '../components/Badge'
import { CollectionEditorLayout } from '../components/CollectionEditorLayout'
import { CARD } from '../components/tokens'

export function CustomerDetailPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const { id } = useParams()
  const customer = id ? getCustomerById(snapshot, id) : undefined
  const items = snapshot.customers.map((c) => ({ id: c.id, label: c.name, sublabel: c.email }))

  if (!customer) {
    return (
      <CollectionEditorLayout title="Customers" basePath="/customers" items={items}>
        <StatePanel eyebrow="404" title="Customer not found" />
      </CollectionEditorLayout>
    )
  }

  const orders = ordersForCustomer(snapshot, customer.id)

  return (
    <CollectionEditorLayout title="Customers" basePath="/customers" items={items}>
      <div className="mb-8">
        <Eyebrow>Customer</Eyebrow>
        <h2>{customer.name}</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <div className={`grid gap-3 p-5 ${CARD}`}>
          <h4>Account details</h4>
          <Row label="Email" value={customer.email} />
          <Row label="Joined" value={customer.createdAt.slice(0, 10)} />
          <Row label="Orders" value={String(orders.length)} />
          <Row label="Lifetime value" value={formatCurrency(orders.reduce((s, o) => s + o.totalZar, 0))} />
          <p className="mt-1 rounded-md border border-dashed border-line-strong px-3 py-2 text-[0.82rem] text-muted">
            Profile fields are customer-owned and read-only here.
          </p>
        </div>

        <div>
          <h4 className="mb-3">Orders</h4>
          <TableWrap>
            <table className="w-full border-collapse">
              <thead className="border-b border-line bg-surface-alt">
                <tr>
                  <Th>Reference</Th>
                  <Th>Date</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Total</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-surface-alt">
                    <Td>
                      <Link to={`/orders/${order.id}`} className="underline underline-offset-4">
                        {order.reference}
                      </Link>
                    </Td>
                    <Td>{order.placedAt.slice(0, 10)}</Td>
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
    </CollectionEditorLayout>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[0.92rem]">
      <span className="text-muted">{label}</span>
      <span>{value}</span>
    </div>
  )
}
