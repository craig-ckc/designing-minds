import { useState, type DragEvent } from 'react'
import { cn } from '@designing-minds/utils'
import type { ProductFile } from '@designing-minds/cms'
import { formatBytes } from '../../lib/upload-transport'
import { useFieldUploads, useUploadTarget, useUploads, type UploadJob } from '../../lib/uploads'
import { Icon } from '../ui'
import { Button, buttonStyles, FileInput } from '../primitives'

/**
 * The file attached to a record.
 *
 * A product carries exactly ONE file. Modelled on the Webflow asset field:
 * while the slot is empty it is a drop zone, and the moment a file lands the
 * zone is gone — the only moves left are Replace and Delete. There is no "add
 * another", because a second file is not a state this field can be in.
 *
 * Replacing swaps the bytes behind the same entry id, so the download
 * entitlement and anything else pointing at that file follows the new upload.
 *
 * The value is still stored as an array (`purchasedFiles`), so a record that
 * somehow holds more than one — legacy data — shows all of them rather than
 * hiding files a buyer may already have paid for. It just never offers to add.
 *
 * Uploads run through the background queue: leaving this editor doesn't cancel
 * them, and a file that lands while you're elsewhere is written through rather
 * than lost. Progress is explicit so nobody closes the tab on a half-sent file.
 */
export function FileListField({
  collectionId,
  recordId,
  fieldKey,
  label,
  files,
  onChange,
  disabled,
  labelId,
}: {
  collectionId: string
  recordId: string
  fieldKey: string
  label: string
  files: ProductFile[]
  /** Accepts an updater so concurrent uploads can't overwrite each other. */
  onChange: (update: (current: ProductFile[]) => ProductFile[]) => void
  disabled?: boolean
  labelId: string
}) {
  const { start } = useUploads()
  const jobs = useFieldUploads(collectionId, recordId, fieldKey)
  const [dragActive, setDragActive] = useState(false)

  // While this editor is open, finished uploads land in the draft rather than
  // being written straight to the record.
  useUploadTarget(collectionId, recordId, fieldKey, (file, replacesFileId) => {
    onChange((current) =>
      replacesFileId
        ? current.map((entry) => (entry.id === replacesFileId ? { ...file, label: entry.label } : entry))
        : [...current, file],
    )
  })

  // One file, so only ever the first of a selection or a multi-file drop.
  const queue = (selected: FileList | File[] | null, replacesFileId?: string) => {
    const file = [...(selected ?? [])][0]
    if (!file) return
    start({ collectionId, recordId, fieldKey, file, replacesFileId })
  }

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setDragActive(false)
    if (disabled) return
    queue(event.dataTransfer.files)
  }

  const active = jobs.filter((job) => job.status === 'uploading')
  // The slot is taken once a file is there or one is on its way, and an
  // occupied slot offers Replace — never a second upload.
  const slotFilled = files.length > 0 || active.length > 0

  return (
    // A file list has no single focusable control, so it is announced as a
    // labelled group rather than pointing a <label> at something invisible.
    <div role="group" aria-labelledby={labelId} className="grid gap-2.5">
      {files.length > 0 ? (
        <ul className="grid gap-2.5">
          {files.map((file) => (
            <li key={file.id}>
              <FileCard
                file={file}
                disabled={disabled}
                onReplace={(picked) => queue(picked, file.id)}
                onDelete={() => onChange((current) => current.filter((entry) => entry.id !== file.id))}
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
          <FailedUpload key={job.id} job={job} />
        ))}

      {!disabled && !slotFilled ? (
        <FileInput
          label={`Upload the ${label.toLowerCase()}`}
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
                'flex cursor-pointer flex-col items-center justify-center gap-1 rounded-control border-2 border-dashed px-4 py-5 text-center transition',
                'focus-within:outline focus-within:outline-2 focus-within:outline-primary focus-within:outline-offset-1',
                dragActive ? 'border-primary bg-primary-tint' : 'border-line-strong bg-surface-alt hover:border-primary',
              )}
            >
              <span className="grid h-8 w-8 place-items-center rounded-pill bg-surface text-ink-soft">
                <span className="h-4 w-4">
                  <Icon name="upload" />
                </span>
              </span>
              <span className="text-[0.85rem] font-medium text-ink">
                {dragActive ? 'Drop to upload' : 'Drag & drop a file here'}
              </span>
              <span className="text-[0.8rem] text-muted">
                or <span className="font-medium text-primary">click to browse</span>
              </span>
            </label>
          )}
        />
      ) : files.length === 0 && active.length === 0 ? (
        <p className="text-[0.85rem] text-muted">No file attached.</p>
      ) : null}
    </div>
  )
}

/* ------------------------------- One file ------------------------------- */

function FileCard({
  file,
  disabled,
  onReplace,
  onDelete,
}: {
  file: ProductFile
  disabled?: boolean
  onReplace: (picked: FileList | null) => void
  onDelete: () => void
}) {
  const size = formatBytes(file.sizeBytes)

  return (
    <div className="rounded-control border border-line bg-surface">
      <div className="flex items-start gap-3 p-3">
        <span className="grid h-11 w-11 flex-none place-items-center rounded-control bg-ph text-ph-glyph">
          <span className="h-5 w-5">
            <Icon name="doc" />
          </span>
        </span>
        <span className="grid min-w-0 flex-1 gap-0.5">
          <span className="truncate text-[0.9rem] font-medium text-ink">{file.filename}</span>
          <span className="truncate text-[0.8rem] text-muted">
            {[size, file.contentType].filter(Boolean).join(' · ') || 'Stored'}
          </span>
          {!file.storageKey ? (
            <span className="text-[0.8rem] text-warn">Not stored yet — re-upload this file.</span>
          ) : null}
        </span>
      </div>

      {!disabled ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-line px-3 py-2">
          {/* Replace, not "upload again": the entry keeps its id so anything
              already pointing at this file follows the new bytes.

              A plain <label> wearing the button styling, not a Base UI Button:
              the label's own activation is what opens the picker, and routing
              it through a non-native button would add a competing role and key
              handler on top of it. */}
          <FileInput
            label={`Replace ${file.filename}`}
            onFiles={onReplace}
            render={(labelProps) => (
              <label {...labelProps} className={cn(buttonStyles({ variant: 'outline', size: 'sm' }), 'cursor-pointer')}>
                <span className="h-3.5 w-3.5">
                  <Icon name="upload" />
                </span>
                Replace
              </label>
            )}
          />
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <span className="h-3.5 w-3.5">
              <Icon name="close" />
            </span>
            Delete
          </Button>
        </div>
      ) : null}
    </div>
  )
}

/* ------------------------------- Progress ------------------------------- */

function UploadProgress({ job }: { job: UploadJob }) {
  const { cancel } = useUploads()
  const percent = Math.round(job.progress * 100)

  return (
    <div className="rounded-control border border-line bg-surface-alt px-3 py-2.5">
      <div className="flex items-center gap-3">
        <span className="min-w-0 flex-1 truncate text-[0.85rem] font-medium text-ink">{job.filename}</span>
        <span className="flex-none text-[0.8rem] tabular-nums text-muted">{percent}%</span>
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
        className="mt-2 h-1.5 w-full overflow-hidden rounded-pill bg-line"
      >
        <div className="h-full rounded-pill bg-primary transition-[width] duration-200" style={{ width: `${percent}%` }} />
      </div>

      {/* Says the quiet part out loud: this is the state where closing the tab
          loses the file, and the upload survives moving around the admin. */}
      <p className="mt-1.5 text-[0.78rem] text-muted">
        {percent < 100
          ? 'Uploading — you can keep working, but don’t refresh or close this tab.'
          : 'Finishing up…'}
      </p>
    </div>
  )
}

function FailedUpload({ job }: { job: UploadJob }) {
  const { dismiss } = useUploads()
  return (
    <div className="flex items-start gap-3 rounded-control border border-danger bg-danger-tint px-3 py-2.5">
      <span className="min-w-0 flex-1 text-[0.85rem] text-danger">
        <span className="font-medium">{job.filename}</span> — {job.error ?? 'Upload failed.'}
      </span>
      <Button variant="ghost" size="sm" onClick={() => dismiss(job.id)}>
        Dismiss
      </Button>
    </div>
  )
}
