import { type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Container } from '../../components/ui/Container'
import { Eyebrow } from '../../components/ui/Eyebrow'
import { Button } from '../../components/ui/Button'
import { StatePanel } from '../../components/ui/StatePanel'
import { useAuth } from '../../lib/auth'
import { useNoindex } from '../../lib/useNoindex'

const linkCls = ({ isActive }: { isActive: boolean }) =>
  `block rounded-md px-3 py-2 text-[0.95rem] ${isActive ? 'bg-surface-alt font-medium text-ink' : 'text-ink-soft hover:bg-surface-alt'}`

/** Shown when an account route is opened while signed out. */
export function SignedOut() {
  useNoindex()
  return (
    <StatePanel eyebrow="Customer Account" title="You’re not signed in" body="Log in to view your account, orders, and downloads.">
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
    <section className="section">
      <Container>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>Customer Account</Eyebrow>
            <h1 className="text-[2rem]">{title}</h1>
            {intro ? <p className="mt-2 text-muted">{intro}</p> : null}
          </div>
          <Button type="button" variant="text" onClick={signOut}>
            Log out
          </Button>
        </div>
        <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
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
      </Container>
    </section>
  )
}
