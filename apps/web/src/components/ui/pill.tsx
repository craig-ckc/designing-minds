import { type ReactNode } from 'react'
import { cn, cv } from '@designing-minds/utils'

export type PillTone = 'neutral' | 'primary' | 'solid' | 'outline' | 'surface'
export type PillSize = 'sm' | 'md'

/** The one pill-shaped label primitive: chips, tags, badges, statuses.
 *  `Badge` and `Tag` are thin wrappers over it. */
const pillStyles = cv({
  base: ['inline-flex items-center rounded-pill font-semibold'],
  variants: {
    tone: {
      neutral: ['bg-surface-sunk text-ink-soft'],
      primary: ['bg-primary-tint text-primary'],
      solid: ['bg-primary text-on-primary'],
      outline: ['border border-line-strong text-ink-soft'],
      surface: ['border border-line-strong bg-surface text-ink-soft shadow-soft'],
    },
    size: {
      sm: ['gap-1.5 px-2.5 py-1 text-caption tracking-[0.02em]'],
      md: ['gap-2 px-4 py-2 text-label font-medium'],
    },
  },
  defaultVariants: { tone: 'neutral', size: 'sm' },
})

export function Pill({
  children,
  tone,
  size,
  dot,
  className,
}: {
  children: ReactNode
  tone?: PillTone
  size?: PillSize
  /** Leading brand-blue dot (as on section tags). */
  dot?: boolean
  className?: string
}) {
  return (
    <span className={cn(pillStyles({ tone, size }), className)}>
      {dot ? <span className="h-1.5 w-1.5 rounded-pill bg-primary" aria-hidden /> : null}
      {children}
    </span>
  )
}
