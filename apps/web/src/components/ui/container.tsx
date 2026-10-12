import { type ReactNode } from 'react'

export type ContainerWidth = 'page' | 'full'

export function Container({ children, className = '', width = 'page' }: { children: ReactNode; className?: string; width?: ContainerWidth }) {
  return <div className={`mx-auto w-full ${width === 'full' ? 'max-w-none' : 'max-w-page'} px-5 sm:px-8 lg:px-12 ${className}`}>{children}</div>
}
