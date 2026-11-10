import { useEffect, useState, type ComponentProps } from 'react'
import type { RichTextEditor } from './RichTextEditor'
import { Button, Textarea } from '../primitives'

type EditorComponent = typeof RichTextEditor
type EditorProps = ComponentProps<EditorComponent>
const loadEditor = () => import('./RichTextEditor').then((module) => module.RichTextEditor)

/** Loads formatting tools only when a record needs them, keeping its draft in the parent. */
export function DeferredRichTextEditor({ load = loadEditor, ...props }: EditorProps & {
  load?: () => Promise<EditorComponent>
}) {
  const [Editor, setEditor] = useState<EditorComponent | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    void Promise.resolve().then(() => cancelled ? undefined : load()).then(
      (loaded) => { if (loaded && !cancelled) setEditor(() => loaded) },
      () => { if (!cancelled) setFailed(true) },
    )
    return () => { cancelled = true }
  }, [load, attempt])

  if (Editor) return <Editor {...props} />
  if (failed) {
    return (
      <div className="grid gap-2">
        <p role="status" className="text-ui text-ink-soft">
          The formatted editor could not load. You can edit Markdown below or retry.
        </p>
        <Textarea id={props.id} aria-labelledby={props['aria-labelledby']} disabled={props.disabled}
          value={props.value} onChange={(event) => props.onChange(event.target.value)} className="min-h-[140px]" />
        <Button className="justify-self-start" onClick={() => { setFailed(false); setAttempt((value) => value + 1) }}>
          Retry formatted editor
        </Button>
      </div>
    )
  }
  return (
    <div role="status" className="min-h-[140px] rounded-control border border-line px-2.5 py-2 text-ui text-muted">
      Loading editor…
    </div>
  )
}
