import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Field } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../lib/auth'
import { AuthLayout } from './AuthLayout'

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await signIn(email, password)
      navigate(params.get('redirect') ?? '/account')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to log in.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Customer Account"
      title="Log in"
      intro="Access your orders and download your purchased resources."
      onSubmit={() => void submit()}
      footer={
        <>
          New here?{' '}
          <Link to="/sign-up" className="text-ink underline underline-offset-4">
            Create an account
          </Link>
        </>
      }
    >
      {error ? <p className="rounded-md border border-line bg-surface-alt px-3 py-2 text-[0.9rem] text-ink-soft">{error}</p> : null}
      <Field label="Email">
        <input className="field" type="email" placeholder="you@example.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </Field>
      <Field label="Password">
        <input className="field" type="password" placeholder="Your password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </Field>
      <Button type="submit" variant="solid" className="w-full" disabled={submitting}>
        {submitting ? 'Logging in…' : 'Log in'}
      </Button>
    </AuthLayout>
  )
}

