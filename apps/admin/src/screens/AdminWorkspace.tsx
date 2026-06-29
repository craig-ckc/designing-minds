import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { cn } from '@designing-minds/utils'
import type { CmsSnapshot, ProductFile } from '@designing-minds/cms'
import type { AdminCollection, AdminRecord } from '../cms/types'
import { buildFieldContext, createBlank, selectRecord, selectRecords } from '../cms/adapter'
import { fieldIsVisible, getPath, setPath } from '../cms/record'
import { repository } from '../repository'
import { RecordsToolbar } from '../components/workspace/RecordsToolbar'
import { RecordTable } from '../components/workspace/RecordTable'
import { RecordListPane } from '../components/workspace/RecordListPane'
import { RecordEditor } from '../components/editor/RecordEditor'

type SaveFn = (collection: AdminCollection, record: AdminRecord) => Promise<AdminRecord | null>
type UploadFn = (record: AdminRecord, file: File) => Promise<ProductFile>

type Props = {
  collection: AdminCollection
  snapshot: CmsSnapshot
  saving: boolean
  onSave: SaveFn
  onUpload: UploadFn
}

/**
 * The Editorial Workspace for one Collection: the record table (full width) or,
 * once a record is selected via the URL, the record-list pane + Record Editor.
 */
export function AdminWorkspace({ collection, snapshot, saving, onSave, onUpload }: Props) {
  const navigate = useNavigate()
  const { recordId } = useParams()
  const [search, setSearch] = useState('')

  const records = useMemo(() => selectRecords(snapshot, collection.id), [snapshot, collection.id])
  const ctx = useMemo(() => buildFieldContext(snapshot), [snapshot])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return records
    return records.filter((record) =>
      collection.searchFields.some((key) => String(getPath(record, key) ?? '').toLowerCase().includes(q)),
    )
  }, [records, search, collection])

  const editable = !collection.readOnly && repository.canWrite
  const editing = Boolean(recordId)
  const selectedId = recordId ?? null

  const goToRecord = (id: string) => navigate(`/${collection.id}/${id}`)
  const goToList = () => navigate(`/${collection.id}`)
  const createNew = () => navigate(`/${collection.id}/new`)

  // The record currently targeted by the URL (null = list view; undefined = not found).
  const initial = useMemo<AdminRecord | null | undefined>(() => {
    if (!recordId) return null
    if (recordId === 'new') return createBlank(snapshot, collection.id)
    return selectRecord(snapshot, collection.id, recordId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordId, collection.id])

  return (
    <div className="flex min-h-0 flex-1">
      <section
        className={cn('flex min-h-0 flex-col border-r border-line', editing ? 'w-[280px] flex-none' : 'min-w-0 flex-1')}
        aria-label={`${collection.label} records`}
      >
        {editing ? (
          <RecordListPane
            collection={collection}
            records={records}
            selectedId={selectedId}
            onSelect={goToRecord}
            onNew={editable ? createNew : undefined}
          />
        ) : (
          <>
            <RecordsToolbar
              title={collection.label}
              query={search}
              onQueryChange={setSearch}
              onNew={editable ? createNew : undefined}
              newLabel={`New ${collection.singular.toLowerCase()}`}
            />
            <RecordTable collection={collection} records={filtered} selectedId={selectedId} onSelect={goToRecord} />
            <footer className="flex h-8 flex-none items-center border-t border-line px-4 text-[0.8rem] text-muted">
              Showing {filtered.length} of {records.length}
            </footer>
          </>
        )}
      </section>

      {editing ? (
        initial ? (
          // Keyed by recordId so the draft re-initialises on navigation (no effect needed).
          <RecordEditorPane
            key={recordId}
            collection={collection}
            initial={initial}
            records={records}
            ctx={ctx}
            saving={saving}
            onSave={onSave}
            onUpload={onUpload}
            onBack={goToList}
            onNavigateToRecord={goToRecord}
          />
        ) : (
          <div className="grid flex-1 place-items-center text-muted">Record not found.</div>
        )
      ) : null}
    </div>
  )
}

/* ----------------------- Editing one record (draft) -------------------- */

function RecordEditorPane({
  collection,
  initial,
  records,
  ctx,
  saving,
  onSave,
  onUpload,
  onBack,
  onNavigateToRecord,
}: {
  collection: AdminCollection
  initial: AdminRecord
  records: AdminRecord[]
  ctx: ReturnType<typeof buildFieldContext>
  saving: boolean
  onSave: SaveFn
  onUpload: UploadFn
  onBack: () => void
  onNavigateToRecord: (id: string) => void
}) {
  const [draft, setDraft] = useState<AdminRecord>(initial)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const fileListKey = collection.fields.find((field) => field.type === 'fileList')?.key
  const updateValue = (key: string, value: unknown) => setDraft((current) => setPath(current, key, value))

  const validate = (record: AdminRecord): string | null => {
    for (const field of collection.fields) {
      if (!field.required || !fieldIsVisible(field, record)) continue
      const value = getPath(record, field.key)
      const empty = value == null || value === '' || (Array.isArray(value) && value.length === 0)
      if (empty) return `${field.label.replace(/\s*\(.*\)$/, '')} is required.`
    }
    for (const field of collection.fields) {
      if (field.type !== 'slug') continue
      const slug = String(getPath(record, field.key) ?? '').trim()
      if (!slug) continue
      const clash = records.some((other) => other.id !== record.id && String(getPath(other, field.key) ?? '').trim() === slug)
      if (clash) return `Another ${collection.singular.toLowerCase()} already uses this ${field.label.toLowerCase()}.`
    }
    return null
  }

  const persist = async (record: AdminRecord): Promise<void> => {
    let next = record
    for (const field of collection.fields) {
      if (field.type === 'slug') next = setPath(next, field.key, String(getPath(next, field.key) ?? '').trim())
    }
    const problem = validate(next)
    if (problem) {
      setValidationError(problem)
      return
    }
    setValidationError(null)
    const saved = await onSave(collection, next)
    if (saved) {
      setDraft({ ...saved })
      if (saved.id !== initial.id) onNavigateToRecord(saved.id)
    }
  }

  const handleToggleStatus = () => {
    if (!collection.statusField) return
    const next = setPath(draft, collection.statusField, !getPath(draft, collection.statusField))
    setDraft(next)
    void persist(next)
  }

  const handleUpload = async (file: File) => {
    if (!fileListKey) return
    setUploading(true)
    setUploadError(null)
    try {
      const uploaded = await onUpload(draft, file)
      setDraft((current) => {
        const existing = Array.isArray(current[fileListKey]) ? (current[fileListKey] as ProductFile[]) : []
        return setPath(current, fileListKey, [...existing, uploaded])
      })
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Unable to upload file.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <RecordEditor
      collection={collection}
      record={draft}
      ctx={ctx}
      onUpdate={updateValue}
      onUpload={handleUpload}
      uploading={uploading}
      uploadError={uploadError}
      onSave={() => void persist(draft)}
      onToggleStatus={handleToggleStatus}
      onBack={onBack}
      saving={saving}
      error={validationError}
      canWrite={repository.canWrite}
    />
  )
}
