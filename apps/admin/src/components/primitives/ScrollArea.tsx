import { type ReactNode } from 'react'
import { ScrollArea as BaseScrollArea } from '@base-ui/react/scroll-area'
import { cn } from '@designing-minds/utils'

const scrollbar =
  'flex touch-none select-none rounded-full opacity-0 transition-opacity delay-300 data-[hovering]:opacity-100 data-[hovering]:delay-0 data-[scrolling]:opacity-100 data-[scrolling]:delay-0'

/**
 * Scrollable region on the Base UI ScrollArea primitive, with a thin monochrome
 * overlay thumb. The Root must have a bounded height (e.g. `min-h-0 flex-1`).
 */
export function ScrollArea({
  children,
  className,
  viewportClassName,
  orientation = 'vertical',
}: {
  children: ReactNode
  className?: string
  viewportClassName?: string
  orientation?: 'vertical' | 'horizontal' | 'both'
}) {
  return (
    <BaseScrollArea.Root className={cn('relative min-h-0', className)}>
      <BaseScrollArea.Viewport className={cn('h-full w-full overscroll-contain', viewportClassName)}>
        {children}
      </BaseScrollArea.Viewport>

      {orientation !== 'horizontal' ? (
        <BaseScrollArea.Scrollbar orientation="vertical" className={cn(scrollbar, 'm-0.5 w-1.5 justify-center')}>
          <BaseScrollArea.Thumb className="w-full rounded-full bg-line-strong" />
        </BaseScrollArea.Scrollbar>
      ) : null}

      {orientation !== 'vertical' ? (
        <BaseScrollArea.Scrollbar orientation="horizontal" className={cn(scrollbar, 'm-0.5 h-1.5 flex-col justify-center')}>
          <BaseScrollArea.Thumb className="h-full rounded-full bg-line-strong" />
        </BaseScrollArea.Scrollbar>
      ) : null}

      {orientation === 'both' ? <BaseScrollArea.Corner /> : null}
    </BaseScrollArea.Root>
  )
}
