import { type CmsSnapshot } from '@designing-minds/cms'
import { Section } from '../ui/section'
import { StarRating } from '../ui/star-rating'
import { TestimonialCarousel } from './testimonial-carousel'

export function HomeTestimonialsSection({ snapshot }: { snapshot: CmsSnapshot | null }) {
  const items = snapshot?.testimonials.filter((t) => t.published) ?? []
  if (items.length === 0) return null

  const lead = items[0]
  const cards = items.slice(1)

  return (
    <Section id="parent-stories" className="overflow-x-clip">
      <h2 className="max-w-[20ch]">Real stories from families across South Africa</h2>
      <p className="mt-3 text-body-sm text-muted">Based on verified customer orders to date.</p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div className="order-2 lg:order-1">
          <img
            src="/images/image-05.png"
            alt="Illustration of a smiling parent in a wooden picture frame"
            className="mx-auto aspect-square w-full max-w-form object-contain"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="order-1 lg:order-2">
          <StarRating value={5} />
          <blockquote className="mt-4 text-quote font-bold leading-[1.35] tracking-[-0.02em]">
            “{lead.quote}”
          </blockquote>
          <p className="mt-4 text-body">
            <strong className="font-bold">{lead.customerName}</strong>
            {lead.context ? <span className="text-muted"> · {lead.context}</span> : null}
          </p>
        </div>
      </div>

      {cards.length > 0 ? <TestimonialCarousel testimonials={cards} /> : null}
    </Section>
  )
}
