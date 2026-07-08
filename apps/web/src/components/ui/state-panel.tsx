import { type ReactNode } from 'react'

export function StatePanel({
  title,
  body,
  children,
}: {
  title: string
  body?: string
  children?: ReactNode
}) {
  return (
    <div className="grid min-h-[60vh] place-items-center px-5 text-center">
      <div className="grid max-w-form gap-4">
        <h1>{title}</h1>
        {body ? <p className="lead">{body}</p> : null}
        {children}
      </div>
    </div>
  )
}
