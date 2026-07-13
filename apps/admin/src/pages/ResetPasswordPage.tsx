import { useState, type FormEvent } from 'react'
import { useAdminAuth } from '../lib/auth'
import { Button, Input } from '../components/primitives'

/**
 * Shown when an admin arrives via a password-reset email link (the auth provider
 * flips `recovery` on the PASSWORD_RECOVERY event). Supabase has already
 * established a temporary session from the link, so updatePassword() can set the
 * new password; on success `recovery` clears and the workspace renders.
 */
export function ResetPasswordPage() {
  const { updatePassword } = useAdminAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
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
    } catch (e) {
      setError(e instanceof Error ? `${e.message} Your reset link may have expired.` : 'Unable to update your password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-surface px-6">
      <form onSubmit={(event) => void submit(event)} className="grid w-full max-w-sm gap-4 border border-line bg-white p-6">
        <div>
          <p className="text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-muted">Designing Minds Admin</p>
          <h1 className="mt-1 text-[1.6rem]">Choose a new password</h1>
        </div>
        {error ? <p className="rounded-md border border-line bg-surface-alt px-3 py-2 text-[0.9rem] text-ink-soft">{error}</p> : null}
        <label className="grid gap-1.5 text-[0.9rem]">
          New password
          <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required />
        </label>
        <label className="grid gap-1.5 text-[0.9rem]">
          Confirm password
          <Input type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} autoComplete="new-password" required />
        </label>
        <Button type="submit" variant="solid" size="md" disabled={submitting} className="h-[42px] w-full">
          {submitting ? 'Saving…' : 'Update password'}
        </Button>
      </form>
    </main>
  )
}
