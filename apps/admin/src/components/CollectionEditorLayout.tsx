import { type ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Icon } from './ui'
import { SOLID_BTN } from './tokens'

export interface EditorItem {
  id: string
  label: string
  sublabel?: string
}

/**
 * Webflow-style edit mode: a narrow item column (this collection's records)
 * beside the editor, so you can hop between items without leaving the editor.
 * The persistent nav rail lives in <Shell>, giving the full 3-pane layout.
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
  /** When provided, shows a "+ New" action (catalogue collections). Omit for read-mostly operations. */
  newLabel?: string
  children: ReactNode
}) {
  const itemCls = ({ isActive }: { isActive: boolean }) =>
    `block rounded-md px-3 py-2 ${isActive ? 'bg-surface-alt font-medium text-ink' : 'text-ink-soft hover:bg-surface-alt'}`

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Link to={basePath} className="mb-3 inline-flex items-center gap-1.5 text-[0.88rem] text-ink-soft hover:text-ink">
          <span className="h-4 w-4">
            <Icon name="back" />
          </span>
          All {title.toLowerCase()}
        </Link>
        {newLabel ? (
          <Link to={`${basePath}/new`} className={`${SOLID_BTN} mb-3 w-full`}>
            {newLabel}
          </Link>
        ) : null}
        <nav className="grid max-h-[70vh] gap-0.5 overflow-y-auto rounded-[10px] border border-line bg-surface p-1.5 text-[0.9rem]">
          {items.map((item) => (
            <NavLink key={item.id} to={`${basePath}/${item.id}`} end className={itemCls}>
              <span className="block truncate">{item.label}</span>
              {item.sublabel ? <span className="block truncate text-[0.76rem] text-muted">{item.sublabel}</span> : null}
            </NavLink>
          ))}
          {items.length === 0 ? <span className="px-3 py-2 text-[0.85rem] text-muted">No items.</span> : null}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
