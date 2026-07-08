import { type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Section } from '../../components/ui/section'
import { Eyebrow } from '../../components/ui/eyebrow'
import { Button } from '../../components/ui/button'
import { Notice } from '../../components/ui/notice'
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
    <Section>
        <div className="mx-auto grid max-w-form gap-6">
          <div>
            <Eyebrow>{eyebrow}</Eyebrow>
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

          <div className="border-t border-line pt-4 text-body-sm text-muted">{footer}</div>
          <p className="text-label text-muted">
            Need help? <Link to="/help" className="font-semibold text-primary underline underline-offset-4">Visit support</Link>
          </p>
        </div>
    </Section>
  )
}
