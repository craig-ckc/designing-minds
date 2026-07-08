import { Button } from '../ui/button'
import { Icon } from '../ui/icon'
import { Section } from '../ui/section'

export function AboutHeroSection() {
  return (
    <Section className="bg-cream" containerClassName="text-center">
      <div className="mx-auto max-w-prose">
        <p className="mb-4 text-label font-bold uppercase tracking-[0.14em] text-primary">About Designing Minds</p>
        <h1 className="mx-auto max-w-[18ch]">Helping learners thrive, one test at a time</h1>
        <p className="mx-auto mt-6 max-w-[56ch] lead">
          We believe learning should be simple, accessible, and stress-free. Designing Minds makes affordable,
          CAPS-aligned practice tests that help learners prepare with confidence — and empower parents to guide
          learning at home.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button to="/shop" variant="solid">
            Browse resources
            <span className="h-4 w-4">
              <Icon name="arrow" />
            </span>
          </Button>
          <Button to="/contact" variant="soft">
            Get in touch
          </Button>
        </div>
      </div>
    </Section>
  )
}
