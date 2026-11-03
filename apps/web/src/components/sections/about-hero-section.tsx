import { Button } from '../ui/button'
import { Icon } from '../ui/icon'
import { Section } from '../ui/section'

export function AboutHeroSection() {
  return (
    <Section className="about-hero" containerClassName="about-hero__layout" spacing="tight">
      <div className="about-hero__copy">
        <h1>Shaping confident learners, one test at a time</h1>
        <p className="mt-4 lead">
          Affordable practice tests aligned with CAPS — South Africa’s Curriculum and Assessment Policy Statement —
          help learners prepare with confidence and give parents simple support at home.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button to="/shop" variant="solid">
            Browse resources <Icon name="arrow" size={16} />
          </Button>
          <Button to="/contact" variant="outline">Get in touch</Button>
        </div>
      </div>
      <figure className="about-hero__photo">
        <img src="/images/image-07.png" alt="A parent helping a child practise at home" fetchPriority="high" />
        <figcaption>Teacher-made resources. Real support at home.</figcaption>
      </figure>
    </Section>
  )
}
