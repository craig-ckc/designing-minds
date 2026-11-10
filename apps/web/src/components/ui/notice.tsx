import { type ComponentPropsWithRef } from 'react'
import { cn, cv } from '@designing-minds/utils'
import { type VariantOf } from './variants'

/** Inline banner for form errors, confirmations and info. */
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

export type NoticeTone = VariantOf<typeof noticeStyles, 'tone'>

export type NoticeProps = {
  tone?: NoticeTone
  /** Defaults to `alert` for errors and `status` otherwise (a polite live region). */
  role?: 'alert' | 'status'
} & ComponentPropsWithRef<'p'>

/** The default role follows the tone so failures interrupt and confirmations
 *  do not. A notice that is already on screen when the page loads is not
 *  announced; mount it on the state change that produces it. */
export function Notice({ tone, className, role, children, ...rest }: NoticeProps) {
  return (
    <p {...rest} className={cn(noticeStyles({ tone }), className)} role={role ?? (tone === 'error' ? 'alert' : 'status')}>
      {children}
    </p>
  )
}
