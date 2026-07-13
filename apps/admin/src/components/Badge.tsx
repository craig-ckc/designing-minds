import { type ReactNode } from 'react'
import { cn, cv } from '@designing-minds/utils'
import type { OrderStatus, PaymentStatus, ProductKind } from '@designing-minds/cms'

type Tone = 'solid' | 'outline' | 'muted'

/**
 * Status shown as a plain text label with a single leading tone dot — the
 * table's answer to the old pill/chip. Tone drives the dot colour and the
 * text emphasis (live → brand pink, in-progress → ink, inactive → faded),
 * never a filled background. Export names keep the `Pill` suffix so callers
 * (RecordTable, DashboardPage) don't churn.
 */
const dotStyles = cv({
  base: ['h-1.5 w-1.5 flex-none rounded-full'],
  variants: {
    tone: {
      solid: ['bg-primary'],
      outline: ['bg-ink-soft'],
      muted: ['bg-line-strong'],
    },
  },
  defaultVariants: { tone: 'outline' },
})

const labelStyles = cv({
  base: ['capitalize'],
  variants: {
    tone: {
      solid: ['text-ink'],
      outline: ['text-ink-soft'],
      muted: ['text-muted'],
    },
  },
  defaultVariants: { tone: 'outline' },
})

export function Pill({ children, tone, className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap', labelStyles({ tone }), className)}>
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
const KIND_TONE: Record<ProductKind, Tone> = {
  Bundle: 'solid',
  'Access Plan': 'outline',
  'Single': 'muted',
}

export const OrderStatusPill = ({ status }: { status: OrderStatus }) => <Pill tone={ORDER_TONE[status]}>{status}</Pill>
export const PaymentStatusPill = ({ status }: { status: PaymentStatus }) => <Pill tone={PAYMENT_TONE[status]}>{status}</Pill>
export const KindPill = ({ kind }: { kind: ProductKind }) => <Pill tone={KIND_TONE[kind]}>{kind}</Pill>
