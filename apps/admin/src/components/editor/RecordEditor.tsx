import type { AdminCollection, AdminRecord, FieldContext, EditorSection as EditorSectionDef } from '../../cms/types'
import { fieldIsVisible, findField, getPath, getRecordTitle } from '../../cms/record'
import {
  publishState,
  PUBLISH_STATE_HINT,
  PUBLISH_STATE_LABEL,
  PUBLISH_STATE_TONE,
  type PublishState,
} from '../../cms/publish-state'
import { useSite } from '../../lib/site-status'
import { Pill } from '../Badge'
import { Icon } from '../ui'
import { Button, MenuChoice, ScrollArea, SplitButton } from '../primitives'
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
      <header className="flex h-12 flex-none items-center gap-3 border-b border-line px-6 py-1">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back to list">
          <span className="h-4 w-4">
            <Icon name="back" />
          </span>
        </Button>
        <h2 className="min-w-0 truncate text-base font-semibold tracking-[-0.01em]">{getRecordTitle(collection, record)}</h2>

        <div className="ml-auto flex flex-none items-center gap-3">
          {error ? <span className="text-[0.85rem] text-danger">{error}</span> : null}

          {/* Publish state, always shown: it's the answer to "is my change live?" */}
          {collection.statusField && !error ? (
            <Pill tone={PUBLISH_STATE_TONE[state]} title={PUBLISH_STATE_HINT[state]} className="text-[0.82rem]">
              {PUBLISH_STATE_LABEL[state]}
            </Pill>
          ) : null}

          {/* Save feedback, distinct from publish state: "written to the CMS"
              vs "live on the site". Both can be true at once, and usually the
              first is true while the second isn't. */}
          {editable && !error ? (
            dirty ? (
              <span className="text-[0.8rem] text-muted">Unsaved changes</span>
            ) : justSaved ? (
              <span className="text-[0.8rem] text-muted">Saved</span>
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
            <span className="rounded-control border border-dashed border-line-strong px-2.5 py-1 text-[0.78rem] uppercase tracking-[0.06em] text-muted">
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
          <div className="mt-1 border-t border-line px-3 pb-1 pt-2 text-[0.78rem] leading-snug text-muted">
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
