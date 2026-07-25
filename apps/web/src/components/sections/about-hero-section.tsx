import { Button } from '../ui/button'
import { Icon } from '../ui/icon'
import { Section } from '../ui/section'

export function AboutHeroSection() {
  return (
    <Section containerClassName="text-center" spacing="tight">
      <div className="mx-auto max-w-readable">
        <h1>Shaping confident learners, one test at a time</h1>
        <p className="mx-auto mt-6 max-w-prose lead">
          Affordable practice tests aligned with CAPS — South Africa’s Curriculum and Assessment Policy Statement —
          help learners prepare with confidence and give parents simple support at home.
        </p>
        <div className="relative z-10 mt-8 flex flex-wrap justify-center gap-3">
          <Button to="/shop" variant="solid">
            Browse resources
            <Icon name="arrow" size={16} />
          </Button>
          <Button to="/contact" variant="soft">
            Get in touch
          </Button>
        </div>
      </div>
    </Section>
  )
}
