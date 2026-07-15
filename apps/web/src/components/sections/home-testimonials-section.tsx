import { type CmsSnapshot } from '@designing-minds/cms'
import { Card } from '../ui/card'
import { Placeholder } from '../ui/placeholder'
import { Section } from '../ui/section'
import { StarRating } from '../ui/star-rating'

export function HomeTestimonialsSection({ snapshot }: { snapshot: CmsSnapshot | null }) {
  const items = snapshot?.testimonials.filter((t) => t.published) ?? []
  if (items.length === 0) return null

  const lead = items[0]
  const cards = items.slice(1, 4)

  return (
    <Section id="parent-stories">
      <h2 className="max-w-[20ch]">Real stories from families across South Africa</h2>
      <p className="mt-3 text-body-sm text-muted">Based on verified customer orders to date.</p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div className="order-2 lg:order-1">
          <Placeholder ratio="1 / 1" className="mx-auto max-w-form bg-surface" label="Illustration" />
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

      {cards.length > 0 ? (
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {cards.map((t) => (
            <Card as="figure" key={t.id} pad="md" className="flex flex-col gap-3">
              <StarRating value={5} size="sm" />
              <blockquote className="text-body leading-[1.5]">“{t.quote}”</blockquote>
              <figcaption className="mt-auto text-body-sm">
                <strong className="font-bold">{t.customerName}</strong>
                {t.context ? <span className="text-muted"> · {t.context}</span> : null}
              </figcaption>
            </Card>
          ))}
        </div>
      ) : null}
    </Section>
  )
}
