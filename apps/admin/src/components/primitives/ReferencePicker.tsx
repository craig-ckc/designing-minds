import { Combobox } from '@base-ui/react/combobox'
import { cn, FIELD, POPUP, POPUP_ROW } from '../../design'
import { Icon } from '../ui'
import { Button } from './Button'
import { availableOptions, enforceMaxSelected } from './reference-picker-utils'

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
  maxSelected,
  placeholder = 'Type to search…',
}: {
  options: PickerOption[]
  /** Selected option values, in pick order. */
  selected: string[]
  onChange: (next: string[]) => void
  disabled?: boolean
  id?: string
  /** When set, at most this many items may be selected. Selecting a new item
   *  at the limit replaces the earliest pick. */
  maxSelected?: number
  placeholder?: string
}) {
  const byValue = new Map(options.map((option) => [option.value, option]))
  const value = selected.map((item) => byValue.get(item) ?? { label: item, value: item })
  // Suggestions are only ever things you haven't added yet — see availableOptions.
  const available = availableOptions(options, selected)

  function emit(next: string[]) {
    if (maxSelected != null) next = enforceMaxSelected(next, maxSelected)
    onChange(next)
  }

  return (
    <div className="grid gap-2">
      {!disabled ? (
        <Combobox.Root
          multiple
          items={available}
          value={value}
          onValueChange={(next) => emit(next.map((option) => option.value))}
          isItemEqualToValue={(a, b) => a.value === b.value}
        >
          <Combobox.Input id={id} placeholder={placeholder} className={FIELD} />
          <Combobox.Portal>
            <Combobox.Positioner align="start" sideOffset={6} className="z-50">
              <Combobox.Popup className={cn(POPUP, 'max-h-[16rem] w-[var(--anchor-width)] overflow-auto py-1')}>
                <Combobox.Empty className="px-2.5 py-1.5 text-ui text-muted">
                  {available.length === 0 && options.length > 0 ? 'Everything is already added.' : 'No matches.'}
                </Combobox.Empty>
                <Combobox.List>
                  {(option: PickerOption) => (
                    <Combobox.Item
                      key={option.value}
                      value={option}
                      className={POPUP_ROW}
                    >
                      <span className="min-w-0 truncate">{option.label}</span>
                    </Combobox.Item>
                  )}
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>
      ) : null}

      {value.length > 0 ? (
        /* Chips, wrapping — each sized to its own text, so the list is as tall
           as it needs to be instead of one full-width row per item. A bundle
           with sixteen members was sixteen 1100px boxes holding 200px of text,
           with the remove control a thousand pixels from the label it removed.

           Each chip is two zones split by a rule that runs the chip's full
           height, edge to edge: the label with its own padding, and a square
           cell for the trash. Square because it holds a glyph and nothing else
           — padding on that side would only make it lopsided. */
        <ul className="flex flex-wrap gap-1.5">
          {value.map((option) => (
            <li
              key={option.value}
              className="flex h-5.5 max-w-full items-center overflow-hidden rounded-tight bg-ref text-ref-ink"
            >
              <span className="min-w-0 truncate px-2 text-ui font-medium">{option.label}</span>
              {!disabled ? (
                <Button
                  variant="ghost"
                  size="icon"
                  // Square, flush to the chip's edges, and its left border IS
                  // the divider — a separate 1px element would sit inside the
                  // padding and stop short of the chip's top and bottom.
                  className="size-5.5 flex-none rounded-none border-l border-ref-line p-0 text-ref-ink hover:bg-ref-line hover:text-ref-ink"
                  aria-label={`Remove ${option.label}`}
                  onClick={() => emit(selected.filter((item) => item !== option.value))}
                >
                  <span className="size-3">
                    <Icon name="trash" />
                  </span>
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-ui text-muted">Nothing selected yet.</p>
      )}
    </div>
  )
}
