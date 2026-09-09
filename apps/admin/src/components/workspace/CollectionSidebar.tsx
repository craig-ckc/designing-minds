import { NavLink } from 'react-router-dom'
import { type CmsSnapshot } from '@designing-minds/cms'
import { collectionGroups } from '../../cms/registry'
import { recordCount } from '../../cms/adapter'
import { Icon } from '../ui'
import { ScrollArea } from '../primitives'

/* Gutter rule for the side panels: every label in this column starts at the
   same x. The header and footer are chrome bars at the app's standard `px-2.5`
   (10px); rows reach the same 10px as 4px of group inset plus 6px of row
   padding, the inset being what keeps an active row's fill off the pane edge.
   Change one of the three and the column visibly steps. */
const rowCls = ({ isActive }: { isActive: boolean }) =>
  `group flex items-center gap-2 rounded-control h-row px-1.5 text-ui transition ${
    isActive ? 'bg-surface-sunk font-medium text-ink' : 'text-ink-soft hover:bg-surface-alt hover:text-ink'
  }`

/** Registry-driven navigation: Dashboard pinned, then grouped collections with counts. */
export function CollectionSidebar({ snapshot }: { snapshot: CmsSnapshot }) {
  return (
    <div className="flex h-full flex-col">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `flex h-bar items-center gap-2 border-b border-line px-2.5 text-ui ${isActive ? 'font-medium text-ink' : 'text-ink-soft'}`
        }
      >
        <span className="size-4 flex-none">
          <Icon name="grid" />
        </span>
        Dashboard
      </NavLink>

      <ScrollArea className="min-h-0 flex-1" viewportClassName="py-1.5">
        <div className="px-1 pb-2"><NavLink to="/diagnostics" className={rowCls}>Diagnostics</NavLink></div>
        {collectionGroups.map((group) => (
          <div key={group.group} className="flex flex-col gap-0.5 px-1 pb-1.5">
            <div className="px-1.5 py-1.5">
              <span className="text-title font-semibold text-ink">{group.group}</span>
            </div>
            {group.collections.map((collection) => (
              <NavLink key={collection.id} to={`/${collection.id}`} className={rowCls}>
                <span className="truncate">{collection.label}</span>
                <span className="ml-1 flex-none text-ui text-muted">{recordCount(snapshot, collection.id)} items</span>
                <span className="ml-auto size-3.5 flex-none text-muted opacity-0 group-hover:opacity-100 group-[.active]:opacity-100">
                  <Icon name="arrow" />
                </span>
              </NavLink>
            ))}
          </div>
        ))}
      </ScrollArea>

    </div>
  )
}
