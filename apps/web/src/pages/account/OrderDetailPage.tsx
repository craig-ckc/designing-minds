import { Link, useParams } from 'react-router-dom'
import { type CmsSnapshot, getOrderById, getProductBySlug, paymentForOrder, priceLabel } from '@designing-minds/cms'
import { Icon } from '../../components/ui/Icon'
import { Button } from '../../components/ui/Button'
import { StatePanel } from '../../components/ui/StatePanel'
import { useAuth } from '../../lib/auth'
import { AccountShell, SignedOut } from './AccountShell'
import { OrderStatusBadge } from './OrderStatusBadge'

export function OrderDetailPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const { customer } = useAuth()
  const { orderId } = useParams()
  const order = orderId ? getOrderById(snapshot, orderId) : undefined

  if (!customer) {
    return <SignedOut />
  }

  if (!order) {
    return (
      <StatePanel eyebrow="Customer Account" title="Order not found" body="We couldn’t find that order on your account.">
        <div className="mt-2 flex justify-center">
          <Button to="/account/orders" variant="text">
            Back to order history
          </Button>
        </div>
      </StatePanel>
    )
  }

  const payment = paymentForOrder(snapshot, order)
  const downloadable = order.status === 'fulfilled' || order.status === 'paid'

  return (
    <AccountShell title={`Order ${order.reference}`}>
      <div className="grid gap-8">
        {/* Receipt summary */}
        <div className="card grid gap-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3>Receipt</h3>
              <p className="text-[0.88rem] text-muted">Placed {order.placedAt.slice(0, 10)}</p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="grid gap-2 border-t border-line pt-4 text-[0.92rem]">
            <Row label="Order reference" value={order.reference} />
            <Row label="Account" value={`${order.customerName} · ${order.customerEmail}`} />
            {payment ? <Row label="Payment" value={`${payment.provider} · ${payment.reference} · ${payment.status}`} /> : null}
            <Row label="Total" value={priceLabel(order.totalZar)} strong />
          </div>
        </div>

        {/* Purchased items + downloads */}
        <div>
          <h3 className="mb-4">Purchased items</h3>
          {!downloadable ? (
            <p className="mb-4 rounded-md border border-line bg-surface-alt px-4 py-3 text-[0.9rem] text-ink-soft">
              Downloads unlock here once payment succeeds. This order is currently <strong>{order.status}</strong>.
            </p>
          ) : null}
          <ul className="grid gap-4">
            {order.items.map((item) => {
              const product = getProductBySlug(snapshot, item.productSlug)
              const files = product?.purchasedFiles ?? []
              return (
                <li key={item.id} className="border border-line bg-surface p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <Link to={`/product/${item.productSlug}`} className="font-medium hover:opacity-70">
                        {item.title}
                      </Link>
                      <p className="text-[0.85rem] text-muted">{item.productKind}</p>
                    </div>
                    <strong>{priceLabel(item.priceZar)}</strong>
                  </div>

                  {files.length > 0 ? (
                    <ul className="mt-4 grid gap-2 border-t border-line pt-4">
                      {files.map((file) => (
                        <li key={file.id} className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-2 text-[0.92rem]">
                            <span className="h-4 w-4 text-muted">
                              <Icon name="doc" />
                            </span>
                            {file.label}
                          </span>
                          <Button type="button" variant={downloadable ? 'outline' : 'text'} size="sm" disabled={!downloadable}>
                            <span className="h-4 w-4">
                              <Icon name="download" />
                            </span>
                            Download
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 border-t border-line pt-3 text-[0.85rem] text-muted">
                      Files for bundles and access plans resolve from their included resources.
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        </div>

        <p className="text-[0.9rem] text-muted">
          Problem with a download?{' '}
          <Link to="/contact" className="text-ink underline underline-offset-4">
            Contact support
          </Link>
          .
        </p>
      </div>
    </AccountShell>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex flex-wrap justify-between gap-2">
      <span className="text-muted">{label}</span>
      <span className={strong ? 'font-semibold' : ''}>{value}</span>
    </div>
  )
}
