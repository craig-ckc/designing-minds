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
      {render({ htmlFor: id })}
      <input
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
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
    </span>
  )
}
