import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_LABEL,
  rejectUpload,
  uploadHint,
  uploadRules,
} from '../../apps/admin/src/lib/upload-rules.ts'

const read = (path: string) => readFileSync(new URL(`../../apps/admin/src/${path}`, import.meta.url), 'utf8')

const file = (name: string, type: string, size: number) => ({ name, type, size })
const pdf = (size: number) => file('Grade 7 Mathematics Term 3 Summary.pdf', 'application/pdf', size)

test('the limit matches what the live project actually enforces', () => {
  // Verified against the project, not assumed: a resumable-upload claim of
  // exactly 52,428,800 bytes is accepted and 52,428,801 is refused with
  // "Maximum size exceeded".
  assert.equal(MAX_UPLOAD_BYTES, 52_428_800)
  assert.equal(MAX_UPLOAD_LABEL, '50 MB')
})

test('the boundary is exact, so nothing storage would accept is turned away', () => {
  assert.equal(rejectUpload('purchased', pdf(MAX_UPLOAD_BYTES)), null, 'exactly at the limit must be allowed')
  assert.match(rejectUpload('purchased', pdf(MAX_UPLOAD_BYTES + 1)) ?? '', /50 MB/)
})

test('the 109MB PDF is refused up front, with its size and the limit', () => {
  const refusal = rejectUpload('purchased', pdf(108_975_292))
  assert.ok(refusal, 'a 109MB file must be refused')
  assert.match(refusal, /109 MB/, 'should quote the size of the file in hand')
  assert.match(refusal, /50 MB/, 'should quote the limit')
  assert.match(refusal, /nothing was uploaded/i, 'should say no bytes moved')
})

test('a PDF cannot be dropped on the preview-image zone', () => {
  // The mistake that put six PDFs in the gallery folder, where the website
  // renders them in an <img>. `accept="image/*"` never stopped it: drag & drop
  // ignores the attribute entirely.
  const refusal = rejectUpload('gallery', pdf(5_000_000))
  assert.ok(refusal, 'a PDF must be refused by the image zone')
  assert.match(refusal, /PNG, JPG/, 'should say what the zone does take')
  assert.match(refusal, /nothing was uploaded/i)
  // And the reverse: an image is not a preview PDF.
  assert.ok(rejectUpload('preview', file('cover.png', 'image/png', 900_000)))
  assert.ok(rejectUpload('purchased', file('cover.png', 'image/png', 900_000)))
})

test('every zone takes what the catalogue actually holds', () => {
  assert.equal(rejectUpload('purchased', pdf(3_000_000)), null)
  assert.equal(rejectUpload('purchased', file('bundle.zip', 'application/zip', 9_000_000)), null)
  assert.equal(rejectUpload('preview', pdf(1_000_000)), null)
  for (const image of ['a.png', 'b.jpg', 'c.jpeg', 'd.webp', 'e.gif']) {
    assert.equal(rejectUpload('gallery', file(image, `image/${image.slice(2)}`, 500_000)), null, image)
  }
})

test('a file the browser gives no MIME type for is judged on its extension', () => {
  // Common for ZIPs, and for anything dragged out of an archive: `type` is ''
  // or application/octet-stream. Requiring the MIME to match would refuse files
  // that are exactly right.
  assert.equal(rejectUpload('purchased', file('bundle.zip', '', 4_000_000)), null)
  assert.equal(rejectUpload('purchased', file('worksheet.pdf', 'application/octet-stream', 4_000_000)), null)
  assert.ok(rejectUpload('gallery', file('worksheet.pdf', '', 4_000_000)), 'still refused by the image zone')
})

test('an SVG is not treated as a gallery image', () => {
  // `image/*` would have accepted it. These go to the PUBLIC bucket the website
  // embeds, and an SVG is a document that can carry script.
  assert.ok(rejectUpload('gallery', file('logo.svg', 'image/svg+xml', 12_000)))
})

test('an empty file is refused rather than stored as a broken download', () => {
  assert.match(rejectUpload('purchased', pdf(0)) ?? '', /empty/i)
})

test('the size check runs on the wrong-type file too, in the order that helps most', () => {
  // A 109MB PDF on the image zone is wrong twice; being told the type is wrong
  // is the more useful of the two, because compressing it would not help.
  assert.match(rejectUpload('gallery', pdf(108_975_292)) ?? '', /takes PNG, JPG/)
})

test('the gate sits in the upload queue, before any bytes leave the browser', () => {
  const queue = read('lib/uploads.tsx')
  // Refused inside start(), and returning before the transport is ever called.
  const start = queue.slice(queue.indexOf('const start = useCallback'), queue.indexOf('const dismiss ='))
  assert.match(start, /rejectUpload\(input\.purpose, input\.file\)/)
  assert.ok(
    start.indexOf('rejectUpload') < start.indexOf('live.current.upload'),
    'the check must come before the upload call',
  )
  assert.match(start, /status: 'error'/, 'a refused file becomes a failed job the field can show')
})

test('every drop zone says its limit and its file types up front', () => {
  const zones: [string, keyof typeof uploadRules][] = [
    ['FileListField', 'purchased'],
    ['ImageGalleryField', 'gallery'],
    ['PreviewPdfField', 'preview'],
  ]
  for (const [field, purpose] of zones) {
    const source = read(`components/editor/${field}.tsx`)
    assert.match(source, new RegExp(`uploadHint\\('${purpose}'\\)`), `${field} should show the hint`)
    assert.match(source, new RegExp(`uploadRules\\.${purpose}\\.accept`), `${field} should narrow its picker`)
    // The hint and the picker come from the same rule, so they cannot disagree.
    assert.doesNotMatch(source, /accept="image\/\*"|accept="application\/pdf/, `${field} should not hardcode accept`)
  }
  assert.equal(uploadHint('purchased'), 'PDF or ZIP · up to 50 MB')
  assert.equal(uploadHint('preview'), 'PDF · up to 50 MB')
  assert.equal(uploadHint('gallery'), 'PNG, JPG, WebP, GIF or AVIF · up to 50 MB')
})
