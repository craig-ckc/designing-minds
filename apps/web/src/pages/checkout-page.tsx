import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { type CmsSnapshot, priceLabel, publishedProducts } from '@designing-minds/cms'
import { Container } from '../components/ui/container'
import { Breadcrumb } from '../components/ui/breadcrumb'
import { Button } from '../components/ui/button'
import { Icon } from '../components/ui/icon'
import { useAuth } from '../lib/auth'
import { apiUrl } from '../lib/api'
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

interface FakePayfastCheckoutResponse extends CheckoutBaseResponse {
  fakePayfast: {
    path: string
  }
}

type CheckoutResponse = PayfastCheckoutResponse | FakePayfastCheckoutResponse

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
  const [submitting, setSubmitting] = useState(false)
  const slugs = useMemo(() => getCartSlugs(), [])
  const items = slugs
    .map((slug) => publishedProducts(snapshot).find((p) => p.slug === slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
  const total = items.reduce((sum, item) => sum + item.priceZar, 0)

  const pay = async () => {
    if (!customer) {
      navigate('/login?redirect=/checkout')
      return
    }
    if (items.length === 0) {
      setError('Your cart is empty.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const token = await getAccessToken()
      if (!token) throw new Error('Authentication required.')
      const response = await fetch(apiUrl('/api/checkout'), {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items: items.map((item) => ({ productSlug: item.slug })) }),
      })
      const body = (await response.json()) as CheckoutResponse | { error?: string }
      if (!response.ok) throw new Error('error' in body && body.error ? body.error : 'Unable to start checkout.')
      const checkout = body as CheckoutResponse
      if ('fakePayfast' in checkout && checkout.fakePayfast) {
        navigate(checkout.fakePayfast.path)
        return
      }
      if ('payfast' in checkout) {
        postToPayfast(checkout.payfast)
        return
      }
      throw new Error('Checkout response did not include a payment handoff.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to start checkout.')
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
          <div className="grid gap-4 rounded-card border border-line bg-surface p-6">
            <h3>Order summary</h3>
            {items.length > 0 ? (
              <ul className="grid gap-2 text-body-sm">
                {items.map((item) => (
                  <li key={item.slug} className="flex justify-between gap-3">
                    <span className="text-ink-soft">{item.title}</span>
                    <span>{priceLabel(item.priceZar)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-body-sm text-muted">Your cart is empty.</p>
            )}
            <div className="flex justify-between border-t border-line pt-3 text-[1.1rem] font-semibold">
              <span>Total</span>
              <span>{priceLabel(total)}</span>
            </div>
            {error ? (
              <p className="rounded-control border border-line bg-surface-alt px-3 py-2 text-body-sm text-ink-soft">{error}</p>
            ) : null}
            <Button type="button" variant="solid" className="w-full" onClick={() => void pay()} disabled={submitting || items.length === 0}>
              {submitting ? 'Redirecting…' : 'Pay with PayFast'}
            </Button>
            <p className="text-label text-muted">Single payment. Downloads unlock only after PayFast confirms payment.</p>
          </div>
        </div>
      </Container>
    </section>
  )
}
