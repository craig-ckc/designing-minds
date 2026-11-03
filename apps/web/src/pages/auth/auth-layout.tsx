import { type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ResourceStack } from '../../components/ui/resource-stack'
import { Section } from '../../components/ui/section'
import { Button } from '../../components/ui/button'
import { Notice } from '../../components/ui/notice'
import { useNoindex } from '../../lib/use-noindex'

/** Shared Shell for the noindex authentication pages. */
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
    <Section spacing="tight" className="bg-surface" containerClassName="auth-layout">
      <div className="auth-panel">
        <aside className="auth-intro" aria-label="Learning with Designing Minds">
          <p className="hero-eyebrow">A little practice goes a long way.</p>
          <h2 className="max-w-[20ch]">More confidence starts with a little support.</h2>
          <p className="mt-3 text-body text-ink-soft">Teacher-made resources, ready whenever your child is.</p>
          <div aria-hidden="true"><ResourceStack /></div>
        </aside>
        <div className="auth-card grid gap-5">
          <div>
            <h1 className="text-page-title">{title}</h1>
            <p className="mt-3 text-muted">{intro}</p>
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

          <p className="auth-footer border-t border-line pt-4 text-body-sm text-muted">
            {footer}. Need help? <Link to="/help">Visit support</Link>.
          </p>
        </div>
      </div>
    </Section>
  )
}
