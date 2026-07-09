import { type CmsSnapshot, ordersForCustomer } from '@designing-minds/cms'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { useAuth } from '../../lib/auth'
import { AccountShell, SignedOut } from './account-shell'
import { OrderList } from './order-list'

export function OrderHistoryPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const { customer } = useAuth()
  if (!customer) {
    return <SignedOut />
  }
  const orders = [...ordersForCustomer(snapshot, customer.id)].sort((a, b) => b.placedAt.localeCompare(a.placedAt))

  return (
    <AccountShell title="Order history" intro="Every order on your account. Open an order to download its files.">
      {orders.length > 0 ? (
        <OrderList orders={orders} />
      ) : (
        <Card variant="surface" pad="md" className="text-center">
          <p className="text-muted">You have no orders yet.</p>
          <div className="mt-3 flex justify-center">
            <Button to="/shop" variant="solid" size="sm">
              Browse resources
            </Button>
          </div>
        </Card>
      )}
    </AccountShell>
  )
}
