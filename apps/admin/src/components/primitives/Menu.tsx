import { type ReactElement, type ReactNode } from 'react'
import { Menu as BaseMenu } from '@base-ui/react/menu'
import { cn, POPUP, POPUP_ROW } from '../../design'

/** Dropdown menu on the Base UI Menu primitive; `trigger` is the anchor element. */
export function Menu({
  trigger,
  children,
  align = 'end',
}: {
  trigger: ReactElement<Record<string, unknown>>
  children: ReactNode
  align?: 'start' | 'center' | 'end'
}) {
  return (
    <BaseMenu.Root>
      <BaseMenu.Trigger render={trigger} />
      <BaseMenu.Portal>
        <BaseMenu.Positioner align={align} sideOffset={6} className="z-50">
          <BaseMenu.Popup className={cn(POPUP, 'min-w-[200px] py-1')}>{children}</BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  )
}

export function MenuItem({
  children,
  onClick,
  className,
}: {
  children: ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <BaseMenu.Item
      onClick={onClick}
      className={cn(POPUP_ROW, 'text-ink-soft data-[highlighted]:text-ink', className)}
    >
      {children}
    </BaseMenu.Item>
  )
}

/** Non-interactive informational row (e.g. the signed-in account). */
export function MenuLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('px-2.5 py-1 text-ui text-muted', className)}>{children}</div>
}

export function MenuSeparator() {
  return <BaseMenu.Separator className="my-1 h-px bg-line" />
}
