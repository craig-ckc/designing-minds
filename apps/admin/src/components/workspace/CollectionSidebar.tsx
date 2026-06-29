import { NavLink } from 'react-router-dom'
import { type CmsSnapshot } from '@designing-minds/cms'
import { collectionGroups } from '../../cms/registry'
import { recordCount } from '../../cms/adapter'
import { repository } from '../../repository'
import { Icon } from '../ui'
import { ScrollArea } from '../primitives'

const rowCls = ({ isActive }: { isActive: boolean }) =>
  `group flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[0.88rem] transition ${
    isActive ? 'bg-surface-alt font-medium text-ink' : 'text-ink-soft hover:bg-surface-alt hover:text-ink'
  }`

/** Registry-driven navigation: Dashboard pinned, then grouped collections with counts. */
export function CollectionSidebar({ snapshot }: { snapshot: CmsSnapshot }) {
  return (
    <div className="flex h-full flex-col">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `flex items-center h-12 gap-2.5 border-b border-line px-4 py-3 text-[0.88rem] ${isActive ? 'font-medium text-ink' : 'text-ink-soft'}`
        }
      >
        <span className="h-[16px] w-[16px] flex-none">
          <Icon name="grid" />
        </span>
        Dashboard
      </NavLink>

      <ScrollArea className="min-h-0 flex-1" viewportClassName="py-2">
        {collectionGroups.map((group) => (
          <div key={group.group} className="px-2 pb-2">
            <div className="px-2.5 py-1.5">
              <span className="text-[0.78rem] font-medium text-ink">{group.group}</span>
            </div>
            {group.collections.map((collection) => (
              <NavLink key={collection.id} to={`/${collection.id}`} className={rowCls}>
                <span className="truncate">{collection.label}</span>
                <span className="ml-1 flex-none text-[0.78rem] text-muted">{recordCount(snapshot, collection.id)} items</span>
                <span className="ml-auto h-3.5 w-3.5 flex-none text-muted opacity-0 group-hover:opacity-100 group-[.active]:opacity-100">
                  <Icon name="arrow" />
                </span>
              </NavLink>
            ))}
          </div>
        ))}
      </ScrollArea>

      <div className="border-t border-line px-4 py-2.5 text-[0.74rem] text-muted">Supabase · {repository.mode}</div>
    </div>
  )
}
