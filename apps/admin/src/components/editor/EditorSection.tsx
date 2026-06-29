import { type ReactNode } from 'react'

/** A titled group of fields inside the Record Editor pane. */
export function EditorSection({ title, children, divided }: { title: string; children: ReactNode; divided?: boolean }) {
  return (
    <section className={`grid gap-4 ${divided ? 'border-t border-line pt-7' : ''}`}>
      <h3 className="text-[1.05rem]">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  )
}
