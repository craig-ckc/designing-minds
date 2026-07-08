import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { CONTACT } from '../content/site'
import { apiUrl } from '../lib/api'
import { Container } from '../components/ui/Container'
import { Eyebrow } from '../components/ui/Eyebrow'
import { Breadcrumb } from '../components/ui/Breadcrumb'
import { Field } from '../components/ui/Field'
import { Button } from '../components/ui/Button'

type Status = 'idle' | 'submitting' | 'sent' | 'error'

export function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  const sent = status === 'sent'

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('submitting')
    setError(null)
    try {
      const response = await fetch(apiUrl('/api/forms'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ form: 'contact', fields: { name, email, message }, website: honeypot }),
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

  return (
    <>
      <section className="section">
        <Container>
          <Breadcrumb trail={[{ to: '/', label: 'Home' }]} current="Contact" />
          <div className="grid items-start gap-9 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div>
              <Eyebrow>Contact us</Eyebrow>
              <h1>Get in touch</h1>
              <p className="mt-4 lead">Questions about a resource, a bundle, or classroom licensing? We’d love to help.</p>
              <div className="mt-7">
                <ContactDetail label="Phone" value={CONTACT.phone} />
                <ContactDetail label="Email" value={CONTACT.email} />
                <ContactDetail label="Office" value={CONTACT.location} last />
              </div>
              <p className="mt-6 text-[0.92rem] text-muted">
                Looking for download or printing help? Visit the{' '}
                <Link to="/help" className="text-ink underline underline-offset-4">
                  Help centre
                </Link>
                .
              </p>
            </div>

            <form className="card grid gap-[18px] p-7" onSubmit={handleSubmit}>
              <h3>Send us a message</h3>
              {/* Honeypot: hidden from humans, catches bots that fill every field. */}
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
              <Field label="Name">
                <input className="field" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required disabled={sent} />
              </Field>
              <Field label="Email">
                <input className="field" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={sent} />
              </Field>
              <Field label="Message">
                <textarea
                  className="field min-h-[130px] resize-y"
                  placeholder="How can we help?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  disabled={sent}
                />
              </Field>
              {!sent ? (
                <Button type="submit" variant="solid" disabled={status === 'submitting'}>
                  {status === 'submitting' ? 'Sending…' : 'Send message'}
                </Button>
              ) : null}
              {sent ? (
                <p className="text-[0.82rem] text-ink-soft">
                  Thanks — your message is on its way. We usually reply within one business day. You can also email us
                  directly at{' '}
                  <a href={`mailto:${CONTACT.email}`} className="underline underline-offset-4">
                    {CONTACT.email}
                  </a>
                  .
                </p>
              ) : error ? (
                <p className="text-[0.82rem] text-red-600">{error}</p>
              ) : (
                <p className="text-[0.82rem] text-muted">We usually reply within one business day.</p>
              )}
            </form>
          </div>
        </Container>
      </section>
    </>
  )
}

function ContactDetail({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`grid gap-1.5 py-[18px] ${last ? '' : 'border-b border-line'}`}>
      <span className="text-[0.82rem] uppercase tracking-[0.08em] text-muted">{label}</span>
      <strong className="text-[1.1rem] font-medium">{value}</strong>
    </div>
  )
}
