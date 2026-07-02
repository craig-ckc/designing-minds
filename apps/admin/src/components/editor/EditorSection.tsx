import { type ReactNode } from 'react'
import { cn } from '@designing-minds/utils'

/**
 * A titled group of fields inside the Record Editor pane. Fields stack in a
 * single full-width column (Webflow-style item editor).
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
    <section className={cn('grid gap-5', divided && 'border-t border-line pt-7')}>
      <header className="grid gap-1">
        <h3 className="text-[1.05rem]">{title}</h3>
        {hint ? <p className="text-[0.82rem] text-muted">{hint}</p> : null}
      </header>
      <div className="grid gap-5">{children}</div>
    </section>
  )
}
