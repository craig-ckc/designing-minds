import { type ReactNode } from 'react'
import { cn, cv } from '@designing-minds/utils'

/** Small pill for product kinds, formats, and statuses. */
const badgeStyles = cv({
  base: ['inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.72rem] font-semibold tracking-[0.02em]'],
  variants: {
    tone: {
      neutral: ['bg-surface-sunk text-ink-soft'],
      solid: ['bg-primary text-white'],
      outline: ['border border-line-strong text-ink-soft'],
    },
  },
  defaultVariants: { tone: 'neutral' },
})

export function Badge({
  children,
  tone,
  className,
}: {
  children: ReactNode
  tone?: 'neutral' | 'solid' | 'outline'
  className?: string
}) {
  return <span className={cn(badgeStyles({ tone }), className)}>{children}</span>
}
