import { type ReactNode } from 'react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Icon } from '../ui/icon'
import { Section } from '../ui/section'

function ConnectCard({ title, body, children, image, imageAlt }: { title: string, body: string, children: ReactNode, image?: string, imageAlt?: string }) {
  return (
    <Card as="article" pad="none" className="flex flex-col overflow-hidden min-h-[36rem] relative">
      {/* <Placeholder ratio="16 / 10" flush className="mt-auto" /> */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden">
        <img src={image} alt={imageAlt ?? ''} className="w-full h-full object-contain" />
      </div>
      <div className="p-7 sm:p-8 relative">
        <h3 className="max-w-[18ch]">{title}</h3>
        <p className="mt-2 max-w-[44ch] text-body text-muted">{body}</p>
        <div className="mt-6">{children}</div>
      </div>
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
          image="/images/image-01.png"
          imageAlt="A parent and child looking up thoughtfully at a thought bubble"
        >
          <Button to="/contact" variant="outline">
            Get in touch
          </Button>
        </ConnectCard>

        <ConnectCard
          title="Curious what’s inside?"
          body="Browse our CAPS-aligned tests and summaries and see the quality for yourself before you buy a thing."
          image="/images/image-02.png"
          imageAlt="An open box with school supplies floating out — a book, test paper, pencil, globe, science flask and graduation cap"
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
