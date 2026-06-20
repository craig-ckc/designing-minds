import { CONTACT, FAQS } from '../content/site'
import { Container } from '../components/ui/Container'
import { Eyebrow } from '../components/ui/Eyebrow'
import { Breadcrumb } from '../components/ui/Breadcrumb'
import { Field } from '../components/ui/Field'
import { Icon } from '../components/ui/Icon'
import { Button } from '../components/ui/Button'

export function ContactPage() {
  return (
    <>
      <section className="section">
        <Container>
          <Breadcrumb trail={[{ to: '/', label: 'Home' }]} current="Contact" />
          <div className="grid items-start gap-9 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div>
              <Eyebrow>Contact us</Eyebrow>
              <h1>Get in touch</h1>
              <p className="mt-4 lead">
                Questions about a test, a bundle, or classroom licensing? We’d love to help.
              </p>
              <div className="mt-7">
                <ContactDetail label="Phone" value={CONTACT.phone} />
                <ContactDetail label="Email" value={CONTACT.email} />
                <ContactDetail label="Office" value={CONTACT.location} last />
              </div>
            </div>

            <form className="card grid gap-[18px] p-7" onSubmit={(event) => event.preventDefault()}>
              <h3>Send us a message</h3>
              <Field label="Name">
                <input className="field" placeholder="Your name" />
              </Field>
              <Field label="Email">
                <input className="field" type="email" placeholder="you@example.com" />
              </Field>
              <Field label="Message">
                <textarea className="field min-h-[130px] resize-y" placeholder="How can we help?" />
              </Field>
              <Button type="submit" variant="text">
                Send message
              </Button>
              <p className="text-[0.82rem] text-muted">We usually reply within one business day.</p>
            </form>
          </div>
        </Container>
      </section>

      <section className="section bg-surface-alt">
        <Container>
          <div className="mx-auto mb-9 max-w-[640px] text-center lg:mb-14">
            <Eyebrow>FAQ</Eyebrow>
            <h2>Frequently asked questions</h2>
          </div>
          <FaqList />
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

function FaqList() {
  return (
    <div className="mx-auto max-w-[820px] border-t border-line">
      {FAQS.map((item, index) => (
        <details key={item.q} open={index === 0} className="group border-b border-line">
          <summary className="flex items-center justify-between gap-4 px-2 py-[22px] text-[1.05rem] font-medium">
            {item.q}
            <span className="h-[22px] w-[22px] flex-none text-ink transition-transform group-open:rotate-45">
              <Icon name="plus" />
            </span>
          </summary>
          <div className="max-w-[70ch] px-2 pb-6 text-ink-soft">{item.a}</div>
        </details>
      ))}
    </div>
  )
}
