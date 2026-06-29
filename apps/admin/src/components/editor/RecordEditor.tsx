import { cn } from '@designing-minds/utils'
import type { AdminCollection, AdminRecord, FieldContext } from '../../cms/types'
import { fieldIsVisible, findField, getPath, getRecordTitle } from '../../cms/record'
import { Pill } from '../Badge'
import { Icon } from '../ui'
import { Button, ScrollArea } from '../primitives'
import { EditorSection } from './EditorSection'
import { FieldControl } from './FieldControl'
import { FULL_WIDTH_TYPES } from './field-layout'

type Props = {
  collection: AdminCollection
  record: AdminRecord
  ctx: FieldContext
  onUpdate: (key: string, value: unknown) => void
  onUpload: (file: File) => void
  uploading: boolean
  uploadError: string | null
  onSave: () => void
  onToggleStatus: () => void
  onBack: () => void
  saving: boolean
  error: string | null
  canWrite: boolean
}

export function RecordEditor({
  collection,
  record,
  ctx,
  onUpdate,
  onUpload,
  uploading,
  uploadError,
  onSave,
  onToggleStatus,
  onBack,
  saving,
  error,
  canWrite,
}: Props) {
  const editable = !collection.readOnly && canWrite
  const statusOn = collection.statusField ? Boolean(getPath(record, collection.statusField)) : false
  const labels = collection.statusLabels

  const visibleSections = collection.sections.filter((section) => (section.visibleWhen ? section.visibleWhen(record) : true))

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-surface">
      <header className="flex flex-none flex-wrap items-center h-12 gap-3 border-b border-line px-6 py-1">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back to list">
          <span className="h-4 w-4">
            <Icon name="back" />
          </span>
        </Button>
        <div className="flex min-w-0 items-center gap-2.5">
          <h2 className="truncate text-base font-semibold tracking-[-0.01em]">{getRecordTitle(collection, record)}</h2>
          {collection.statusField && labels ? <Pill tone={statusOn ? 'solid' : 'muted'}>{statusOn ? labels.on : labels.off}</Pill> : null}
        </div>

        <div className="ml-auto flex items-center gap-3">
          {error ? <span className="text-[0.85rem] text-red-600">{error}</span> : null}
          {editable && collection.statusField && labels ? (
            <Button variant="text" onClick={onToggleStatus} disabled={saving}>
              {statusOn ? labels.verbOff : labels.verbOn}
            </Button>
          ) : null}
          {editable ? (
            <Button variant="solid" size="md" onClick={onSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          ) : (
            <span className="rounded-md border border-dashed border-line-strong px-2.5 py-1 text-[0.78rem] uppercase tracking-[0.06em] text-muted">
              Read only
            </span>
          )}
        </div>
      </header>

      <ScrollArea className="min-h-0 flex-1" viewportClassName="px-6 py-6">
        <div className="grid max-w-[840px] gap-8">
          {visibleSections.map((section, index) => (
            <EditorSection key={section.title} title={section.title} divided={index > 0}>
              {section.fields.map((key) => {
                const field = findField(collection, key)
                if (!field || !fieldIsVisible(field, record)) return null
                const full = FULL_WIDTH_TYPES.has(field.type)
                return (
                  <div key={key} className={cn(full && 'sm:col-span-2')}>
                    <FieldControl
                      field={field}
                      record={record}
                      ctx={ctx}
                      onUpdate={onUpdate}
                      onUpload={onUpload}
                      uploading={uploading}
                      uploadError={uploadError}
                      disabled={!editable}
                    />
                  </div>
                )
              })}
            </EditorSection>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
