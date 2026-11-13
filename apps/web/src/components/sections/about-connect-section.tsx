import { type ReactNode } from 'react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Icon } from '../ui/icon'
import { Section } from '../ui/section'

function ConnectCard({ title, body, image, children }: { title: string; body: string; image: string; children: ReactNode }) {
  return (
    <Card as="article" pad="none" className="flex flex-col overflow-hidden">
      <img src={image} alt="" width={1280} height={853} loading="lazy" decoding="async" className="aspect-[34/15] w-full object-cover" />
      <div className="p-6 sm:p-8">
        <h3>{title}</h3>
        <p className="mt-2 max-w-[420px] text-body text-muted">{body}</p>
        <div className="mt-6">{children}</div>
      </div>
    </Card>
  )
}

export function AboutConnectSection() {
  return (
    <Section>
      <h2 className="mb-8 lg:mb-16">Ask a teacher, or have a look inside</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <ConnectCard
          title="Ask a teacher"
          body="Chat to a teacher about grades, subjects or what to buy first. We usually reply within a day."
          image="/images/paintings/connect-classroom-corner.avif"
        >
          <Button to="/contact" variant="outline">Get in touch</Button>
        </ConnectCard>

        <ConnectCard
          title="See what’s inside"
          body="Browse our CAPS-aligned tests and summaries and see what you get before you buy."
          image="/images/paintings/connect-printed-pages.avif"
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
