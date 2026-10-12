import assert from 'node:assert/strict'
import test from 'node:test'
import { catalogDescription, countLabel, perResourceZar, productAttributeLine } from '../../apps/web/src/lib/product-attributes.ts'

const pdf = (name: string) => ({ id: name, label: name, filename: `${name}.pdf` })

test('a resource card states the file type, format and marks it actually carries', () => {
  assert.equal(
    productAttributeLine({ resourceFormat: 'Test / Assessment', marks: 30, purchasedFiles: [pdf('test')] }),
    'PDF · Test / Assessment · 30 marks',
  )
  assert.equal(productAttributeLine({ resourceFormat: 'Summary', marks: null, purchasedFiles: [pdf('summary')] }), 'PDF · Summary')
})

test('PDF is only claimed when every purchased file is a PDF', () => {
  // The three "project" resources ship as zip archives.
  assert.equal(
    productAttributeLine({ resourceFormat: 'Test / Assessment', marks: 40, purchasedFiles: [{ id: 'z', label: 'Archive', filename: 'Archive.zip' }] }),
    'Test / Assessment · 40 marks',
  )
  assert.equal(
    productAttributeLine({ resourceFormat: 'Test / Assessment', marks: 40, purchasedFiles: [pdf('a'), { id: 'z', label: 'Archive', filename: 'Archive.zip' }] }),
    'Test / Assessment · 40 marks',
  )
  // No files listed yet: no file-type claim either.
  assert.equal(productAttributeLine({ resourceFormat: 'Test / Assessment', marks: 0, purchasedFiles: [] }), 'Test / Assessment')
})

test('per-resource price is the whole-rand average, and absent when there is nothing to divide by', () => {
  assert.equal(perResourceZar(350, 15), 23)
  assert.equal(perResourceZar(1200, 65), 18)
  assert.equal(perResourceZar(200, 5), 40)
  assert.equal(perResourceZar(350, 0), null)
  assert.equal(perResourceZar(0, 5), null)
})

test('count labels pluralise', () => {
  assert.equal(countLabel(1, 'resource'), '1 resource')
  assert.equal(countLabel(15, 'resource'), '15 resources')
  assert.equal(countLabel(8, 'subject'), '8 subjects')
})

test('mini descriptions use CMS copy and fall back only when it is blank', () => {
  assert.equal(catalogDescription('Practice with confidence.', 'PDF · Summary'), 'Practice with confidence.')
  assert.equal(catalogDescription('  Practice\n with   confidence.  ', 'PDF · Summary'), 'Practice with confidence.')
  assert.equal(catalogDescription('', 'PDF · Summary'), 'PDF · Summary')
  assert.equal(catalogDescription(' \n\t ', 'Included resources are being finalised.'), 'Included resources are being finalised.')
})
