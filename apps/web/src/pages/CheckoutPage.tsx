import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { type CmsSnapshot, priceLabel, publishedProducts } from '@designing-minds/cms'
import { Container } from '../components/ui/Container'
import { Breadcrumb } from '../components/ui/Breadcrumb'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Select'
import { useAuth } from '../lib/auth'
import { apiUrl } from '../lib/api'
import { getCartSlugs } from '../lib/cart'
import { useNoindex } from '../lib/useNoindex'

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

  // Access Plans are sold "for a selected grade"; the buyer picks one here.
  const planItems = items.filter((item) => item.productKind === 'Access Plan')
  const [grades, setGrades] = useState<Record<string, string>>({})
  const missingGrade = planItems.some((item) => !grades[item.slug])

  const pay = async () => {
    if (!customer) {
      navigate('/login?redirect=/checkout')
      return
    }
    if (items.length === 0) {
      setError('Your cart is empty.')
      return
    }
    if (missingGrade) {
      setError('Choose a grade for each access plan.')
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
        body: JSON.stringify({ items: items.map((item) => ({ productSlug: item.slug, grade: grades[item.slug] })) }),
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
        <h1 className="mb-8 text-[2rem]">Checkout</h1>

        <div className="grid items-start gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div className="grid gap-6">
            <div className="grid gap-6 rounded-[10px] border border-line p-6">
              <h3>Your account</h3>
              {customer ? (
                <p className="text-[0.92rem] text-muted">
                  Signed in as <strong>{customer.email}</strong>.
                </p>
              ) : (
                <p className="text-[0.92rem] text-muted">
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
              )}
              {error ? <p className="rounded-md border border-line bg-surface-alt px-3 py-2 text-[0.9rem] text-ink-soft">{error}</p> : null}
            </div>

            {planItems.length > 0 ? (
              <div className="grid gap-4 rounded-[10px] border border-line p-6">
                <div>
                  <h3>Choose your grade</h3>
                  <p className="text-[0.88rem] text-muted">Each access plan unlocks one grade. Pick the grade for each plan before paying.</p>
                </div>
                {planItems.map((item) => (
                  <Select
                    key={item.slug}
                    label={item.title}
                    value={grades[item.slug] ?? ''}
                    options={item.includedGrades ?? []}
                    onChange={(grade) => setGrades((prev) => ({ ...prev, [item.slug]: grade }))}
                  />
                ))}
              </div>
            ) : null}
          </div>

          <aside className="grid gap-4 rounded-[10px] border border-line p-6 lg:sticky lg:top-24">
            <h3>Order summary</h3>
            {items.length > 0 ? (
              <ul className="grid gap-2 text-[0.92rem]">
                {items.map((item) => (
                  <li key={item.slug} className="flex justify-between gap-3">
                    <span className="text-ink-soft">{item.title}</span>
                    <span>{priceLabel(item.priceZar)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[0.9rem] text-muted">Your cart is empty.</p>
            )}
            <div className="flex justify-between border-t border-line pt-3 text-[1.1rem] font-semibold">
              <span>Total</span>
              <span>{priceLabel(total)}</span>
            </div>
            <Button type="button" variant="solid" className="w-full" onClick={() => void pay()} disabled={submitting || items.length === 0 || missingGrade}>
              {submitting ? 'Redirecting…' : 'Pay with PayFast'}
            </Button>
            <p className="text-[0.82rem] text-muted">Single payment. Downloads unlock only after PayFast confirms payment.</p>
          </aside>
        </div>
      </Container>
    </section>
  )
}
