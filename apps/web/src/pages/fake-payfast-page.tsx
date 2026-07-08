import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Container } from '../components/ui/container'
import { Breadcrumb } from '../components/ui/breadcrumb'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { StatePanel } from '../components/ui/state-panel'
import { apiUrl } from '../lib/api'
import { clearCart } from '../lib/cart'
import { useAuth } from '../lib/auth'
import { useNoindex } from '../lib/use-noindex'

interface CompleteResponse {
  orderId: string
  status: string
}

export function FakePayfastPage() {
  useNoindex()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { getAccessToken } = useAuth()
  const orderId = useMemo(() => params.get('order') ?? '', [params])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const completePayment = async () => {
    if (!orderId) return
    setSubmitting(true)
    setError(null)
    try {
      const token = await getAccessToken()
      if (!token) throw new Error('Authentication required.')
      const response = await fetch(apiUrl('/api/fake-payfast/complete'), {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId }),
      })
      const body = (await response.json()) as CompleteResponse | { error?: string }
      if (!response.ok) throw new Error('error' in body && body.error ? body.error : 'Unable to complete fake payment.')
      clearCart()
      navigate(`/account/orders/${(body as CompleteResponse).orderId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to complete fake payment.')
      setSubmitting(false)
    }
  }

  if (!orderId) {
    return <StatePanel eyebrow="Fake PayFast" title="Missing order" body="Start checkout again to create a test payment." />
  }

  return (
    <section className="section">
      <Container>
        <Breadcrumb trail={[{ to: '/', label: 'Home' }, { to: '/cart', label: 'Cart' }, { to: '/checkout', label: 'Checkout' }]} current="Fake PayFast" />
        <Card variant="surface" pad="md" className="mx-auto grid max-w-prose gap-6">
          <div>
            <p className="text-caption font-semibold uppercase tracking-[0.12em] text-muted">PayFast test mode</p>
            <h1 className="mt-2 text-page-title">Simulate payment</h1>
            <p className="mt-3 text-muted">
              This test page replaces the PayFast handoff for order <strong>{orderId}</strong>.
            </p>
          </div>

          {error ? <p className="rounded-control border border-line bg-surface-alt px-3 py-2 text-body-sm text-ink-soft">{error}</p> : null}

          <div className="grid gap-3 border-t border-line pt-5 sm:grid-cols-2">
            <Button type="button" variant="solid" onClick={() => void completePayment()} disabled={submitting}>
              {submitting ? 'Processing…' : 'Simulate successful payment'}
            </Button>
            <Button to={`/checkout/cancel?order=${orderId}`} variant="outline">
              Simulate cancelled payment
            </Button>
          </div>

          <p className="text-label text-muted">
            Successful test payments mark the pending PayFast payment as succeeded and unlock the order exactly like a completed ITN.
          </p>
          <Link to="/checkout" className="text-body-sm text-ink underline underline-offset-4">
            Return to checkout
          </Link>
        </Card>
      </Container>
    </section>
  )
}
