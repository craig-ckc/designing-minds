import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { countLabel, perResourceZar, productAttributeLine } from '../../apps/web/src/lib/product-attributes.ts'

const read = (path: string) => readFileSync(new URL(`../../apps/web/src/${path}`, import.meta.url), 'utf8')

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

test('catalogue cards and grade bundle tiles render the derived attribute copy', () => {
  const productCard = read('components/ui/product-card.tsx')
  const bundleCard = read('components/ui/bundle-card.tsx')
  const gradePackages = read('components/sections/grade-package-section.tsx')

  // The line sits between the title and the price row, in the muted meta style.
  assert.match(productCard, /<p className="pt-1 text-body-sm text-muted">\{productAttributeLine\(product\)\}<\/p>/)
  assert.ok(productCard.indexOf('productAttributeLine(product)') < productCard.indexOf('<CatalogPrice record={product}'))

  // Bundle cards: resources · subjects · about R x each, all derived from members.
  assert.match(bundleCard, /const perResource = perResourceZar\(promotionPrice\(bundle\), contents\.length\)/)
  assert.match(bundleCard, /countLabel\(contents\.length, 'resource'\)/)
  assert.match(bundleCard, /countLabel\(subjects\.length, 'subject'\)/)
  assert.match(bundleCard, /about \$\{priceLabel\(perResource\)\} each/)

  // Grade bundle tiles put the per-resource price beside the "bought singly" comparison.
  assert.match(gradePackages, /perResourceZar\(promotionPrice\(product\), value\.itemCount\)/)
  assert.match(gradePackages, /bought singly\s*\{perResource \? ` · about \$\{priceLabel\(perResource\)\} each` : ''\}/)
})
