import { cn } from '@designing-minds/utils'

/** Five-star rating: `Math.round(value)` stars are filled, the rest are empty
 *  outlines. Exposed as one image with an aria-label; the glyphs are hidden. */
export function StarRating({
  value = 5,
  size = 'md',
  className,
}: {
  value?: number
  size?: 'sm' | 'md'
  className?: string
}) {
  const sizeCls = size === 'sm' ? 'text-body tracking-[1.5px]' : 'text-body-lg tracking-[2px]'
  const filled = Math.min(5, Math.max(0, Math.round(value)))
  return (
    <span role="img" aria-label={`${value} out of 5 stars`} className={cn('text-amber', sizeCls, className)}>
      <span aria-hidden="true">{'★'.repeat(filled)}</span>
      <span aria-hidden="true" className="text-line-strong">{'★'.repeat(5 - filled)}</span>
    </span>
  )
}
