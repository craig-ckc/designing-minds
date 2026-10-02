import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Checkbox } from '@base-ui/react/checkbox'
import { type CmsSnapshot, priceLabel, promotionPrice, resolveCartItems } from '@designing-minds/cms'
import { Container } from '../components/ui/container'
import { Breadcrumb } from '../components/ui/breadcrumb'
import { Button } from '../components/ui/button'
import { Icon } from '../components/ui/icon'
import { useAuth } from '../lib/auth'
import { apiUrl } from '../lib/api'
import { requestJson, RequestError } from '../lib/request-json'
import { trackEvent, flushDiagnostics } from '../lib/diagnostics'
import { useCartSlugs } from '../lib/use-cart'
import { useNoindex } from '../lib/use-noindex'

interface PriceQuote {
  items: { productSlug: string; title: string; priceZar: number; originalPriceZar: number; onSale: boolean }[]
  subtotalZar: number
  discountZar: number
  totalZar: number
  couponCode: string | null
  orderId?: string
  basketKey?: string
  customerId?: string
  requestedCode?: string
}

interface CheckoutBaseResponse {
  orderId: string
}

interface PayfastCheckoutResponse extends CheckoutBaseResponse {
  payfast: {
    url: string
    fields: Record<string, string | number | boolean>
  }
}

type CheckoutResponse = PayfastCheckoutResponse

const postToPayfast = ({ url, fields }: PayfastCheckoutResponse['payfast']) => {
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = url
  for (const [key, value] of Object.entries(fields)) {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = key
    input.value = String(value)
    form.appendChild(input)
  }
  document.body.appendChild(form)
  form.submit()
}

export function CheckoutPage({ snapshot }: { snapshot: CmsSnapshot }) {
  useNoindex()
  const navigate = useNavigate()
  const { customer, getAccessToken } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const submittingRef = useRef(false)
  const [submitting, setSubmitting] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const slugs = useCartSlugs()
  const basketKey = JSON.stringify(slugs)
  const customerId = customer?.id
  const [codeInput, setCodeInput] = useState('')
  const [appliedCode, setAppliedCode] = useState('')
  const [quote, setQuote] = useState<PriceQuote | null>(null)
  const [quoting, setQuoting] = useState(false)
  const quoteVersion = useRef(0)
  const quoteValid = quote?.basketKey === basketKey && quote?.customerId === customer?.id && quote?.requestedCode === appliedCode
  const loadQuote = useCallback(async (code: string, clearError = true, signal?: AbortSignal) => {
    const version = ++quoteVersion.current
    if (!customerId || slugs.length === 0) return
    try {
      const token = await getAccessToken()
      if (signal?.aborted || version !== quoteVersion.current) return
      setQuoting(true)
      setQuote(null)
      if (clearError) setError(null)
      if (!token) throw new Error('Please sign in again to check prices.')
      const result = await requestJson<PriceQuote>(apiUrl('/api/checkout-quote'), {
        method: 'POST',
        signal,
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ items: slugs.map((productSlug) => ({ productSlug })), couponCode: code }),
      })
      if (version === quoteVersion.current && !signal?.aborted) setQuote({ ...result, basketKey, customerId, requestedCode: code })
    } catch (failure) {
      if (version === quoteVersion.current && !signal?.aborted) setError(failure instanceof Error ? failure.message : 'Unable to check prices.')
    } finally {
      if (version === quoteVersion.current && !signal?.aborted) setQuoting(false)
    }
  }, [customerId, getAccessToken, slugs, basketKey])
  useEffect(() => {
    const controller = new AbortController()
    // Start external work after commit; an aborted effect never starts a request.
    void Promise.resolve().then(() => {
      if (!controller.signal.aborted) return loadQuote(appliedCode, true, controller.signal)
    })
    return () => controller.abort()
  }, [loadQuote, appliedCode, snapshot])
  // Same shared /shop space as the cart: bundle slugs must resolve here too,
  // and they travel to the payment flow as productSlug lines like everything else.
  const items = resolveCartItems(snapshot, slugs)
  const total = items.reduce(
    (sum, item) => sum + promotionPrice(item.kind === 'product' ? item.product : item.bundle),
    0,
  )

  const pay = async () => {
    if (submittingRef.current) return
    if (!customer) {
      navigate('/login?redirect=/checkout')
      return
    }
    if (items.length === 0) {
      setError('Your cart is empty.')
      return
    }
    if (!acceptedTerms) {
      setError('Please agree to the Terms of Use before continuing.')
      return
    }

    if (!quoteValid || !quote || quoting) {
      setError('Please check the order total before paying.')
      return
    }
    submittingRef.current = true
    const requestId = crypto.randomUUID()
    trackEvent('checkout.started', { requestId })
    setSubmitting(true)
    setError(null)
    try {
      const token = await getAccessToken()
      if (!token) throw new Error('Authentication required.')
      const checkout = await requestJson<CheckoutResponse>(apiUrl('/api/checkout'), {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-request-id': requestId,
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: items.map((item) => ({ productSlug: item.kind === 'product' ? item.product.slug : item.bundle.slug })),
          acceptedTerms: true,
          couponCode: appliedCode,
          expectedTotalZar: quote.totalZar,
        }),
      })
      if ('payfast' in checkout && checkout.payfast?.url && checkout.payfast.fields) {
        trackEvent('checkout.handoff', { requestId })
        void flushDiagnostics()
        postToPayfast(checkout.payfast)
        return
      }
      throw new Error('Checkout response did not include a payment handoff.')
    } catch (e) {
      const reference = e instanceof RequestError ? e.requestId : requestId
      trackEvent('checkout.failed', { requestId: reference, errorKind: e instanceof Error ? e.name : 'Error' })
      setError(`${e instanceof Error ? e.message : 'Unable to start checkout.'} Reference: ${reference}`)
      submittingRef.current = false
      setSubmitting(false)
      void loadQuote(appliedCode, false)
    }
  }

  return (
    <section className="section">
      <Container>
        <Breadcrumb trail={[{ to: '/', label: 'Home' }, { to: '/cart', label: 'Cart' }]} current="Checkout" />
        <h1 className="mb-8 text-page-title">Checkout</h1>

        <div className="mx-auto grid max-w-xl gap-4">
          {/* Account status first — a slim confirmation, not a whole column. */}
          {customer ? (
            <div className="flex items-center gap-3 rounded-card border border-line bg-surface p-4">
              <span className="grid h-10 w-10 flex-none place-items-center rounded-pill bg-primary-tint text-primary">
                <span className="h-5 w-5">
                  <Icon name="user" />
                </span>
              </span>
              <p className="text-body-sm text-ink-soft">
                Signed in as <strong className="text-ink">{customer.email}</strong>
              </p>
            </div>
          ) : (
            <div className="rounded-card border border-line bg-surface p-5">
              <p className="text-body-sm text-muted">
                Checkout requires a Customer Account.{' '}
                <Link to="/login?redirect=/checkout" className="text-ink underline underline-offset-4">
                  Log in
                </Link>{' '}
                or{' '}
                <Link to="/sign-up?redirect=/checkout" className="text-ink underline underline-offset-4">
                  create one
                </Link>
                .
              </p>
            </div>
          )}

          {/* Then the order details underneath. */}
          <form
            className="grid gap-4 rounded-card border border-line bg-surface p-6"
            onSubmit={(event) => {
              event.preventDefault()
              void pay()
            }}
          >
            <h2>Order summary</h2>
            {items.length > 0 ? (
              <ul className="grid gap-2 text-body-sm">
                {items.map((item) => {
                  const record = item.kind === 'product' ? item.product : item.bundle
                  return (
                    <li key={record.slug} className="flex justify-between gap-3">
                      <span className="text-ink-soft">{record.title}</span>
                      <span>
                        {(() => {
                          const line = quoteValid ? quote?.items.find((entry) => entry.productSlug === record.slug) : null
                          const price = line?.priceZar ?? promotionPrice(record)
                          const original = line?.originalPriceZar ?? record.priceZar
                          return <>{price < original ? <s className="mr-2 text-muted">{priceLabel(original)}</s> : null}{priceLabel(price)}</>
                        })()}
                      </span>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-body-sm text-muted">Your cart is empty.</p>
            )}
            <div className="grid gap-2 border-t border-line pt-3">
              <label htmlFor="discount-code" className="text-body-sm font-semibold">Discount code</label>
              <div className="flex flex-wrap gap-2">
                <input id="discount-code" value={codeInput} maxLength={40} autoComplete="off" spellCheck={false}
                  onChange={(event) => setCodeInput(event.target.value)} disabled={submitting || quoting}
                  className="min-w-0 flex-1 rounded-control border border-line bg-surface px-3 py-2 text-body-sm" />
                <Button type="button" variant="outline" disabled={!customer || !codeInput.trim() || submitting || quoting}
                  onClick={() => {
                    const code = codeInput.trim().toUpperCase()
                    if (code === appliedCode) void loadQuote(code)
                    else setAppliedCode(code)
                  }}>Apply</Button>
                {appliedCode ? <Button type="button" variant="text" disabled={submitting || quoting}
                  onClick={() => { setCodeInput(''); setAppliedCode('') }}>Remove</Button> : null}
              </div>
              <p className="text-label text-muted">Each code can be used once per customer.{!customer ? ' Sign in to apply a code.' : ''}</p>
            </div>
            {customer && !quoteValid && !quoting ? <Button type="button" variant="outline" disabled={submitting}
              onClick={() => void loadQuote(appliedCode)}>Check prices again</Button> : null}
            {quoting ? <p role="status" className="text-body-sm text-muted">Checking prices…</p> : null}
            {quoteValid && quote && quote.discountZar > 0 ? (
              <div className="grid gap-2 text-body-sm" aria-live="polite">
                <div className="flex justify-between"><span>Subtotal</span><span>{priceLabel(quote.subtotalZar)}</span></div>
                <div className="flex justify-between"><span>Discount ({quote.couponCode})</span><span>−{priceLabel(quote.discountZar)}</span></div>
              </div>
            ) : null}
            {quoteValid && quote?.orderId ? <p className="text-label text-muted">This resumes your pending payment at its original total.</p> : null}
            <div className="flex justify-between border-t border-line pt-3 text-[1.1rem] font-semibold">
              <span>Total</span>
              <span>{priceLabel(quoteValid && quote ? quote.totalZar : total)}</span>
            </div>
            {error ? (
              <p role="alert" className="rounded-control border border-line bg-surface-alt px-3 py-2 text-body-sm text-ink-soft">{error}</p>
            ) : null}
            <div className="flex items-start gap-3 rounded-control bg-surface-alt p-4 text-body-sm text-ink-soft">
              <Checkbox.Root
                id="accepted-terms"
                name="acceptedTerms"
                checked={acceptedTerms}
                onCheckedChange={setAcceptedTerms}
                required
                nativeButton
                render={<button type="button" />}
                className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-[0.35rem] border border-line-strong bg-canvas text-on-primary transition data-checked:border-primary data-checked:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <Checkbox.Indicator className="flex data-unchecked:hidden">
                  <Icon name="check" size={16} weight="bold" />
                </Checkbox.Indicator>
              </Checkbox.Root>
              <label htmlFor="accepted-terms" className="cursor-pointer">
                I have read and agree to the{' '}
                <Link
                  to="/terms"
                  className="font-semibold text-primary-ink underline underline-offset-4 hover:text-primary-ink-strong"
                >
                  Terms of Use
                </Link>
                .
              </label>
            </div>
            <Button
              type="submit"
              variant="solid"
              className="w-full"
              disabled={submitting || quoting || (Boolean(customer) && !quoteValid) || items.length === 0 || !acceptedTerms}
            >
              {submitting ? 'Redirecting…' : 'Pay with PayFast'}
            </Button>
            <p className="text-label text-muted">Single payment. Downloads unlock only after PayFast confirms payment.</p>
          </form>
        </div>
      </Container>
    </section>
  )
}
