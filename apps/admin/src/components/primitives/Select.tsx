import { Select as BaseSelect } from '@base-ui/react/select'
import { cn } from '@designing-minds/utils'
import { FIELD } from '../tokens'
import { Icon } from '../ui'

export type SelectOption = { label: string; value: string }

/** Single-select dropdown on the Base UI Select primitive, styled as a field control. */
export function Select({
  value,
  onValueChange,
  options,
  placeholder,
  id,
  disabled,
  className,
}: {
  value: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  id?: string
  disabled?: boolean
  className?: string
}) {
  return (
    <BaseSelect.Root value={value} onValueChange={(next) => onValueChange((next ?? '') as string)} disabled={disabled}>
      <BaseSelect.Trigger
        id={id}
        className={cn(FIELD, 'flex items-center justify-between gap-2 text-left disabled:opacity-50', className)}
      >
        <BaseSelect.Value placeholder={placeholder} />
        <BaseSelect.Icon className="h-4 w-4 flex-none text-muted">
          <Icon name="chevron" />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner sideOffset={6} className="z-50">
          <BaseSelect.Popup className="max-h-[18rem] min-w-[var(--anchor-width)] overflow-auto rounded-md border border-line bg-surface py-1 text-[0.9rem] shadow-lg">
            {options.map((option) => (
              <BaseSelect.Item
                key={option.value}
                value={option.value}
                className="flex cursor-default items-center justify-between gap-3 px-3 py-1.5 outline-none data-[highlighted]:bg-surface-alt data-[selected]:font-medium"
              >
                <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
                <BaseSelect.ItemIndicator className="h-4 w-4 flex-none">
                  <Icon name="check" />
                </BaseSelect.ItemIndicator>
              </BaseSelect.Item>
            ))}
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  )
}
