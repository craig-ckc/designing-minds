import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Field } from '../../components/ui/field'
import { Button } from '../../components/ui/button'
import { Notice } from '../../components/ui/notice'
import { useAuth } from '../../lib/auth'
import { AuthLayout } from './auth-layout'

/**
 * Landing page for the password-reset email link. Supabase parses the recovery
 * token from the URL on load and establishes a temporary session, so
 * updatePassword() (supabase.auth.updateUser) can set the new password. On
 * success the recovery session becomes a normal session — send them to Account.
 *
 * Until auth finishes initializing we don't know whether the link produced a
 * recovery session, so show a checking state instead of the form. Without a
 * session the link is expired, invalid, or already used — explain that instead
 * of offering a form that cannot succeed.
 */
export function ResetPasswordPage() {
  const { updatePassword, session, loading } = useAuth()
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

  if (loading) {
    return (
      <AuthLayout
        title="Choose a new password"
        intro="Checking your reset link…"
        footer={
          <>
            Need a new link?{' '}
            <Link to="/forgot-password" className="text-ink underline underline-offset-4">
              Request another
            </Link>
          </>
        }
      >
        <Notice tone="info">Checking your reset link…</Notice>
      </AuthLayout>
    )
  }

  if (!session) {
    return (
      <AuthLayout
        title="This reset link is no longer valid"
        intro="Your link may have expired, is invalid, or was already used."
        footer={
          <>
            Remembered it?{' '}
            <Link to="/login" className="text-ink underline underline-offset-4">
              Back to log in
            </Link>
          </>
        }
      >
        <Notice tone="error">This password-reset link has expired or is invalid.</Notice>
        <Button to="/forgot-password" variant="solid" className="w-full">
          Request a new link
        </Button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
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
      {error ? <Notice tone="error">{error}</Notice> : null}
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
