import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { type CmsSnapshot, individualResources, priceLabel } from '@designing-minds/cms'
import { Container } from '../components/ui/Container'
import { Breadcrumb } from '../components/ui/Breadcrumb'
import { Field } from '../components/ui/Field'
import { Button } from '../components/ui/Button'
import { useAuth } from '../lib/auth'
import { useNoindex } from '../lib/useNoindex'

export function CheckoutPage({ snapshot }: { snapshot: CmsSnapshot }) {
  useNoindex()
  const navigate = useNavigate()
  const { login } = useAuth()
  const items = useMemo(() => individualResources(snapshot).slice(0, 2), [snapshot])
  const total = items.reduce((sum, item) => sum + item.priceZar, 0)
  const demoOrder = snapshot.orders[0]

  // Wireframe: checkout requires a Customer Account, so "pay" signs in (creating
  // the session) and lands on the order's detail page where files unlock.
  const pay = () => {
    login()
    if (demoOrder) navigate(`/account/orders/${demoOrder.id}`)
  }

  return (
    <section className="section">
      <Container>
        <Breadcrumb trail={[{ to: '/', label: 'Home' }, { to: '/cart', label: 'Cart' }]} current="Checkout" />
        <h1 className="mb-8 text-[2rem]">Checkout</h1>

        <div className="grid items-start gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div className="grid gap-8">
            {/* Step 1 — account */}
            <div className="grid gap-4 rounded-[10px] border border-line p-6">
              <div className="flex items-center gap-3">
                <Step n={1} />
                <h3>Your account</h3>
              </div>
              <p className="text-[0.92rem] text-muted">
                Checkout requires a Customer Account so your downloads are saved.{' '}
                <Link to="/login?redirect=/checkout" className="text-ink underline underline-offset-4">
                  Log in
                </Link>{' '}
                or{' '}
                <Link to="/sign-up?redirect=/checkout" className="text-ink underline underline-offset-4">
                  create one
                </Link>
                .
              </p>
              <Field label="Email">
                <input className="field" type="email" placeholder="you@example.com" autoComplete="email" />
              </Field>
            </div>

            {/* Step 2 — payment */}
            <div className="grid gap-4 rounded-[10px] border border-line p-6">
              <div className="flex items-center gap-3">
                <Step n={2} />
                <h3>Payment</h3>
              </div>
              <Field label="Card number">
                <input className="field" inputMode="numeric" placeholder="0000 0000 0000 0000" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Expiry">
                  <input className="field" placeholder="MM / YY" />
                </Field>
                <Field label="CVC">
                  <input className="field" placeholder="123" />
                </Field>
              </div>
              <p className="text-[0.82rem] text-muted">
                Single payment — Access Plans are one-time purchases and do not auto-renew.
              </p>
            </div>
          </div>

          <aside className="grid gap-4 rounded-[10px] border border-line p-6 lg:sticky lg:top-24">
            <h3>Order summary</h3>
            <ul className="grid gap-2 text-[0.92rem]">
              {items.map((item) => (
                <li key={item.slug} className="flex justify-between gap-3">
                  <span className="text-ink-soft">{item.title}</span>
                  <span>{priceLabel(item.priceZar)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between border-t border-line pt-3 text-[1.1rem] font-semibold">
              <span>Total</span>
              <span>{priceLabel(total)}</span>
            </div>
            <Button type="button" variant="solid" className="w-full" onClick={pay}>
              Pay now
            </Button>
            <p className="text-[0.82rem] text-muted">
              On success you’ll land on your Order Detail page, where your files unlock for download.
            </p>
          </aside>
        </div>
      </Container>
    </section>
  )
}

function Step({ n }: { n: number }) {
  return (
    <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-[0.85rem] font-semibold text-white">{n}</span>
  )
}
