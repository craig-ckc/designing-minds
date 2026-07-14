import { type Testimonial } from '@designing-minds/cms'
import { Section } from '../ui/section'
import { Placeholder } from '../ui/placeholder'
import { Card } from '../ui/card'

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
              <blockquote className="text-[1.18rem] font-medium leading-[1.5] tracking-[-0.01em]">“{item.quote}”</blockquote>
              <figcaption className="mt-auto flex items-center gap-3">
                <Placeholder circle className="h-11 w-11 flex-none" />
                <span>
                  <strong className="block text-body font-bold">{item.customerName}</strong>
                  <span className="text-label text-muted">{item.context}</span>
                </span>
              </figcaption>
            </Card>
          ))}
        </div>
    </Section>
  )
}
