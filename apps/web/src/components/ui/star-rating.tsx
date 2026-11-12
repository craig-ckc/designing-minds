import { cn } from '@designing-minds/utils'
import { Icon } from './icon'

/** Five-star rating: `Math.round(value)` soft filled stars, the rest muted.
 *  Exposed as one image with an aria-label; the glyphs are hidden. */
export function StarRating({
  value = 5,
  size = 'md',
  className,
}: {
  value?: number
  size?: 'sm' | 'md'
  className?: string
}) {
  const px = size === 'sm' ? 16 : 18
  const filled = Math.min(5, Math.max(0, Math.round(value)))
  return (
    <span role="img" aria-label={`${value} out of 5 stars`} className={cn('inline-flex items-center gap-0.5', className)}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          aria-hidden="true"
          data-filled={i < filled ? '' : undefined}
          className={cn('inline-flex shrink-0', i < filled ? 'text-on-yellow' : 'text-line-strong')}
        >
          <Icon name="star" weight="fill" size={px} />
        </span>
      ))}
    </span>
  )
}
