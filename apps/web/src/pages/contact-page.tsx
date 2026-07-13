import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { CONTACT } from '../content/site'
import { apiUrl } from '../lib/api'
import { Section } from '../components/ui/section'
import { Breadcrumb } from '../components/ui/breadcrumb'
import { Field } from '../components/ui/field'
import { Select } from '../components/ui/select'
import { Button } from '../components/ui/button'
import { Icon, type IconName } from '../components/ui/icon'

type Status = 'idle' | 'submitting' | 'sent' | 'error'

// Topics distilled from the most common Help/FAQ themes, plus a generic catch-all.
const TOPICS = [
  'General enquiry',
  'Finding the right resource',
  'Downloads & printing',
  'Bundles & access plans',
  'Billing & payments',
  'My account',
  'Schools & bulk orders',
]

const Required = () => <span className="text-primary"> *</span>

export function ContactPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [topic, setTopic] = useState(TOPICS[0])
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
      const name = `${firstName} ${lastName}`.trim()
      const response = await fetch(apiUrl('/api/forms'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          form: 'contact',
          fields: { name, firstName, lastName, email, topic, message },
          website: honeypot,
        }),
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
    <Section>
      <Breadcrumb trail={[{ to: '/', label: 'Home' }]} current="Contact" />
      <div className="grid items-start gap-9 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div>
          <h1>Get in touch</h1>
          <p className="mt-4 lead">Questions about a resource, a bundle, or classroom licensing? We’d love to help.</p>
          <div className="mt-7">
            <ContactDetail icon="phone" label="Phone" value={CONTACT.phone} />
            <ContactDetail icon="mail" label="Email" value={CONTACT.email} />
            <ContactDetail icon="pin" label="Office" value={CONTACT.location} last />
          </div>
          <p className="mt-6 text-body-sm text-muted">
            Looking for download or printing help? Visit the{' '}
            <Link to="/help" className="font-semibold text-primary underline underline-offset-4">
              Help centre
            </Link>
            .
          </p>
        </div>

        <form className="card grid gap-[18px] p-7" onSubmit={handleSubmit}>
          <h2>Send us a message</h2>
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
          <div className="grid gap-[18px] sm:grid-cols-2">
            <Field label={<>First name<Required /></>}>
              <input
                className="field"
                placeholder="Your first name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={sent}
              />
            </Field>
            <Field label="Last name">
              <input
                className="field"
                placeholder="Your last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={sent}
              />
            </Field>
          </div>
          <Field label={<>Email<Required /></>}>
            <input
              className="field"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={sent}
            />
          </Field>
          <Select label="What can we help with?" value={topic} options={TOPICS} onChange={setTopic} />
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
            <p className="text-label text-ink-soft">
              Thanks — your message is on its way. We usually reply within one business day. You can also email us
              directly at{' '}
              <a href={`mailto:${CONTACT.email}`} className="underline underline-offset-4">
                {CONTACT.email}
              </a>
              .
            </p>
          ) : error ? (
            <p className="text-label text-danger">{error}</p>
          ) : (
            <p className="text-label text-muted">We usually reply within one business day.</p>
          )}
        </form>
      </div>
    </Section>
  )
}

function ContactDetail({ icon, label, value, last }: { icon: IconName; label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex items-center gap-4 py-[18px] ${last ? '' : 'border-b border-line'}`}>
      <span className="grid h-11 w-11 flex-none place-items-center rounded-lg bg-primary-tint text-primary">
        <span className="h-5 w-5">
          <Icon name={icon} />
        </span>
      </span>
      <span className="grid gap-0.5">
        <span className="text-caption font-bold uppercase tracking-[0.08em] text-muted">{label}</span>
        <strong className="text-[1.05rem] font-bold">{value}</strong>
      </span>
    </div>
  )
}
