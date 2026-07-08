import { Button } from '../ui/button'
import { Section } from '../ui/section'
import { CtaBanner } from './cta-banner'

export function AboutCtaSection() {
  return (
    <Section>
      <CtaBanner
        title="Ready to support your child’s learning journey?"
        body="Explore our printable CAPS-aligned tests and learning resources, made to build confidence, reduce stress, and make learning fun."
      >
        <Button to="/shop" variant="text-light">
          Browse Tests
        </Button>
      </CtaBanner>
    </Section>
  )
}

