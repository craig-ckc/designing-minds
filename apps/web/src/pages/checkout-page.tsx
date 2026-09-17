import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Checkbox } from '@base-ui/react/checkbox'
import { type CmsSnapshot, priceLabel, resolveCartItems } from '@designing-minds/cms'
import { Container } from '../components/ui/container'
import { Breadcrumb } from '../components/ui/breadcrumb'
import { Button } from '../components/ui/button'
import { Icon } from '../components/ui/icon'
import { useAuth } from '../lib/auth'
import { apiUrl } from '../lib/api'
import { requestJson, RequestError } from '../lib/request-json'
import { trackEvent, flushDiagnostics } from '../lib/diagnostics'
import { getCartSlugs } from '../lib/cart'
import { useNoindex } from '../lib/use-noindex'

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
  const slugs = useMemo(() => getCartSlugs(), [])
  // Same shared /shop space as the cart: bundle slugs must resolve here too,
  // and they travel to the payment flow as productSlug lines like everything else.
  const items = resolveCartItems(snapshot, slugs)
  const total = items.reduce(
    (sum, item) => sum + (item.kind === 'product' ? item.product.priceZar : item.bundle.priceZar),
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
                      <span>{priceLabel(record.priceZar)}</span>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-body-sm text-muted">Your cart is empty.</p>
            )}
            <div className="flex justify-between border-t border-line pt-3 text-[1.1rem] font-semibold">
              <span>Total</span>
              <span>{priceLabel(total)}</span>
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
            <Button type="submit" variant="solid" className="w-full" disabled={submitting || items.length === 0}>
              {submitting ? 'Redirecting…' : 'Pay with PayFast'}
            </Button>
            <p className="text-label text-muted">Single payment. Downloads unlock only after PayFast confirms payment.</p>
          </form>
        </div>
      </Container>
    </section>
  )
}
