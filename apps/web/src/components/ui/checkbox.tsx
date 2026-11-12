import { type ComponentProps, type ReactNode } from 'react'
import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox'
import { cn } from '@designing-minds/utils'
import { Icon } from './icon'

/**
 * Themed Base UI checkbox with an attached label. Controlled
 * (`checked`/`onCheckedChange`) or uncontrolled (`defaultChecked`); `name` and
 * `required` post natively. The 24px box meets the target-size minimum.
 *
 * Rendered as a `<button>` (`nativeButton`) so it works with the label's
 * `htmlFor`; the label text may contain links.
 */
export function Checkbox({
  id,
  label,
  className,
  boxClassName,
  ...rest
}: Omit<ComponentProps<typeof BaseCheckbox.Root>, 'render' | 'nativeButton' | 'children' | 'className' | 'id'> & {
  id: string
  label: ReactNode
  /** Classes for the label/row wrapper. */
  className?: string
  /** Classes for the box itself. */
  boxClassName?: string
}) {
  return (
    <div className={cn('flex items-start gap-3 text-body text-ink-soft', className)}>
      <BaseCheckbox.Root
        {...rest}
        id={id}
        nativeButton
        render={<button type="button" />}
        className={cn(
          'mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-sm border border-line-strong bg-canvas text-on-primary transition',
          'data-[checked]:border-primary data-[checked]:bg-primary',
          boxClassName,
        )}
      >
        <BaseCheckbox.Indicator className="flex data-[unchecked]:hidden">
          <Icon name="check" size={16} weight="bold" />
        </BaseCheckbox.Indicator>
      </BaseCheckbox.Root>
      <label htmlFor={id} className="cursor-pointer">{label}</label>
    </div>
  )
}
