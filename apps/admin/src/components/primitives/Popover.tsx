import { type ReactElement, type ReactNode } from 'react'
import { Popover as BasePopover } from '@base-ui/react/popover'
import { cn } from '@designing-minds/utils'

/** Anchored popup on the Base UI Popover primitive; `trigger` is the anchor element. */
export function Popover({
  trigger,
  children,
  align = 'start',
  className,
}: {
  trigger: ReactElement<Record<string, unknown>>
  children: ReactNode
  align?: 'start' | 'center' | 'end'
  className?: string
}) {
  return (
    <BasePopover.Root>
      <BasePopover.Trigger render={trigger} />
      <BasePopover.Portal>
        <BasePopover.Positioner align={align} sideOffset={6} className="z-50">
          <BasePopover.Popup
            className={cn(
              'flex max-h-[min(420px,var(--available-height))] flex-col overflow-hidden rounded-md border border-line bg-surface text-[0.88rem] shadow-lg',
              className,
            )}
          >
            {children}
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  )
}
