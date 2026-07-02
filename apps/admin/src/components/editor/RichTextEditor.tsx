import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from '@tiptap/markdown'
import { cn } from '@designing-minds/utils'

/**
 * Webflow-style rich text field backed by Markdown: the editing surface is
 * WYSIWYG (TipTap), but every change is serialised to Markdown and stored on
 * the record as a plain string, which the public website renders back into
 * real elements (headings, lists, dividers).
 */
export function RichTextEditor({
  value,
  onChange,
  disabled,
  id,
}: {
  value: string
  onChange: (markdown: string) => void
  disabled?: boolean
  id?: string
}) {
  const editor = useEditor({
    extensions: [StarterKit, Markdown],
    content: value,
    contentType: 'markdown',
    editable: !disabled,
    onUpdate: ({ editor: current }) => onChange(current.getMarkdown()),
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        class: 'tiptap min-h-[180px] px-3.5 py-2.5',
        role: 'textbox',
        'aria-multiline': 'true',
      },
    },
  })

  return (
    <div
      className={cn(
        'rich-text overflow-hidden rounded-md border border-line-strong bg-surface',
        'focus-within:outline focus-within:outline-2 focus-within:outline-ink focus-within:-outline-offset-1',
        disabled && 'opacity-70',
      )}
    >
      {!disabled ? <Toolbar editor={editor} /> : null}
      <EditorContent editor={editor} />
    </div>
  )
}

/* ------------------------------- Toolbar ------------------------------- */

function ToolButton({
  label,
  title,
  active,
  onClick,
  className,
}: {
  label: string
  title: string
  active?: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      // Keep focus in the editor so marks apply to the current selection.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        'grid h-7 min-w-7 place-items-center rounded px-1.5 text-[0.8rem] font-medium text-ink-soft transition',
        'hover:bg-surface-alt hover:text-ink',
        active && 'bg-ink text-white hover:bg-ink hover:text-white',
        className,
      )}
    >
      {label}
    </button>
  )
}

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null
  const chain = () => editor.chain().focus()

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-line bg-surface-alt/60 px-2 py-1.5">
      {([1, 2, 3] as const).map((level) => (
        <ToolButton
          key={level}
          label={`H${level}`}
          title={`Heading ${level}`}
          active={editor.isActive('heading', { level })}
          onClick={() => chain().toggleHeading({ level }).run()}
        />
      ))}
      <span className="mx-1 h-4 w-px bg-line" />
      <ToolButton label="B" title="Bold" active={editor.isActive('bold')} onClick={() => chain().toggleBold().run()} />
      <ToolButton
        label="I"
        title="Italic"
        active={editor.isActive('italic')}
        onClick={() => chain().toggleItalic().run()}
        className="italic"
      />
      <span className="mx-1 h-4 w-px bg-line" />
      <ToolButton
        label="• List"
        title="Bullet list"
        active={editor.isActive('bulletList')}
        onClick={() => chain().toggleBulletList().run()}
      />
      <ToolButton
        label="1. List"
        title="Numbered list"
        active={editor.isActive('orderedList')}
        onClick={() => chain().toggleOrderedList().run()}
      />
      <span className="mx-1 h-4 w-px bg-line" />
      <ToolButton
        label="❝"
        title="Quote"
        active={editor.isActive('blockquote')}
        onClick={() => chain().toggleBlockquote().run()}
      />
      <ToolButton label="—" title="Divider" onClick={() => chain().setHorizontalRule().run()} />
    </div>
  )
}
