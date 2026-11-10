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

type SelectValueProps = {
  /** Controlled value. Pair with `onValueChange`. */
  value?: string
  /** Uncontrolled initial value. */
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** @deprecated Use `onValueChange`; kept so existing call sites compile. */
  onChange?: (value: string) => void
}

function notifier({ onValueChange, onChange }: Pick<SelectValueProps, 'onValueChange' | 'onChange'>) {
  return (next: string | null) => {
    if (next === null) return
    onValueChange?.(next)
    onChange?.(next)
  }
}

/** Shared themed control and popup, also used without a visible field label in toolbars. */
export function SelectControl({ label, name, value, defaultValue, options, onValueChange, onChange, compact = false, align = 'start', className }: SelectValueProps & {
  label: string
  name?: string
  options: readonly SelectOption[]
  compact?: boolean
  align?: 'start' | 'end'
  className?: string
}) {
  return (
    <BaseSelect.Root
      name={name}
      value={value}
      defaultValue={defaultValue}
      items={options}
      onValueChange={notifier({ onValueChange, onChange })}
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

/** Labelled form/filter select. The optional name preserves native form posting.
 *  `options` may be plain strings or `{ value, label }` pairs. */
export function Select({ label, name, value, defaultValue, options, onValueChange, onChange, compact = false }: SelectValueProps & {
  label: string
  name?: string
  options: readonly (string | SelectOption)[]
  compact?: boolean
}) {
  return (
    <Field label={label}>
      <SelectControl
        label={label}
        name={name}
        value={value}
        defaultValue={defaultValue}
        options={options.map((option) => (typeof option === 'string' ? { value: option, label: option } : option))}
        onValueChange={onValueChange}
        onChange={onChange}
        compact={compact}
      />
    </Field>
  )
}
