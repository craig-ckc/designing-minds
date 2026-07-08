import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Field } from '../../components/ui/field'
import { Button } from '../../components/ui/button'
import { Notice } from '../../components/ui/notice'
import { useAuth } from '../../lib/auth'
import { AuthLayout } from './auth-layout'

const signupErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : ''
  if (message.toLowerCase().includes('rate limit')) {
    return 'Too many signup attempts have been made. Wait a while before trying again, or log in if this account was already created.'
  }
  return message || 'Unable to create account.'
}

export function SignUpPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await signUp(name, email, password)
      navigate(params.get('redirect') ?? '/account')
    } catch (e) {
      setError(signupErrorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Customer Account"
      title="Create your account"
      intro="Save your orders and download purchased files anytime from your account."
      onSubmit={() => void submit()}
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="text-ink underline underline-offset-4">
            Log in
          </Link>
        </>
      }
    >
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Field label="Full name">
        <input className="field" placeholder="Your name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>
      <Field label="Email">
        <input className="field" type="email" placeholder="you@example.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </Field>
      <Field label="Password">
        <input className="field" type="password" placeholder="Create a password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </Field>
      <Button type="submit" variant="solid" className="w-full" disabled={submitting}>
        {submitting ? 'Creating…' : 'Create account'}
      </Button>
    </AuthLayout>
  )
}
