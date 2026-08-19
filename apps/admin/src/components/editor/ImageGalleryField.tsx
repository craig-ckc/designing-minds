import { useState, type DragEvent } from 'react'
import { cn } from '@designing-minds/utils'
import type { ProductImage } from '@designing-minds/cms'
import { formatBytes } from '../../lib/upload-transport'
import { useFieldUploads, useUploadTarget, useUploads, type UploadJob } from '../../lib/uploads'
import { Icon } from '../ui'
import { Button, FileInput, Input } from '../primitives'

/**
 * The preview images shown on a record's Product Detail.
 *
 * The plural sibling of FileListField, and deliberately its opposite: that
 * field holds one paid artefact and hides its drop zone the moment the slot is
 * taken, because a second purchased file is not a state it can be in. A gallery
 * has no such ceiling — the drop zone stays for as long as the editor wants to
 * add more, which is the Webflow multi-image field's behaviour and the reason
 * `multiple` is set on the picker and a whole dropped selection is queued.
 *
 * Thumbnails rather than filenames: these are pictures, and an editor deciding
 * what a shopper sees first is comparing images, not names. "IMG_4021.jpg"
 * tells them nothing.
 *
 * ORDER IS CONTENT. The array order is the order a visitor pages through, so
 * moving an image is an edit, not a view preference. Reordering is done with
 * Move buttons rather than dragging: a drag is unreachable by keyboard and
 * fiddly on a laptop trackpad, and this is a rearrangement of a short list, not
 * a canvas. The generated cover is always the visitor's first slide and is not
 * in this list, so position 1 here is the second thing they see.
 *
 * Uploads run through the shared background queue, so leaving the editor does
 * not cancel them and progress is per image — an editor dropping eight photos
 * can watch them land one at a time instead of guessing.
 */
export function ImageGalleryField({
  collectionId,
  recordId,
  fieldKey,
  images,
  onChange,
  disabled,
  labelId,
}: {
  collectionId: string
  recordId: string
  fieldKey: string
  images: ProductImage[]
  /** Accepts an updater so concurrent uploads can't overwrite each other. */
  onChange: (update: (current: ProductImage[]) => ProductImage[]) => void
  disabled?: boolean
  labelId: string
}) {
  const { start } = useUploads()
  const jobs = useFieldUploads(collectionId, recordId, fieldKey)
  const [dragActive, setDragActive] = useState(false)

  // While this editor is open, finished uploads land in the draft rather than
  // being written straight to the record. A gallery only ever appends — there is
  // no Replace here, so nothing to reconcile against an existing entry.
  useUploadTarget<ProductImage>(collectionId, recordId, fieldKey, (image) => {
    onChange((current) => [...current, image])
  })

  const queue = (selected: FileList | File[] | null) => {
    // Every picked file, not just the first: queueing the whole selection is the
    // entire point of this field.
    for (const file of [...(selected ?? [])]) {
      start({ collectionId, recordId, fieldKey, purpose: 'gallery', file })
    }
  }

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setDragActive(false)
    if (disabled) return
    queue(event.dataTransfer.files)
  }

  const patchImage = (id: string, changes: Partial<ProductImage>) =>
    onChange((current) => current.map((entry) => (entry.id === id ? { ...entry, ...changes } : entry)))

  const move = (id: string, delta: -1 | 1) =>
    onChange((current) => {
      const from = current.findIndex((entry) => entry.id === id)
      const to = from + delta
      if (from < 0 || to < 0 || to >= current.length) return current
      const next = [...current]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })

  const active = jobs.filter((job) => job.status === 'uploading')
  const failed = jobs.filter((job) => job.status === 'error')

  return (
    // A gallery is many controls, not one input, so it is announced as a
    // labelled group rather than pointing a <label> at something invisible.
    <div role="group" aria-labelledby={labelId} className="grid gap-2.5">
      {images.length > 0 ? (
        <ul className="grid gap-2.5 sm:grid-cols-2">
          {images.map((image, index) => (
            <li key={image.id}>
              <ImageCard
                image={image}
                position={index + 1}
                total={images.length}
                disabled={disabled}
                onAltChange={(alt) => patchImage(image.id, { alt })}
                onMove={(delta) => move(image.id, delta)}
                onDelete={() => onChange((current) => current.filter((entry) => entry.id !== image.id))}
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

      {failed.map((job) => (
        <FailedUpload key={job.id} job={job} />
      ))}

      {!disabled ? (
        <FileInput
          label="Upload preview images"
          accept="image/*"
          multiple
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
                // The input is a sibling, so `focus-within` never sees it.
                'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-primary peer-focus-visible:outline-offset-1',
                dragActive ? 'border-primary bg-primary-tint' : 'border-line-strong bg-surface-alt hover:border-primary',
              )}
            >
              <span className="grid h-8 w-8 place-items-center rounded-pill bg-surface text-ink-soft">
                <span className="h-4 w-4">
                  <Icon name="upload" />
                </span>
              </span>
              <span className="text-[0.85rem] font-medium text-ink">
                {dragActive
                  ? 'Drop to upload'
                  : images.length > 0
                    ? 'Drag & drop more images here'
                    : 'Drag & drop images here'}
              </span>
              <span className="text-[0.8rem] text-muted">
                or <span className="font-medium text-primary">click to browse</span> — you can pick several at once
              </span>
            </label>
          )}
        />
      ) : images.length === 0 && active.length === 0 ? (
        <p className="text-[0.85rem] text-muted">No preview images.</p>
      ) : null}
    </div>
  )
}

/* ------------------------------- One image ------------------------------ */

function ImageCard({
  image,
  position,
  total,
  disabled,
  onAltChange,
  onMove,
  onDelete,
}: {
  image: ProductImage
  position: number
  total: number
  disabled?: boolean
  onAltChange: (alt: string) => void
  onMove: (delta: -1 | 1) => void
  onDelete: () => void
}) {
  const size = formatBytes(image.sizeBytes)
  const dimensions = image.width && image.height ? `${image.width}×${image.height}` : null
  const altId = `${image.id}:alt`

  return (
    <div className="grid gap-0 overflow-hidden rounded-control border border-line bg-surface">
      {/* Fixed ratio so a column of mixed portrait and landscape uploads stays a
          tidy grid; `contain` because a preview is for recognising the image,
          and cropping it here would hide the part the editor is judging. */}
      <div className="relative aspect-[4/3] bg-ph">
        <img
          src={image.url}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-contain"
        />
        <span className="absolute left-2 top-2 rounded-pill bg-surface/90 px-2 py-0.5 text-[0.75rem] font-medium tabular-nums text-ink">
          {position} of {total}
        </span>
      </div>

      <div className="grid gap-2 p-3">
        <span className="grid gap-0.5">
          <span className="truncate text-[0.9rem] font-medium text-ink">{image.filename}</span>
          <span className="truncate text-[0.8rem] text-muted">
            {[size, dimensions].filter(Boolean).join(' · ') || 'Stored'}
          </span>
        </span>

        {!disabled ? (
          <>
            {/* Alt text belongs to the image, not the record: it describes this
                picture, so it is edited here rather than in a field far away. */}
            <label htmlFor={altId} className="text-[0.8rem] font-medium text-ink-soft">
              Alt text
            </label>
            <Input
              id={altId}
              value={image.alt}
              placeholder="Describe what this image shows"
              onChange={(event) => onAltChange(event.target.value)}
            />

            <div className="flex flex-wrap items-center gap-2 border-t border-line pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={position === 1}
                aria-label={`Move ${image.filename} earlier`}
                onClick={() => onMove(-1)}
              >
                <span className="h-3.5 w-3.5">
                  <Icon name="back" />
                </span>
                Earlier
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={position === total}
                aria-label={`Move ${image.filename} later`}
                onClick={() => onMove(1)}
              >
                Later
                <span className="h-3.5 w-3.5">
                  <Icon name="arrow" />
                </span>
              </Button>
              <Button variant="ghost" size="sm" aria-label={`Remove ${image.filename}`} onClick={onDelete}>
                <span className="h-3.5 w-3.5">
                  <Icon name="close" />
                </span>
                Remove
              </Button>
            </div>
          </>
        ) : (
          <p className="text-[0.8rem] text-muted">{image.alt || 'No alt text.'}</p>
        )}
      </div>
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
