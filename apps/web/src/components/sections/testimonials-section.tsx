import { type Testimonial } from '@designing-minds/cms'
import { Section } from '../ui/section'
import { Card } from '../ui/card'
import { StarRating } from '../ui/star-rating'

export function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null
  return (
    <Section>
        <div className="mx-auto mb-9 max-w-prose text-center lg:mb-14">
          <h2>Real stories from families across South Africa</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {testimonials.map((item) => (
            <Card as="figure" key={item.id} variant="surface" pad="lg" className="flex flex-col gap-4">
              <StarRating value={5} size="sm" />
              <blockquote className="text-[1.18rem] font-medium leading-[1.5] tracking-[-0.01em]">“{item.quote}”</blockquote>
              <figcaption className="mt-auto">
                <strong className="block text-body font-bold">{item.customerName}</strong>
                {item.context ? <span className="text-label text-muted">{item.context}</span> : null}
              </figcaption>
            </Card>
          ))}
        </div>
    </Section>
  )
}
