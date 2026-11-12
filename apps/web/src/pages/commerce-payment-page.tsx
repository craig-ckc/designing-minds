import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { priceLabel } from '@designing-minds/cms'
import { Button } from '../components/ui/button'
import { Container } from '../components/ui/container'
import { useAuth } from '../lib/auth'
import { useCatalogSnapshot } from '../lib/catalog'
import { loadSignedInAccount } from '../lib/account-data'
import { requestJson } from '../lib/request-json'
import { apiUrl } from '../lib/api'
import { matchingPaymentState, type PaymentOrderState } from '../lib/commerce-payment-state'
import { useNoindex } from '../lib/use-noindex'
import { consumePurchasedPhysicalCart } from '../lib/physical-cart'
import { getCartSlugs, setCartSlugs } from '../lib/cart'

export function CommercePaymentPage() {
  useNoindex()
  const { orderId } = useParams()
  const { customer, getAccessToken } = useAuth()
  const snapshot = useCatalogSnapshot()
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState<PaymentOrderState | null>(null)
  const [actionError, setActionError] = useState<{ customerId: string; orderId: string; message: string } | null>(null)
  const current = matchingPaymentState(loaded, customer?.id, orderId)
  const order = current?.order ?? null
  const error = actionError && actionError.customerId === customer?.id && actionError.orderId === orderId ? actionError.message : current?.error ?? null
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)
  const requestVersion = useRef(0)
  useEffect(() => {
    requestVersion.current += 1
    if (!customer || !orderId || !snapshot.localCommercePreview) return
    let stale = false
    void loadSignedInAccount(customer.id).then((account) => {
      if (stale) return
      const purchase = account.orders.find((entry) => entry.id === orderId)
      if (!purchase) throw new Error('Order not found in this Customer Account.')
      setLoaded({ customerId: customer.id, orderId, order: purchase, error: null })
    }).catch((failure: unknown) => { if (!stale) setLoaded({ customerId: customer.id, orderId, order: null, error: failure instanceof Error ? failure.message : 'Unable to load the sample order.' }) })
    return () => { stale = true; requestVersion.current += 1 }
  }, [customer, orderId, snapshot.localCommercePreview])
  const simulate = async (outcome: 'succeeded' | 'failed' | 'cancelled') => {
    if (lock.current || !orderId || !order || !customer) return
    const version = requestVersion.current
    const actingCustomerId = customer.id
    lock.current = true; setBusy(true); setActionError(null)
    try {
      const token = await getAccessToken()
      if (version !== requestVersion.current) return
      if (!token) throw new Error('Please sign in again.')
      const result = await requestJson<{ status: string }>(apiUrl('/api/commerce/payment/simulate'), { method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ orderId, outcome }) })
      if (version !== requestVersion.current) return
      if (result.status === 'paid' || result.status === 'fulfilled') {
        consumePurchasedPhysicalCart(order.id, order.items)
        const purchased = new Set(order.items.filter((item) => item.productType !== 'physical').map((item) => item.productSlug))
        setCartSlugs(getCartSlugs().filter((slug) => !purchased.has(slug)))
      }
      navigate(`/account/orders/${orderId}`, { replace: true })
    } catch (failure) { if (version === requestVersion.current) setActionError({ customerId: actingCustomerId, orderId, message: failure instanceof Error ? failure.message : 'Unable to update the sample payment.' }) }
    finally { lock.current = false; setBusy(false) }
  }
  if (!snapshot.localCommercePreview) return <Container><div className="section-tight"><h1 className="text-h2">Sample payment unavailable</h1><p className="mt-3">This page is available only in the local sample-data preview.</p><Button to="/account/orders" className="mt-4">Order history</Button></div></Container>
  return <section className="section-tight"><Container><div className="mx-auto grid max-w-form gap-5 rounded-md border border-line bg-surface p-6">
    <p className="text-label font-semibold uppercase tracking-wide text-primary-ink">Local sample payment</p><h1 className="text-h2">Choose a payment outcome</h1>
    <p className="text-body text-ink-soft">No money is collected. This simulates the payment response so you can inspect the order and stock changes.</p>
    {!customer ? <Link to={`/login?redirect=${encodeURIComponent(`/checkout/payment/${orderId}`)}`} className="underline">Sign in to view this order</Link> : order ? <>
      <div className="grid gap-2 border-y border-line py-4"><p className="text-body">{order.reference}</p><strong className="text-h2">{priceLabel(order.totalZar)}</strong><p className="text-label text-muted">Current status: {order.status}</p></div>
      {order.reservationExpiresAt ? <p className="text-label text-muted">Stock reserved until {new Date(order.reservationExpiresAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}.</p> : null}
      {order.status === 'pending' ? <div className="grid gap-3"><Button type="button" variant="solid" disabled={busy} onClick={() => void simulate('succeeded')}>{busy ? 'Updating payment…' : 'Simulate successful payment'}</Button><Button type="button" variant="outline" disabled={busy} onClick={() => void simulate('failed')}>Simulate failed payment</Button><Button type="button" variant="text" disabled={busy} onClick={() => void simulate('cancelled')}>Cancel and release stock</Button></div> : <Button to={`/account/orders/${order.id}`}>View order</Button>}
    </> : !current?.error ? <p role="status">Loading the sample order…</p> : null}
    {error ? <p role="alert" className="text-body text-danger">{error}</p> : null}<Link to="/cart" className="text-body underline">Return to cart</Link>
  </div></Container></section>
}
