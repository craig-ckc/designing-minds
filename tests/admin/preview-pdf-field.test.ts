import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { rejectUpload } from '../../apps/admin/src/lib/upload-rules.ts'
import { buildCsv } from '../../apps/admin/src/cms/csv-io.ts'
import { collectionRegistry } from '../../apps/admin/src/cms/registry.ts'
import type { AdminRecord } from '../../apps/admin/src/cms/types.ts'

const read = (path: string) => readFileSync(new URL(`../../apps/admin/src/${path}`, import.meta.url), 'utf8')

/**
 * Source with comments removed. Needed whenever a test asserts something is
 * *absent*: these files explain their own decisions in prose that quotes the
 * code being removed, and a bare `doesNotMatch` reads the explanation as the
 * thing itself.
 */
const readCode = (path: string) =>
  read(path)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

const collection = (id: string) => {
  const found = collectionRegistry.find((entry) => entry.id === id)
  assert.ok(found, `expected a "${id}" collection in the registry`)
  return found
}

test('both catalogue collections expose the preview PDF in an editor section', () => {
  // /shop/<slug> serves products and bundles from one page, so a preview PDF
  // that existed on only one of them would be an inconsistency an editor runs into.
  for (const id of ['products', 'bundles']) {
    const entry = collection(id)
    const field = entry.fields.find((f) => f.key === 'previewPdfs')
    assert.ok(field, `${id} should carry a previewPdfs field`)
    assert.equal(field.type, 'previewPdfList')
    // A field absent from every section is invisible in the editor.
    const sections = entry.sections.filter((s) => s.fields.includes('previewPdfs'))
    assert.equal(sections.length, 1, `${id} should show previewPdfs in exactly one section`)
    assert.ok(sections[0].hint, `${id}'s preview PDF section should explain what it is for`)
    // The section trails the preview images section, mirroring the record shape.
    const galleryIndex = entry.sections.findIndex((s) => s.fields.includes('galleryImages'))
    const pdfIndex = entry.sections.findIndex((s) => s.fields.includes('previewPdfs'))
    assert.equal(pdfIndex, galleryIndex + 1, `${id}'s Preview PDF section should sit right after Preview images`)
  }
})

test('the preview PDF is not required, so an existing record stays saveable', () => {
  // Every published product/bundle predates this field. Marking it required
  // would make the whole catalogue unsaveable until someone uploaded a PDF.
  for (const id of ['products', 'bundles']) {
    const field = collection(id).fields.find((f) => f.key === 'previewPdfs')
    assert.ok(field)
    assert.notEqual(field.required, true)
  }
})

test('previewPdfs is left out of CSV entirely', () => {
  // A filename in a cell says nothing about where the bytes are, so exporting
  // one invites an import that silently drops or invents storage objects.
  const csv = buildCsv(collection('products'), [
    {
      id: 'p1',
      title: 'A resource',
      previewPdfs: [{ id: 'f1', label: 'Sample', url: 'https://example.test/a.pdf' }],
    } as AdminRecord,
  ])
  const header = csv.split('\n')[0]
  assert.doesNotMatch(header, /previewPdfs/)
  assert.doesNotMatch(csv, /example\.test/)
})

test('preview PDF uploads go to the public bucket, like gallery images', () => {
  const field = read('components/editor/PreviewPdfField.tsx')
  assert.match(field, /purpose: 'preview'/)
})

test('the field only accepts PDFs', () => {
  const field = read('components/editor/PreviewPdfField.tsx')
  // The picker is narrowed from the shared rule, and — because `accept` is
  // advisory and ignored by drag & drop — the rule is also enforced in the
  // upload queue. See tests/admin/upload-rules.test.ts.
  assert.match(field, /accept=\{uploadRules\.preview\.accept\}/)
  assert.equal(rejectUpload('preview', { name: 'cover.png', type: 'image/png', size: 1000 }) !== null, true)
})

test('a preview PDF is refused unless the server returned a public URL', () => {
  // Without a url the record would store a preview the website can never link
  // to, and the failure would only show up as a dead download link later.
  const adapter = read('cms/adapter.ts')
  assert.match(adapter, /if \(purpose === 'preview' && !body\.publicUrl\) \{/)
})

test('a preview upload defaults its display name to the filename minus extension', () => {
  // Visitor-facing, unlike alt text: it always needs *something*, and the
  // editor can rename it from there — see PreviewPdfField's Display name input.
  const adapter = read('cms/adapter.ts')
  const previewBranch = adapter.slice(adapter.indexOf("if (purpose === 'preview')"), adapter.indexOf('return {\n        id: fileId,'))
  assert.match(previewBranch, /file\.name\.lastIndexOf\('\.'\)/)
  assert.match(previewBranch, /label,/)
})

test('the slot disappears once a PDF is uploaded — no second upload offered', () => {
  // Mirrors FileListField's single-slot rule: an occupied slot offers Replace,
  // never a second drop zone.
  const field = readCode('components/editor/PreviewPdfField.tsx')
  assert.match(field, /const slotFilled = previews\.length > 0 \|\| active\.length > 0/)
  assert.match(field, /!disabled && !slotFilled/)
  // Unlike the gallery, this field never queues more than one file at a time.
  assert.doesNotMatch(field, /multiple/)
})

test('replacing a preview keeps the entry id and its editor-given label', () => {
  // The whole reason Replace exists rather than delete-then-reupload: anything
  // pointing at this preview, and whatever name the editor gave it, survives.
  const field = readCode('components/editor/PreviewPdfField.tsx')
  assert.match(
    field,
    /current\.map\(\(entry\) => \(entry\.id === replacesFileId \? \{ \.\.\.file, label: entry\.label \} : entry\)\)/,
  )
})

test('the display name input edits the entry label via the updater', () => {
  const field = readCode('components/editor/PreviewPdfField.tsx')
  assert.match(field, /Display name/)
  assert.match(field, /value=\{preview\.label\}/)
  assert.match(
    field,
    /onChange\(\(current\) => current\.map\(\(entry\) => \(entry\.id === preview\.id \? \{ \.\.\.entry, label: next \} : entry\)\)\)/,
  )
})

test('failed and in-progress uploads are shown, like the sibling fields', () => {
  const field = read('components/editor/PreviewPdfField.tsx')
  assert.match(field, /role="progressbar"/)
  assert.match(field, /cancel\(job\.id\)/)
  assert.match(field, /<UploadFailure /)
})

test('a new record starts with an empty previewPdfs array', () => {
  // The website reads previewPdfs unconditionally, so a blank record must have
  // the same shape as a saved one — undefined would be a different thing.
  const adapter = read('cms/adapter.ts')
  const blanks = adapter.slice(adapter.indexOf('export function createBlank'))
  const products = blanks.slice(blanks.indexOf("case 'products'"), blanks.indexOf("case 'bundles'"))
  const bundles = blanks.slice(blanks.indexOf("case 'bundles'"), blanks.indexOf("case 'faqs'"))
  assert.match(products, /previewPdfs: \[\],/)
  assert.match(bundles, /previewPdfs: \[\],/)
})

test('FieldControl dispatches previewPdfList to the new field, as a labelled group', () => {
  const control = read('components/editor/FieldControl.tsx')
  assert.match(control, /case 'previewPdfList':/)
  assert.match(control, /renderPreviewPdfList/)
  assert.match(control, /GROUP_FIELDS = new Set<AdminField\['type'\]>\(\['fileList', 'imageGallery', 'previewPdfList'\]\)/)
})
