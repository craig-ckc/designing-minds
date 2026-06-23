import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatCurrency, type CmsSnapshot } from '@designing-minds/cms'
import { Td, Th } from '../components/ui'
import { CollectionListLayout } from '../components/CollectionListLayout'
import { PaymentStatusPill } from '../components/Badge'

export function PaymentsPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const [query, setQuery] = useState('')
  const orderRef = (orderId: string) => snapshot.orders.find((o) => o.id === orderId)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return snapshot.payments.filter((p) => {
      const ref = orderRef(p.orderId)?.reference ?? ''
      return !q || `${p.reference} ${p.provider} ${ref}`.toLowerCase().includes(q)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot.payments, query])

  return (
    <CollectionListLayout title="Payments" count={visible.length} query={query} onQueryChange={setQuery}>
      <table className="w-full border-collapse">
        <thead className="border-b border-line bg-surface-alt">
          <tr>
            <Th>Reference</Th>
            <Th className="w-full">Order</Th>
            <Th>Provider</Th>
            <Th>Date</Th>
            <Th>Status</Th>
            <Th className="text-right">Amount</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {visible.map((payment) => {
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
    </CollectionListLayout>
  )
}
