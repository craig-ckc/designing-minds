import { useState } from 'react'
import { type Testimonial } from '@designing-minds/cms'
import { cn } from '@designing-minds/utils'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { StarRating } from '../ui/star-rating'

function TestimonialCard({ item, duplicate = false }: { item: Testimonial; duplicate?: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = item.quote.length > 260

  return (
    <Card
      as="figure"
      variant="surface"
      pad="lg"
      className={cn(
        'flex w-[min(82vw,24rem)] shrink-0 snap-center flex-col gap-4 border border-line-strong',
        expanded ? 'min-h-80' : 'h-[23rem] sm:h-80',
      )}
    >
      <StarRating value={5} size="sm" />
      <blockquote
        className={cn(
          'text-[1.08rem] font-medium leading-[1.55] tracking-[-0.01em]',
          isLong && !expanded && 'line-clamp-7',
        )}
      >
        “{item.quote}”
      </blockquote>
      {isLong && !duplicate ? (
        <Button variant="text" aria-expanded={expanded} onClick={() => setExpanded((current) => !current)}>
          {expanded ? 'Show less' : 'Read full story'}
        </Button>
      ) : null}
      <figcaption className="mt-auto">
        <strong className="block text-body font-bold">{item.customerName}</strong>
        {item.context ? <span className="text-label text-muted">{item.context}</span> : null}
      </figcaption>
    </Card>
  )
}

export function TestimonialCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const duration = Math.max(testimonials.length * 12, 60)

  return (
    <div className="testimonial-carousel-shell mt-8">
      <div
        role="region"
        aria-label="Family testimonials"
        tabIndex={0}
        className="testimonial-carousel py-2"
      >
        <div className="testimonial-carousel-track" style={{ animationDuration: `${duration}s` }}>
          <div className="testimonial-carousel-group">
            {testimonials.map((item) => <TestimonialCard key={item.id} item={item} />)}
          </div>
          <div className="testimonial-carousel-group testimonial-carousel-copy" aria-hidden="true">
            {testimonials.map((item) => (
              <TestimonialCard key={`duplicate-${item.id}`} item={item} duplicate />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
