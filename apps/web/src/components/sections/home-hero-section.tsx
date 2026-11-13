import { type CmsSnapshot } from '@designing-minds/cms'
import { SOCIAL_PROOF } from '../../content/site'
import { Button } from '../ui/button'
import { Icon } from '../ui/icon'
import { Section } from '../ui/section'
import { StarRating } from '../ui/star-rating'

export function HomeHeroSection({ snapshot }: { snapshot: CmsSnapshot | null }) {
  const hasPublishedTestimonials = snapshot?.testimonials.some((testimonial) => testimonial.published) ?? false

  return (
    <Section id="home-intro" className="home-hero" spacing="none" containerClassName="home-hero__layout">
      <img className="home-hero__image" src="/images/paintings/home-hero.avif" alt="" width={1536} height={864} fetchPriority="high" />
      <div className="home-hero__copy">
        <h1>Practice resources that build confidence at home</h1>
        <p className="mt-4 text-body text-ink">
          Printable tests and summaries for <span className="whitespace-nowrap">Grades 3–7</span>. Aligned with CAPS, South Africa’s
          Curriculum and Assessment Policy Statement.
        </p>
        {/* Figma: the rating sits 12px after the button, pink 16px stars then a 14px ink label. */}
        <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8">
          <Button to="/shop" variant="solid">
            Browse resources <Icon name="arrow" size={16} />
          </Button>
          {hasPublishedTestimonials ? (
            <a href="#parent-stories" className="inline-flex min-h-8 flex-wrap items-center gap-x-3 gap-y-1 text-body text-ink hover:underline">
              <StarRating value={SOCIAL_PROOF.rating} size="sm" tone="primary" />
              <span>{SOCIAL_PROOF.ratingClaim}</span>
            </a>
          ) : null}
        </div>
      </div>
    </Section>
  )
}
