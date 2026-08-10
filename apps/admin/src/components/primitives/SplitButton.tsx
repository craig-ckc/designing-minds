import { type ReactElement, type ReactNode } from 'react'
import { Menu as BaseMenu } from '@base-ui/react/menu'
import { cn } from '@designing-minds/utils'
import { Button, type ButtonProps } from './Button'
import { buttonStyles, type ButtonVariant } from './button-styles'

/**
 * A primary action with a caret that opens related choices — the shape of
 * Webflow's "Publish now ▾".
 *
 * Two separate targets, not one: clicking the label does the thing, clicking
 * the caret shows what else is available. That is the whole point of the
 * pattern — the common action stays one click away while the alternatives stop
 * being hidden knowledge.
 *
 * Both halves are Base UI buttons; the caret is a real Menu.Trigger, so keyboard
 * and focus behaviour come from the primitive rather than being reimplemented.
 */
export function SplitButton({
  children,
  onClick,
  menu,
  variant = 'solid',
  disabled,
  className,
  menuLabel = 'More options',
  ...props
}: Omit<ButtonProps, 'variant' | 'size' | 'render'> & {
  children: ReactNode
  onClick?: () => void
  /** Menu content — MenuItem / MenuLabel / MenuSeparator. */
  menu: ReactNode
  variant?: ButtonVariant
  menuLabel?: string
}) {
  return (
    <span className={cn('inline-flex isolate', className)}>
      <Button
        variant={variant}
        size="sm"
        onClick={onClick}
        disabled={disabled}
        // Square off the inner edge so the two halves read as one control.
        className="rounded-r-none"
        {...props}
      >
        {children}
      </Button>

      {/* A hairline between the halves, so the caret is visibly its own target. */}
      <span aria-hidden className="w-px bg-black/15" />

      <BaseMenu.Root>
        <BaseMenu.Trigger
          disabled={disabled}
          aria-label={menuLabel}
          className={cn(buttonStyles({ variant, size: 'sm' }), 'rounded-l-none px-2')}
        >
          <span className="h-3.5 w-3.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </BaseMenu.Trigger>
        <BaseMenu.Portal>
          <BaseMenu.Positioner align="end" sideOffset={6} className="z-50">
            <BaseMenu.Popup className="min-w-[260px] rounded-control border border-line bg-surface py-1 text-[0.88rem] shadow-lg">
              {menu}
            </BaseMenu.Popup>
          </BaseMenu.Positioner>
        </BaseMenu.Portal>
      </BaseMenu.Root>
    </span>
  )
}

/**
 * A menu row that carries an explanation, not just a name.
 *
 * The statuses are the thing the admin most often has to guess at, so the menu
 * spells out what each one means rather than making the user infer it.
 */
export function MenuChoice({
  label,
  description,
  selected,
  onClick,
  trailing,
}: {
  label: ReactNode
  description?: string
  selected?: boolean
  onClick?: () => void
  trailing?: ReactElement
}) {
  return (
    <BaseMenu.Item
      onClick={onClick}
      className={cn(
        'grid cursor-default gap-0.5 px-3 py-2 outline-none',
        'data-[highlighted]:bg-surface-alt',
        selected && 'bg-surface-alt',
      )}
    >
      <span className="flex items-center gap-2">
        <span className={cn('min-w-0 flex-1 truncate', selected ? 'font-semibold text-ink' : 'text-ink-soft')}>
          {label}
        </span>
        {selected ? <span className="flex-none text-[0.72rem] uppercase tracking-[0.08em] text-muted">Current</span> : null}
        {trailing}
      </span>
      {description ? <span className="text-[0.8rem] leading-snug text-muted">{description}</span> : null}
    </BaseMenu.Item>
  )
}
