import { type FormEvent, useState } from 'react'
import { CONTACT } from '../content/site'
import { Button } from './ui/Button'

export function NewsletterForm({ compact }: { compact?: boolean }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const mailto = `mailto:${CONTACT.email}?subject=${encodeURIComponent('Newsletter signup')}&body=${encodeURIComponent(
      `Please add this address to the Designing Minds newsletter: ${email}`,
    )}`
    window.location.href = mailto
    setSent(true)
  }

  if (sent) {
    return (
      <p className={`max-w-[460px] text-[0.9rem] text-ink-soft ${compact ? 'mt-[18px]' : 'mt-6'}`}>
        Thanks! Your email app should have opened to confirm your signup.
      </p>
    )
  }

  return (
    <form
      className={`flex max-w-[460px] flex-col gap-2.5 sm:flex-row ${compact ? 'mt-[18px]' : 'mt-6'}`}
      onSubmit={handleSubmit}
    >
      <input
        className="field flex-1"
        type="email"
        placeholder="Enter your email"
        aria-label="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Button type="submit" variant="solid">
        {compact ? 'Subscribe' : 'Get my free test'}
      </Button>
    </form>
  )
}
