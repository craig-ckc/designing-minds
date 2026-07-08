import { type ReactNode } from 'react'

/**
 * Section kicker. Sentence-case, medium weight, coloured in the brand blue by
 * default — pass a `text-*` class to theme it to a section's pastel colour-way.
 */
export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`mb-4 inline-flex items-center gap-2 text-[0.95rem] font-bold tracking-[-0.01em] text-primary ${className}`}>
      <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
      {children}
    </p>
  )
}
