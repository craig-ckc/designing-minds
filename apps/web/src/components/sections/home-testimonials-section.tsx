import { type CmsSnapshot } from '@designing-minds/cms'
import { Card } from '../ui/card'
import { Placeholder } from '../ui/placeholder'
import { Section } from '../ui/section'
import { StarRating } from '../ui/star-rating'
import fallbackTestimonials from '../../content/home/fallback-testimonials.json'

export function HomeTestimonialsSection({ snapshot }: { snapshot: CmsSnapshot | null }) {
  const published = snapshot?.testimonials.filter((t) => t.published) ?? []
  const items = published.length > 0 ? published : fallbackTestimonials
  const lead = items[0]
  const cards = items.slice(1, 4)

  return (
    <Section className="bg-cream">
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div className="order-2 lg:order-1">
          <Placeholder ratio="1 / 1" className="mx-auto max-w-form bg-surface" label="Watch their story" />
        </div>
        <div className="order-1 lg:order-2">
          <h2 className="max-w-[16ch]">Real stories from families across South Africa</h2>
          <blockquote className="mt-6 text-quote font-bold leading-[1.35] tracking-[-0.02em]">
            “{lead.quote}”
          </blockquote>
          <p className="mt-4 text-body">
            <strong className="font-bold">{lead.customerName}</strong>{' '}
            <span className="text-muted">· {lead.context}</span>
          </p>
        </div>
      </div>

      {cards.length > 0 ? (
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {cards.map((t) => (
            <Card as="figure" key={t.id} pad="md" className="flex flex-col gap-3">
              <StarRating size="sm" className="tracking-[2px]" />
              <blockquote className="text-body leading-[1.5]">“{t.quote}”</blockquote>
              <figcaption className="mt-auto text-body-sm">
                <strong className="font-bold">{t.customerName}</strong>{' '}
                <span className="text-muted">· {t.context}</span>
              </figcaption>
            </Card>
          ))}
        </div>
      ) : null}
    </Section>
  )
}
