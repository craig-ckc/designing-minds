import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox'
import { cn } from '@designing-minds/utils'
import { Icon } from '../ui'

/** Monochrome checkbox on the Base UI Checkbox primitive. */
export function Checkbox({
  checked,
  onCheckedChange,
  disabled,
  id,
  className,
  'aria-label': ariaLabel,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  id?: string
  className?: string
  'aria-label'?: string
}) {
  return (
    <BaseCheckbox.Root
      id={id}
      checked={checked}
      onCheckedChange={(next) => onCheckedChange(next)}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        'grid h-4 w-4 flex-none place-items-center rounded border border-line-strong bg-surface text-white transition',
        'data-[checked]:border-ink data-[checked]:bg-ink',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-1',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
    >
      <BaseCheckbox.Indicator>
        <span className="block h-3 w-3">
          <Icon name="check" />
        </span>
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  )
}
