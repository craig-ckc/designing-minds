import { type Testimonial } from '@designing-minds/cms'
import { Card } from '../ui/card'
import { StarRating } from '../ui/star-rating'

function TestimonialCard({ item }: { item: Testimonial }) {
  return (
    <Card
      as="figure"
      variant="surface"
      pad="md"
      className="flex min-h-80 w-[min(82vw,24rem)] shrink-0 flex-col gap-4 border border-line-strong sm:p-8"
    >
      <StarRating value={5} size="sm" />
      <blockquote className="line-clamp-7 shrink-0 break-words text-[1.08rem] font-medium leading-[1.55] tracking-[-0.01em]">
        “{item.quote}”
      </blockquote>
      <figcaption className="mt-auto">
        <strong className="block text-body font-bold">{item.customerName}</strong>
        {item.context ? <span className="text-label text-muted">{item.context}</span> : null}
      </figcaption>
    </Card>
  )
}

export function TestimonialCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  // A lone testimonial renders statically: the marquee would show a clipped duplicate.
  if (testimonials.length < 2) {
    return (
      <div className="mt-8 flex justify-center py-2" role="region" aria-label="Family testimonials">
        {testimonials.map((item) => <TestimonialCard key={item.id} item={item} />)}
      </div>
    )
  }
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
              <TestimonialCard key={`duplicate-${item.id}`} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
