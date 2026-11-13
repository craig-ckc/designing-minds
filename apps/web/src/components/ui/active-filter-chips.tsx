import { type RefObject, useRef } from 'react'
import { Pill } from './pill'

export type ActiveFilter = { key: string; value: string; label: string }

/**
 * Removable chips for the filters currently applied to the shop: a primary md
 * `Pill` inside a button named "Remove filter: <label>". Removing one returns
 * focus to its neighbour (next, else previous) or, when it was the last, to
 * `emptyFocusRef`.
 */
export function ActiveFilterChips({
  filters,
  onRemove,
  emptyFocusRef,
}: {
  filters: ActiveFilter[]
  onRemove: (filter: ActiveFilter) => void
  emptyFocusRef?: RefObject<HTMLElement | null>
}) {
  const listRef = useRef<HTMLUListElement>(null)
  if (filters.length === 0) return null

  const remove = (filter: ActiveFilter, index: number) => {
    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? []
    const neighbour = buttons[index + 1] ?? buttons[index - 1] ?? null
    onRemove(filter)
    // Keyed chips persist across the re-render, so the neighbour stays focusable.
    if (neighbour) neighbour.focus()
    else emptyFocusRef?.current?.focus()
  }

  return (
    <ul ref={listRef} aria-label="Active filters" className="flex flex-wrap items-center gap-2">
      {filters.map((filter, index) => (
        <li key={`${filter.key}:${filter.value}`}>
          <button
            type="button"
            aria-label={`Remove filter: ${filter.label}`}
            onClick={() => remove(filter, index)}
            className="group rounded-full"
          >
            <Pill tone="primary" size="md" className="transition-colors group-hover:text-primary-ink-strong">
              {filter.label}
              <span aria-hidden="true">×</span>
            </Pill>
          </button>
        </li>
      ))}
    </ul>
  )
}
