import { cn } from '@designing-minds/utils'
import type { AdminCollection, AdminRecord } from '../../cms/types'
import { getRecordSubtitle, getRecordTitle } from '../../cms/record'
import { Icon } from '../ui'
import { Button, ScrollArea } from '../primitives'

/** Narrow record list shown beside the editor (the middle pane of the split view). */
export function RecordListPane({
  collection,
  records,
  selectedId,
  onSelect,
  onNew,
}: {
  collection: AdminCollection
  records: AdminRecord[]
  selectedId: string | null
  onSelect: (id: string) => void
  onNew?: () => void
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-none items-center justify-between h-12 border-b border-line px-4 py-1">
        <span className="text-base font-semibold">{collection.label}</span>
        {onNew ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onNew}
            title={`New ${collection.singular.toLowerCase()}`}
            aria-label={`New ${collection.singular.toLowerCase()}`}
          >
            <span className="h-4 w-4">
              <Icon name="plus" />
            </span>
          </Button>
        ) : null}
      </div>

      <ScrollArea className="min-h-0 flex-1" viewportClassName="flex flex-col gap-1 p-2">
        {records.map((record) => {
          const active = record.id === selectedId
          const subtitle = getRecordSubtitle(collection, record)
          return (
            <button
              key={record.id}
              type="button"
              onClick={() => onSelect(record.id)}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-md px-2 py-1 text-left transition',
                active ? 'bg-surface-alt font-medium text-ink' : 'text-ink-soft hover:bg-surface-alt hover:text-ink',
              )}
            >
              <span className="grid h-7 w-7 flex-none place-items-center rounded bg-ph text-ph-glyph">
                <span className="h-3.5 w-3.5">
                  <Icon name="doc" />
                </span>
              </span>
              <span className="grid min-w-0">
                <span className="truncate text-[0.88rem]">{getRecordTitle(collection, record)}</span>
                {subtitle ? <span className="truncate text-[0.78rem] text-muted">{subtitle}</span> : null}
              </span>
            </button>
          )
        })}
        {records.length === 0 ? <span className="block px-2 py-1.5 text-[0.85rem] text-muted">No records.</span> : null}
      </ScrollArea>
    </div>
  )
}
