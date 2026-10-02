import { useState } from 'react'
import type { AdminCollection, AdminRecord, FieldContext, EditorSection as EditorSectionDef } from '../../cms/types'
import { isDeletable } from '../../cms/adapter'
import { fieldIsVisible, findField, getRecordTitle } from '../../cms/record'
import {
  canSaveAs,
  publishState,
  publishStateHint,
  PUBLISH_STATE_LABEL,
  PUBLISH_STATE_TONE,
  recordStatus,
  SAVE_CHOICES,
  type SaveStatus,
} from '../../cms/publish-state'
import { useSite } from '../../lib/site-status'
import { BAR, CHIP_DASHED, cn } from '../../design'
import { Pill } from '../Badge'
import { Icon } from '../ui'
import { Button, ConfirmDialog, MenuChoice, ScrollArea, SplitButton } from '../primitives'
import { EditorSection } from './EditorSection'
import { FieldControl } from './FieldControl'

type Props = {
  collection: AdminCollection
  record: AdminRecord
  ctx: FieldContext
  onUpdate: (key: string, value: unknown) => void
  /** Plain save, for an editable collection without a publish status. */
  onSave: () => void
  /**
   * Save the draft with this status — the ONLY way to save a record that has
   * one. There is no status-less Save: every save says what should happen to
   * the change on the website.
   */
  onSaveAs: (status: SaveStatus) => void
  /** Duplicate this record (the saved baseline, not the live draft) and navigate to the copy. */
  onDuplicate: () => void
  /**
   * True on `/collection/new`, before the first save. Delete and Duplicate
   * both address a row that does not exist yet — Delete would ask the API to
   * remove an id it has never seen (the repository's row-count check would
   * throw, surfacing as a baffling error), and Duplicate would produce a
   * second blank "New product (copy)".
   */
  isNew: boolean
  /** Permanently delete this record. Resolves false on failure, so the caller knows to stay put. */
  onDelete: () => Promise<boolean>
  onBack: () => void
  saving: boolean
  dirty: boolean
  /** True briefly after a successful save, for the "Saved" confirmation. */
  justSaved: boolean
  error: string | null
  canWrite: boolean
}

export function RecordEditor({
  collection,
  record,
  ctx,
  onUpdate,
  onSave,
  onSaveAs,
  onDuplicate,
  onDelete,
  isNew,
  onBack,
  saving,
  dirty,
  justSaved,
  error,
  canWrite,
}: Props) {
  const site = useSite()
  const editable = !collection.readOnly && canWrite
  const hasStatus = Boolean(collection.statusField)
  // Deleting needs more than write access — mirrors AdminWorkspace's own
  // `deletable`, so the editor never offers a Delete that the list wouldn't.
  const deletable = editable && isDeletable(collection.id)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleDelete = async () => {
    setConfirmDelete(false)
    // A failed delete surfaces through the same error banner every other
    // write does — staying put (rather than calling onBack unconditionally)
    // is what keeps that message attached to a record that's still here.
    if (await onDelete()) onBack()
  }

  // The stored status plus whether the website pages have caught up with it.
  const state = publishState(record, site)

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
          collectionId={collection.id}
          ctx={ctx}
          onUpdate={onUpdate}
          disabled={!editable}
        />
      )
    })

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-surface">
      <header className={cn(BAR, 'gap-2')}>
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back to list">
          <span className="size-4">
            <Icon name="back" />
          </span>
        </Button>
        <h2 className="min-w-0 truncate text-title font-semibold">{getRecordTitle(collection, record)}</h2>

        <div className="ml-auto flex flex-none items-center gap-2">
          {error ? <span className="text-ui text-danger">{error}</span> : null}

          {/* The stored status — the answer to "is my change live?". It
              describes what's SAVED, so unsaved edits are called out beside it
              rather than changing it. */}
          {hasStatus && !error ? (
            <Pill tone={PUBLISH_STATE_TONE[state]} title={publishStateHint(record, site)} className="text-ui">
              {PUBLISH_STATE_LABEL[state]}
            </Pill>
          ) : null}

          {editable && !error ? (
            dirty ? (
              <span className="text-ui text-muted">Unsaved changes</span>
            ) : justSaved ? (
              <span className="text-ui text-muted">Saved</span>
            ) : null
          ) : null}

          {editable && hasStatus ? (
            <SaveAsButton record={record} dirty={dirty} saving={saving} onSaveAs={onSaveAs} />
          ) : editable ? (
            <Button variant="solid" size="sm" onClick={onSave} disabled={saving || !dirty}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          ) : (
            <span className={CHIP_DASHED}>Read only</span>
          )}
        </div>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        {/* No max-width column and no gap here: each EditorSection owns its own
            padding and its own divider hairline, so removing the 840px column
            lets those hairlines — and the fields themselves — reach both
            edges of the pane, matching the reference. */}
        <div className="grid">
          {visibleSections.map((section, index) => (
            <EditorSection key={section.title} title={section.title} hint={section.hint} divided={index > 0}>
              {renderFields(section)}
            </EditorSection>
          ))}

          {/* Record-level actions, not a titled section: these act ON the
              record rather than editing it, and a heading here would only
              restate what a row of buttons already shows. Same rhythm as the
              sections above it (full-bleed padding, top hairline as the
              divider) so it reads as the last one rather than as furniture. */}
          {editable && !isNew ? (
            <div className="flex items-center gap-2 border-t border-line px-4 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onDuplicate}
                // Disabled while dirty so this never has to decide between
                // duplicating what's saved and what's on screen — only the
                // saved baseline is ever a candidate.
                disabled={saving || dirty}
                title={dirty ? 'Save your changes first' : undefined}
              >
                Duplicate
              </Button>

              {/* Destructive, and pushed away from the two buttons pressed
                  routinely — same reasoning as the gallery card's Remove
                  button. */}
              {deletable ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDelete(true)}
                  disabled={saving}
                  className="ml-auto border-danger/40 text-danger hover:border-danger hover:text-danger"
                  aria-label={`Delete ${getRecordTitle(collection, record)}`}
                >
                  <span className="size-4">
                    <Icon name="trash" />
                  </span>
                  Delete
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </ScrollArea>

      {/* Named after the record itself rather than a count — the bulk version
          of this dialog (AdminWorkspace) names counts because it can delete
          many at once; this one only ever deletes the one record it's open on. */}
      <ConfirmDialog
        open={confirmDelete}
        title={`Delete "${getRecordTitle(collection, record)}"?`}
        description="This cannot be undone."
        confirmLabel={`Permanently delete this ${collection.singular.toLowerCase()}`}
        cancelLabel="Keep it"
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}

/**
 * How a record is saved: the primary half queues the change for the next
 * publish (the common case, one click); the caret offers saving as a draft or
 * archiving, each with what it does to the website written next to it.
 *
 * Nothing here deploys. Publishing the *site* is the topbar's job.
 */
function SaveAsButton({
  record,
  dirty,
  saving,
  onSaveAs,
}: {
  record: AdminRecord
  dirty: boolean
  saving: boolean
  onSaveAs: (status: SaveStatus) => void
}) {
  const current = recordStatus(record)
  const [primary, ...rest] = SAVE_CHOICES
  return (
    <SplitButton
      variant="solid"
      onClick={() => onSaveAs(primary.status)}
      disabled={saving}
      actionDisabled={!canSaveAs(primary.status, record, dirty)}
      menuLabel="More ways to save"
      menu={[primary, ...rest].map((choice) => (
        <MenuChoice
          key={choice.status}
          label={choice.label}
          description={choice.description}
          selected={!dirty && current === choice.status}
          disabled={!canSaveAs(choice.status, record, dirty)}
          onClick={() => onSaveAs(choice.status)}
        />
      ))}
    >
      {saving ? 'Saving…' : primary.label}
    </SplitButton>
  )
}
