import { Button } from '../ui/button'
import { Section } from '../ui/section'
import { CtaBanner } from './cta-banner'

export function BundleCtaSection() {
  return (
    <Section>
      <CtaBanner
        title="Cover a whole term or the full year in one purchase"
        body="Bundles group the available tests and memorandums for a grade into one discounted, once-off purchase."
      >
        <Button to="/packages" variant="solid-light">
          Browse bundles
        </Button>
        <Button to="/about" variant="outline-light">
          Learn more
        </Button>
      </CtaBanner>
    </Section>
  )
}
