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
    <div className="relative grid items-center gap-8 overflow-hidden rounded-3xl bg-primary p-9 text-white shadow-card lg:grid-cols-[1.4fr_1fr] lg:p-14">
      {/* soft decorative blobs */}
      <span aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
      <span aria-hidden className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-white/[0.07]" />
      <div className="relative">
        {eyebrow ? (
          <p className="mb-4 inline-flex items-center gap-2 text-[0.95rem] font-bold text-white/80">
            <span className="h-2 w-2 rounded-full bg-white/80" aria-hidden />
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-white">{title}</h2>
        <p className="mt-3.5 text-[1.05rem] text-white/80">{body}</p>
      </div>
      <div className="relative flex flex-wrap gap-3 lg:justify-end">{children}</div>
    </div>
  )
}
