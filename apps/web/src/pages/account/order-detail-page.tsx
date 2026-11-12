import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  bundleContents,
  getBundleBySlug,
  getOrderById,
  getProductBySlug,
  paymentForOrder,
  priceLabel,
  type CmsSnapshot,
  type OrderItem,
} from '@designing-minds/cms'
import { Icon } from '../../components/ui/icon'
import { DownloadFileRow } from '../../components/ui/download-file-row'
import { SpecRow } from '../../components/ui/spec-row'
import { SummaryRow } from '../../components/ui/summary-row'
import { SummaryLine } from '../../components/summary-line'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Notice } from '../../components/ui/notice'
import { StatePanel } from '../../components/ui/state-panel'
import { useAuth } from '../../lib/auth'
import { apiUrl } from '../../lib/api'
import { fetchOrderStatus } from '../../lib/account-data'
import { consumePurchasedPhysicalCart } from '../../lib/physical-cart'
import { AccountShell, SignedOut } from './account-shell'
import { OrderStatusBadge } from './order-status-badge'
import { OrderRecoveryNotice } from './order-recovery-notice'
import { formatDisplayDate } from '../../lib/format-date'

/**
 * The resources an order line entitles you to download.
 *
 * A line is a slug in the shared /shop space, so it may name either
 * Collection: a resource grants itself, a bundle grants its members. Bundle
 * membership is explicit, so this agrees with the issue-download endpoint by
 * construction — both mean "is it in includedProductSlugs".
 */
const downloadProductsForItem = (snapshot: CmsSnapshot, item: OrderItem) => {
  if (item.productType === 'physical' || item.productKind === 'Physical') return []
  const product = getProductBySlug(snapshot, item.productSlug)
  if (product) return [product]
  const bundle = getBundleBySlug(snapshot, item.productSlug)
  return bundle ? bundleContents(snapshot, bundle) : []
}

export function OrderDetailPage({ snapshot, onRefresh }: { snapshot: CmsSnapshot; onRefresh: () => Promise<void> }) {
  const { customer, getAccessToken } = useAuth()
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const { orderId } = useParams()
  const order = orderId ? getOrderById(snapshot, orderId) : undefined
  const orderStatus = order?.status
  const isDownloadable = order?.status === 'paid' || order?.status === 'fulfilled'
  useEffect(() => {
    if (order && isDownloadable) consumePurchasedPhysicalCart(order.id, order.items)
  }, [order, isDownloadable])

  // While an order is still pending, poll only its status (cheap) rather than
  // refetching account records; refresh those once it flips to a downloadable
  // state so the files appear, then stop. The catalogue remains static.
  useEffect(() => {
    if (!customer || !orderId || (orderStatus && orderStatus !== 'pending')) return
    let attempts = 0
    const interval = window.setInterval(() => {
      attempts += 1
      void (async () => {
        const status = await fetchOrderStatus(orderId).catch(() => null)
        if (status && status !== 'pending') await onRefresh()
      })()
      if (attempts >= 20) window.clearInterval(interval)
    }, 3000)
    return () => window.clearInterval(interval)
  }, [customer, onRefresh, orderStatus, orderId])

  if (!customer) {
    return <SignedOut />
  }

  if (!order) {
    return (
      <StatePanel title="Finalizing order" body="We’re checking for this order. If payment has just completed, it can take a moment to appear.">
        <div className="mt-2 flex justify-center">
          <Button to="/account/orders" variant="text">
            Back to order history
          </Button>
        </div>
      </StatePanel>
    )
  }

  const payment = paymentForOrder(snapshot, order)
  const downloadable = order.status === 'paid' || order.status === 'fulfilled'
  const hasDigital = order.items.some((item) => !isPhysicalItem(item))

  const download = async (fileId: string) => {
    setDownloadError(null)
    try {
      const token = await getAccessToken()
      if (!token) throw new Error('Authentication required.')
      const response = await fetch(apiUrl('/api/issue-download'), {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId: order.id, fileId }),
      })
      const body = (await response.json()) as { url?: string; filename?: string; error?: string }
      if (!response.ok || !body.url) throw new Error(body.error ?? 'Unable to prepare download.')
      const link = document.createElement('a')
      link.href = body.url
      link.download = body.filename ?? ''
      link.rel = 'noreferrer'
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (e) {
      setDownloadError(e instanceof Error ? e.message : 'Unable to prepare download.')
    }
  }

  const physicalItems = order.items.filter(isPhysicalItem)
  const digitalItems = order.items.filter((item) => !isPhysicalItem(item))
  const showTracker = (order.status === 'paid' || order.status === 'fulfilled')
    && (order.fulfillmentStatus === 'unfulfilled' || order.fulfillmentStatus === 'shipped' || order.fulfillmentStatus === 'delivered')
  const trackingUrl = order.trackingUrl && safeTrackingUrl(order.trackingUrl, snapshot.localCommercePreview) ? order.trackingUrl : null

  return (
    <AccountShell title={`Order ${order.reference}`}>
      <div className="grid gap-8">
        <div className="flex flex-wrap items-center gap-3">
          <OrderStatusBadge status={order.status} />
          <p className="text-body text-ink-soft">Placed {formatDisplayDate(order.placedAt)}</p>
        </div>
        <OrderRecoveryNotice status={order.status} />

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="grid min-w-0 gap-8">
            {hasDigital ? (
              <section aria-labelledby="order-downloads" className="grid gap-4">
                <h2 id="order-downloads" className="text-h4">Downloads</h2>
                {!downloadable ? (
                  <Notice tone="info">
                    {order.status === 'payment_review' ? 'Your payment is under review. Downloads will unlock after your order is confirmed.' : <>Downloads unlock here once payment succeeds. This order is currently <strong>{order.status}</strong>.</>}
                  </Notice>
                ) : null}
                {downloadError ? <Notice tone="error">{downloadError}</Notice> : null}
                <ul className="grid gap-4">
                  {digitalItems.map((item) => {
                    const products = downloadProductsForItem(snapshot, item)
                    const files = products.flatMap((product) => product.purchasedFiles.map((file) => ({ ...file, productTitle: product.title })))
                    return (
                      <li key={item.id}>
                        <Card variant="surface" pad="md" as="article" className="grid gap-3">
                          <ul className="grid"><SummaryLine snapshot={snapshot} slug={item.productSlug} title={item.title} physical={false} price={item.priceZar} /></ul>
                          {files.length > 0 ? (
                            <ul className="grid divide-y divide-line border-t border-line">
                              {files.map((file) => (
                                <DownloadFileRow
                                  key={file.id}
                                  label={file.productTitle === item.title ? file.label : `${file.productTitle} · ${file.label}`}
                                  disabled={!downloadable}
                                  onDownload={() => void download(file.id)}
                                />
                              ))}
                            </ul>
                          ) : (
                            <p className="border-t border-line pt-3 text-label text-muted">Files for bundles resolve from their included resources.</p>
                          )}
                        </Card>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ) : null}

            {order.hasPhysical ? (
              <section aria-labelledby="order-delivery" className="grid gap-4">
                <h2 id="order-delivery" className="text-h4">Delivery</h2>
                <Card variant="surface" pad="md" className="grid gap-5">
                  {showTracker ? (
                    <DeliveryTracker fulfillment={order.fulfillmentStatus as 'unfulfilled' | 'shipped' | 'delivered'} />
                  ) : order.status === 'payment_review' || order.fulfillmentStatus === 'review' ? (
                    <Notice tone="info">Payment was received, but this order needs a stock review. We will confirm fulfilment before dispatch.{hasDigital ? ' Downloads remain locked while the order is under review.' : ''}</Notice>
                  ) : (
                    <p className="text-body text-ink-soft">{order.status === 'failed' ? 'Payment was not completed. No physical products will be dispatched.' : order.status === 'refunded' ? 'This order has been refunded.' : order.status === 'pending' ? 'Physical products will be prepared after payment succeeds.' : null}</p>
                  )}
                  <ul className="grid gap-4 border-t border-line pt-5">
                    {physicalItems.map((item) => (
                      <SummaryLine
                        key={item.id}
                        snapshot={snapshot}
                        slug={item.productSlug}
                        title={item.title}
                        physical
                        quantity={item.quantity ?? 1}
                        unitPriceZar={item.unitPriceZar}
                        values={{ ...item.optionValues, ...item.customizations }}
                        price={item.priceZar}
                      />
                    ))}
                  </ul>
                  {order.delivery || order.trackingNumber || trackingUrl ? (
                    <div className="flex flex-wrap items-start justify-between gap-4 border-t border-line pt-5">
                      {order.delivery ? (
                        <div className="grid gap-1">
                          <h3 className="text-label font-semibold text-ink-soft">Delivering to</h3>
                          <address className="text-body not-italic text-ink">{order.delivery.recipientName}<br />{order.delivery.addressLine1}<br />{order.delivery.addressLine2 ? <>{order.delivery.addressLine2}<br /></> : null}{order.delivery.suburb}, {order.delivery.city}<br />{order.delivery.province} {order.delivery.postalCode}<br />{order.delivery.phone}</address>
                        </div>
                      ) : null}
                      <div className="grid justify-items-start gap-2 sm:justify-items-end">
                        {order.trackingNumber ? <p className="text-body text-ink-soft">Tracking number: <strong className="text-ink">{order.trackingNumber}</strong></p> : null}
                        {trackingUrl ? <Button href={trackingUrl} target="_blank" rel="noreferrer" variant="outline" size="sm">Track your delivery <Icon name="arrow" size={16} /></Button> : null}
                      </div>
                    </div>
                  ) : null}
                </Card>
              </section>
            ) : null}
          </div>

          <aside className="grid gap-4">
            <Card variant="surface" pad="md" className="grid gap-4">
              <h2 className="text-h5">Receipt</h2>
              <ul className="grid gap-3">
                <SpecRow label="Reference" value={order.reference} />
                <SpecRow label="Account" value={order.customerName} />
                <SpecRow label="Email" value={order.customerEmail} />
                {payment ? <SpecRow label="Payment" value={`${payment.provider} · ${payment.reference} · ${payment.status}`} /> : null}
                {order.couponCode ? <>
                  <SpecRow label="Subtotal" value={priceLabel(order.subtotalZar ?? order.totalZar + (order.discountZar ?? 0))} />
                  <SpecRow label={`Discount (${order.couponCode})`} value={`−${priceLabel(order.discountZar ?? 0)}`} />
                </> : null}
                {order.hasPhysical ? <SpecRow label={order.shippingMethod ?? 'Delivery'} value={priceLabel(order.shippingZar ?? 0)} last /> : null}
              </ul>
              <SummaryRow label="Total" value={priceLabel(order.totalZar)} emphasis="total" />
            </Card>
            <p className="text-body text-muted">
              {hasDigital ? 'Problem with a download?' : 'Question about your order?'}{' '}
              <Link to="/contact" className="text-ink underline underline-offset-4">Contact support</Link>.
            </p>
          </aside>
        </div>
      </div>
    </AccountShell>
  )
}

const isPhysicalItem = (item: OrderItem) => item.productType === 'physical' || item.productKind === 'Physical'

const TRACKER_STEPS = [
  { key: 'unfulfilled', label: 'Awaiting fulfilment' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
] as const

/** Three-step progress for paid physical orders. Position only: the data holds no timestamps. */
function DeliveryTracker({ fulfillment }: { fulfillment: 'unfulfilled' | 'shipped' | 'delivered' }) {
  const current = TRACKER_STEPS.findIndex((step) => step.key === fulfillment)
  return (
    <ol aria-label="Delivery progress" className="flex items-center gap-3 text-label">
      {TRACKER_STEPS.map((step, index) => {
        const state = index < current ? 'complete' : index === current ? 'current' : 'upcoming'
        return (
          <li
            key={step.key}
            data-state={state}
            aria-current={state === 'current' ? 'step' : undefined}
            className={`flex items-center gap-2 ${index > 0 ? 'flex-1' : ''} ${state === 'upcoming' ? 'text-muted' : 'font-semibold text-ink'}`}
          >
            {index > 0 ? <span aria-hidden="true" className={`h-px flex-1 ${state === 'upcoming' ? 'bg-line-strong' : 'bg-primary'}`} /> : null}
            <span aria-hidden="true" className={`h-2.5 w-2.5 flex-none rounded-full ${state === 'upcoming' ? 'border border-line-strong' : 'bg-primary'}`} />
            <span>{step.label}</span>
            <span className="sr-only">{state === 'complete' ? ' (done)' : state === 'current' ? ' (current step)' : ''}</span>
          </li>
        )
      })}
    </ol>
  )
}

function safeTrackingUrl(value: string, localPreview = false): boolean {
  try { const url = new URL(value); return url.protocol === 'https:' || (localPreview && url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) } catch { return false }
}
