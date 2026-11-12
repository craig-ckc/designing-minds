import { type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Notice } from '../../components/ui/notice'
import { useNoindex } from '../../lib/use-noindex'

/**
 * Shared shell for the noindex authentication pages: a full-width painted
 * backdrop with one floating white card. `footer` is the "other route" block
 * (prompt + action) under a divider; the support line is added here.
 */
export function AuthLayout({
  title,
  intro,
  children,
  footer,
  onSubmit,
}: {
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
    <section className="auth-stage">
      <img
        className="auth-stage__backdrop"
        src="/images/paintings/auth-hills-wildflowers.avif"
        width={1536}
        height={864}
        alt=""
        decoding="async"
      />
      <div className="auth-card">
        <div>
          <h1 className="text-h2">{title}</h1>
          <p className="mt-2 text-body text-muted">{intro}</p>
        </div>

        {fromCheckout ? (
          <Notice tone="info">
            You need an account to complete checkout. Sign in or create one to continue.
          </Notice>
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

        <div className="auth-footer">
          {footer}
          <p className="text-body text-muted">
            Need help? <Link to="/help">Visit support</Link>
          </p>
        </div>
      </div>
    </section>
  )
}
