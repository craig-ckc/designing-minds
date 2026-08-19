import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { buildCsv } from '../../apps/admin/src/cms/csv-io.ts'
import { collectionRegistry } from '../../apps/admin/src/cms/registry.ts'
import type { AdminRecord } from '../../apps/admin/src/cms/types.ts'

const read = (path: string) => readFileSync(new URL(`../../apps/admin/src/${path}`, import.meta.url), 'utf8')

const collection = (id: string) => {
  const found = collectionRegistry.find((entry) => entry.id === id)
  assert.ok(found, `expected a "${id}" collection in the registry`)
  return found
}

test('both catalogue collections expose the preview gallery in an editor section', () => {
  // /shop/<slug> serves products and bundles from one page, so a gallery that
  // existed on only one of them would be an inconsistency an editor runs into.
  for (const id of ['products', 'bundles']) {
    const entry = collection(id)
    const field = entry.fields.find((f) => f.key === 'galleryImages')
    assert.ok(field, `${id} should carry a galleryImages field`)
    assert.equal(field.type, 'imageGallery')
    // A field absent from every section is invisible in the editor.
    const sections = entry.sections.filter((s) => s.fields.includes('galleryImages'))
    assert.equal(sections.length, 1, `${id} should show galleryImages in exactly one section`)
    assert.ok(sections[0].hint, `${id}'s gallery section should explain what the images are for`)
  }
})

test('the gallery is not required, so an existing record stays saveable', () => {
  // Every published product predates this field. Marking it required would make
  // the whole catalogue unsaveable until someone uploaded a photo to each one.
  for (const id of ['products', 'bundles']) {
    const field = collection(id).fields.find((f) => f.key === 'galleryImages')
    assert.ok(field)
    assert.notEqual(field.required, true)
  }
})

test('storage-backed fields are left out of CSV entirely', () => {
  // A filename in a cell says nothing about where the bytes are, so exporting
  // one invites an import that silently drops or invents storage objects.
  const csv = buildCsv(collection('products'), [
    { id: 'p1', title: 'A resource', galleryImages: [{ id: 'i1', url: 'https://example.test/a.jpg' }] } as AdminRecord,
  ])
  const header = csv.split('\n')[0]
  assert.doesNotMatch(header, /galleryImages/)
  assert.doesNotMatch(header, /purchasedFiles/)
  assert.doesNotMatch(csv, /example\.test/)
})

test('gallery uploads go to the public bucket and purchased files do not', () => {
  const adapter = read('cms/adapter.ts')
  // The two purposes are the whole security boundary: one bucket is world
  // readable, the other is paid content behind an entitlement check.
  assert.match(adapter, /body: JSON\.stringify\(\{ recordId: record\.id, fileId, filename: file\.name, purpose \}\)/)
  assert.match(read('components/editor/ImageGalleryField.tsx'), /purpose: 'gallery'/)
  assert.match(read('components/editor/FileListField.tsx'), /purpose: 'purchased'/)
})

test('a gallery image is refused unless the server returned a public URL', () => {
  // Without a url the record would store an image the website can never render,
  // and the failure would only show up as a blank slide much later.
  const adapter = read('cms/adapter.ts')
  assert.match(adapter, /if \(purpose === 'gallery' && !body\.publicUrl\) \{/)
  assert.match(adapter, /did not return a public URL/)
})

test('alt text is left empty rather than defaulted to the filename', () => {
  // "IMG_4021.jpg" read aloud is worse than nothing, and pre-filling it makes an
  // empty field look finished.
  const adapter = read('cms/adapter.ts')
  assert.match(adapter, /alt: '',/)
  assert.match(read('components/editor/ImageGalleryField.tsx'), /onAltChange/)
})

test('the field accepts many images at once, unlike the single-file field', () => {
  const gallery = read('components/editor/ImageGalleryField.tsx')
  // Multi-select on the picker, and every dropped file queued rather than the
  // first — the plural counterpart to FileListField's deliberate single slot.
  assert.match(gallery, /multiple/)
  assert.match(gallery, /accept="image\/\*"/)
  assert.match(gallery, /for \(const file of \[\.\.\.\(selected \?\? \[\]\)\]\) \{/)
  assert.doesNotMatch(read('components/editor/FileListField.tsx'), /multiple/)
})

test('per-image progress is reported and cancellable', () => {
  const gallery = read('components/editor/ImageGalleryField.tsx')
  assert.match(gallery, /role="progressbar"/)
  assert.match(gallery, /aria-valuenow=\{percent\}/)
  assert.match(gallery, /aria-label=\{`Uploading \$\{job\.filename\}`\}/)
  assert.match(gallery, /cancel\(job\.id\)/)
  // Failures stay on screen with their reason instead of vanishing.
  assert.match(gallery, /function FailedUpload/)
})

test('intrinsic image size is measured at upload time', () => {
  // The only moment the original file is in hand. Storing it lets the website
  // reserve the box so a visitor never watches the page jump.
  const adapter = read('cms/adapter.ts')
  assert.match(adapter, /const readImageSize/)
  assert.match(adapter, /naturalWidth/)
  assert.match(adapter, /naturalHeight/)
  // An undecodable file resolves empty rather than failing the upload.
  assert.match(adapter, /image\.onerror = \(\) => done\(\{\}\)/)
  assert.match(adapter, /URL\.revokeObjectURL\(url\)/)
})

test('gallery order is editable by keyboard, not only by dragging', () => {
  // Order is what the visitor pages through, so rearranging is an edit — and it
  // cannot be locked behind a pointer-only gesture.
  const gallery = read('components/editor/ImageGalleryField.tsx')
  assert.match(gallery, /onMove\(-1\)/)
  assert.match(gallery, /onMove\(1\)/)
  assert.match(gallery, /aria-label=\{`Move \$\{image\.filename\} earlier`\}/)
  assert.match(gallery, /disabled=\{position === 1\}/)
  assert.match(gallery, /disabled=\{position === total\}/)
})

test('a new record starts with an empty gallery', () => {
  // The website reads galleryImages unconditionally, so a blank record must have
  // the same shape as a saved one — undefined would be a different thing.
  // Scoped to createBlank: adapter.ts also has a `case 'products'` in its read
  // switch, and matching that one would prove nothing.
  const adapter = read('cms/adapter.ts')
  const blanks = adapter.slice(adapter.indexOf('export function createBlank'))
  const products = blanks.slice(blanks.indexOf("case 'products'"), blanks.indexOf("case 'bundles'"))
  const bundles = blanks.slice(blanks.indexOf("case 'bundles'"), blanks.indexOf("case 'faqs'"))
  assert.match(products, /galleryImages: \[\],/)
  assert.match(bundles, /galleryImages: \[\],/)
})
