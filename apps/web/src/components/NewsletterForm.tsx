import { Button } from './ui/Button'

export function NewsletterForm({ compact }: { compact?: boolean }) {
  return (
    <form
      className={`flex max-w-[460px] flex-col gap-2.5 sm:flex-row ${compact ? 'mt-[18px]' : 'mt-6'}`}
      onSubmit={(event) => event.preventDefault()}
    >
      <input className="field flex-1" type="email" placeholder="Enter your email" aria-label="Email address" />
      <Button type="submit" variant="text">
        {compact ? 'Subscribe' : 'Get my free test'}
      </Button>
    </form>
  )
}
