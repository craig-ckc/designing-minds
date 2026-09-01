import { useState, type DragEvent } from 'react'
import type { PreviewPdf } from '@designing-minds/cms'
import { formatBytes } from '../../lib/upload-transport'
import { useFieldUploads, useUploadTarget, useUploads, type UploadJob } from '../../lib/uploads'
import { uploadHint, uploadRules } from '../../lib/upload-rules'
import { cn } from '../../design'
import { UploadFailure } from './UploadFailure'
import { Icon } from '../ui'
import { Button, buttonStyles, FileInput, Input } from '../primitives'

/**
 * The one free, publicly downloadable PDF preview on a Product or Bundle.
 *
 * Single slot, modelled on FileListField rather than ImageGalleryField: a
 * record offers exactly one sample, so the drop zone disappears the moment a
 * PDF lands and the only moves left are Replace and Delete. Replacing keeps
 * the entry's id AND its label, same reasoning as FileListField — anything
 * that already points at this preview, plus whatever name the editor gave it,
 * follows the new bytes rather than resetting.
 *
 * Unlike a purchased file, this upload goes to the PUBLIC media bucket
 * (`purpose: 'preview'`) and carries a permanent url — anyone can download it,
 * no purchase or sign-in, which is the entire point of offering it.
 *
 * The card carries an extra control neither sibling field has: a "Display
 * name" input bound to `label`. It defaults to the uploaded filename (see
 * adapter.ts's `uploadFile`) but that filename is often something like
 * `worksheet_final_v3.pdf`, and this text is what a visitor reads on the
 * website's download button — so the editor gets a chance to rename it into
 * something a shopper would actually want to click.
 *
 * The value is still stored as an array (`previewPdfs`), like `purchasedFiles`
 * — so offering several previews later is a UI change to this field, not a
 * data migration.
 */
export function PreviewPdfField({
  collectionId,
  recordId,
  fieldKey,
  label,
  previews,
  onChange,
  disabled,
  labelId,
}: {
  collectionId: string
  recordId: string
  fieldKey: string
  label: string
  previews: PreviewPdf[]
  /** Accepts an updater so concurrent uploads can't overwrite each other. */
  onChange: (update: (current: PreviewPdf[]) => PreviewPdf[]) => void
  disabled?: boolean
  labelId: string
}) {
  const { start } = useUploads()
  const jobs = useFieldUploads(collectionId, recordId, fieldKey)
  const [dragActive, setDragActive] = useState(false)

  // While this editor is open, finished uploads land in the draft rather than
  // being written straight to the record.
  useUploadTarget<PreviewPdf>(collectionId, recordId, fieldKey, (file, replacesFileId) => {
    onChange((current) =>
      replacesFileId
        ? current.map((entry) => (entry.id === replacesFileId ? { ...file, label: entry.label } : entry))
        : [...current, file],
    )
  })

  // One PDF, so only ever the first of a selection or a multi-file drop.
  const queue = (selected: FileList | File[] | null, replacesFileId?: string) => {
    const file = [...(selected ?? [])][0]
    if (!file) return
    start({ collectionId, recordId, fieldKey, purpose: 'preview', file, replacesFileId })
  }

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setDragActive(false)
    if (disabled) return
    queue(event.dataTransfer.files)
  }

  const active = jobs.filter((job) => job.status === 'uploading')
  // The slot is taken once a PDF is there or one is on its way, and an
  // occupied slot offers Replace — never a second upload.
  const slotFilled = previews.length > 0 || active.length > 0

  return (
    // A preview card has several controls, not one input, so it is announced
    // as a labelled group rather than pointing a <label> at something invisible.
    <div role="group" aria-labelledby={labelId} className="grid gap-2">
      {previews.length > 0 ? (
        <ul className="grid gap-2">
          {previews.map((preview) => (
            <li key={preview.id}>
              <PreviewCard
                preview={preview}
                disabled={disabled}
                onLabelChange={(next) =>
                  onChange((current) => current.map((entry) => (entry.id === preview.id ? { ...entry, label: next } : entry)))
                }
                onReplace={(picked) => queue(picked, preview.id)}
                onDelete={() => onChange((current) => current.filter((entry) => entry.id !== preview.id))}
              />
            </li>
          ))}
        </ul>
      ) : null}

      {active.length > 0 ? (
        <ul className="grid gap-2">
          {active.map((job) => (
            <li key={job.id}>
              <UploadProgress job={job} />
            </li>
          ))}
        </ul>
      ) : null}

      {jobs
        .filter((job) => job.status === 'error')
        .map((job) => (
          <UploadFailure key={job.id} job={job} />
        ))}

      {!disabled && !slotFilled ? (
        <FileInput
          label={`Upload the ${label.toLowerCase()}`}
          accept={uploadRules.preview.accept}
          onFiles={(picked) => queue(picked)}
          render={(labelProps) => (
            <label
              {...labelProps}
              onDragOver={(event) => {
                event.preventDefault()
                if (!dragActive) setDragActive(true)
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={onDrop}
              className={cn(
                'flex cursor-pointer flex-col items-center justify-center gap-1 rounded-control border border-dashed px-3 py-4 text-center transition',
                // The input is a sibling, so `focus-within` never sees it.
                'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-primary peer-focus-visible:outline-offset-1',
                dragActive ? 'border-primary bg-primary-tint' : 'border-line-strong bg-surface-alt hover:border-primary',
              )}
            >
              <span className="grid size-7 place-items-center rounded-pill bg-surface text-ink-soft">
                <span className="size-4">
                  <Icon name="upload" />
                </span>
              </span>
              <span className="text-ui font-medium text-ink">
                {dragActive ? 'Drop to upload' : 'Drag & drop a PDF here'}
              </span>
              <span className="text-ui text-muted">
                or <span className="font-medium text-primary">click to browse</span>
              </span>
              {/* Said before anything is picked, not after a refusal. */}
              <span className="text-ui text-muted">{uploadHint('preview')}</span>
            </label>
          )}
        />
      ) : previews.length === 0 && active.length === 0 ? (
        <p className="text-ui text-muted">No preview PDF attached.</p>
      ) : null}
    </div>
  )
}

/* ------------------------------- One PDF -------------------------------- */

function PreviewCard({
  preview,
  disabled,
  onLabelChange,
  onReplace,
  onDelete,
}: {
  preview: PreviewPdf
  disabled?: boolean
  onLabelChange: (next: string) => void
  onReplace: (picked: FileList | null) => void
  onDelete: () => void
}) {
  const size = formatBytes(preview.sizeBytes)
  const labelInputId = `${preview.id}:display-name`

  return (
    <div className="rounded-control border border-line bg-surface">
      <div className="flex items-start gap-2 p-2.5">
        <span className="grid size-9 flex-none place-items-center rounded-control bg-ph text-ph-glyph">
          <span className="size-4">
            <Icon name="doc" />
          </span>
        </span>
        <span className="grid min-w-0 flex-1 gap-0.5">
          <span className="truncate text-ui font-medium text-ink">{preview.filename}</span>
          <span className="truncate text-ui text-muted">
            {[size, preview.contentType].filter(Boolean).join(' · ') || 'Stored'}
          </span>
          {!preview.storageKey ? (
            <span className="text-ui text-warn">Not stored yet — re-upload this file.</span>
          ) : null}
        </span>
      </div>

      {/* The name a visitor sees on the site's download button — not the
          filename above, which is only ever shown here in the admin. */}
      <div className="grid gap-1 border-t border-line px-2.5 py-2">
        <label htmlFor={labelInputId} className="text-ui text-ink">
          Display name
        </label>
        <Input
          id={labelInputId}
          value={preview.label}
          disabled={disabled}
          onChange={(event) => onLabelChange(event.target.value)}
        />
        <p className="text-ui text-muted">Shown on the download button visitors see — not the filename above.</p>
      </div>

      {!disabled ? (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-line px-2.5 py-1.5">
          {/* Replace, not "upload again": the entry keeps its id AND its label,
              so anything already pointing at this preview — and whatever name
              the editor gave it — follows the new bytes.

              A plain <label> wearing the button styling, not a Base UI Button:
              the label's own activation is what opens the picker, and routing
              it through a non-native button would add a competing role and key
              handler on top of it. */}
          <FileInput
            label={`Replace ${preview.filename}`}
            accept={uploadRules.preview.accept}
            onFiles={onReplace}
            render={(labelProps) => (
              <label
                {...labelProps}
                className={cn(
                  buttonStyles({ variant: 'outline', size: 'sm' }),
                  'cursor-pointer',
                  'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-primary peer-focus-visible:outline-offset-1',
                )}
              >
                <span className="size-4">
                  <Icon name="upload" />
                </span>
                Replace
              </label>
            )}
          />
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <span className="size-4">
              <Icon name="close" />
            </span>
            Delete
          </Button>
        </div>
      ) : null}
    </div>
  )
}

/* ------------------------------- Progress -------------------------------- */

function UploadProgress({ job }: { job: UploadJob }) {
  const { cancel } = useUploads()
  const percent = Math.round(job.progress * 100)

  return (
    <div className="rounded-control border border-line bg-surface-alt px-2.5 py-1.5">
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-ui font-medium text-ink">{job.filename}</span>
        <span className="flex-none text-ui tabular-nums text-muted">{percent}%</span>
        <Button variant="ghost" size="sm" onClick={() => cancel(job.id)}>
          Cancel
        </Button>
      </div>

      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Uploading ${job.filename}`}
        className="mt-1.5 h-1 w-full overflow-hidden rounded-pill bg-line"
      >
        <div className="h-full rounded-pill bg-primary transition-[width] duration-200" style={{ width: `${percent}%` }} />
      </div>

      {/* Says the quiet part out loud: this is the state where closing the tab
          loses the file, and the upload survives moving around the admin. */}
      <p className="mt-1 text-ui text-muted">
        {percent < 100
          ? 'Uploading — you can keep working, but don’t refresh or close this tab.'
          : 'Finishing up…'}
      </p>
    </div>
  )
}

