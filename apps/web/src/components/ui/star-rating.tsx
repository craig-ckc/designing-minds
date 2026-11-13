import { cn } from '@designing-minds/utils'
import { Icon } from './icon'

/** Five-star rating: `Math.round(value)` soft filled stars, the rest muted.
 *  Exposed as one image with an aria-label; the glyphs are hidden.
 *  `tone="primary"` is the brand-pink hero rating (Figma Home hero); testimonials keep amber. */
export function StarRating({
  value = 5,
  size = 'md',
  tone = 'amber',
  className,
}: {
  value?: number
  size?: 'sm' | 'md'
  tone?: 'amber' | 'primary'
  className?: string
}) {
  const px = size === 'sm' ? 16 : 18
  const filled = Math.min(5, Math.max(0, Math.round(value)))
  const filledTone = tone === 'primary' ? 'text-primary' : 'text-on-yellow'
  return (
    <span role="img" aria-label={`${value} out of 5 stars`} className={cn('inline-flex items-center', tone === 'primary' ? 'gap-1' : 'gap-0.5', className)}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          aria-hidden="true"
          data-filled={i < filled ? '' : undefined}
          className={cn('inline-flex shrink-0', i < filled ? filledTone : 'text-line-strong')}
        >
          <Icon name="star" weight="fill" size={px} />
        </span>
      ))}
    </span>
  )
}
