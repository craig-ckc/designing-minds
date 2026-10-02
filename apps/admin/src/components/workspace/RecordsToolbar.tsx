import { Icon } from '../ui'
import { Button, Input } from '../primitives'
import { cn, BAR } from '../../design'
import { SAVE_CHOICES, type SaveStatus } from '../../cms/publish-state'
import { FilterPopover, type FilterState, type ResolvedFacet } from './FilterPopover'

/**
 * The one bar above the record table, in two modes.
 *
 * Browsing: title, search, filter, and the actions that make new things —
 * Select, Export, Import, New.
 *
 * Selecting: the same bar, re-tenanted. The heading becomes the running count,
 * the make-new actions leave (they have nothing to do with a selection), and
 * the actions that operate *on* a selection appear in their place — but only
 * once something is actually selected, so an empty selection offers only the
 * way out.
 *
 * Selection used to open a second strip underneath, which meant the controls
 * for the selection sat somewhere other than the controls for the list, and
 * the table shifted down as it appeared. One bar that changes tenant keeps the
 * layout still and puts every control in the same place.
 *
 * Search and filter survive both modes: narrowing the list is how you find
 * what to select, so taking them away mid-task would be the wrong moment.
 *
 * `compact` is the same toolbar once a record is open and the list has narrowed
 * to a single column: the title and New survive, the list-wide controls don't
 * fit and are dropped. It stays one component so opening a record reads as the
 * same table narrowing, not as a different screen appearing.
 */
export function RecordsToolbar({
  title,
  selectionTitle,
  query,
  onQueryChange,
  facets,
  filters,
  onFiltersChange,
  selecting,
  selectedCount,
  onStartSelecting,
  onCancelSelecting,
  onExport,
  onDelete,
  onBulkStatus,
  busy,
  onImport,
  onNew,
  newLabel,
  compact,
}: {
  /** The collection's name. Stays put in both modes — search reads off it. */
  title: string
  /** The heading while selecting, e.g. "2 products selected". */
  selectionTitle: string
  query: string
  onQueryChange: (value: string) => void
  facets: ResolvedFacet[]
  filters: FilterState
  onFiltersChange: (next: FilterState) => void
  selecting: boolean
  selectedCount: number
  onStartSelecting: () => void
  onCancelSelecting: () => void
  onExport: () => void
  /** Omitted when the collection is read-only, or the account cannot write. */
  onDelete?: () => void
  /** Bulk save-as (queue / draft / archive). Omitted when the collection has no status field. */
  onBulkStatus?: (status: SaveStatus) => void
  /** A bulk write is in flight — every action that writes is held. */
  busy?: boolean
  onImport?: () => void
  onNew?: () => void
  newLabel?: string
  compact?: boolean
}) {
  if (compact) {
    return (
      <div className={cn(BAR, 'justify-between')}>
        <h2 className="min-w-0 truncate text-title font-semibold">{title}</h2>
        {onNew ? (
          <Button variant="ghost" size="icon" onClick={onNew} title={newLabel} aria-label={newLabel}>
            <span className="size-4">
              <Icon name="plus" />
            </span>
          </Button>
        ) : null}
      </div>
    )
  }

  const noun = title.toLowerCase()

  return (
    <div className={cn(BAR, 'h-auto min-h-bar flex-wrap gap-1.5')}>
      {/* aria-live so the count is announced as it changes — while selecting,
          this heading is the only thing reporting what is selected. */}
      <h2 className="mr-auto text-title font-semibold" aria-live={selecting ? 'polite' : undefined}>
        {selecting ? selectionTitle : title}
      </h2>

      <div className="relative">
        <span className="pointer-events-none absolute left-2 top-1/2 z-10 size-3.5 -translate-y-1/2 text-muted">
          <Icon name="search" />
        </span>
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={`Search ${noun}…`}
          aria-label={`Search ${noun}`}
          className="w-[180px] pl-7"
        />
      </div>

      {facets.length > 0 ? <FilterPopover facets={facets} filters={filters} onChange={onFiltersChange} /> : null}

      {selecting ? (
        <>
          {/* Nothing selected means nothing to act on, so the only control is
              the way back. The actions appear the moment a row is ticked. */}
          {selectedCount > 0 ? (
            <>
              {/* Same three choices as the editor's save menu, same words. */}
              {onBulkStatus
                ? SAVE_CHOICES.map((choice) => (
                    <Button
                      key={choice.status}
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      title={choice.description}
                      onClick={() => onBulkStatus(choice.status)}
                    >
                      {choice.label}
                    </Button>
                  ))
                : null}

              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                disabled={busy}
                aria-label={`Export the selected ${noun} as CSV`}
              >
                <span className="size-4">
                  <Icon name="download" />
                </span>
                Export
              </Button>

              {/* Destructive, and styled to say so. There is no `danger` button
                  variant — the outline variant carries the danger role, the way
                  the Select toggle carried the active one. */}
              {onDelete ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDelete}
                  disabled={busy}
                  aria-label={`Delete the selected ${noun}`}
                  className="border-danger/40 text-danger hover:border-danger hover:text-danger"
                >
                  <span className="size-4">
                    <Icon name="trash" />
                  </span>
                  Delete
                </Button>
              ) : null}
            </>
          ) : null}

          <Button variant="ghost" size="sm" onClick={onCancelSelecting} disabled={busy}>
            Cancel
          </Button>
        </>
      ) : (
        <>
          <Button variant="outline" size="sm" onClick={onStartSelecting}>
            <span className="size-4">
              <Icon name="check" />
            </span>
            Select
          </Button>

          {/* Export leaves the app (arrow down), import comes into it (arrow up).
              These two were the wrong way round, and Export used the
              open-in-new-tab glyph. */}
          <Button variant="outline" size="sm" onClick={onExport} aria-label={`Export ${noun} as CSV`}>
            <span className="size-4">
              <Icon name="download" />
            </span>
            Export
          </Button>

          {onImport ? (
            <Button variant="outline" size="sm" onClick={onImport} aria-label={`Import ${noun} from CSV`}>
              <span className="size-4">
                <Icon name="upload" />
              </span>
              Import
            </Button>
          ) : null}

          {onNew ? (
            <Button variant="solid" size="sm" onClick={onNew}>
              <span className="size-4">
                <Icon name="plus" />
              </span>
              {newLabel ?? 'New'}
            </Button>
          ) : null}
        </>
      )}
    </div>
  )
}
