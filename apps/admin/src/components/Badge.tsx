import { type ReactNode } from 'react'
import { cn, cv } from '@designing-minds/utils'
import type { OrderStatus, PaymentStatus, ProductKind } from '@designing-minds/cms'

/** Monochrome status pill — varies by fill/outline/opacity, never colour. */
const pill = cv({
  base: ['inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.72rem] font-medium uppercase tracking-[0.06em]'],
  variants: {
    tone: {
      solid: ['border border-ink bg-ink text-white'],
      outline: ['border border-line-strong bg-surface text-ink'],
      muted: ['border border-line bg-surface-alt text-muted'],
    },
  },
  defaultVariants: { tone: 'outline' },
})

type Tone = 'solid' | 'outline' | 'muted'

export function Pill({ children, tone, className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return <span className={cn(pill({ tone }), className)}>{children}</span>
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
  'Individual Resource': 'muted',
}

export const OrderStatusPill = ({ status }: { status: OrderStatus }) => <Pill tone={ORDER_TONE[status]}>{status}</Pill>
export const PaymentStatusPill = ({ status }: { status: PaymentStatus }) => <Pill tone={PAYMENT_TONE[status]}>{status}</Pill>
export const KindPill = ({ kind }: { kind: ProductKind }) => <Pill tone={KIND_TONE[kind]}>{kind}</Pill>
