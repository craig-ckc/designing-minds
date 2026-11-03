import { Select as BaseSelect } from '@base-ui/react/select'
import { cn } from '@designing-minds/utils'
import { Icon } from './icon'
import { Field } from './field'

function disableHiddenInputHitTarget(input: HTMLInputElement | null) {
  if (!input) return
  input.inert = true
  input.style.pointerEvents = 'none'
}

export interface SelectOption {
  value: string
  label: string
}

/** Shared themed control and popup, also used without a visible field label in toolbars. */
export function SelectControl({ label, name, value, options, onChange, compact = false, align = 'start', className }: {
  label: string
  name?: string
  value: string
  options: readonly SelectOption[]
  onChange: (value: string) => void
  compact?: boolean
  align?: 'start' | 'end'
  className?: string
}) {
  return (
    <BaseSelect.Root
      name={name}
      value={value}
      items={options}
      onValueChange={(next) => { if (next !== null) onChange(next) }}
      inputRef={disableHiddenInputHitTarget}
    >
      <BaseSelect.Trigger
        aria-label={label}
        className={cn(compact ? 'filter-control w-full justify-between text-left' : 'field flex items-center justify-between gap-2 text-left font-normal hover:border-primary', className)}
      >
        <BaseSelect.Value />
        <BaseSelect.Icon className="h-3 w-3 text-ink-soft">
          <Icon name="chevron" />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner align={align} sideOffset={8} collisionPadding={8} alignItemWithTrigger={false} className="z-50">
          <BaseSelect.Popup className="select-menu">
            <BaseSelect.List>
              {options.map((option) => (
                <BaseSelect.Item key={option.value} value={option.value} className="select-menu__item">
                  <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
                  <span className="h-4 w-4 shrink-0">
                    <BaseSelect.ItemIndicator><Icon name="check" size={16} /></BaseSelect.ItemIndicator>
                  </span>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  )
}

/** Labelled form/filter select. The optional name preserves native form posting. */
export function Select({ label, name, value, options, onChange, compact = false }: {
  label: string
  name?: string
  value: string
  options: string[]
  onChange: (value: string) => void
  compact?: boolean
}) {
  return (
    <Field label={label}>
      <SelectControl label={label} name={name} value={value} options={options.map((option) => ({ value: option, label: option }))} onChange={onChange} compact={compact} />
    </Field>
  )
}
