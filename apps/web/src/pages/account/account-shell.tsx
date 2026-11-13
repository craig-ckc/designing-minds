import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@designing-minds/utils'
import { Breadcrumb } from '../../components/ui/breadcrumb'
import { Section } from '../../components/ui/section'
import { Button } from '../../components/ui/button'
import { StatePanel } from '../../components/ui/state-panel'
import { useAuth } from '../../lib/auth'
import { useNoindex } from '../../lib/use-noindex'
import { AccountTabs } from './account-tabs'

/** Shown when an account route is opened while signed out. */
export function SignedOut() {
  useNoindex()
  return (
    <StatePanel title="You’re not signed in" body="Log in to view your account, orders, and downloads.">
      <div className="mt-2 flex justify-center gap-4">
        <Button to="/login" variant="solid">
          Log in
        </Button>
        <Button to="/sign-up" variant="outline">
          Create account
        </Button>
      </div>
    </StatePanel>
  )
}

export function AccountShell({
  title,
  intro,
  meta,
  breadcrumb,
  children,
}: {
  title: string
  intro?: string
  /** Inline detail under the title (e.g. an order's status badge and date). */
  meta?: ReactNode
  /** Trail above the header; the current crumb is the page itself. */
  breadcrumb?: { trail: { to: string; label: string }[]; current: string }
  children: ReactNode
}) {
  useNoindex()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const signOut = async () => {
    try {
      await logout()
      navigate('/')
    } catch {
      // Logout failed — keep the user here; the session is still active.
    }
  }

  return (
    <Section className={breadcrumb ? 'sm:pt-8' : 'sm:pt-10'}>
      {breadcrumb ? <Breadcrumb trail={breadcrumb.trail} current={breadcrumb.current} /> : null}
      <div className={cn('flex flex-wrap items-end justify-between gap-4', breadcrumb && 'mt-2')}>
        <div className="min-w-0">
          <h1 className="text-h2 break-words">{title}</h1>
          {intro ? <p className="mt-2 text-body-lg text-muted">{intro}</p> : null}
          {meta ? <div className="mt-3 flex flex-wrap items-center gap-3">{meta}</div> : null}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={signOut}>
          Log out
        </Button>
      </div>
      <div className="mt-8">
        <AccountTabs />
      </div>
      <div className="mt-8">{children}</div>
    </Section>
  )
}
