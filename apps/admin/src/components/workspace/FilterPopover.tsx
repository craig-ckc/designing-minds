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
          <span className="size-4">
            <Icon name="filter" />
          </span>
          Filter
          {active > 0 ? (
            <span className="grid h-3.5 min-w-3.5 place-items-center rounded-pill bg-primary px-1 text-meta font-semibold text-on-primary">
              {active}
            </span>
          ) : null}
        </Button>
      }
      className="w-[240px]"
    >
      <div className="flex flex-none items-center justify-between border-b border-line px-2.5 py-1.5">
        <span className="text-meta font-semibold uppercase text-muted">Filters</span>
        {active > 0 ? (
          <Button variant="ghost" size="sm" onClick={() => onChange({})}>
            Clear all
          </Button>
        ) : null}
      </div>

      <ScrollArea className="min-h-0 flex-1" viewportClassName="px-2.5 py-2">
        <div className="grid gap-3">
          {facets.map((facet) => (
            <fieldset key={facet.key} className="grid gap-1">
              <legend className="mb-1 text-ui font-medium">{facet.label}</legend>
              {facet.options.map((option) => {
                const checked = (filters[facet.key] ?? []).includes(option.value)
                return (
                  <label key={option.value} className="flex cursor-pointer items-center gap-2 text-ui text-ink-soft">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(facet.key, option.value)}
                      aria-label={`${facet.label}: ${option.label}`}
                    />
                    {option.label}
                  </label>
                )
              })}
              {facet.options.length === 0 ? <span className="text-ui text-muted">No values yet.</span> : null}
            </fieldset>
          ))}
        </div>
      </ScrollArea>
    </Popover>
  )
}
