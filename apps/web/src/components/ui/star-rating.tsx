import { cn } from '@designing-minds/utils'

/** Five-star rating rendered once — consistent glyph, tracking, amber colour
 *  and a built-in aria-label. */
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
  return (
    <span role="img" aria-label={`${value} out of 5 stars`} className={cn('text-amber', sizeCls, className)}>
      {'★★★★★'}
    </span>
  )
}
