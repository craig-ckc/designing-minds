import { type ComponentPropsWithRef } from 'react'
import { cn } from '@designing-minds/utils'

export type ContainerWidth = 'page' | 'full'

export function Container({ children, className, width = 'page', ...rest }: { width?: ContainerWidth } & ComponentPropsWithRef<'div'>) {
  return (
    <div {...rest} className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', width === 'full' ? 'max-w-none' : 'max-w-page', className)}>
      {children}
    </div>
  )
}
