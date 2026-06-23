import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Field } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../lib/auth'
import { AuthLayout } from './AuthLayout'

export function SignUpPage() {
  const { signUp } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    setMessage(null)
    try {
      await signUp(name, email, password)
      setMessage('Check your email to verify your account before checkout.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to create account.')
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
      {message ? <p className="rounded-md border border-line bg-surface-alt px-3 py-2 text-[0.9rem] text-ink-soft">{message}</p> : null}
      {error ? <p className="rounded-md border border-line bg-surface-alt px-3 py-2 text-[0.9rem] text-ink-soft">{error}</p> : null}
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
