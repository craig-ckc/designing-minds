import { Link } from 'react-router-dom'
import { formatCurrency, ordersForCustomer, type CmsSnapshot } from '@designing-minds/cms'
import { PageHeader, Td, TableWrap, Th } from '../components/ui'

export function CustomersPage({ snapshot }: { snapshot: CmsSnapshot }) {
  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Customers"
        description="Customer-owned account records. Profile details are read-only for admins."
      />
      <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-dashed border-line-strong px-3 py-1.5 text-[0.78rem] uppercase tracking-[0.08em] text-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-muted" />
        Read-only — customers own their own profile information
      </p>

      <TableWrap>
        <table className="w-full border-collapse">
          <thead className="border-b border-line bg-surface-alt">
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Joined</Th>
              <Th>Orders</Th>
              <Th className="text-right">Lifetime value</Th>
              <Th />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {snapshot.customers.map((customer) => {
              const orders = ordersForCustomer(snapshot, customer.id)
              const ltv = orders.reduce((sum, o) => sum + o.totalZar, 0)
              return (
                <tr key={customer.id} className="hover:bg-surface-alt">
                  <Td>
                    <Link to={`/customers/${customer.id}`} className="font-medium underline underline-offset-4">
                      {customer.name}
                    </Link>
                  </Td>
                  <Td className="text-muted">{customer.email}</Td>
                  <Td>{customer.createdAt.slice(0, 10)}</Td>
                  <Td>{orders.length}</Td>
                  <Td className="text-right">{formatCurrency(ltv)}</Td>
                  <Td>
                    <Link to={`/customers/${customer.id}`} className="text-[0.88rem] underline underline-offset-4">
                      View
                    </Link>
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </TableWrap>
    </>
  )
}
