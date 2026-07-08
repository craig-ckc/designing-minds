import { type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Section } from '../../components/ui/section'
import { Button } from '../../components/ui/button'
import { StatePanel } from '../../components/ui/state-panel'
import { useAuth } from '../../lib/auth'
import { useNoindex } from '../../lib/use-noindex'

const linkCls = ({ isActive }: { isActive: boolean }) =>
  `block rounded-pill px-3.5 py-2 text-body font-semibold ${isActive ? 'bg-surface-sunk text-ink' : 'text-ink-soft hover:bg-surface-sunk'}`

/** Shown when an account route is opened while signed out. */
export function SignedOut() {
  useNoindex()
  return (
    <StatePanel title="You’re not signed in" body="Log in to view your account, orders, and downloads.">
      <div className="mt-2 flex justify-center gap-4">
        <Button to="/login" variant="solid">
          Log in
        </Button>
        <Button to="/sign-up" variant="text">
          Create account
        </Button>
      </div>
    </StatePanel>
  )
}

export function AccountShell({
  title,
  intro,
  children,
}: {
  title: string
  intro?: string
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
    <Section>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-page-title">{title}</h1>
            {intro ? <p className="mt-2 text-muted">{intro}</p> : null}
          </div>
          <Button type="button" variant="text" onClick={signOut}>
            Log out
          </Button>
        </div>
        <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
          <aside className="lg:sticky lg:top-[var(--sticky-offset)] lg:self-start">
            <nav className="grid gap-1">
              <NavLink to="/account" end className={linkCls}>
                Dashboard
              </NavLink>
              <NavLink to="/account/orders" className={linkCls}>
                Order history
              </NavLink>
              <NavLink to="/help" className={linkCls}>
                Support
              </NavLink>
            </nav>
          </aside>
          <div>{children}</div>
        </div>
    </Section>
  )
}
