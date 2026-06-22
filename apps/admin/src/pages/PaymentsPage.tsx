import { Link } from 'react-router-dom'
import { formatCurrency, type CmsSnapshot } from '@designing-minds/cms'
import { PageHeader, Td, TableWrap, Th } from '../components/ui'
import { PaymentStatusPill } from '../components/Badge'

export function PaymentsPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const orderRef = (orderId: string) => snapshot.orders.find((o) => o.id === orderId)

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Payments"
        description="Payment status and provider references connected to checkout and orders."
      />
      <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-dashed border-line-strong px-3 py-1.5 text-[0.78rem] uppercase tracking-[0.08em] text-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-muted" />
        Read-only — single charge per order (Access Plans do not auto-renew)
      </p>

      <TableWrap>
        <table className="w-full border-collapse">
          <thead className="border-b border-line bg-surface-alt">
            <tr>
              <Th>Reference</Th>
              <Th>Order</Th>
              <Th>Provider</Th>
              <Th>Date</Th>
              <Th>Status</Th>
              <Th className="text-right">Amount</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {snapshot.payments.map((payment) => {
              const order = orderRef(payment.orderId)
              return (
                <tr key={payment.id} className="hover:bg-surface-alt">
                  <Td className="font-medium">{payment.reference}</Td>
                  <Td>
                    {order ? (
                      <Link to={`/orders/${order.id}`} className="underline underline-offset-4">
                        {order.reference}
                      </Link>
                    ) : (
                      payment.orderId
                    )}
                  </Td>
                  <Td>{payment.provider}</Td>
                  <Td>{payment.createdAt.slice(0, 10)}</Td>
                  <Td>
                    <PaymentStatusPill status={payment.status} />
                  </Td>
                  <Td className="text-right">{formatCurrency(payment.amountZar)}</Td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </TableWrap>
    </>
  )
}
