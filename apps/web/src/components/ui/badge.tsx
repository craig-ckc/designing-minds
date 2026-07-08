import { type ReactNode } from 'react'
import { Pill } from './pill'

/** Small pill for product kinds, formats, and statuses. Thin wrapper over Pill. */
export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: 'neutral' | 'solid' | 'outline'
  className?: string
}) {
  return (
    <Pill tone={tone} size="sm" className={className}>
      {children}
    </Pill>
  )
}
