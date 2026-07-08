import { type FormEvent, useState } from 'react'
import { apiUrl } from '../../lib/api'
import { Button } from './button'

type Status = 'idle' | 'submitting' | 'sent' | 'error'

export function NewsletterForm({ compact, source = 'website' }: { compact?: boolean; source?: string }) {
  const [email, setEmail] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('submitting')
    setError(null)
    try {
      const response = await fetch(apiUrl('/api/forms'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ form: 'newsletter', fields: { email, source }, website: honeypot }),
      })
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error ?? 'Something went wrong. Please try again.')
      }
      setStatus('sent')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <p className={`max-w-form text-body-sm text-ink-soft ${compact ? 'mt-[18px]' : 'mt-6'}`}>
        Thanks! You’re on the list — look out for your free test in your inbox.
      </p>
    )
  }

  return (
    <form
      className={`flex max-w-form flex-col gap-2.5 sm:flex-row ${compact ? 'mt-[18px]' : 'mt-6'}`}
      onSubmit={handleSubmit}
    >
      {/* Honeypot: hidden from humans, catches bots that fill every Field. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
      />
      <input
        className="field flex-1"
        type="email"
        placeholder="Enter your email"
        aria-label="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Button type="submit" variant="solid" disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Submitting…' : compact ? 'Subscribe' : 'Get my free test'}
      </Button>
      {error ? <p className="w-full text-label text-danger sm:mt-1">{error}</p> : null}
    </form>
  )
}
