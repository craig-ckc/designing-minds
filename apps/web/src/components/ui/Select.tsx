import { Select as BaseSelect } from '@base-ui/react/select'
import { Icon } from './Icon'

/** Accessible single-select built on Base UI. Used for browse-page filters. */
export function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <label className="grid gap-2 text-[0.92rem] font-medium">
      {label}
      <BaseSelect.Root value={value} onValueChange={(next) => onChange(next as string)}>
        <BaseSelect.Trigger className="flex min-h-[46px] items-center justify-between gap-2 rounded-md border border-line-strong bg-surface px-3.5 py-2.5 text-left font-normal hover:border-ink focus:outline focus:outline-2 focus:outline-ink">
          <BaseSelect.Value />
          <BaseSelect.Icon className="h-4 w-4 text-muted">
            <Icon name="chevron" />
          </BaseSelect.Icon>
        </BaseSelect.Trigger>
        <BaseSelect.Portal>
          <BaseSelect.Positioner sideOffset={6} className="z-50">
            <BaseSelect.Popup className="max-h-[18rem] min-w-[var(--anchor-width)] overflow-auto rounded-md border border-line bg-surface py-1 shadow-md">
              {options.map((option) => (
                <BaseSelect.Item
                  key={option}
                  value={option}
                  className="flex cursor-default items-center justify-between gap-3 px-3.5 py-2 text-[0.92rem] data-[highlighted]:bg-surface-alt data-[selected]:font-medium"
                >
                  <BaseSelect.ItemText>{option}</BaseSelect.ItemText>
                  <BaseSelect.ItemIndicator className="h-4 w-4">
                    <Icon name="check" />
                  </BaseSelect.ItemIndicator>
                </BaseSelect.Item>
              ))}
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
    </label>
  )
}
