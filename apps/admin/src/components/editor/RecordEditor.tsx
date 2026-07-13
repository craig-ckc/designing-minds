import type { AdminCollection, AdminRecord, FieldContext, EditorSection as EditorSectionDef } from '../../cms/types'
import { fieldIsVisible, findField, getPath, getRecordTitle } from '../../cms/record'
import { Pill } from '../Badge'
import { Icon } from '../ui'
import { Button, ScrollArea } from '../primitives'
import { EditorSection } from './EditorSection'
import { FieldControl } from './FieldControl'

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
  dirty: boolean
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
  dirty,
  error,
  canWrite,
}: Props) {
  const editable = !collection.readOnly && canWrite
  const statusOn = collection.statusField ? Boolean(getPath(record, collection.statusField)) : false
  const labels = collection.statusLabels

  const visibleSections = collection.sections.filter((section) => (section.visibleWhen ? section.visibleWhen(record) : true))

  const renderFields = (section: EditorSectionDef) =>
    section.fields.map((key) => {
      const field = findField(collection, key)
      if (!field || !fieldIsVisible(field, record)) return null
      return (
        <FieldControl
          key={key}
          field={field}
          record={record}
          ctx={ctx}
          onUpdate={onUpdate}
          onUpload={onUpload}
          uploading={uploading}
          uploadError={uploadError}
          disabled={!editable}
        />
      )
    })

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-surface">
      <header className="flex h-12 flex-none items-center gap-3 border-b border-line px-6 py-1">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back to list">
          <span className="h-4 w-4">
            <Icon name="back" />
          </span>
        </Button>
        <div className="flex min-w-0 items-center gap-2.5">
          <h2 className="truncate text-base font-semibold tracking-[-0.01em]">{getRecordTitle(collection, record)}</h2>
          {collection.statusField && labels ? <Pill tone={statusOn ? 'solid' : 'muted'}>{statusOn ? labels.on : labels.off}</Pill> : null}
        </div>

        <div className="ml-auto flex flex-none items-center gap-3">
          {error ? <span className="text-[0.85rem] text-danger">{error}</span> : null}
          {editable && dirty && !error ? (
            <span className="flex items-center gap-1.5 text-[0.8rem] text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Unsaved changes
            </span>
          ) : null}
          {editable && collection.statusField && labels ? (
            <Button variant="soft" size="md" onClick={onToggleStatus} disabled={saving}>
              {statusOn ? labels.verbOff : labels.verbOn}
            </Button>
          ) : null}
          {editable ? (
            <Button variant="solid" size="md" onClick={onSave} disabled={saving || !dirty}>
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
            <EditorSection key={section.title} title={section.title} hint={section.hint} divided={index > 0}>
              {renderFields(section)}
            </EditorSection>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
