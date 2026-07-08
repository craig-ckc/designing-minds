import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { type CmsSnapshot, type OrderItem, getOrderById, getProductBySlug, paymentForOrder, priceLabel, resourceUnlockedByPlan } from '@designing-minds/cms'
import { Icon } from '../../components/ui/Icon'
import { Button } from '../../components/ui/Button'
import { StatePanel } from '../../components/ui/StatePanel'
import { useAuth } from '../../lib/auth'
import { apiUrl } from '../../lib/api'
import { supabase } from '../../lib/supabase'
import { AccountShell, SignedOut } from './AccountShell'
import { OrderStatusBadge } from './OrderStatusBadge'

const downloadProductsForItem = (snapshot: CmsSnapshot, item: OrderItem) => {
  const product = getProductBySlug(snapshot, item.productSlug)
  if (!product) return []
  if (product.productKind === 'Single') return [product]
  return snapshot.products.filter((candidate) => resourceUnlockedByPlan(product, candidate))
}

export function OrderDetailPage({ snapshot, onRefresh }: { snapshot: CmsSnapshot; onRefresh: () => Promise<void> }) {
  const { customer, getAccessToken } = useAuth()
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const { orderId } = useParams()
  const order = orderId ? getOrderById(snapshot, orderId) : undefined
  const isDownloadable = order?.status === 'paid' || order?.status === 'fulfilled'

  // While an order is still pending, poll only its status (cheap) rather than
  // refetching the whole catalogue snapshot; refresh the snapshot once it flips
  // to a downloadable state so the files appear, then stop.
  useEffect(() => {
    if (!customer || !orderId || isDownloadable) return
    let attempts = 0
    const interval = window.setInterval(() => {
      attempts += 1
      void (async () => {
        if (supabase) {
          const { data } = await supabase.from('orders').select('status').eq('id', orderId).maybeSingle()
          const status = (data as { status?: string } | null)?.status
          if (status === 'paid' || status === 'fulfilled') await onRefresh()
        } else {
          await onRefresh()
        }
      })()
      if (attempts >= 20) window.clearInterval(interval)
    }, 3000)
    return () => window.clearInterval(interval)
  }, [customer, onRefresh, isDownloadable, orderId])

  if (!customer) {
    return <SignedOut />
  }

  if (!order) {
    return (
      <StatePanel eyebrow="Customer Account" title="Finalizing order" body="We’re checking for this order. If payment has just completed, it can take a moment to appear.">
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
            <p className="mb-4 rounded-xl border border-line bg-surface-alt px-4 py-3 text-[0.9rem] text-ink-soft">
              Downloads unlock here once payment succeeds. This order is currently <strong>{order.status}</strong>.
            </p>
          ) : null}
          {downloadError ? (
            <p className="mb-4 rounded-xl border border-line bg-surface-alt px-4 py-3 text-[0.9rem] text-ink-soft">{downloadError}</p>
          ) : null}
          <ul className="grid gap-4">
            {order.items.map((item) => {
              const products = downloadProductsForItem(snapshot, item)
              const files = products.flatMap((product) => product.purchasedFiles.map((file) => ({ ...file, productTitle: product.title })))
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
                            {file.productTitle === item.title ? file.label : `${file.productTitle} · ${file.label}`}
                          </span>
                          <Button type="button" variant={downloadable ? 'outline' : 'text'} size="sm" disabled={!downloadable} onClick={() => void download(file.id)}>
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
