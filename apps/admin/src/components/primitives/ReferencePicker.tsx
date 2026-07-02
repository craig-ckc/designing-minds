import { Combobox } from '@base-ui/react/combobox'
import { cn } from '@designing-minds/utils'
import { FIELD } from '../tokens'
import { Icon } from '../ui'
import { Button } from './Button'

export type PickerOption = { label: string; value: string }

/**
 * Type-ahead multi-reference picker (Webflow-style): type to filter options by
 * substring, click a match to add it, and manage the picks in the list below.
 * Scales to large collections where a checkbox grid would be unusable.
 */
export function ReferencePicker({
  options,
  selected,
  onChange,
  disabled,
  id,
  placeholder = 'Type to search…',
}: {
  options: PickerOption[]
  /** Selected option values, in pick order. */
  selected: string[]
  onChange: (next: string[]) => void
  disabled?: boolean
  id?: string
  placeholder?: string
}) {
  const byValue = new Map(options.map((option) => [option.value, option]))
  const value = selected.map((item) => byValue.get(item) ?? { label: item, value: item })

  return (
    <div className="grid gap-2">
      {!disabled ? (
        <Combobox.Root
          multiple
          items={options}
          value={value}
          onValueChange={(next) => onChange(next.map((option) => option.value))}
          isItemEqualToValue={(a, b) => a.value === b.value}
        >
          <Combobox.Input id={id} placeholder={placeholder} className={cn(FIELD, 'min-h-[42px] text-[0.92rem]')} />
          <Combobox.Portal>
            <Combobox.Positioner align="start" sideOffset={6} className="z-50">
              <Combobox.Popup className="max-h-[16rem] w-[var(--anchor-width)] overflow-auto rounded-md border border-line bg-surface py-1 text-[0.9rem] shadow-lg">
                <Combobox.Empty className="px-3 py-2 text-[0.85rem] text-muted">No matches.</Combobox.Empty>
                <Combobox.List>
                  {(option: PickerOption) => (
                    <Combobox.Item
                      key={option.value}
                      value={option}
                      className="flex cursor-default items-center justify-between gap-3 px-3 py-1.5 outline-none data-[highlighted]:bg-surface-alt data-[selected]:font-medium"
                    >
                      <span className="min-w-0 truncate">{option.label}</span>
                      <Combobox.ItemIndicator className="h-4 w-4 flex-none">
                        <Icon name="check" />
                      </Combobox.ItemIndicator>
                    </Combobox.Item>
                  )}
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>
      ) : null}

      {value.length > 0 ? (
        <ul className="grid gap-1.5">
          {value.map((option) => (
            <li
              key={option.value}
              className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface px-3 py-2 text-[0.9rem]"
            >
              <span className="min-w-0 truncate">{option.label}</span>
              {!disabled ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  aria-label={`Remove ${option.label}`}
                  onClick={() => onChange(selected.filter((item) => item !== option.value))}
                >
                  <span className="h-3.5 w-3.5">
                    <Icon name="close" />
                  </span>
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[0.85rem] text-muted">Nothing selected yet.</p>
      )}
    </div>
  )
}
