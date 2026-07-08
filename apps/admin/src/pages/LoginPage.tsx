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
    <main className="grid min-h-screen place-items-center bg-surface px-6">
      <form onSubmit={(event) => void submit(event)} className="grid w-full max-w-sm gap-4 border border-line bg-white p-6">
        <div>
          <p className="text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-muted">Designing Minds Admin</p>
          <h1 className="mt-1 text-[1.6rem]">{forgot ? 'Reset password' : 'Log in'}</h1>
        </div>
        {error ? <p className="rounded-md border border-line bg-surface-alt px-3 py-2 text-[0.9rem] text-ink-soft">{error}</p> : null}

        {forgot && sent ? (
          <p className="rounded-md border border-line bg-surface-alt px-3 py-2 text-[0.9rem] text-ink-soft">
            If an admin account exists for {email}, a reset link is on its way.
          </p>
        ) : (
          <>
            <label className="grid gap-1.5 text-[0.9rem]">
              Email
              <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
            </label>
            {!forgot ? (
              <label className="grid gap-1.5 text-[0.9rem]">
                Password
                <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
              </label>
            ) : null}
            <Button type="submit" variant="solid" size="md" disabled={submitting} className="h-[46px] w-full">
              {submitting ? (forgot ? 'Sending…' : 'Logging in…') : forgot ? 'Send reset link' : 'Log in'}
            </Button>
          </>
        )}

        <button
          type="button"
          onClick={() => switchMode(forgot ? 'login' : 'forgot')}
          className="justify-self-start text-[0.85rem] text-ink-soft underline underline-offset-4 hover:text-ink"
        >
          {forgot ? 'Back to log in' : 'Forgot password?'}
        </button>
      </form>
    </main>
  )
}
