import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox'
import { cn } from '../../design'
import { Icon } from '../ui'

/** Brand checkbox on the Base UI Checkbox primitive. */
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
        'group grid size-field flex-none place-items-center rounded-tight text-on-primary transition dense:size-3.5',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-1',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
    >
      <span className="grid size-3.5 place-items-center rounded-tight border border-line-strong bg-surface group-data-[checked]:border-primary-edge group-data-[checked]:bg-primary">
        <BaseCheckbox.Indicator>
          <span className="block size-2.5">
            <Icon name="check" />
          </span>
        </BaseCheckbox.Indicator>
      </span>
    </BaseCheckbox.Root>
  )
}
