import { Select as BaseSelect } from '@base-ui/react/select'
import { Icon } from './icon'
import { Field } from './field'

function disableHiddenInputHitTarget(input: HTMLInputElement | null) {
  if (!input) return
  input.inert = true
  input.style.pointerEvents = 'none'
}

/** Accessible single-select built on Base UI. Used for browse-page filters.
 *  Composes <Field> for the label and the shared `.field` control base so it
 *  stays visually identical to text inputs. */
export function Select({
  label,
  name,
  value,
  options,
  onChange,
}: {
  label: string
  /** Native form field name. When set, Base UI renders a hidden input that
   *  carries the current value, so the select posts through a plain HTML
   *  form the same way a native <select> would (see newsletter/contact
   *  progressive-enhancement fallbacks). */
  name?: string
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <Field label={label}>
      <BaseSelect.Root
        name={name}
        value={value}
        onValueChange={(next) => onChange(next as string)}
        inputRef={disableHiddenInputHitTarget}
      >
        <BaseSelect.Trigger className="field flex items-center justify-between gap-2 text-left font-normal hover:border-primary">
          <BaseSelect.Value />
          <BaseSelect.Icon className="h-4 w-4 text-muted">
            <Icon name="chevron" />
          </BaseSelect.Icon>
        </BaseSelect.Trigger>
        <BaseSelect.Portal>
          <BaseSelect.Positioner sideOffset={6} className="z-50">
            <BaseSelect.Popup className="max-h-[18rem] min-w-[var(--anchor-width)] overflow-auto rounded-control border border-line bg-surface p-1.5 shadow-card">
              {options.map((option) => (
                <BaseSelect.Item
                  key={option}
                  value={option}
                  className="flex cursor-default items-center justify-between gap-3 rounded-lg px-3 py-2 text-body-sm data-[highlighted]:bg-surface-sunk data-[selected]:font-bold data-[selected]:text-primary-ink"
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
    </Field>
  )
}
