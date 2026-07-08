import { type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Container } from '../../components/ui/container'
import { Eyebrow } from '../../components/ui/eyebrow'
import { Button } from '../../components/ui/button'
import { useNoindex } from '../../lib/use-noindex'

/** Shared Shell for the noindex authentication pages. */
export function AuthLayout({
  eyebrow,
  title,
  intro,
  children,
  footer,
  onSubmit,
}: {
  eyebrow: string
  title: string
  intro: string
  children: ReactNode
  footer: ReactNode
  onSubmit?: () => void
}) {
  useNoindex()
  const [params] = useSearchParams()
  const fromCheckout = params.get('redirect') === '/checkout'

  return (
    <section className="section">
      <Container>
        <div className="mx-auto grid max-w-[440px] gap-6">
          <div>
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1 className="text-[2rem]">{title}</h1>
            <p className="mt-3 text-muted">{intro}</p>
          </div>

          {fromCheckout ? (
            <p className="rounded-2xl border border-primary/30 bg-primary-tint px-4 py-3 text-[0.9rem] text-ink-soft">
              You need an account to complete checkout. Sign in or create one to continue.
            </p>
          ) : null}

          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              onSubmit?.()
            }}
          >
            {children}
          </form>

          {fromCheckout ? (
            <Button to="/checkout" variant="text">
              Return to checkout
            </Button>
          ) : null}

          <div className="border-t border-line pt-4 text-[0.92rem] text-muted">{footer}</div>
          <p className="text-[0.85rem] text-muted">
            Need help? <Link to="/help" className="font-semibold text-primary underline underline-offset-4">Visit support</Link>
          </p>
        </div>
      </Container>
    </section>
  )
}
