import { type CmsSnapshot } from '@designing-minds/cms'
import { Section, SectionNotice } from '../ui/section'
import { TestimonialCarousel } from './testimonial-carousel'

/** Testimonial carousel. While the catalogue is still loading (`snapshot` null) it shows a notice instead. */
export function TestimonialsSection({ snapshot, loadError }: { snapshot: CmsSnapshot | null; loadError?: string | null }) {
  if (!snapshot) {
    return (
      <Section>
        <SectionNotice
          title={loadError ? 'Testimonials are unavailable' : 'Loading testimonials...'}
          body={loadError ?? 'The story is ready now; parent feedback will appear when the content request finishes.'}
        />
      </Section>
    )
  }
  const testimonials = snapshot.testimonials.filter((t) => t.published)
  if (testimonials.length === 0) return null
  return (
    <Section className="overflow-x-clip">
      <div className="mx-auto max-w-prose text-center">
        <h2>Real stories from families across South Africa</h2>
      </div>
      <TestimonialCarousel testimonials={testimonials} />
    </Section>
  )
}
