import { type ReactNode } from 'react'
import { cn, cv } from '@designing-minds/utils'
import type { OrderStatus, PaymentStatus } from '@designing-minds/cms'

type Tone = 'solid' | 'outline' | 'muted' | 'warn' | 'info'

/**
 * Status shown as a plain text label with a single leading tone dot — the
 * table's answer to the old pill/chip. Tone drives the dot colour and the
 * text emphasis (live → brand pink, in-progress → ink, inactive → faded),
 * never a filled background. Export names keep the `Pill` suffix so callers
 * (RecordTable, DashboardPage) don't churn.
 *
 * `warn` / `info` carry publish state: saved-but-not-live, and rebuild in
 * flight. They're the only tones that leave the warm neutral palette, which is
 * the point — "this isn't on the site yet" has to be noticeable.
 */
const dotStyles = cv({
  base: ['h-1.5 w-1.5 flex-none rounded-full'],
  variants: {
    tone: {
      solid: ['bg-primary'],
      outline: ['bg-ink-soft'],
      muted: ['bg-line-strong'],
      warn: ['bg-warn'],
      info: ['bg-info'],
    },
  },
  defaultVariants: { tone: 'outline' },
})

const labelStyles = cv({
  base: [],
  variants: {
    tone: {
      solid: ['text-ink'],
      outline: ['text-ink-soft'],
      muted: ['text-muted'],
      warn: ['text-warn'],
      info: ['text-info'],
    },
  },
  defaultVariants: { tone: 'outline' },
})

export function Pill({
  children,
  tone,
  className,
  title,
}: {
  children: ReactNode
  tone?: Tone
  className?: string
  /** Hover explanation — used for the publish-state hints. */
  title?: string
}) {
  return (
    <span
      title={title}
      className={cn('inline-flex items-center gap-1.5 whitespace-nowrap', labelStyles({ tone }), className)}
    >
      <span className={dotStyles({ tone })} aria-hidden />
      {children}
    </span>
  )
}

const ORDER_TONE: Record<OrderStatus, Tone> = {
  fulfilled: 'solid',
  paid: 'solid',
  pending: 'outline',
  failed: 'muted',
  refunded: 'muted',
}
const PAYMENT_TONE: Record<PaymentStatus, Tone> = {
  succeeded: 'solid',
  pending: 'outline',
  failed: 'muted',
  refunded: 'muted',
}

/* Operational statuses arrive lowercase from the database, so they capitalise
   here rather than in the shared label style — publish-state labels are real
   sentences ("Changes in draft") that must not be title-cased. */
export const OrderStatusPill = ({ status }: { status: OrderStatus }) => (
  <Pill tone={ORDER_TONE[status]} className="capitalize">
    {status}
  </Pill>
)
export const PaymentStatusPill = ({ status }: { status: PaymentStatus }) => (
  <Pill tone={PAYMENT_TONE[status]} className="capitalize">
    {status}
  </Pill>
)

