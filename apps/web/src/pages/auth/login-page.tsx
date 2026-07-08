import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Field } from '../../components/ui/field'
import { Button } from '../../components/ui/button'
import { Notice } from '../../components/ui/notice'
import { useAuth } from '../../lib/auth'
import { AuthLayout } from './auth-layout'

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
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Field label="Email">
        <input className="field" type="email" placeholder="you@example.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </Field>
      <Field label="Password">
        <input className="field" type="password" placeholder="Your password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </Field>
      <div className="-mt-1 text-label">
        <Link to="/forgot-password" className="text-ink-soft underline underline-offset-4 hover:text-ink">
          Forgot password?
        </Link>
      </div>
      <Button type="submit" variant="solid" className="w-full" disabled={submitting}>
        {submitting ? 'Logging in…' : 'Log in'}
      </Button>
    </AuthLayout>
  )
}

