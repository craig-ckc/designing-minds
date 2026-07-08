import { type ReactNode } from 'react'
import { Eyebrow } from './eyebrow'

export function StatePanel({
  eyebrow,
  title,
  body,
  children,
}: {
  eyebrow: string
  title: string
  body?: string
  children?: ReactNode
}) {
  return (
    <div className="grid min-h-[60vh] place-items-center px-5 text-center">
      <div className="grid max-w-[460px] gap-4">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1>{title}</h1>
        {body ? <p className="lead">{body}</p> : null}
        {children}
      </div>
    </div>
  )
}
