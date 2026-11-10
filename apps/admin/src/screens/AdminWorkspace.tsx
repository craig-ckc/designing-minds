import { duplicateCouponCode, promotionValidation } from '@designing-minds/cms'
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
import { type SaveStatus } from '../cms/publish-state'
import { chooseNewProductType, duplicatePhysicalVariants, physicalProductEditValidation } from '../cms/physical-product-edit'
import type { PhysicalVariantDraft } from '@designing-minds/cms'
import { currentYear } from '../cms/years'
import { saveSelectedStatus } from '../lib/bulk-status'

type SaveFn = (collection: AdminCollection, record: AdminRecord) => Promise<AdminRecord | null>

type DeleteFn = (collection: AdminCollection, ids: string[]) => Promise<boolean>

type Props = {
  collection: AdminCollection
  snapshot: CmsSnapshot
  saving: boolean
  onSave: SaveFn
  onDelete: DeleteFn
  onRefresh?: () => void
}

/**
 * The Editorial Workspace for one Collection: the record table (full width) or,
 * once a record is selected via the URL, the record-list pane + Record Editor.
 */
export function AdminWorkspace({ collection, snapshot, saving, onSave, onDelete, onRefresh }: Props) {
  const navigate = useNavigate()
  const { recordId } = useParams()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<FilterState>({})
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set())
  const [importOpen, setImportOpen] = useState(false)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [bulkSummary, setBulkSummary] = useState<string | null>(null)
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
    setBulkSummary(null)
    setBulkBusy(true)
    try {
      const result = await saveSelectedStatus(collection, records, selected, status, onSave)
      const summary = result.failedIds.length
        ? `Updated ${result.updated} of ${result.attempted}; ${result.failedIds.length} failed. Selection is unchanged so you can retry.`
        : `Updated ${result.updated} ${collection.label.toLowerCase()}.`
      setBulkSummary(summary)
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
        className={cn('min-h-0 flex-col border-r border-line', editing ? 'hidden lg:flex lg:w-pane lg:flex-none' : 'flex min-w-0 flex-1')}
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
        {bulkSummary ? <p role={bulkSummary.includes('failed') ? 'alert' : 'status'} className="px-3 py-2 text-ui">{bulkSummary}</p> : null}

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
            onRefresh={onRefresh}
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
  onRefresh,
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
  onRefresh?: () => void
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
      if (collection.id === 'products' && key === 'productType') {
        return isNew ? chooseNewProductType(current, resolved, ctx.valueLists, currentYear()) : current
      }
      let next = setPath(current, key, resolved)
      if (collection.id === 'products' && key === 'pricingMode' && resolved === 'fixed') next = { ...next, pricingFieldKey: null, billableCharacters: null }
      if (slugKey && slugFollowsTitle && key === collection.titleField) {
        next = setPath(next, slugKey, uniqueSlug(String(resolved ?? ''), slugKey, records, current.id))
      }
      return next
    })
  }

  const validate = (record: AdminRecord): string | null => {
    if (collection.id === 'products' && record.productType === 'physical') {
      if (!ctx.commerceReady) return 'Physical-product management is not installed in this environment yet.'
      const error = physicalProductEditValidation(record)
      if (error) return error
    }
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
    return promotionValidation(collection.id, record)
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
      if (isNew || saved.id !== initial.id) onNavigateToRecord(saved.id)
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
    if (collection.id === 'coupons') copy = { ...copy, code: duplicateCouponCode(String(baseline.code ?? ''), copy.id), enabled: false }
    if (collection.id === 'products' && baseline.productType === 'physical') copy = { ...copy, variants: duplicatePhysicalVariants(baseline.variants as PhysicalVariantDraft[] | undefined, copy.id) }
    if (slugKey) copy = setPath(copy, slugKey, uniqueSlug(title, slugKey, records, copy.id))
    void persist(copy)
  }

  /**
   * Id is stable across edits (nothing in the editor writes to it), so this
   * always reaches the real saved row regardless of what the draft looks
   * like on screen.
   */
  const deleteThisRecord = (): Promise<boolean> => onDelete(collection, [initial.id])
  const clearDirtyBeforeDeleteNavigation = () => {
    dirtyRef.current = false
    setDraft({ ...baseline })
    setBaseline({ ...baseline })
  }
  const keepEditing = () => {
    blocker.reset?.()
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>('button[aria-label="Back to list"]')?.focus()
    })
  }

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
        onDeleted={clearDirtyBeforeDeleteNavigation}
        isNew={isNew}
        onBack={onBack}
        saving={saving}
        dirty={dirty}
        justSaved={justSaved && !dirty}
        error={validationError}
        canWrite={repository.canWrite}
        onRefresh={onRefresh}
      />
      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title="Discard unsaved changes?"
        description={`This ${collection.singular.toLowerCase()} has unsaved changes. If you leave now, they will be lost.`}
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        onConfirm={() => blocker.proceed?.()}
        onCancel={keepEditing}
      />
    </>
  )
}
