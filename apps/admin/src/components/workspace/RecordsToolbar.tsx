import { Icon, type IconName } from '../ui'
import { Button, Input } from '../primitives'

/** Non-functional wireframe controls, mirroring the previous list toolbar. */
function GhostButton({ icon, label }: { icon: IconName; label: string }) {
  return (
    <Button variant="outline" size="sm" title="Wireframe control">
      <span className="h-3.5 w-3.5">
        <Icon name={icon} />
      </span>
      {label}
    </Button>
  )
}

/**
 * Toolbar above the record table: title + search + New, with the same ghost
 * filter/export/import controls the old CollectionListLayout showed.
 */
export function RecordsToolbar({
  title,
  query,
  onQueryChange,
  onNew,
  newLabel,
}: {
  title: string
  query: string
  onQueryChange: (value: string) => void
  onNew?: () => void
  newLabel?: string
}) {
  return (
    <div className="flex flex-none flex-wrap items-center h-12 gap-2.5 border-b border-line px-6 py-1">
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
          className="min-h-0 h-[34px] w-[200px] pl-8 pr-3 text-[0.85rem]"
        />
      </div>

      <GhostButton icon="filter" label="Filter" />
      <GhostButton icon="check" label="Select" />
      <GhostButton icon="external" label="Export" />
      <GhostButton icon="download" label="Import" />

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
