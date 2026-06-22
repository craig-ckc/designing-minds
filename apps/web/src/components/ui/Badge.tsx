import { type ReactNode } from 'react'
import { cn, cv } from '@designing-minds/utils'

/** Small pill for product kinds, formats, and statuses. Monochrome wireframe tones. */
const badge = cv({
  base: ['inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.72rem] font-medium uppercase tracking-[0.04em]'],
  variants: {
    tone: {
      neutral: ['border border-line text-muted'],
      solid: ['bg-ink text-white'],
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
  return <span className={cn(badge({ tone }), className)}>{children}</span>
}
