import { type ReactNode } from 'react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Icon } from '../ui/icon'
import { Placeholder } from '../ui/placeholder'
import { Section } from '../ui/section'

function ConnectCard({
  title,
  body,
  children,
}: {
  title: string
  body: string
  children: ReactNode
}) {
  return (
    <Card as="article" pad="none" className="flex flex-col overflow-hidden">
      <div className="p-7 sm:p-8">
        <h4 className="max-w-[18ch]">{title}</h4>
        <p className="mt-2 max-w-[44ch] text-body text-muted">{body}</p>
        <div className="mt-6">{children}</div>
      </div>
      <Placeholder ratio="16 / 10" flush className="mt-auto" />
    </Card>
  )
}

export function AboutConnectSection() {
  return (
    <Section>
      <div className="mx-auto mb-10 max-w-prose text-center lg:mb-14">
        <h2>Two easy ways to get started</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <ConnectCard
          title="Still have a question?"
          body="Chat to a real teacher about grades, subjects, or what to buy first. We usually reply within a day."
        >
          <Button to="/contact" variant="outline">
            Get in touch
          </Button>
        </ConnectCard>

        <ConnectCard
          title="Curious what’s inside?"
          body="Browse our CAPS-aligned tests and summaries and see the quality for yourself before you buy a thing."
        >
          <Button to="/shop" variant="solid">
            Browse resources
            <Icon name="arrow" size={16} />
          </Button>
        </ConnectCard>
      </div>
    </Section>
  )
}
