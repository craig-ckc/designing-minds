import type { ReactNode } from 'react'
import { Icon } from './icon'

/** Native disclosure keeps every detail in the prerendered page and works without JS. */
export function DetailDisclosure({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="detail-disclosure border-b border-line">
      <summary className="group flex min-h-12 items-center justify-between gap-4 py-4 text-ink focus-visible:outline-2 focus-visible:outline-primary-ink focus-visible:outline-offset-2">
        <h2 className="text-base font-semibold leading-snug tracking-normal">{title}</h2>
        <span className="flex-none transition-transform motion-reduce:transition-none group-open:rotate-45" aria-hidden="true">
          <Icon name="plus" size={16} />
        </span>
      </summary>
      <div className="pb-5 text-sm leading-relaxed text-ink-soft">{children}</div>
    </details>
  )
}
