import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(new URL(`../../apps/web/src/${path}`, import.meta.url), 'utf8')

test('a grade page leads with its packages and labels the grid as singles', () => {
  const grade = read('pages/grade-detail-page.tsx')

  // The package section must precede the single-resource grid in source order,
  // which is the reading order on the page.
  const packagesAt = grade.indexOf('<GradePackageSection')
  const singlesAt = grade.indexOf('single resources')
  assert.ok(packagesAt > -1, 'grade page renders the package section')
  assert.ok(singlesAt > packagesAt, 'packages come before the singles grid')

  // The old below-the-fold underlined text link is gone.
  assert.doesNotMatch(grade, /Browse bundles &amp; plans/)
})

test('the grade package section only claims value it can derive', () => {
  const section = read('components/sections/grade-package-section.tsx')

  assert.match(section, /bundleValue\(snapshot, product\)/)
  // A saving is only rendered behind a positive check, never as a bare R0.
  assert.match(section, /value && value\.savingPercent > 0/)
  assert.match(section, /value && value\.savingZar > 0/)
  assert.match(section, /Included resources are being finalised/)
})

test('the shop catalogue lists bundles ahead of individual resources', () => {
  const shop = read('pages/shop-page.tsx')

  // Bundles and resources are separate Collections but one grid: the combined
  // list must be built bundles-first, not sorted after the fact.
  assert.match(shop, /\.\.\.matchingBundles\.map[\s\S]*\.\.\.matchingProducts\.map/)
  assert.match(shop, /Bundles first/)
  // The catalogue stays lazily expanded so static HTML is bounded.
  assert.match(shop, /useDeferredCatalog\(visible\)/)
  assert.doesNotMatch(shop, /Sorted by catalogue order/)
})
