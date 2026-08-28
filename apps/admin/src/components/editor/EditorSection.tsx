import { type ReactNode } from 'react'
import { cn, FIELD_HELP } from '../../design'

/**
 * A titled group of fields inside the Record Editor pane. Each section is a
 * full-width block that owns its own padding, so when `divided` is set the
 * hairline above it spans the full width of the pane rather than stopping at
 * a centred column.
 */
export function EditorSection({
  title,
  hint,
  children,
  divided,
}: {
  title: string
  hint?: string
  children: ReactNode
  divided?: boolean
}) {
  return (
    <section className={cn('grid gap-5 px-4 py-5', divided && 'border-t border-line')}>
      <header className="grid gap-0.5">
        <h3 className="text-section">{title}</h3>
        {hint ? <p className={FIELD_HELP}>{hint}</p> : null}
      </header>
      <div className="grid gap-4">{children}</div>
    </section>
  )
}
