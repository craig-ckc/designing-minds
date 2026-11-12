import { type ReactNode } from 'react'
import { cn } from '@designing-minds/utils'

/**
 * One label/value row of an order summary (code twin of Figma's SummaryRow).
 * `total` is the closing row: heading-weight ink with a hairline above.
 */
export function SummaryRow({
  label,
  value,
  emphasis = 'default',
  className,
}: {
  label: ReactNode
  value: ReactNode
  emphasis?: 'default' | 'total'
  className?: string
}) {
  const total = emphasis === 'total'
  return (
    <div
      data-emphasis={emphasis}
      className={cn(
        'flex justify-between gap-4',
        total ? 'border-t border-line pt-3 text-h6 text-ink' : 'text-body text-ink-soft',
        className,
      )}
    >
      <span>{label}</span>
      <span className={cn('text-right tabular-nums', !total && 'text-ink')}>{value}</span>
    </div>
  )
}
