import { type ComponentPropsWithRef } from 'react'
import { cn, cv } from '@designing-minds/utils'
import { type VariantOf } from './variants'

/** The one pill-shaped label primitive: chips, tags, badges, statuses.
 *  `Badge` is a thin wrapper over it. */
const pillStyles = cv({
  base: ['inline-flex items-center rounded-pill font-semibold'],
  variants: {
    tone: {
      neutral: ['bg-surface-sunk text-ink-soft'],
      primary: ['bg-primary-tint text-primary-ink'],
      solid: ['bg-primary-deep text-on-primary'],
      outline: ['border border-line-strong text-ink-soft'],
      surface: ['border border-line-strong bg-surface text-ink-soft shadow-soft'],
      danger: ['bg-danger-tint text-danger'],
    },
    size: {
      sm: ['gap-1.5 px-2.5 py-1 text-caption tracking-[0.02em]'],
      md: ['gap-2 px-4 py-2 text-label font-medium'],
    },
  },
  defaultVariants: { tone: 'neutral', size: 'sm' },
})

export type PillTone = VariantOf<typeof pillStyles, 'tone'>
export type PillSize = VariantOf<typeof pillStyles, 'size'>

export type PillProps = {
  tone?: PillTone
  size?: PillSize
  /** Leading brand dot (as on section tags). */
  dot?: boolean
} & Omit<ComponentPropsWithRef<'span'>, 'color'>

export function Pill({ children, tone, size, dot, className, ...rest }: PillProps) {
  return (
    <span {...rest} className={cn(pillStyles({ tone, size }), className)}>
      {dot ? <span className="h-1.5 w-1.5 rounded-pill bg-primary" aria-hidden /> : null}
      {children}
    </span>
  )
}
