import { type ReactNode } from 'react'
import { ScrollArea as BaseScrollArea } from '@base-ui/react/scroll-area'
import { cn } from '../../design'

const scrollbar =
  'flex touch-none select-none rounded-full opacity-0 transition-opacity delay-300 data-[hovering]:opacity-100 data-[hovering]:delay-0 data-[scrolling]:opacity-100 data-[scrolling]:delay-0'

/**
 * Scrollable region on the Base UI ScrollArea primitive, with a thin monochrome
 * overlay thumb. Bound the Root's height for vertical scrolling (e.g.
 * `min-h-0 flex-1`); horizontal tables can keep their natural height.
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
    <BaseScrollArea.Root className={cn('relative flex min-h-0 flex-col', className)}>
      <BaseScrollArea.Viewport className={cn('min-h-0 w-full flex-1 overscroll-contain', viewportClassName)}>
        {children}
      </BaseScrollArea.Viewport>

      {orientation !== 'horizontal' ? (
        <BaseScrollArea.Scrollbar orientation="vertical" className={cn(scrollbar, 'm-0.5 w-1.5 justify-center')}>
          <BaseScrollArea.Thumb className="w-full rounded-full bg-line-strong" />
        </BaseScrollArea.Scrollbar>
      ) : null}

      {orientation !== 'vertical' ? (
        <BaseScrollArea.Scrollbar orientation="horizontal" className={cn(scrollbar, 'm-0.5 h-2 flex-col justify-center bg-line/50 opacity-100 dense:h-1.5 dense:bg-transparent dense:opacity-0')}>
          <BaseScrollArea.Thumb className="h-full rounded-full bg-ink-soft dense:bg-line-strong" />
        </BaseScrollArea.Scrollbar>
      ) : null}

      {orientation === 'both' ? <BaseScrollArea.Corner /> : null}
    </BaseScrollArea.Root>
  )
}
