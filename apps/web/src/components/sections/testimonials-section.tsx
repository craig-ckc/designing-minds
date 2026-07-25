import { type Testimonial } from '@designing-minds/cms'
import { Section } from '../ui/section'
import { TestimonialCarousel } from './testimonial-carousel'

export function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
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
