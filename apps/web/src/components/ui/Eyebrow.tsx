import { type ReactNode } from 'react'

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`mb-4 inline-block text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-muted ${className}`}>
      {children}
    </p>
  )
}
