import { useState } from 'react'
import type { AdminCollection, AdminRecord, FieldContext, EditorSection as EditorSectionDef } from '../../cms/types'
import { isDeletable } from '../../cms/adapter'
import { fieldIsVisible, findField, getPath, getRecordTitle } from '../../cms/record'
import {
  publishState,
  PUBLISH_STATE_HINT,
  PUBLISH_STATE_LABEL,
  PUBLISH_STATE_TONE,
  type PublishState,
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
  onSave: () => void
  /** Change the record's status flag. Edits the draft only — Save commits it. */
  onSetStatus: (next: boolean) => void
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
  onSetStatus,
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
  const statusOn = collection.statusField ? Boolean(getPath(record, collection.statusField)) : false
  const labels = collection.statusLabels
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

  // The record's own flag says whether it *should* be on the site; this says
  // whether the site actually has it — the two only agree after a publish.
  const state = publishState(collection, record, site)

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

          {/* Publish state, always shown: it's the answer to "is my change live?" */}
          {collection.statusField && !error ? (
            <Pill tone={PUBLISH_STATE_TONE[state]} title={PUBLISH_STATE_HINT[state]} className="text-ui">
              {PUBLISH_STATE_LABEL[state]}
            </Pill>
          ) : null}

          {/* Save feedback, distinct from publish state: "written to the CMS"
              vs "live on the site". Both can be true at once, and usually the
              first is true while the second isn't. */}
          {editable && !error ? (
            dirty ? (
              <span className="text-ui text-muted">Unsaved changes</span>
            ) : justSaved ? (
              <span className="text-ui text-muted">Saved</span>
            ) : null
          ) : null}

          {editable && collection.statusField && labels ? (
            <StatusSplitButton on={statusOn} labels={labels} state={state} onSelect={onSetStatus} />
          ) : null}

          {editable ? (
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

              {collection.statusField && labels ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSetStatus(false)}
                  disabled={!statusOn}
                >
                  {labels.verbOff}
                </Button>
              ) : null}

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
 * The record's status: the primary action plus every status it could be, with
 * what each one means.
 *
 * The main half performs the one transition that makes sense from here, so the
 * common case is a single click. The caret exists because "what does Draft
 * actually mean?" was previously something you had to work out from a tooltip —
 * now the choices are written down where the decision is made.
 *
 * Nothing here deploys. Publishing the *site* is the topbar's job; this only
 * decides whether the record is meant to be on it, which the next site publish
 * then acts on.
 */
function StatusSplitButton({
  on,
  labels,
  state,
  onSelect,
}: {
  on: boolean
  labels: NonNullable<AdminCollection['statusLabels']>
  state: PublishState
  onSelect: (next: boolean) => void
}) {
  return (
    <SplitButton
      variant={on ? 'soft' : 'solid'}
      onClick={() => onSelect(!on)}
      menuLabel="Change status"
      menu={
        <>
          <MenuChoice
            label={labels.on}
            description="Meant to be on the website. It goes live at the next site publish."
            selected={on}
            onClick={() => onSelect(true)}
          />
          <MenuChoice
            label={labels.off}
            description="Kept out of the website. The next site publish removes it if it was live."
            selected={!on}
            onClick={() => onSelect(false)}
          />
          <div className="mt-1 border-t border-line px-2.5 pb-1 pt-1.5 text-ui text-muted">
            {state === 'draft'
              ? 'This record currently reads Draft: it has saved changes the website hasn’t picked up yet. Publishing the site clears that.'
              : 'A record reads Draft on its own whenever it has saved changes the website hasn’t picked up yet.'}
          </div>
        </>
      }
    >
      {on ? labels.verbOff : labels.verbOn}
    </SplitButton>
  )
}
