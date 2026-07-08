import { Button } from '../ui/button'
import { Section } from '../ui/section'
import { CtaBanner } from './cta-banner'

export function BundleCtaSection() {
  return (
    <Section>
      <CtaBanner
        title="Cover a whole term or the full year in one purchase"
        body="Bundles group a grade’s resources into one discounted, once-off purchase. Access plans unlock a term or year — no auto-renewal."
      >
        <Button to="/packages" variant="solid-light">
          Browse bundles &amp; plans
        </Button>
        <Button to="/about" variant="outline-light">
          Learn more
        </Button>
      </CtaBanner>
    </Section>
  )
}

