import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(new URL(`../../apps/admin/src/${path}`, import.meta.url), 'utf8')

/**
 * Source with comments removed. Needed whenever a test asserts something is
 * *absent*: these files explain their own decisions in prose that quotes the
 * code being discussed, and a bare `doesNotMatch` reads the explanation as the
 * thing itself. (Same helper as tests/admin/selection-and-delete.test.ts.)
 */
const readCode = (path: string) =>
  read(path)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

/** Returns the substring from `openParenIndex` (which must point at a `(`) up to and
 * including its matching close paren. Used to isolate one JSX ternary branch from
 * another when they sit inside the same ` ? ( … ) : ( … )` expression.
 * (Same helper as tests/admin/selection-and-delete.test.ts.) */
function sliceBalanced(source: string, openParenIndex: number): string {
  let depth = 0
  for (let i = openParenIndex; i < source.length; i++) {
    if (source[i] === '(') depth++
    else if (source[i] === ')') {
      depth--
      if (depth === 0) return source.slice(openParenIndex, i + 1)
    }
  }
  throw new Error(`unbalanced parens from index ${openParenIndex}`)
}

const editor = readCode('components/editor/RecordEditor.tsx')
const workspace = readCode('screens/AdminWorkspace.tsx')

/** Isolates the `{editable && !isNew ? ( … ) : null}` actions block that follows
 * the mapped sections — not the `{editable ? (` ternary in the header
 * (Save vs. "Read only"), which sits earlier in the same file. */
function actionsBlock(): string {
  const afterSections = editor.indexOf('visibleSections.map(')
  assert.ok(afterSections >= 0, 'expected RecordEditor to map over visibleSections')
  const marker = '{editable && !isNew ? ('
  const gateIdx = editor.indexOf(marker, afterSections)
  assert.ok(gateIdx >= 0, 'expected an `{editable && !isNew ? (` gate after the mapped sections')
  return sliceBalanced(editor, gateIdx + marker.length - 1)
}

/* =========================================================================
   Shape — one untitled block, at the bottom, inside the ScrollArea, gated on
   editable.
   ========================================================================= */

test('the three record actions live in one untitled block after the mapped sections, still inside the ScrollArea', () => {
  const afterSections = editor.indexOf('visibleSections.map(')
  const block = actionsBlock()
  const blockIdx = editor.indexOf(block, afterSections)
  const scrollAreaEnd = editor.indexOf('</ScrollArea>')
  assert.ok(blockIdx > afterSections, 'the actions block should come after the mapped sections')
  assert.ok(blockIdx < scrollAreaEnd, 'the actions block should still be inside the ScrollArea')

  // No <EditorSection>, and therefore no title — every section above this one
  // has a heading, and this one deliberately doesn't.
  assert.doesNotMatch(block, /<EditorSection/)
  assert.doesNotMatch(block, /<h3/)

  // Matches the section rhythm anyway: full-bleed padding, top hairline as
  // the divider, exactly like the EditorSections above it.
  assert.match(block, /border-t border-line px-4 py-4/)
})

test('the whole block is gated on the record being editable', () => {
  // sliceBalanced already anchored on `{editable ? (` to find this block; this
  // just names the requirement so a future refactor that changes the gate
  // (e.g. to `canWrite` alone) fails somewhere obvious instead of silently.
  const marker = '{editable && !isNew ? ('
  const afterSections = editor.indexOf('visibleSections.map(')
  assert.ok(editor.indexOf(marker, afterSections) >= 0)
})

test('RecordEditor computes `deletable` the same way AdminWorkspace already does, so the editor never offers a Delete the list would refuse', () => {
  const line = 'const deletable = editable && isDeletable(collection.id)'
  assert.ok(editor.includes(line), 'RecordEditor should mirror AdminWorkspace\'s own `deletable` computation')
  assert.ok(workspace.includes(line))
  assert.match(editor, /import \{ isDeletable \} from '\.\.\/\.\.\/cms\/adapter'/)
})

/* =========================================================================
   Duplicate on the left; Delete pushed right — same reasoning as the gallery
   card's Remove button. There is no Unpublish here any more: status lives in
   one control, the header's save menu (Archive replaces Unpublish).
   ========================================================================= */

test('Duplicate comes first; Delete is last and carries ml-auto', () => {
  const block = actionsBlock()
  const duplicateIdx = block.indexOf('onClick={onDuplicate}')
  const deleteMlAutoIdx = block.indexOf('ml-auto')
  assert.ok(duplicateIdx >= 0 && deleteMlAutoIdx >= 0)
  assert.ok(duplicateIdx < deleteMlAutoIdx, 'Duplicate should come before the ml-auto Delete button')
})

test('the action block offers no status change of its own', () => {
  const block = actionsBlock()
  assert.doesNotMatch(block, /onSaveAs|statusLabels|verbOff|Unpublish/)
})

test('Delete is styled exactly like RecordsToolbar\'s Delete, so the two agree', () => {
  const block = actionsBlock()
  assert.match(block, /className="ml-auto border-danger\/40 text-danger hover:border-danger hover:text-danger"/)
  const toolbar = read('components/workspace/RecordsToolbar.tsx')
  assert.match(toolbar, /className="border-danger\/40 text-danger hover:border-danger hover:text-danger"/)
})

test('every button in the block is outline/sm, and Delete carries the trash icon that already exists', () => {
  const block = actionsBlock()
  const buttonOpenings = [...block.matchAll(/<Button\b[^>]*/gs)]
  assert.ok(buttonOpenings.length >= 2, 'expected at least Duplicate and Delete')
  for (const [opening] of buttonOpenings) {
    assert.match(opening, /variant="outline"/)
    assert.match(opening, /size="sm"/)
  }
  assert.match(block, /<Icon name="trash" \/>/)
})

/* =========================================================================
   Delete — confirmation first, framed as permanent, one named record.
   ========================================================================= */

test('Delete opens a confirmation dialog rather than deleting on click', () => {
  const block = actionsBlock()
  assert.match(block, /onClick=\{\(\) => setConfirmDelete\(true\)\}/)
})

test('the confirmation is wired so the actual delete only ever happens from onConfirm', () => {
  // handleDelete should appear exactly twice: once where it's defined, once
  // where the dialog invokes it. If it showed up anywhere else, some other
  // control could delete without going through the dialog at all.
  const handleDeleteRefs = [...editor.matchAll(/handleDelete/g)].length
  assert.equal(handleDeleteRefs, 2, 'handleDelete should be defined once and invoked once, from onConfirm')
  assert.match(editor, /onConfirm=\{\(\) => void handleDelete\(\)\}/)
})

test('the dialog is worded for one named record and says the action is permanent', () => {
  assert.match(editor, /title=\{`Delete "\$\{getRecordTitle\(collection, record\)\}"\?`\}/)
  assert.match(editor, /description="This cannot be undone\."/)
  assert.match(editor, /confirmLabel=\{`Permanently delete this \$\{collection\.singular\.toLowerCase\(\)\}`\}/)
})

test('a successful delete navigates back to the list; a failed one leaves the editor where it was', () => {
  assert.match(editor, /if \(await onDelete\(\)\) onBack\(\)/)
})

test('deleteThisRecord in AdminWorkspace targets a stable id and reuses the same onDelete the bulk case uses', () => {
  assert.match(
    workspace,
    /const deleteThisRecord = \(\): Promise<boolean> => onDelete\(collection, \[initial\.id\]\)/,
  )
  // Threaded through from AdminWorkspace's own onDelete prop, not a second
  // implementation of deletion.
  assert.match(workspace, /onDelete: DeleteFn/)
  assert.match(workspace, /<RecordEditorPane[\s\S]*?onDelete=\{onDelete\}/)
})

/* =========================================================================
   Duplicate — gated on dirty, copies the saved baseline, never goes live.
   ========================================================================= */

test('Duplicate is disabled while the draft has unsaved changes, with a title explaining why', () => {
  const block = actionsBlock()
  assert.match(block, /onClick=\{onDuplicate\}/)
  assert.match(block, /disabled=\{saving \|\| dirty\}/)
  assert.match(block, /title=\{dirty \? 'Save your changes first' : undefined\}/)
})

function duplicateRecordFn(): string {
  const start = workspace.indexOf('const duplicateRecord = () => {')
  const end = workspace.indexOf('const deleteThisRecord')
  assert.ok(start >= 0 && end > start, 'expected a duplicateRecord function before deleteThisRecord')
  return workspace.slice(start, end)
}

test('duplicating copies the saved baseline, not the live draft', () => {
  const fn = duplicateRecordFn()
  assert.match(fn, /\{ \.\.\.baseline, id: crypto\.randomUUID\(\) \}/)
  // The `'draft'` STATUS literal is fine; the `draft` VARIABLE is not.
  assert.doesNotMatch(fn, /(?<!')\bdraft\b(?!')/, 'duplicateRecord should never read the live draft — only baseline')
})

test('duplicating gets its id the same way a brand new record does', () => {
  const fn = duplicateRecordFn()
  assert.match(fn, /crypto\.randomUUID\(\)/)
  // createBlank (the "new record" path) generates ids the same way — this is
  // the same mechanism, not a second id scheme.
  assert.match(read('cms/adapter.ts'), /const id = crypto\.randomUUID\(\)/)
})

test('the duplicate\'s title gets " (copy)" appended and its slug is made unique from that title', () => {
  const fn = duplicateRecordFn()
  assert.match(fn, /\(copy\)/)
  assert.match(fn, /setPath\(copy, collection\.titleField, title\)/)
  assert.match(fn, /uniqueSlug\(title, slugKey, records, copy\.id\)/)
  // Only when the collection actually has a slug field — faqs/testimonials
  // don't, and forcing one on them would invent a field that isn't there.
  assert.match(fn, /if \(slugKey\)/)
})

test('duplicating resets the status to Draft so a copy never goes live on its own', () => {
  const fn = duplicateRecordFn()
  assert.match(fn, /setPath\(copy, collection\.statusField, 'draft'\)/)
})

test('every editable catalogue collection keys its status as the four-state `status` field', () => {
  const registry = read('cms/registry.ts')
  const matches = [...registry.matchAll(/statusField: 'status'/g)]
  assert.equal(matches.length, 4, 'expected products, bundles, faqs and testimonials to all key status as `status`')
  assert.doesNotMatch(registry, /statusField: 'published'/)
})

/* =========================================================================
   Saving — there is no status-less Save for a record with a status. Every
   save names what should happen on the website.
   ========================================================================= */

test('the header saves through the save-as split button, never a plain Save, when the collection has a status', () => {
  assert.match(editor, /editable && hasStatus \? \(\s*<SaveAsButton/)
  assert.match(editor, /function SaveAsButton/)
  assert.match(editor, /SAVE_CHOICES/)
})

test('saveAs writes the chosen status and the edits in ONE save', () => {
  const start = workspace.indexOf('const saveAs = (status: SaveStatus) => {')
  const end = workspace.indexOf('const duplicateRecord')
  assert.ok(start >= 0 && end > start)
  const fn = workspace.slice(start, end)
  assert.match(fn, /persist\(setPath\(draft, collection\.statusField, status\)\)/)
})

test('the header no longer carries a Preview link', () => {
  assert.doesNotMatch(readCode('components/Shell.tsx'), /Preview/)
})

/* -------------------------------------------------------------------------
   The never-saved record. `/collection/new` renders the editor with
   `editable` true, so without this gate the action block appears for a row
   that does not exist on the server yet.
   ------------------------------------------------------------------------- */

test('the action block is hidden until the record has been saved once', () => {
  // Delete would hand the API an id it has never seen — the repository's
  // row-count check throws, so the user gets an error rather than a no-op, but
  // an error is still the wrong answer to pressing Delete on a blank form.
  // Duplicate would cheerfully produce a second "New product (copy)".
  const editor = readCode('components/editor/RecordEditor.tsx')
  assert.match(editor, /editable && !isNew \?/, 'the block must be gated on isNew as well as editable')
  assert.match(editor, /isNew: boolean/, 'RecordEditor should take the flag explicitly')
})

test('isNew comes from the route, not inferred from the record', () => {
  // The URL is the only thing that actually knows: a blank record built by
  // createBlank is indistinguishable from a saved one with empty fields.
  const workspace = readCode('screens/AdminWorkspace.tsx')
  assert.match(workspace, /isNew=\{recordId === 'new'\}/)
  assert.match(workspace, /isNew=\{isNew\}/, 'the pane should pass it straight through')
})
