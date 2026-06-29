import { useState, type FormEvent } from 'react'
import { useAdminAuth } from '../lib/auth'
import { Button, Input } from '../components/primitives'

export function LoginPage() {
  const { signIn } = useAdminAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await signIn(email, password)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to log in.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-surface px-6">
      <form onSubmit={(event) => void submit(event)} className="grid w-full max-w-sm gap-4 border border-line bg-white p-6">
        <div>
          <p className="text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-muted">Designing Minds Admin</p>
          <h1 className="mt-1 text-[1.6rem]">Log in</h1>
        </div>
        {error ? <p className="rounded-md border border-line bg-surface-alt px-3 py-2 text-[0.9rem] text-ink-soft">{error}</p> : null}
        <label className="grid gap-1.5 text-[0.9rem]">
          Email
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
        </label>
        <label className="grid gap-1.5 text-[0.9rem]">
          Password
          <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
        </label>
        <Button type="submit" variant="solid" size="md" disabled={submitting} className="h-[46px] w-full">
          {submitting ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
    </main>
  )
}

