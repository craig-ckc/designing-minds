import { useNavigate, useParams } from 'react-router-dom'
import { formatCurrency } from '@designing-minds/cms'
import { getCustomerById, sampleCustomers, type Customer } from '../data/sampleCustomers'
import { customerSpend, getOrdersByCustomer, orderTotal, type Order } from '../data/sampleOrders'
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

export function CustomersPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const selected = id ? getCustomerById(id) ?? null : null

  return (
    <>
      <PageHeader
        eyebrow="Store"
        title="Customers"
        description="People who have purchased from your store."
        actions={<SampleNote />}
      />

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.6fr_1fr]">
        <section>
          <TableWrap>
            <table className="w-full border-collapse">
              <thead className="border-b border-line bg-surface-alt">
                <tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th className="text-right">Orders</Th>
                  <Th className="text-right">Total spent</Th>
                  <Th>Joined</Th>
                </tr>
              </thead>
              <tbody>
                {sampleCustomers.map((customer) => {
                  const orders = getOrdersByCustomer(customer.id)
                  return (
                    <tr
                      key={customer.id}
                      onClick={() => navigate(`/customers/${customer.id}`)}
                      className={`cursor-pointer border-b border-line last:border-0 hover:bg-surface-alt ${
                        selected?.id === customer.id ? 'bg-surface-alt' : ''
                      }`}
                    >
                      <Td className="font-medium">{customer.name}</Td>
                      <Td className="text-muted">{customer.email}</Td>
                      <Td className="text-right tabular-nums">{orders.length}</Td>
                      <Td className="text-right font-medium tabular-nums">
                        {formatCurrency(customerSpend(customer.id))}
                      </Td>
                      <Td className="text-muted">{customer.joined}</Td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </TableWrap>
        </section>

        <aside>
          {selected ? (
            <CustomerDetail customer={selected} onClose={() => navigate('/customers')} />
          ) : (
            <div className={`grid place-items-center p-10 text-center text-muted ${CARD}`}>
              <span className="mb-3 h-8 w-8 text-line-strong">
                <Icon name="users" />
              </span>
              <p className="text-[0.92rem]">Select a customer to see their orders.</p>
            </div>
          )}
        </aside>
      </div>
    </>
  )
}

function CustomerDetail({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const navigate = useNavigate()
  const orders = getOrdersByCustomer(customer.id)
  return (
    <div className={`grid gap-5 p-6 ${CARD} xl:sticky xl:top-24`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Placeholder circle className="h-12 w-12 flex-none" />
          <div>
            <h3 className="text-[1.35rem] leading-tight">{customer.name}</h3>
            <span className="text-[0.85rem] text-muted">{customer.email}</span>
          </div>
        </div>
        <button type="button" onClick={onClose} className="text-[0.85rem] text-muted underline underline-offset-4 hover:text-ink">
          Close
        </button>
      </div>

      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-[10px] border border-line bg-line">
        <Stat label="Orders" value={String(orders.length)} />
        <Stat label="Spent" value={formatCurrency(customerSpend(customer.id))} />
        <Stat label="Joined" value={customer.joined} />
      </div>

      <div>
        <p className="mb-3 text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-muted">Orders</p>
        <ul className="grid gap-2.5">
          {orders.length === 0 ? <li className="text-[0.9rem] text-muted">No orders yet.</li> : null}
          {orders.map((order: Order) => (
            <li key={order.id}>
              <button
                type="button"
                onClick={() => navigate(`/orders/${order.id}`)}
                className="flex w-full items-center justify-between gap-3 rounded-md border border-line px-3 py-2.5 text-left text-[0.9rem] hover:border-ink"
              >
                <span>
                  <span className="block font-medium">{order.id}</span>
                  <span className="text-[0.8rem] text-muted">{order.date}</span>
                </span>
                <span className="flex items-center gap-3">
                  <StatusBadge status={order.status} />
                  <span className="font-medium tabular-nums">{formatCurrency(orderTotal(order))}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface px-3 py-3 text-center">
      <strong className="block text-[1.05rem] font-semibold tracking-[-0.02em]">{value}</strong>
      <span className="text-[0.72rem] uppercase tracking-[0.08em] text-muted">{label}</span>
    </div>
  )
}
