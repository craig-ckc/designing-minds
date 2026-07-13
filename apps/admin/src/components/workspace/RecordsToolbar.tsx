import { cn } from '@designing-minds/utils'
import { Icon } from '../ui'
import { Button, Input } from '../primitives'
import { FilterPopover, type FilterState, type ResolvedFacet } from './FilterPopover'

/**
 * Toolbar above the record table: title + search, filter popover, selection
 * mode toggle, CSV export/import, and New. Import is only offered when the
 * caller passes `onImport` (editable collections with write access).
 */
export function RecordsToolbar({
  title,
  query,
  onQueryChange,
  facets,
  filters,
  onFiltersChange,
  selecting,
  onToggleSelecting,
  onExport,
  onImport,
  onNew,
  newLabel,
}: {
  title: string
  query: string
  onQueryChange: (value: string) => void
  facets: ResolvedFacet[]
  filters: FilterState
  onFiltersChange: (next: FilterState) => void
  selecting: boolean
  onToggleSelecting: () => void
  onExport: () => void
  onImport?: () => void
  onNew?: () => void
  newLabel?: string
}) {
  return (
    <div className="flex min-h-12 flex-none flex-wrap items-center gap-2.5 border-b border-line px-6 py-1.5">
      <h2 className="mr-auto text-base font-semibold">{title}</h2>

      <div className="relative">
        <span className="pointer-events-none absolute left-2.5 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-muted">
          <Icon name="search" />
        </span>
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={`Search ${title.toLowerCase()}…`}
          aria-label={`Search ${title.toLowerCase()}`}
          className="min-h-0 h-8 w-[200px] pl-8 pr-3 text-[0.85rem]"
        />
      </div>

      {facets.length > 0 ? <FilterPopover facets={facets} filters={filters} onChange={onFiltersChange} /> : null}

      <Button
        variant="outline"
        size="sm"
        onClick={onToggleSelecting}
        aria-pressed={selecting}
        className={cn(selecting && 'border-primary bg-primary-tint text-primary hover:border-primary hover:text-primary')}
      >
        <span className="h-3.5 w-3.5">
          <Icon name="check" />
        </span>
        Select
      </Button>

      <Button variant="outline" size="sm" onClick={onExport} aria-label={`Export ${title.toLowerCase()} as CSV`}>
        <span className="h-3.5 w-3.5">
          <Icon name="external" />
        </span>
        Export
      </Button>

      {onImport ? (
        <Button variant="outline" size="sm" onClick={onImport} aria-label={`Import ${title.toLowerCase()} from CSV`}>
          <span className="h-3.5 w-3.5">
            <Icon name="download" />
          </span>
          Import
        </Button>
      ) : null}

      {onNew ? (
        <Button variant="solid" size="sm" onClick={onNew}>
          <span className="h-3.5 w-3.5">
            <Icon name="plus" />
          </span>
          {newLabel ?? 'New'}
        </Button>
      ) : null}
    </div>
  )
}
