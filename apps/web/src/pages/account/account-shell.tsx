import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-h2">{title}</h1>
          {intro ? <p className="mt-2 text-muted">{intro}</p> : null}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={signOut}>
          Log out
        </Button>
      </div>
      <div className="mt-6">
        <AccountTabs />
      </div>
      <div className="mt-8">{children}</div>
    </Section>
  )
}
