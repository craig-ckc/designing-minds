import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { CONTACT } from '../content/site'
import { Container } from '../components/ui/Container'
import { Eyebrow } from '../components/ui/Eyebrow'
import { Breadcrumb } from '../components/ui/Breadcrumb'
import { Field } from '../components/ui/Field'
import { Button } from '../components/ui/Button'

export function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const body = `From: ${name} <${email}>\n\n${message}`
    const mailto = `mailto:${CONTACT.email}?subject=${encodeURIComponent(`Website enquiry from ${name || 'a customer'}`)}&body=${encodeURIComponent(body)}`
    window.location.href = mailto
    setSent(true)
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
              <Field label="Name">
                <input className="field" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
              </Field>
              <Field label="Email">
                <input className="field" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </Field>
              <Field label="Message">
                <textarea
                  className="field min-h-[130px] resize-y"
                  placeholder="How can we help?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </Field>
              <Button type="submit" variant="solid">
                Send message
              </Button>
              {sent ? (
                <p className="text-[0.82rem] text-ink-soft">
                  Your email app should have opened. If not, email us directly at{' '}
                  <a href={`mailto:${CONTACT.email}`} className="underline underline-offset-4">
                    {CONTACT.email}
                  </a>
                  .
                </p>
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
