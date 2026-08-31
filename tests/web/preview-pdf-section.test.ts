import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import type { PreviewPdf } from '../../packages/cms/src/types.ts'
import { previewDownloadHref } from '../../apps/web/src/lib/preview-pdf.ts'

const productPageSource = readFileSync(new URL('../../apps/web/src/pages/product-page.tsx', import.meta.url), 'utf8')

const pdf = (overrides: Partial<PreviewPdf> = {}): PreviewPdf => ({
  id: 'pdf-1',
  label: 'Grade 4 Maths Sample',
  filename: 'original-upload.pdf',
  storageKey: 'previews/pdf-1.pdf',
  url: 'https://example.supabase.co/storage/v1/object/public/media/previews/pdf-1.pdf',
  ...overrides,
})

test('a forced-download href appends the label as a filename, encoded, with a .pdf extension', () => {
  const href = previewDownloadHref(pdf())

  assert.equal(
    href,
    'https://example.supabase.co/storage/v1/object/public/media/previews/pdf-1.pdf?download=Grade%204%20Maths%20Sample.pdf',
  )
})

test('a label already ending in .pdf is not double-suffixed', () => {
  const href = previewDownloadHref(pdf({ label: 'Sample.pdf' }))

  assert.match(href, /\?download=Sample\.pdf$/)
  assert.doesNotMatch(href, /\.pdf\.pdf/)
})

test('an empty label falls back to the original filename', () => {
  const href = previewDownloadHref(pdf({ label: '   ', filename: 'term-3-summary.pdf' }))

  assert.match(href, /\?download=term-3-summary\.pdf$/)
})

test('a url that already carries a query string gets download appended with &, not a second ?', () => {
  const href = previewDownloadHref(pdf({ url: 'https://example.supabase.co/object/pdf-1.pdf?token=abc' }))

  assert.equal(href, 'https://example.supabase.co/object/pdf-1.pdf?token=abc&download=Grade%204%20Maths%20Sample.pdf')
})

test('the resource detail hides the preview section on an empty (or stale, undefined) array', () => {
  // No DOM renderer in this suite (see the rest of tests/web) — the guard is
  // asserted structurally: previewPdfs only ever reaches the section behind a
  // truthy length check, same defensive shape as `galleryImages ?? []`.
  const resourceSection = productPageSource.slice(
    productPageSource.indexOf('function ResourceDetail'),
    productPageSource.indexOf('function BundleDetail'),
  )

  assert.match(resourceSection, /const previewPdfs = product\.previewPdfs \?\? \[\]/)
  assert.match(
    resourceSection,
    /\{previewPdfs\.length > 0 \? <PreviewPdfSection pdfs=\{previewPdfs\} subject="resource" \/> : null\}/,
  )
})

test('the bundle detail hides the preview section on an empty (or stale, undefined) array', () => {
  const bundleSection = productPageSource.slice(productPageSource.indexOf('function BundleDetail'))

  assert.match(bundleSection, /const previewPdfs = bundle\.previewPdfs \?\? \[\]/)
  assert.match(
    bundleSection,
    /\{previewPdfs\.length > 0 \? <PreviewPdfSection pdfs=\{previewPdfs\} subject="bundle" \/> : null\}/,
  )
})

test('the preview section renders a real download link per entry, labelled and forced-download', () => {
  const section = productPageSource.slice(
    productPageSource.indexOf('function PreviewPdfSection'),
    productPageSource.indexOf('/* ----------------------------- Single resource'),
  )

  assert.match(section, /Preview before you buy/)
  // No eyebrow/kicker — the heading is the section's only label.
  assert.doesNotMatch(section, /eyebrow/i)
  assert.match(section, /pdfs\.map\(\(pdf\) => \(/)
  assert.match(section, /href=\{previewDownloadHref\(pdf\)\}/)
  assert.match(section, /rel="noopener"/)
  assert.match(section, /\{pdf\.label\}/)
})

test('the preview section is placed after the descriptive copy and before the classroom-licensing block', () => {
  const resourceSection = productPageSource.slice(
    productPageSource.indexOf('function ResourceDetail'),
    productPageSource.indexOf('function BundleDetail'),
  )
  const aboutAt = resourceSection.indexOf('About this resource')
  const previewAt = resourceSection.indexOf('<PreviewPdfSection')
  const footerAt = resourceSection.indexOf('<DetailFooterBlocks')

  assert.ok(aboutAt > -1 && previewAt > -1 && footerAt > -1)
  assert.ok(aboutAt < previewAt && previewAt < footerAt, 'preview section must sit between the About copy and the footer blocks')

  const bundleSection = productPageSource.slice(productPageSource.indexOf('function BundleDetail'))
  const includedAt = bundleSection.indexOf('What’s included')
  const bundlePreviewAt = bundleSection.indexOf('<PreviewPdfSection')
  const bundleFooterAt = bundleSection.indexOf('<DetailFooterBlocks')

  assert.ok(includedAt > -1 && bundlePreviewAt > -1 && bundleFooterAt > -1)
  assert.ok(
    includedAt < bundlePreviewAt && bundlePreviewAt < bundleFooterAt,
    'preview section must sit between What’s included and the footer blocks',
  )
})
