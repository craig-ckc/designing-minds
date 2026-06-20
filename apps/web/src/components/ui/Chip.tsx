import { type ReactNode } from 'react'

export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-line px-2.5 py-1 text-[0.72rem] uppercase tracking-[0.04em] text-muted">
      {children}
    </span>
  )
}
