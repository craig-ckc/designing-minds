import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Field } from '../../components/ui/field'
import { Button } from '../../components/ui/button'
import { useAuth } from '../../lib/auth'
import { AuthLayout } from './auth-layout'

/**
 * Landing page for the password-reset email link. Supabase parses the recovery
 * token from the URL on load and establishes a temporary session, so
 * updatePassword() (supabase.auth.updateUser) can set the new password. On
 * success the recovery session becomes a normal session — send them to Account.
 */
export function ResetPasswordPage() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (password.length < 8) {
      setError('Use at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await updatePassword(password)
      navigate('/account')
    } catch (e) {
      setError(
        e instanceof Error
          ? `${e.message} Your reset link may have expired — request a new one.`
          : 'Unable to update your password.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Customer Account"
      title="Choose a new password"
      intro="Enter a new password for your account."
      onSubmit={() => void submit()}
      footer={
        <>
          Need a new link?{' '}
          <Link to="/forgot-password" className="text-ink underline underline-offset-4">
            Request another
          </Link>
        </>
      }
    >
      {error ? (
        <p className="rounded-xl border border-line bg-surface-alt px-3 py-2 text-[0.9rem] text-ink-soft">{error}</p>
      ) : null}
      <Field label="New password">
        <input
          className="field"
          type="password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </Field>
      <Field label="Confirm password">
        <input
          className="field"
          type="password"
          placeholder="Re-enter your new password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
      </Field>
      <Button type="submit" variant="solid" className="w-full" disabled={submitting}>
        {submitting ? 'Saving…' : 'Update password'}
      </Button>
    </AuthLayout>
  )
}
