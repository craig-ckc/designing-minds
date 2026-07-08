import { type ReactNode } from 'react'

type EyebrowTone = 'primary' | 'on-primary'

const toneClass: Record<EyebrowTone, string> = {
  primary: 'text-primary',
  'on-primary': 'text-on-primary/80',
}

/**
 * Section kicker. Sentence-case, bold, coloured in the brand blue by default.
 * `tone="on-primary"` recolours it for placement on primary / dark panels;
 * a `text-*` className still wins to theme it to a section's pastel colour-way.
 */
export function Eyebrow({
  children,
  className = '',
  tone = 'primary',
}: {
  children: ReactNode
  className?: string
  tone?: EyebrowTone
}) {
  return (
    <p className={`mb-4 inline-flex items-center gap-2 text-body font-bold tracking-[-0.01em] ${toneClass[tone]} ${className}`}>
      <span className="h-2 w-2 rounded-pill bg-current" aria-hidden />
      {children}
    </p>
  )
}
