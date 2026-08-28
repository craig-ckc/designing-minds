import { Select as BaseSelect } from '@base-ui/react/select'
import { cn, FIELD, POPUP, POPUP_ROW } from '../../design'
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
        <BaseSelect.Icon className="size-3.5 flex-none text-muted">
          <Icon name="chevron" />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner sideOffset={6} className="z-50">
          <BaseSelect.Popup className={cn(POPUP, 'max-h-[16rem] min-w-[var(--anchor-width)] overflow-auto py-1')}>
            {options.map((option) => (
              <BaseSelect.Item
                key={option.value}
                value={option.value}
                className={cn(POPUP_ROW, 'justify-between gap-3 data-[selected]:font-medium')}
              >
                <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
                <BaseSelect.ItemIndicator className="size-3.5 flex-none">
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
