import { useState, type DragEvent } from 'react'
import type { ProductImage } from '@designing-minds/cms'
import { formatBytes } from '../../lib/upload-transport'
import { useFieldUploads, useUploadTarget, useUploads, type UploadJob } from '../../lib/uploads'
import { cn } from '../../design'
import { Icon } from '../ui'
import { Button, FileInput } from '../primitives'

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
    <div role="group" aria-labelledby={labelId} className="grid gap-2">
      {images.length > 0 ? (
        /* The gallery sizes itself against THIS list, not the viewport: the
           editor pane is whatever is left after the sidebar and the record
           list, so `sm:` was asking the wrong question and answering it with
           two columns whether the pane was 640px or 2000px wide.

           The `@container` deliberately wraps only the list. It resolves to
           `contain: layout`, which makes the element a containing block for
           fixed-position descendants — and the drop zone below is a FileInput,
           whose hidden input is `position: fixed` precisely so it contributes
           nothing to any ancestor's scroll height (see FileInput's comment for
           the app-scrolls-out-of-view bug that caused). Containing it here
           would bring that back.

           Rungs are set by card width, not by taste: each step keeps a card
           above ~135px, which is what a truncated filename and the row of
           three 24px icon buttons need. (They used to be set around the
           alt-text input at ~185px — that input has since been hidden, which
           is what lets eight columns arrive at 1152px instead of 1560px.) */
        <div className="@container">
          <ul className="grid gap-2 grid-cols-1 @sm:grid-cols-2 @xl:grid-cols-4 @4xl:grid-cols-6 @6xl:grid-cols-8">
            {images.map((image, index) => (
              <li key={image.id}>
                <ImageCard
                  image={image}
                  position={index + 1}
                  total={images.length}
                  disabled={disabled}
                  onMove={(delta) => move(image.id, delta)}
                  onDelete={() => onChange((current) => current.filter((entry) => entry.id !== image.id))}
                />
              </li>
            ))}
          </ul>
        </div>
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
                {dragActive
                  ? 'Drop to upload'
                  : images.length > 0
                    ? 'Drag & drop more images here'
                    : 'Drag & drop images here'}
              </span>
              <span className="text-ui text-muted">
                or <span className="font-medium text-primary">click to browse</span> — you can pick several at once
              </span>
            </label>
          )}
        />
      ) : images.length === 0 && active.length === 0 ? (
        <p className="text-ui text-muted">No preview images.</p>
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
  onMove,
  onDelete,
}: {
  image: ProductImage
  position: number
  total: number
  disabled?: boolean
  onMove: (delta: -1 | 1) => void
  onDelete: () => void
}) {
  const size = formatBytes(image.sizeBytes)
  const dimensions = image.width && image.height ? `${image.width}×${image.height}` : null

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
        <span className="absolute left-2 top-2 rounded-pill bg-surface/90 px-1.5 py-0 text-meta font-medium tabular-nums text-ink">
          {position} of {total}
        </span>
        {/* Alt text is hidden from this field for now, so every image ships
            without one — which is exactly what `alt: ''` means to the website:
            decorative. Said per image rather than once for the field, so that
            when alt text comes back this badge becomes the real distinction
            between an image that has one and an image that doesn't. */}
        <span className="absolute bottom-2 left-2 rounded-pill bg-surface/90 px-1.5 py-0 text-meta font-medium text-muted">
          Decorative
        </span>
      </div>

      <div className="grid gap-1.5 p-2.5">
        <span className="truncate text-ui font-medium text-ink">{image.filename}</span>
        <span className="truncate text-ui text-muted">
          {[size, dimensions].filter(Boolean).join(' · ') || 'Stored'}
        </span>

        {/* Reorder and remove on one row, icon-only.

            The labelled buttons ("Earlier" / "Later" / "Remove") needed ~220px
            and wrapped onto two lines at every column count above two, so most
            of a card's height went to three words. `title` carries what the
            label used to say for anyone hovering; `aria-label` already carried
            it for everyone else, so nothing is lost to a screen reader.

            Remove sits apart, pushed right: it is destructive and should not be
            adjacent to the two buttons an editor presses repeatedly. */}
        {!disabled ? (
          <div className="flex items-center gap-0.5 border-t border-line pt-1.5">
            <Button
              variant="outline"
              size="icon"
              disabled={position === 1}
              title="Move earlier"
              aria-label={`Move ${image.filename} earlier`}
              onClick={() => onMove(-1)}
            >
              <span className="size-4">
                <Icon name="back" />
              </span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={position === total}
              title="Move later"
              aria-label={`Move ${image.filename} later`}
              onClick={() => onMove(1)}
            >
              <span className="size-4">
                <Icon name="arrow" />
              </span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto"
              title="Remove"
              aria-label={`Remove ${image.filename}`}
              onClick={onDelete}
            >
              <span className="size-4">
                <Icon name="close" />
              </span>
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

/* ------------------------------- Progress ------------------------------- */

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

      <p className="mt-1 text-ui text-muted">
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
    <div className="flex items-start gap-2 rounded-control border border-danger bg-danger-tint px-2.5 py-1.5">
      <span className="min-w-0 flex-1 text-ui text-danger">
        <span className="font-medium">{job.filename}</span> — {job.error ?? 'Upload failed.'}
      </span>
      <Button variant="ghost" size="sm" onClick={() => dismiss(job.id)}>
        Dismiss
      </Button>
    </div>
  )
}
