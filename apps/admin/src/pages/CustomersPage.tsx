import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatCurrency, ordersForCustomer, type CmsSnapshot } from '@designing-minds/cms'
import { Td, Th } from '../components/ui'
import { CollectionListLayout } from '../components/CollectionListLayout'

export function CustomersPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const [query, setQuery] = useState('')
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return snapshot.customers.filter((c) => !q || `${c.name} ${c.email}`.toLowerCase().includes(q))
  }, [snapshot.customers, query])

  return (
    <CollectionListLayout title="Customers" count={visible.length} query={query} onQueryChange={setQuery}>
      <table className="w-full border-collapse">
        <thead className="border-b border-line bg-surface-alt">
          <tr>
            <Th>Name</Th>
            <Th className="w-full">Email</Th>
            <Th>Joined</Th>
            <Th>Orders</Th>
            <Th className="text-right">Lifetime value</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {visible.map((customer) => {
            const orders = ordersForCustomer(snapshot, customer.id)
            const ltv = orders.reduce((sum, o) => sum + o.totalZar, 0)
            return (
              <tr key={customer.id} className="cursor-pointer hover:bg-surface-alt">
                <Td>
                  <Link to={`/customers/${customer.id}`} className="font-medium underline-offset-4 hover:underline">
                    {customer.name}
                  </Link>
                </Td>
                <Td className="text-muted">{customer.email}</Td>
                <Td>{customer.createdAt.slice(0, 10)}</Td>
                <Td>{orders.length}</Td>
                <Td className="text-right">{formatCurrency(ltv)}</Td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </CollectionListLayout>
  )
}
