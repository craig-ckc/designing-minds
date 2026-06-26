import { type Testimonial } from '@designing-minds/cms'
import { Container } from '../ui/Container'
import { Eyebrow } from '../ui/Eyebrow'
import { Placeholder } from '../ui/Placeholder'

export function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null
  return (
    <section className="section bg-surface-alt">
      <Container>
        <div className="mx-auto mb-9 max-w-[640px] text-center lg:mb-14">
          <Eyebrow>What parents are saying</Eyebrow>
          <h2>Real stories from families across South Africa</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {testimonials.map((item) => (
            <figure key={item.id} className="card flex flex-col gap-5 p-[30px]">
              <div className="tracking-[3px] text-ink" aria-label="5 out of 5 stars">
                ★★★★★
              </div>
              <blockquote className="text-[1.12rem] leading-[1.5]">“{item.quote}”</blockquote>
              <figcaption className="flex items-center gap-3">
                <Placeholder circle className="h-11 w-11 flex-none" />
                <span>
                  <strong className="block text-[0.95rem] font-semibold">{item.customerName}</strong>
                  <span className="text-[0.85rem] text-muted">{item.context}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  )
}
