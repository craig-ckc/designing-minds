import { useEffect, useMemo, useRef, useState } from 'react'
import { useBlocker, useNavigate, useParams } from 'react-router-dom'
import { cn } from '@designing-minds/utils'
import type { CmsSnapshot, ProductFile } from '@designing-minds/cms'
import type { AdminCollection, AdminRecord } from '../cms/types'
import { buildFieldContext, createBlank, resolveFilterFacets, selectRecord, selectRecords } from '../cms/adapter'
import { fieldIsVisible, getPath, matchesFilters, setPath, uniqueSlug } from '../cms/record'
import { buildCsv } from '../cms/csv-io'
import { downloadCsv } from '../lib/csv'
import { repository } from '../repository'
import { useUnsavedChanges } from '../lib/unsaved'
import { Button, ConfirmDialog } from '../components/primitives'
import { RecordsToolbar } from '../components/workspace/RecordsToolbar'
import { type FilterState } from '../components/workspace/FilterPopover'
import { RecordTable } from '../components/workspace/RecordTable'
import { RecordListPane } from '../components/workspace/RecordListPane'
import { ImportDialog } from '../components/workspace/ImportDialog'
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
  const [filters, setFilters] = useState<FilterState>({})
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set())
  const [importOpen, setImportOpen] = useState(false)
  const [bulkBusy, setBulkBusy] = useState(false)

  const records = useMemo(() => selectRecords(snapshot, collection.id), [snapshot, collection.id])
  const ctx = useMemo(() => buildFieldContext(snapshot), [snapshot])
  const facets = useMemo(() => resolveFilterFacets(collection, snapshot, records), [collection, snapshot, records])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return records.filter((record) => {
      if (!matchesFilters(record, filters)) return false
      if (!q) return true
      return collection.searchFields.some((key) => String(getPath(record, key) ?? '').toLowerCase().includes(q))
    })
  }, [records, search, filters, collection])

  const editable = !collection.readOnly && repository.canWrite
  const editing = Boolean(recordId)
  const selectedId = recordId ?? null

  /* ------------------------- Selection & bulk ops ----------------------- */

  const toggleSelecting = () => {
    setSelecting((on) => !on)
    setSelected(new Set())
  }

  const toggleSelected = (id: string) =>
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const toggleAllVisible = () =>
    setSelected((current) => {
      const allSelected = filtered.length > 0 && filtered.every((record) => current.has(record.id))
      const next = new Set(current)
      for (const record of filtered) {
        if (allSelected) next.delete(record.id)
        else next.add(record.id)
      }
      return next
    })

  const bulkSetStatus = async (on: boolean) => {
    const statusField = collection.statusField
    if (!statusField) return
    setBulkBusy(true)
    try {
      for (const record of records) {
        if (!selected.has(record.id)) continue
        if (Boolean(getPath(record, statusField)) === on) continue
        await onSave(collection, setPath(record, statusField, on))
      }
    } finally {
      setBulkBusy(false)
    }
  }

  /** Export the selection when one exists, otherwise the current filtered list. */
  const exportCsv = () => {
    const rows = selected.size > 0 ? records.filter((record) => selected.has(record.id)) : filtered
    downloadCsv(`${collection.id}.csv`, buildCsv(collection, rows))
  }

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
              facets={facets}
              filters={filters}
              onFiltersChange={setFilters}
              selecting={selecting}
              onToggleSelecting={toggleSelecting}
              onExport={exportCsv}
              onImport={editable ? () => setImportOpen(true) : undefined}
              onNew={editable ? createNew : undefined}
              newLabel={`New ${collection.singular.toLowerCase()}`}
            />

            {selecting ? (
              <div className="flex flex-none flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-line bg-surface-alt px-6 py-2 text-[0.85rem]">
                <span className="font-medium">{selected.size} selected</span>
                <Button variant="ghost" size="sm" onClick={() => setSelected(new Set(filtered.map((record) => record.id)))}>
                  Select all {filtered.length}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())} disabled={selected.size === 0}>
                  Clear
                </Button>
                <span className="ml-auto flex flex-wrap items-center gap-2">
                  {editable && collection.statusField && collection.statusLabels ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void bulkSetStatus(true)}
                        disabled={bulkBusy || selected.size === 0}
                      >
                        {collection.statusLabels.verbOn} selected
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void bulkSetStatus(false)}
                        disabled={bulkBusy || selected.size === 0}
                      >
                        {collection.statusLabels.verbOff} selected
                      </Button>
                    </>
                  ) : null}
                  <Button variant="outline" size="sm" onClick={exportCsv} disabled={selected.size === 0}>
                    Export selected
                  </Button>
                </span>
              </div>
            ) : null}

            <RecordTable
              collection={collection}
              records={filtered}
              selectedId={selectedId}
              onSelect={goToRecord}
              selection={
                selecting
                  ? { selectedIds: selected, onToggle: toggleSelected, onToggleAll: toggleAllVisible }
                  : undefined
              }
            />
            <footer className="flex h-8 flex-none items-center gap-3 border-t border-line px-4 text-[0.8rem] text-muted">
              Showing {filtered.length} of {records.length}
              {selecting && selected.size > 0 ? <span>· {selected.size} selected</span> : null}
            </footer>

            {editable ? (
              <ImportDialog
                open={importOpen}
                onClose={() => setImportOpen(false)}
                collection={collection}
                records={records}
                ctx={ctx}
                createBlank={() => createBlank(snapshot, collection.id)}
                onSave={(record) => onSave(collection, record)}
              />
            ) : null}
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
  // The last saved shape of the record; the draft is dirty when it differs.
  const [baseline, setBaseline] = useState<AdminRecord>(initial)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline)
  // Ref mirror so the navigation blocker sees post-save state immediately,
  // before React re-renders (persist() resets it right before navigating).
  const dirtyRef = useRef(false)
  useEffect(() => {
    dirtyRef.current = dirty
  }, [dirty])

  // Block in-app navigation (record switch, back to list, sidebar, dashboard)
  // while dirty; the ConfirmDialog below resumes or cancels it.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => dirtyRef.current && currentLocation.pathname !== nextLocation.pathname,
  )

  // Browser refresh / tab close.
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  // Non-router escape hatches (logout in the topbar) check this tracker.
  const unsaved = useUnsavedChanges()
  useEffect(() => {
    unsaved.setDirty(dirty)
    return () => unsaved.setDirty(false)
  }, [dirty, unsaved])

  const fileListKey = collection.fields.find((field) => field.type === 'fileList')?.key
  const slugKey = collection.fields.find((field) => field.type === 'slug')?.key

  // Mirror the title into the slug until the user edits the slug themselves.
  // New records start with a blank slug, so they opt in automatically; existing
  // records already have one, so their slug is never silently rewritten.
  const [slugFollowsTitle, setSlugFollowsTitle] = useState(
    () => Boolean(slugKey) && String(getPath(initial, slugKey ?? '') ?? '').trim() === '',
  )

  const updateValue = (key: string, value: unknown) => {
    if (slugKey && key === slugKey) setSlugFollowsTitle(String(value ?? '').trim() === '')
    setDraft((current) => {
      let next = setPath(current, key, value)
      if (slugKey && slugFollowsTitle && key === collection.titleField) {
        next = setPath(next, slugKey, uniqueSlug(String(value ?? ''), slugKey, records, current.id))
      }
      return next
    })
  }

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
      setBaseline({ ...saved })
      dirtyRef.current = false
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
    <>
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
        dirty={dirty}
        error={validationError}
        canWrite={repository.canWrite}
      />
      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title="Discard unsaved changes?"
        description={`This ${collection.singular.toLowerCase()} has unsaved changes. If you leave now, they will be lost.`}
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        onConfirm={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      />
    </>
  )
}
