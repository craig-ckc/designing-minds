import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Field } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../lib/auth'
import { AuthLayout } from './AuthLayout'

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await resetPassword(email)
      setSent(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to send the reset email.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Customer Account"
      title="Reset your password"
      intro="Enter your account email and we’ll send you a link to set a new password."
      onSubmit={() => void submit()}
      footer={
        <>
          Remembered it?{' '}
          <Link to="/login" className="text-ink underline underline-offset-4">
            Back to log in
          </Link>
        </>
      }
    >
      {sent ? (
        <p className="rounded-xl border border-line bg-surface-alt px-3 py-2 text-[0.9rem] text-ink-soft">
          If an account exists for {email}, a password-reset link is on its way. Check your inbox (and spam folder).
        </p>
      ) : (
        <>
          {error ? (
            <p className="rounded-xl border border-line bg-surface-alt px-3 py-2 text-[0.9rem] text-ink-soft">{error}</p>
          ) : null}
          <Field label="Email">
            <input
              className="field"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Button type="submit" variant="solid" className="w-full" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send reset link'}
          </Button>
        </>
      )}
    </AuthLayout>
  )
}
