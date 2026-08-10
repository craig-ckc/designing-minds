import { cn } from '@designing-minds/utils'
import { Icon } from '../ui'
import { Button, Input } from '../primitives'
import { FilterPopover, type FilterState, type ResolvedFacet } from './FilterPopover'

/**
 * Toolbar above the record table: title + search, filter popover, selection
 * mode toggle, CSV export/import, and New. Import is only offered when the
 * caller passes `onImport` (editable collections with write access).
 *
 * `compact` is the same toolbar once a record is open and the list has narrowed
 * to a single column: the title and New survive, the list-wide controls don't
 * fit and are dropped. It stays one component so opening a record reads as the
 * same table narrowing, not as a different screen appearing.
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
  compact,
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
  compact?: boolean
}) {
  if (compact) {
    return (
      <div className="flex h-12 flex-none items-center justify-between gap-2 border-b border-line px-4 py-1.5">
        <h2 className="min-w-0 truncate text-base font-semibold">{title}</h2>
        {onNew ? (
          <Button variant="ghost" size="icon" onClick={onNew} title={newLabel} aria-label={newLabel}>
            <span className="h-4 w-4">
              <Icon name="plus" />
            </span>
          </Button>
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex min-h-12 flex-none flex-wrap items-center gap-2.5 border-b border-line px-4 py-1.5">
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

      {/* Export leaves the app (arrow down), import comes into it (arrow up).
          These two were the wrong way round, and Export used the
          open-in-new-tab glyph. */}
      <Button variant="outline" size="sm" onClick={onExport} aria-label={`Export ${title.toLowerCase()} as CSV`}>
        <span className="h-3.5 w-3.5">
          <Icon name="download" />
        </span>
        Export
      </Button>

      {onImport ? (
        <Button variant="outline" size="sm" onClick={onImport} aria-label={`Import ${title.toLowerCase()} from CSV`}>
          <span className="h-3.5 w-3.5">
            <Icon name="upload" />
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
