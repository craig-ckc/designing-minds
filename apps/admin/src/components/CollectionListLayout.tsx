import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icon, type IconName } from './ui'

const CONTROL = 'inline-flex h-[34px] items-center gap-1.5 rounded-md border border-line-strong px-2.5 text-[0.85rem] text-ink-soft transition hover:border-ink hover:text-ink'

function GhostButton({ icon, label }: { icon: IconName; label: string }) {
  return (
    <button type="button" className={CONTROL} title="Wireframe control">
      <span className="h-3.5 w-3.5">
        <Icon name={icon} />
      </span>
      {label}
    </button>
  )
}

/**
 * Webflow-style collection list view: title + toolbar (search, filter, select,
 * export, import, settings, New) above a full-width table, with a
 * "Showing 1–N of N" footer. Selecting a row routes into the editor.
 */
export function CollectionListLayout({
  title,
  count,
  total,
  query,
  onQueryChange,
  newLabel,
  newTo,
  filters,
  children,
}: {
  title: string
  count: number
  /** Unfiltered total, for the footer; defaults to count. */
  total?: number
  query: string
  onQueryChange: (value: string) => void
  newLabel?: string
  newTo?: string
  filters?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="">
      <div className="mb-4 flex flex-wrap items-center gap-2.5 px-6 pt-5">
        <h2 className="mr-auto text-[1.3rem]">{title}</h2>

        <div className="relative">
          <span className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted">
            <Icon name="search" />
          </span>
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={`Search ${title.toLowerCase()}…`}
            aria-label={`Search ${title.toLowerCase()}`}
            className="h-[34px] w-[200px] rounded-md border border-line-strong bg-surface pl-8 pr-3 text-[0.85rem] focus:outline focus:outline-2 focus:outline-ink focus:-outline-offset-1"
          />
        </div>

        {filters}
        <GhostButton icon="filter" label="Filter" />
        <GhostButton icon="check" label="Select" />
        <GhostButton icon="external" label="Export" />
        <GhostButton icon="download" label="Import" />
        <GhostButton icon="settings" label="Settings" />

        {newTo ? (
          <Link
            to={newTo}
            className="inline-flex h-[34px] items-center gap-1.5 rounded-md bg-ink px-3 text-[0.85rem] font-medium text-white hover:opacity-85"
          >
            <span className="h-3.5 w-3.5">
              <Icon name="plus" />
            </span>
            {newLabel ?? 'New'}
          </Link>
        ) : null}
      </div>

      <div className="overflow-x-auto border-y border-line">{children}</div>

      <p className="mt-3 text-[0.82rem] text-muted">
        Showing {count === 0 ? 0 : 1}–{count} of {total ?? count}
      </p>
    </div>
  )
}
