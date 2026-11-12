import { type Order } from '@designing-minds/cms'
import { Card } from '../../components/ui/card'
import { OrderRow } from './order-row'

/** Orders as one surface of divider-separated `OrderRow`s — shared by the account
 *  dashboard (recent orders) and the full order-history page. */
export function OrderList({ orders }: { orders: Order[] }) {
  return (
    <Card variant="surface" pad="none">
      <ul className="divide-y divide-line overflow-clip rounded-md">
        {orders.map((order) => (
          <li key={order.id}>
            <OrderRow order={order} />
          </li>
        ))}
      </ul>
    </Card>
  )
}
