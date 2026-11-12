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
      <p className="mt-3 text-body text-muted">Based on verified customer orders to date.</p>

      {/* A compact lead row keeps the section from dominating the page: the
          framed illustration is decoration, so it shrinks on desktop and
          drops out on phones where it pushed the quotes a screen down. */}
      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:items-center lg:gap-16">
        <div className="hidden lg:block">
          <img
            src="/images/image-05.png"
            alt="Illustration of a smiling parent in a wooden picture frame"
            className="mx-auto aspect-square w-full object-contain"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div>
          <StarRating value={5} />
          <blockquote className="mt-4 max-w-[52ch] text-h3 font-semibold leading-[1.35] tracking-[-0.02em]">
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
