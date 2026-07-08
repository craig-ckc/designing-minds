import { type ReactNode } from 'react'
import { cn, cv } from '@designing-minds/utils'

export type NoticeTone = 'info' | 'error' | 'success'

/** Inline alert banner for form errors, confirmations and info. Replaces the
 *  hand-rolled bordered banners scattered across auth, checkout and forms. */
const noticeStyles = cv({
  base: ['rounded-control border px-4 py-3 text-body-sm'],
  variants: {
    tone: {
      info: ['border-primary/30 bg-primary-tint text-ink-soft'],
      error: ['border-danger/30 bg-danger-tint text-danger'],
      success: ['border-forest/25 bg-meadow/40 text-forest'],
    },
  },
  defaultVariants: { tone: 'info' },
})

export function Notice({
  children,
  tone,
  className,
  role,
}: {
  children: ReactNode
  tone?: NoticeTone
  className?: string
  role?: 'alert' | 'status'
}) {
  return (
    <p className={cn(noticeStyles({ tone }), className)} role={role ?? (tone === 'error' ? 'alert' : undefined)}>
      {children}
    </p>
  )
}
