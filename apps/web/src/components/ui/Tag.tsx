import { type ReactNode } from 'react'

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line-strong px-3 py-1.5 text-[0.82rem] text-ink-soft">
      <span className="h-1.5 w-1.5 rounded-full bg-ink" />
      {children}
    </span>
  )
}
