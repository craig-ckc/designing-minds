import { type ReactNode } from 'react'

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
    <div className="grid items-center gap-8 rounded-[10px] bg-ink p-9 text-white lg:grid-cols-[1.4fr_1fr] lg:p-16">
      <div>
        {eyebrow ? (
          <p className="mb-4 inline-block text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-white/60">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-white">{title}</h2>
        <p className="mt-3.5 text-white/70">{body}</p>
      </div>
      <div className="flex flex-wrap gap-3 lg:justify-end">{children}</div>
    </div>
  )
}
