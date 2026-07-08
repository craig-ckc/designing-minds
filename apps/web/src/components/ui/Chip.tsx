import { type ReactNode } from 'react'

export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-surface-sunk px-2.5 py-1 text-[0.72rem] font-semibold text-ink-soft">
      {children}
    </span>
  )
}
