import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { deliveryValidation, normalizeDeliveryPhone, priceLabel, type CommerceCheckoutResponse, type CommerceInput, type CommerceQuote, type DeliveryDetails } from '@designing-minds/cms'
import { Button } from '../components/ui/button'
import { Container } from '../components/ui/container'
import { Breadcrumb } from '../components/ui/breadcrumb'
import { useAuth } from '../lib/auth'
import { useCartSlugs } from '../lib/use-cart'
import { usePhysicalCartLines } from '../lib/physical-cart'
import { useCatalogSnapshot } from '../lib/catalog'
import { apiUrl } from '../lib/api'
import { requestJson } from '../lib/request-json'
import { SummaryLine } from '../components/summary-line'
import { SummaryRow } from '../components/ui/summary-row'
import { useNoindex } from '../lib/use-noindex'
import { postToPayment } from '../lib/payment-handoff'
import { TermsCheckbox } from '../components/checkout/terms-checkbox'
import { TextLink } from '../components/ui/text-link'

const emptyDelivery: DeliveryDetails = { recipientName: '', phone: '', addressLine1: '', addressLine2: '', suburb: '', city: '', province: '', postalCode: '', country: 'ZA' }
const addressFields = [
  ['recipientName', 'Recipient name', 'name'], ['phone', 'Mobile number', 'tel'],
  ['addressLine1', 'Street address', 'address-line1'], ['addressLine2', 'Address line 2 (optional)', 'address-line2'],
  ['suburb', 'Suburb', 'address-level3'], ['city', 'City / town', 'address-level2'],
  ['province', 'Province', 'address-level1'], ['postalCode', 'Postal code', 'postal-code'],
] as const

export function CommerceCheckout() {
  useNoindex()
  const snapshot = useCatalogSnapshot()
  const { customer, getAccessToken } = useAuth()
  const navigate = useNavigate()
  const digitalSlugs = useCartSlugs()
  const physicalItems = usePhysicalCartLines()
  const [delivery, setDelivery] = useState<DeliveryDetails>(emptyDelivery)
  const [codeInput, setCodeInput] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [terms, setTerms] = useState(false)
  const [quote, setQuote] = useState<{ key: string; value: CommerceQuote } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [quoting, setQuoting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const busy = useRef(false)
  const version = useRef(0)
  const preserveQuoteError = useRef(false)
  const input = useMemo<CommerceInput>(() => ({ digitalSlugs, physicalItems, couponCode }), [digitalSlugs, physicalItems, couponCode])
  const basketKey = JSON.stringify([customer?.id, input])
  const currentBasketKey = useRef(basketKey)
  useLayoutEffect(() => {
    currentBasketKey.current = basketKey
  }, [basketKey])
  const hasItems = digitalSlugs.length + physicalItems.length > 0
  const hasPhysical = physicalItems.length > 0
  const currentQuote = quote?.key === basketKey ? quote.value : null
  const loadQuote = useCallback(async (signal: AbortSignal, keepError = false) => {
    const requestVersion = ++version.current
    if (!customer || !hasItems) return
    setQuoting(true)
    setQuote(null)
    if (!keepError) setError(null)
    try {
      const token = await getAccessToken()
      if (!token) throw new Error('Please sign in again to check prices.')
      const result = await requestJson<CommerceQuote>(apiUrl('/api/commerce/quote'), { method: 'POST', signal,
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify(input) })
      if (!signal.aborted && requestVersion === version.current) setQuote({ key: basketKey, value: result })
    } catch (failure) {
      if (!signal.aborted && requestVersion === version.current) setError(failure instanceof Error ? failure.message : 'Unable to check prices.')
    } finally { if (!signal.aborted && requestVersion === version.current) setQuoting(false) }
  }, [basketKey, customer, hasItems, input, getAccessToken])
  useEffect(() => {
    const controller = new AbortController()
    void Promise.resolve().then(() => {
      if (controller.signal.aborted) return
      const keepError = preserveQuoteError.current
      preserveQuoteError.current = false
      return loadQuote(controller.signal, keepError)
    })
    return () => { controller.abort(); version.current += 1 }
  }, [loadQuote, refresh])

  const submit = async () => {
    if (busy.current) return
    if (!customer) { navigate('/login?redirect=/checkout'); return }
    if (!currentQuote || !hasItems) { setError('Check the current prices before continuing.'); return }
    if (!terms) { setError('Please agree to the Terms of Use.'); return }
    if (hasPhysical) {
      const issue = deliveryValidation(delivery)
      if (issue) { setError(issue); return }
    }
    busy.current = true; setSubmitting(true); setError(null)
    const submittedBasketKey = basketKey
    try {
      const token = await getAccessToken()
      if (!token) throw new Error('Please sign in again before paying.')
      if (currentBasketKey.current !== submittedBasketKey) {
        busy.current = false
        setSubmitting(false)
        return
      }
      const checkout = await requestJson<CommerceCheckoutResponse>(apiUrl('/api/commerce/checkout'), { method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...input, delivery: hasPhysical ? { ...delivery, phone: normalizeDeliveryPhone(delivery.phone) } : null,
          shippingOptionId: currentQuote.shippingOption?.id ?? null, acceptedTerms: terms, expectedTotalZar: currentQuote.totalZar }) })
      if (currentBasketKey.current !== submittedBasketKey) {
        busy.current = false
        setSubmitting(false)
        return
      }
      if (checkout.simulation && snapshot.localCommercePreview) { navigate(`/checkout/payment/${checkout.orderId}`); return }
      if (checkout.payfast) { postToPayment(checkout.payfast); return }
      throw new Error('A payment handoff was not returned. Your order may still be pending; check Order History before trying again.')
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to start checkout.')
      preserveQuoteError.current = true
      setRefresh((value) => value + 1)
      busy.current = false
      setSubmitting(false)
    }
  }

  return <section className="section-tight"><Container>
    <Breadcrumb trail={[{ to: '/', label: 'Home' }, { to: '/cart', label: 'Cart' }]} current="Checkout" />
    <h1 className="mb-6 text-h2">Checkout</h1>
    {!hasItems ? <div className="rounded-md border border-line bg-surface p-6"><p>Your cart is empty.</p><Button to="/shop" className="mt-4">Continue shopping</Button></div> : <form className="grid items-start gap-8 lg:grid-cols-[1fr_1fr]" onSubmit={(event) => { event.preventDefault(); void submit() }}>
      <div className="grid gap-5">
        <section className="rounded-md border border-line bg-surface p-5"><h2 className="mb-3 text-h4">Your account</h2>
          {customer ? <p className="text-body text-ink-soft">Signed in as <strong>{customer.email}</strong></p> : <p className="text-body text-ink-soft">Sign in to continue. <Link to="/login?redirect=/checkout" className="font-semibold underline">Log in</Link> or <Link to="/sign-up?redirect=/checkout" className="underline">create a Customer Account</Link>.</p>}
        </section>
        {hasPhysical ? <section className="rounded-md border border-line bg-surface p-5"><h2 className="mb-2 text-h4">Delivery details</h2><p className="mb-4 text-body text-muted">Your physical products will be delivered together. Digital resources appear in your account after payment.</p>
          <div className="grid gap-4 sm:grid-cols-2">{addressFields.map(([key, label, autoComplete]) => <label key={key} className={`grid gap-2 text-body font-medium ${key === 'addressLine1' || key === 'addressLine2' ? 'sm:col-span-2' : ''}`}>{label}<input className="field w-full font-normal" name={key} autoComplete={autoComplete} value={delivery[key] ?? ''} maxLength={200} required={key !== 'addressLine2'} disabled={submitting} inputMode={key === 'phone' ? 'tel' : key === 'postalCode' ? 'numeric' : undefined} onChange={(event) => setDelivery((current) => ({ ...current, [key]: event.target.value }))} /></label>)}</div>
          <p className="mt-4 text-label text-muted">South Africa only.</p>
        </section> : null}
      </div>
      <section className="grid gap-4 rounded-md border border-line bg-surface p-5 lg:sticky lg:top-[var(--sticky-offset)]"><h2 className="text-h4">Order summary</h2>
        {quoting ? <p role="status" className="text-body text-muted">Checking prices and availability…</p> : null}
        {currentQuote ? <>
          <ul className="grid gap-2">{currentQuote.items.map((item) => <SummaryLine key={item.cartLineId ?? item.id} snapshot={snapshot} slug={item.productSlug} title={item.title} physical={item.productType === 'physical'} quantity={item.quantity} values={{ ...item.optionValues, ...item.customizations }} price={item.priceZar} />)}</ul>
          <div className="grid gap-2 border-t border-line pt-3"><SummaryRow label="Subtotal" value={priceLabel(currentQuote.subtotalZar)} />{currentQuote.discountZar > 0 ? <SummaryRow label={`Discount (${currentQuote.couponCode})`} value={`−${priceLabel(currentQuote.discountZar)}`} /> : null}
          {currentQuote.shippingOption ? <SummaryRow label={currentQuote.shippingOption.label} value={priceLabel(currentQuote.shippingZar)} /> : <SummaryRow label="Delivery" value="Not required" />}
          <SummaryRow label="Total" value={priceLabel(currentQuote.totalZar)} emphasis="total" /></div>
        </> : <p className="text-body text-muted">Your final total appears after you sign in and prices are checked.</p>}
        <div className="grid gap-2 border-t border-line pt-3"><label htmlFor="commerce-code" className="text-body font-semibold">Discount code</label><div className="flex gap-2"><input id="commerce-code" className="min-h-[var(--control-h)] min-w-0 flex-1 rounded-md border border-line bg-surface px-3 py-2 text-body" maxLength={40} value={codeInput} disabled={submitting || quoting} onChange={(event) => setCodeInput(event.target.value)} /><Button type="button" variant="outline" disabled={!customer || quoting || submitting || !codeInput.trim()} onClick={() => { setCouponCode(codeInput.trim().toUpperCase()); setRefresh((value) => value + 1) }}>Apply</Button>{couponCode ? <Button type="button" variant="text" disabled={submitting || quoting} onClick={() => { setCodeInput(''); setCouponCode('') }}>Remove</Button> : null}</div><p className="text-label text-muted">Codes apply to eligible digital resources only. Delivery is charged once.</p></div>
        {error ? <p role="alert" className="rounded-md bg-danger-tint p-3 text-body text-danger">{error}</p> : null}
        {customer && !currentQuote && !quoting ? <Button type="button" variant="outline" onClick={() => setRefresh((value) => value + 1)}>Check prices again</Button> : null}
        <TermsCheckbox checked={terms} onChange={setTerms} disabled={submitting}>I have read and agree to the <TextLink to="/terms" tone="soft" className="font-semibold">Terms of Use</TextLink>.</TermsCheckbox>
        <Button type="submit" variant="solid" disabled={submitting || quoting || !currentQuote || !terms || !customer}>{submitting ? 'Starting payment…' : snapshot.localCommercePreview ? 'Continue to sample payment' : 'Pay with PayFast'}</Button>
        <p className="text-label text-muted">{snapshot.localCommercePreview ? 'Local sample payment only. No money is collected.' : 'Your stock is reserved while you complete payment.'}</p>
      </section>
    </form>}
  </Container></section>
}

