import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from '@tiptap/markdown'
import { cn } from '@designing-minds/utils'
import { Toolbar, ToolbarSeparator, ToolbarToggle } from '../primitives'

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
        'rich-text overflow-hidden rounded-control border border-line-strong bg-surface',
        'focus-within:outline focus-within:outline-2 focus-within:outline-primary focus-within:-outline-offset-1',
        disabled && 'opacity-70',
      )}
    >
      {!disabled ? <EditorToolbar editor={editor} /> : null}
      <EditorContent editor={editor} />
    </div>
  )
}

/* ------------------------------- Toolbar ------------------------------- */

function EditorToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null
  const chain = () => editor.chain().focus()

  return (
    <Toolbar label="Text formatting">
      {([1, 2, 3] as const).map((level) => (
        <ToolbarToggle
          key={level}
          label={`Heading ${level}`}
          pressed={editor.isActive('heading', { level })}
          onPressed={() => chain().toggleHeading({ level }).run()}
        >
          H{level}
        </ToolbarToggle>
      ))}
      <ToolbarSeparator />
      <ToolbarToggle label="Bold" pressed={editor.isActive('bold')} onPressed={() => chain().toggleBold().run()}>
        B
      </ToolbarToggle>
      <ToolbarToggle
        label="Italic"
        pressed={editor.isActive('italic')}
        onPressed={() => chain().toggleItalic().run()}
        className="italic"
      >
        I
      </ToolbarToggle>
      <ToolbarSeparator />
      <ToolbarToggle
        label="Bullet list"
        pressed={editor.isActive('bulletList')}
        onPressed={() => chain().toggleBulletList().run()}
      >
        • List
      </ToolbarToggle>
      <ToolbarToggle
        label="Numbered list"
        pressed={editor.isActive('orderedList')}
        onPressed={() => chain().toggleOrderedList().run()}
      >
        1. List
      </ToolbarToggle>
      <ToolbarSeparator />
      <ToolbarToggle
        label="Quote"
        pressed={editor.isActive('blockquote')}
        onPressed={() => chain().toggleBlockquote().run()}
      >
        ❝
      </ToolbarToggle>
      {/* Not a state, just an action — never renders as pressed. */}
      <ToolbarToggle label="Divider" onPressed={() => chain().setHorizontalRule().run()}>
        —
      </ToolbarToggle>
    </Toolbar>
  )
}
