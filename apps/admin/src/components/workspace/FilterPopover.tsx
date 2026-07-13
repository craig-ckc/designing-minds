import type { FieldOption } from '../../cms/types'
import { Icon } from '../ui'
import { Button, Checkbox, Popover, ScrollArea } from '../primitives'

/** A CollectionFilter with its options resolved against the live snapshot/records. */
export type ResolvedFacet = { key: string; label: string; options: FieldOption[] }

/** Per-facet value lists; values within a facet are OR-ed, facets AND-ed. */
export type FilterState = Record<string, string[]>

function activeFilterCount(filters: FilterState): number {
  return Object.values(filters).reduce((count, values) => count + values.length, 0)
}

export function FilterPopover({
  facets,
  filters,
  onChange,
}: {
  facets: ResolvedFacet[]
  filters: FilterState
  onChange: (next: FilterState) => void
}) {
  const active = activeFilterCount(filters)

  const toggle = (key: string, value: string) => {
    const current = filters[key] ?? []
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
    onChange({ ...filters, [key]: next })
  }

  return (
    <Popover
      trigger={
        <Button variant="outline" size="sm" aria-label={active ? `Filter (${active} active)` : 'Filter'}>
          <span className="h-3.5 w-3.5">
            <Icon name="filter" />
          </span>
          Filter
          {active > 0 ? (
            <span className="grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[0.68rem] font-semibold text-on-primary">
              {active}
            </span>
          ) : null}
        </Button>
      }
      className="w-[280px]"
    >
      <div className="flex flex-none items-center justify-between border-b border-line px-3.5 py-2.5">
        <span className="text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-muted">Filters</span>
        {active > 0 ? (
          <Button variant="ghost" size="sm" onClick={() => onChange({})}>
            Clear all
          </Button>
        ) : null}
      </div>

      <ScrollArea className="min-h-0 flex-1" viewportClassName="px-3.5 py-3">
        <div className="grid gap-4">
          {facets.map((facet) => (
            <fieldset key={facet.key} className="grid gap-1.5">
              <legend className="mb-1.5 text-[0.82rem] font-medium">{facet.label}</legend>
              {facet.options.map((option) => {
                const checked = (filters[facet.key] ?? []).includes(option.value)
                return (
                  <label key={option.value} className="flex cursor-pointer items-center gap-2 text-[0.88rem] text-ink-soft">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(facet.key, option.value)}
                      aria-label={`${facet.label}: ${option.label}`}
                    />
                    {option.label}
                  </label>
                )
              })}
              {facet.options.length === 0 ? <span className="text-[0.82rem] text-muted">No values yet.</span> : null}
            </fieldset>
          ))}
        </div>
      </ScrollArea>
    </Popover>
  )
}
