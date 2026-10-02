import { useEffect, useMemo, useRef, useState } from 'react'
import { useBlocker, useNavigate, useParams } from 'react-router-dom'
import type { CmsSnapshot } from '@designing-minds/cms'
import type { AdminCollection, AdminRecord } from '../cms/types'
import { buildFieldContext, createBlank, isDeletable, resolveFilterFacets, selectRecord, selectRecords } from '../cms/adapter'
import { fieldIsVisible, getPath, matchesFilters, matchesSearch, setPath, uniqueSlug } from '../cms/record'
import { buildCsv } from '../cms/csv-io'
import { downloadCsv } from '../lib/csv'
import { repository } from '../repository'
import { useUnsavedChanges } from '../lib/unsaved'
import { ConfirmDialog } from '../components/primitives'
import { RecordsToolbar } from '../components/workspace/RecordsToolbar'
import { type FilterState } from '../components/workspace/FilterPopover'
import { RecordTable } from '../components/workspace/RecordTable'
import { ImportDialog } from '../components/workspace/ImportDialog'
import { RecordEditor } from '../components/editor/RecordEditor'
import { cn, STATUSBAR } from '../design'
import { recordStatus, type SaveStatus } from '../cms/publish-state'

type SaveFn = (collection: AdminCollection, record: AdminRecord) => Promise<AdminRecord | null>

type DeleteFn = (collection: AdminCollection, ids: string[]) => Promise<boolean>

type Props = {
  collection: AdminCollection
  snapshot: CmsSnapshot
  saving: boolean
  onSave: SaveFn
  onDelete: DeleteFn
}

/**
 * The Editorial Workspace for one Collection: the record table (full width) or,
 * once a record is selected via the URL, the record-list pane + Record Editor.
 */
export function AdminWorkspace({ collection, snapshot, saving, onSave, onDelete }: Props) {
  const navigate = useNavigate()
  const { recordId } = useParams()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<FilterState>({})
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set())
  const [importOpen, setImportOpen] = useState(false)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const records = useMemo(() => selectRecords(snapshot, collection.id), [snapshot, collection.id])
  const ctx = useMemo(() => buildFieldContext(snapshot), [snapshot])
  const facets = useMemo(() => resolveFilterFacets(collection, snapshot, records), [collection, snapshot, records])

  const filtered = useMemo(
    () =>
      records.filter(
        (record) => matchesFilters(record, filters) && matchesSearch(record, collection.searchFields, search),
      ),
    [records, search, filters, collection],
  )

  const editable = !collection.readOnly && repository.canWrite
  // Deleting needs more than write access: the repository only has tables for
  // the four content collections, and operational records are history.
  const deletable = editable && isDeletable(collection.id)
  const bulkStatusAvailable = Boolean(editable && collection.statusField)

  /**
   * The bar's heading while selecting. It replaces the collection name, so it
   * has to say what state you are in on its own — "Nothing selected" rather
   * than "0 products selected", which reads like a broken counter.
   */
  /**
   * What actually happens, per the schema's cascades — not a generic warning.
   * A product leaves every bundle that contained it and any live cart, because
   * `bundle_products` and `cart_items` cascade off its id. Past orders are
   * safe: `orders.items` is a JSONB snapshot taken at purchase.
   */
  const deleteWarning =
    collection.id === 'products'
      ? 'This cannot be undone. They will also be removed from every bundle that includes them and from any shopper’s cart. Completed orders keep their own record and are unaffected.'
      : collection.id === 'bundles'
        ? 'This cannot be undone. They will also be removed from any shopper’s cart. Completed orders keep their own record and are unaffected.'
        : 'This cannot be undone.'

  const selectionTitle =
    selected.size === 0
      ? 'Nothing selected'
      : `${selected.size} ${(selected.size === 1 ? collection.singular : collection.label).toLowerCase()} selected`
  const editing = Boolean(recordId)
  const selectedId = recordId ?? null

  /* ------------------------- Selection & bulk ops ----------------------- */

  const startSelecting = () => {
    setSelecting(true)
    setSelected(new Set())
  }

  const cancelSelecting = () => {
    setSelecting(false)
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

  const bulkSetStatus = async (status: SaveStatus) => {
    const statusField = collection.statusField
    if (!statusField) return
    setBulkBusy(true)
    try {
      for (const record of records) {
        if (!selected.has(record.id)) continue
        const current = recordStatus(record)
        // Queueing something already Published (unchanged) would publish nothing.
        if (current === status || (status === 'queued' && current === 'published')) continue
        await onSave(collection, setPath(record, statusField, status))
      }
    } finally {
      setBulkBusy(false)
    }
  }

  /**
   * Permanently deletes the selection. The confirm step is not ceremony: this
   * is the one action in the admin with no undo and no draft to fall back on.
   *
   * A failed delete keeps the selection — the error names what went wrong, and
   * clearing the rows it refers to would take that away.
   */
  const deleteSelected = async () => {
    setConfirmDelete(false)
    const ids = [...selected]
    if (ids.length === 0) return
    setBulkBusy(true)
    try {
      if (await onDelete(collection, ids)) setSelected(new Set())
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

  // Opening a record narrows the same table rather than swapping in a
  // different view: the list-wide columns are hidden and only the first one —
  // the record's name — is kept. Its registry width is dropped because the
  // pane sizes the column now.
  const listColumns = useMemo(
    () => (editing ? [{ ...collection.listColumns[0], width: undefined }] : undefined),
    [editing, collection.listColumns],
  )

  return (
    <div className="flex min-h-0 flex-1">
      <section
        className={cn('flex min-h-0 flex-col border-r border-line', editing ? 'w-pane flex-none' : 'min-w-0 flex-1')}
        aria-label={`${collection.label} records`}
      >
        <RecordsToolbar
          title={collection.label}
          selectionTitle={selectionTitle}
          query={search}
          onQueryChange={setSearch}
          facets={facets}
          filters={filters}
          onFiltersChange={setFilters}
          selecting={!editing && selecting}
          selectedCount={selected.size}
          onStartSelecting={startSelecting}
          onCancelSelecting={cancelSelecting}
          onExport={exportCsv}
          onDelete={deletable ? () => setConfirmDelete(true) : undefined}
          onBulkStatus={bulkStatusAvailable ? (status) => void bulkSetStatus(status) : undefined}
          busy={bulkBusy}
          onImport={editable ? () => setImportOpen(true) : undefined}
          onNew={editable ? createNew : undefined}
          newLabel={`New ${collection.singular.toLowerCase()}`}
          compact={editing}
        />

        {/* One table in both states — narrowed to its first column while a
            record is open, so the list never becomes a different component. */}
        <RecordTable
          collection={collection}
          records={filtered}
          columns={listColumns}
          fixedLayout={editing}
          emptyMessage={filtered.length === records.length ? 'No records yet.' : 'No matches.'}
          selectedId={selectedId}
          onSelect={goToRecord}
          selection={
            !editing && selecting
              ? { selectedIds: selected, onToggle: toggleSelected, onToggleAll: toggleAllVisible }
              : undefined
          }
        />

        <footer className={STATUSBAR}>
          Showing {filtered.length} of {records.length}
          {!editing && selecting && selected.size > 0 ? <span>· {selected.size} selected</span> : null}
        </footer>

        {/* Named counts, and the word "Permanently": the one action here that
            cannot be undone should not read like the ones that can. */}
        <ConfirmDialog
          open={confirmDelete}
          title={`Delete ${selected.size} ${(selected.size === 1 ? collection.singular : collection.label).toLowerCase()}?`}
          description={
            deleteWarning
          }
          confirmLabel={`Permanently delete ${selected.size}`}
          cancelLabel="Keep them"
          onConfirm={() => void deleteSelected()}
          onCancel={() => setConfirmDelete(false)}
        />

        {editable && !editing ? (
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
      </section>

      {editing ? (
        initial ? (
          // Keyed by recordId so the draft re-initialises on navigation (no effect needed).
          <RecordEditorPane
            key={recordId}
            collection={collection}
            initial={initial}
            isNew={recordId === 'new'}
            records={records}
            stored={recordId === 'new' ? undefined : records.find((record) => record.id === recordId)}
            ctx={ctx}
            saving={saving}
            onSave={onSave}
            onDelete={onDelete}
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
  isNew,
  records,
  stored,
  ctx,
  saving,
  onSave,
  onDelete,
  onBack,
  onNavigateToRecord,
}: {
  collection: AdminCollection
  initial: AdminRecord
  /** Straight from the URL: `/collection/new` has nothing on the server yet. */
  isNew: boolean
  records: AdminRecord[]
  /** The record as currently stored (snapshot), which can change underneath — e.g. a publish. */
  stored: AdminRecord | undefined
  ctx: ReturnType<typeof buildFieldContext>
  saving: boolean
  onSave: SaveFn
  onDelete: DeleteFn
  onBack: () => void
  onNavigateToRecord: (id: string) => void
}) {
  const [draft, setDraft] = useState<AdminRecord>(initial)
  // The last saved shape of the record; the draft is dirty when it differs.
  const [baseline, setBaseline] = useState<AdminRecord>(initial)
  const [validationError, setValidationError] = useState<string | null>(null)
  // Drives the transient "Saved" confirmation in the editor header.
  const [justSaved, setJustSaved] = useState(false)

  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline)
  // A publish (or a background upload) can change the stored record while it
  // is open. With no edits in progress, follow it — otherwise the header would
  // keep saying "Queued" about a record that is now Published. With edits in
  // progress, keep them; the next save decides.
  const [followed, setFollowed] = useState(stored)
  if (stored && stored !== followed) {
    setFollowed(stored)
    if (!dirty) {
      setDraft({ ...stored })
      setBaseline({ ...stored })
    }
  }

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

  const slugKey = collection.fields.find((field) => field.type === 'slug')?.key

  // Mirror the title into the slug until the user edits the slug themselves.
  // New records start with a blank slug, so they opt in automatically; existing
  // records already have one, so their slug is never silently rewritten.
  const [slugFollowsTitle, setSlugFollowsTitle] = useState(
    () => Boolean(slugKey) && String(getPath(initial, slugKey ?? '') ?? '').trim() === '',
  )

  /**
   * Update one field. `value` may be an updater function, which matters for
   * anything written from outside the render that produced it — a background
   * upload landing while another is still in flight would otherwise compute
   * its new array from a stale snapshot of the old one and drop a file.
   */
  const updateValue = (key: string, value: unknown) => {
    const isUpdater = typeof value === 'function'
    if (slugKey && key === slugKey && !isUpdater) setSlugFollowsTitle(String(value ?? '').trim() === '')
    setDraft((current) => {
      const resolved = isUpdater ? (value as (previous: unknown) => unknown)(getPath(current, key)) : value
      let next = setPath(current, key, resolved)
      if (slugKey && slugFollowsTitle && key === collection.titleField) {
        next = setPath(next, slugKey, uniqueSlug(String(resolved ?? ''), slugKey, records, current.id))
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
      setJustSaved(true)
      if (saved.id !== initial.id) onNavigateToRecord(saved.id)
    }
  }

  // The "Saved" confirmation is a moment, not a state — clear it once the user
  // has had time to see it, or as soon as they start editing again.
  useEffect(() => {
    if (!justSaved) return
    const timer = window.setTimeout(() => setJustSaved(false), 4000)
    return () => window.clearTimeout(timer)
  }, [justSaved])

  /**
   * Every save names a status, so "saved" can never be mistaken for "live":
   * Queue for publish, Save as draft, or Archive. The status is written with
   * the edits in one save — it is the save.
   */
  const saveAs = (status: SaveStatus) => {
    if (!collection.statusField) return
    setJustSaved(false)
    void persist(setPath(draft, collection.statusField, status))
  }

  /**
   * Builds a copy of the saved baseline — never the live draft, so this can
   * never be asked whether it's duplicating what's stored or what's on
   * screen. The button that triggers it is disabled while dirty for the same
   * reason: baseline and draft only ever agree when it's enabled.
   */
  const duplicateRecord = () => {
    const title = `${String(getPath(baseline, collection.titleField) ?? '')} (copy)`
    // Fresh id the same way a brand new record gets one — see createBlank.
    let copy: AdminRecord = { ...baseline, id: crypto.randomUUID() }
    copy = setPath(copy, collection.titleField, title)
    // Never goes live on its own — a duplicate is a starting point to edit,
    // not a second publish of the original.
    if (collection.statusField) copy = setPath(copy, collection.statusField, 'draft')
    if (slugKey) copy = setPath(copy, slugKey, uniqueSlug(title, slugKey, records, copy.id))
    void persist(copy)
  }

  /**
   * Id is stable across edits (nothing in the editor writes to it), so this
   * always reaches the real saved row regardless of what the draft looks
   * like on screen.
   */
  const deleteThisRecord = (): Promise<boolean> => onDelete(collection, [initial.id])

  return (
    <>
      <RecordEditor
        collection={collection}
        record={draft}
        ctx={ctx}
        onUpdate={updateValue}
        onSave={() => void persist(draft)}
        onSaveAs={saveAs}
        onDuplicate={duplicateRecord}
        onDelete={deleteThisRecord}
        isNew={isNew}
        onBack={onBack}
        saving={saving}
        dirty={dirty}
        justSaved={justSaved && !dirty}
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
