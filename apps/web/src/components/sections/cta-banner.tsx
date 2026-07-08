import { type ReactNode } from 'react'
import { Eyebrow } from '../ui/eyebrow'

export function CtaBanner({
  eyebrow,
  title,
  body,
  children,
}: {
  eyebrow?: string
  title: string
  body: string
  children: ReactNode
}) {
  return (
    <div className="relative grid items-center gap-8 overflow-hidden rounded-panel bg-primary p-9 text-on-primary shadow-card lg:grid-cols-[1.4fr_1fr] lg:p-14">
      {/* soft decorative blobs */}
      <span aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-pill bg-on-primary/10" />
      <span aria-hidden className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-pill bg-on-primary/[0.07]" />
      <div className="relative">
        {eyebrow ? <Eyebrow tone="on-primary">{eyebrow}</Eyebrow> : null}
        <h2 className="text-on-primary">{title}</h2>
        <p className="mt-3.5 text-body-lg text-on-primary/80">{body}</p>
      </div>
      <div className="relative flex flex-wrap gap-3 lg:justify-end">{children}</div>
    </div>
  )
}
