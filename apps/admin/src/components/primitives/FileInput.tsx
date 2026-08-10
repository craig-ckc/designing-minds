import { useId, type ReactNode } from 'react'
import { cn } from '@designing-minds/utils'

/**
 * File picking, in one place.
 *
 * There is no accessible way to style a file picker directly, so every
 * implementation ends up pairing a hidden input with something else — which is
 * exactly why it should exist once rather than be re-derived per call site.
 *
 * The trigger is a `<label htmlFor>`, not a scripted `.click()`: the browser
 * opens the picker natively, and the visually-hidden input stays in the tab
 * order so keyboard users reach the real control instead of a fake one.
 * `render` receives the props to spread onto whatever plays the label.
 *
 * The input is hidden with `position: fixed`, NOT the usual `sr-only`.
 * `sr-only` is `position: absolute`, so inside this `display: contents`
 * wrapper the input resolved against the nearest positioned ancestor — the
 * workspace `<main>` — and got laid out wherever it happened to sit in the
 * scrolled field list, hundreds of pixels below the shell's box. That made the
 * `h-screen overflow-hidden` shell scrollable, and activating the label focuses
 * the input, so the browser scrolled the entire app out of view to reveal it.
 * With no scrollbar there was no way to scroll back: the admin looked like it
 * had vanished, leaving only the sticky top bar. Fixed positioning keeps the
 * input focusable and off-screen while contributing nothing to any ancestor's
 * scroll height, so there is never anything to scroll to.
 */
export function FileInput({
  onFile,
  onFiles,
  accept,
  multiple,
  disabled,
  label,
  render,
  className,
}: {
  /** Single-file callback. Use `onFiles` when `multiple` is set. */
  onFile?: (file: File) => void
  /** Receives the whole selection, so several files can be queued at once. */
  onFiles?: (files: FileList | null) => void
  accept?: string
  multiple?: boolean
  disabled?: boolean
  /** Accessible name for the input, e.g. "CSV file". */
  label: string
  render: (labelProps: { htmlFor: string }) => ReactNode
  className?: string
}) {
  const id = useId()

  return (
    <span className={cn('contents', className)}>
      {/* Before the label, so the label can show the input's focus ring with
          `peer-focus-visible:` — a sibling selector only reaches forwards. */}
      <input
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="peer fixed left-0 top-0 h-px w-px opacity-0 pointer-events-none"
        aria-label={label}
        onChange={(event) => {
          const { files } = event.target
          const first = files?.[0]
          // Reset first so re-picking the same file still fires a change.
          const reset = () => {
            event.target.value = ''
          }
          if (onFiles) {
            onFiles(files)
            reset()
            return
          }
          reset()
          if (first) onFile?.(first)
        }}
      />
      {render({ htmlFor: id })}
    </span>
  )
}
