import { type ReactNode } from 'react'
import { Toolbar as BaseToolbar } from '@base-ui/react/toolbar'
import { Toggle } from '@base-ui/react/toggle'
import { cn } from '@designing-minds/utils'

/**
 * Grouped control strip on the Base UI Toolbar primitive — arrow-key roving
 * focus and correct toolbar semantics, which the hand-rolled row of buttons it
 * replaced had neither of.
 */
export function Toolbar({ children, className, label }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <BaseToolbar.Root
      aria-label={label}
      className={cn('flex flex-wrap items-center gap-0.5 border-b border-line bg-surface-alt/60 px-2 py-1.5', className)}
    >
      {children}
    </BaseToolbar.Root>
  )
}

/**
 * A press-to-apply control inside a Toolbar (bold, heading level, list…).
 * Rendered as a Toggle so its on/off state is exposed as `aria-pressed`.
 */
export function ToolbarToggle({
  children,
  label,
  pressed,
  onPressed,
  className,
}: {
  children: ReactNode
  /** Accessible name and tooltip — the visible content is often a glyph. */
  label: string
  pressed?: boolean
  onPressed: () => void
  className?: string
}) {
  return (
    <BaseToolbar.Button
      render={<Toggle pressed={pressed} onPressedChange={onPressed} />}
      title={label}
      aria-label={label}
      // Keep focus in the editor so marks apply to the current selection.
      onMouseDown={(event) => event.preventDefault()}
      className={cn(
        'grid h-7 min-w-7 cursor-default place-items-center rounded-control px-1.5 text-[0.8rem] font-medium text-ink-soft transition',
        'hover:bg-surface-alt hover:text-ink',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-1',
        'data-[pressed]:bg-primary data-[pressed]:text-on-primary data-[pressed]:hover:bg-primary',
        className,
      )}
    >
      {children}
    </BaseToolbar.Button>
  )
}

/** Vertical rule between toolbar groups. */
export function ToolbarSeparator() {
  return <BaseToolbar.Separator className="mx-1 h-4 w-px bg-line" />
}
