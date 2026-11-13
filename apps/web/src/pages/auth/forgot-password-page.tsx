import { useState } from 'react'
import { Field } from '../../components/ui/field'
import { Button } from '../../components/ui/button'
import { Notice } from '../../components/ui/notice'
import { useAuth } from '../../lib/auth'
import { AuthLayout } from './auth-layout'

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
      title={sent ? 'Check your email' : 'Reset your password'}
      intro={sent ? undefined : 'Enter your account email and we’ll send you a link to set a new password.'}
      onSubmit={() => void submit()}
      footer={
        <>
          <p className="text-body text-muted">Remembered it?</p>
          <Button to="/login" variant="outline" className="w-full">
            Back to log in
          </Button>
        </>
      }
    >
      {sent ? (
        <Notice tone="success">
          If an account exists for {email}, a password-reset link is on its way. Check your inbox and spam folder.
        </Notice>
      ) : (
        <>
          {error ? <Notice tone="error">{error}</Notice> : null}
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
          <Button type="submit" variant="solid" className="mt-2 w-full" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send reset link'}
          </Button>
        </>
      )}
    </AuthLayout>
  )
}
