import { useState, type FormEvent } from 'react'
import { useAdminAuth } from '../lib/auth'
import { Button, Input } from '../components/primitives'

export function LoginPage() {
  const { signIn, resetPassword } = useAdminAuth()
  const [mode, setMode] = useState<'login' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const switchMode = (next: 'login' | 'forgot') => {
    setMode(next)
    setError(null)
    setSent(false)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else {
        await resetPassword(email)
        setSent(true)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : mode === 'login' ? 'Unable to log in.' : 'Unable to send the reset email.')
    } finally {
      setSubmitting(false)
    }
  }

  const forgot = mode === 'forgot'

  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-4">
      <form
        onSubmit={(event) => void submit(event)}
        className="grid w-full max-w-sm gap-3 rounded-card border border-line bg-surface p-4"
      >
        <div>
          <p className="text-meta font-semibold uppercase text-muted">Designing Minds Admin</p>
          <h1 className="mt-1 text-page">{forgot ? 'Reset password' : 'Log in'}</h1>
        </div>
        {error ? (
          <p className="rounded-control border border-danger bg-danger-tint px-2.5 py-1.5 text-ui text-danger">{error}</p>
        ) : null}

        {forgot && sent ? (
          <p className="rounded-control border border-line bg-surface-alt px-2.5 py-1.5 text-ui text-ink-soft">
            If an admin account exists for {email}, a reset link is on its way.
          </p>
        ) : (
          <>
            <label className="grid gap-2 text-ui">
              Email
              <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
            </label>
            {!forgot ? (
              <label className="grid gap-2 text-ui">
                Password
                <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
              </label>
            ) : null}
            <Button type="submit" variant="solid" size="md" disabled={submitting} className="h-7 w-full">
              {submitting ? (forgot ? 'Sending…' : 'Logging in…') : forgot ? 'Send reset link' : 'Log in'}
            </Button>
          </>
        )}

        <Button
          type="button"
          variant="text"
          onClick={() => switchMode(forgot ? 'login' : 'forgot')}
          className="justify-self-start text-ui"
        >
          {forgot ? 'Back to log in' : 'Forgot password?'}
        </Button>
      </form>
    </main>
  )
}
