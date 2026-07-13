import { type ReactNode } from 'react'

export function CtaBanner({title,body,children}: { title: string, body: string, children: ReactNode}) {
  return (
    <div className="relative isolate grid items-center gap-8 overflow-hidden rounded-panel bg-primary p-9 text-on-primary lg:grid-cols-[1.4fr_1fr] lg:p-14">
      <div className='absolute inset-0 -z-1 mix-blend-soft-light' >
        <img src="/images/card-background-01.svg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
      </div>
      <div>
        <h2 className="text-on-primary">{title}</h2>
        <p className="mt-3.5 text-body-lg text-on-primary/80">{body}</p>
      </div>
      <div className="relative flex flex-wrap gap-3 lg:justify-end">{children}</div>
    </div>
  )
}
