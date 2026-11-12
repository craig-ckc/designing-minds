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
      title="Welcome back"
      intro="Log in to see your orders and download your resources."
      onSubmit={() => void submit()}
      footer={
        <>
          <p className="text-body text-muted">New here?</p>
          <Button to="/sign-up" variant="outline" className="w-full">
            Create an account
          </Button>
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
      <div className="-mt-1 text-right text-label">
        <Link to="/forgot-password" className="text-ink underline underline-offset-4 hover:text-primary-ink">
          Forgot password?
        </Link>
      </div>
      <Button type="submit" variant="solid" className="w-full" disabled={submitting}>
        {submitting ? 'Logging in…' : 'Log in'}
      </Button>
    </AuthLayout>
  )
}

