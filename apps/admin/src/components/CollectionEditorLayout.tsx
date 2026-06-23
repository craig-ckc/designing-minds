import { type ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Icon } from './ui'

export interface EditorItem {
  id: string
  label: string
  sublabel?: string
}

const itemCls = ({ isActive }: { isActive: boolean }) =>
  `group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[0.88rem] transition ${
    isActive ? 'bg-surface-alt font-medium text-ink' : 'text-ink-soft hover:bg-surface-alt hover:text-ink'
  }`

/**
 * Webflow-style edit mode: a flush item column (this collection's records, with
 * thumbnails) sits against the collections panel, with the detail editor to its
 * right — the full three-column layout.
 */
export function CollectionEditorLayout({
  title,
  basePath,
  items,
  newLabel,
  children,
}: {
  title: string
  basePath: string
  items: EditorItem[]
  /** When provided, shows a "+" add action (catalogue collections). Omit for read-mostly operations. */
  newLabel?: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-full">
      <aside className="hidden w-[260px] flex-none flex-col border-r border-line bg-surface md:flex">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="text-[0.88rem] font-medium">{title}</span>
          {newLabel ? (
            <Link to={`${basePath}/new`} className="grid h-6 w-6 place-items-center rounded text-[1rem] text-ink-soft hover:bg-surface-alt" title={newLabel}>
              <span className="h-4 w-4">
                <Icon name="plus" />
              </span>
            </Link>
          ) : null}
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          {items.map((item) => (
            <NavLink key={item.id} to={`${basePath}/${item.id}`} end className={itemCls}>
              <span className="grid h-7 w-7 flex-none place-items-center rounded bg-ph text-ph-glyph">
                <span className="h-3.5 w-3.5">
                  <Icon name="doc" />
                </span>
              </span>
              <span className="truncate">{item.label}</span>
              <span className="ml-auto h-3.5 w-3.5 flex-none text-muted opacity-0 group-[.active]:opacity-100">
                <Icon name="arrow" />
              </span>
            </NavLink>
          ))}
          {items.length === 0 ? <span className="px-2 py-1.5 text-[0.85rem] text-muted">No items.</span> : null}
        </nav>
      </aside>

      <div className="min-w-0 flex-1 px-6 py-5">{children}</div>
    </div>
  )
}
