import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(new URL(`../../apps/web/src/${path}`, import.meta.url), 'utf8')

test('bundle cards only claim value they can derive', () => {
  const card = read('components/ui/bundle-card.tsx')

  assert.match(card, /bundleValue\(snapshot, bundle\)/)
  // A saving is only rendered behind a positive check, never as a bare R0.
  assert.match(card, /value && value\.savingPercent > 0/)
  assert.match(card, /compareAtPriceZar=\{value\?\.singlesTotalZar\}/)
  assert.match(card, /Included resources are being finalised/)
})

test('the shop catalogue lists bundles ahead of individual resources', () => {
  const shop = read('pages/shop-page.tsx')

  // Bundles and resources are separate Collections but one grid: the combined
  // list must be built bundles-first, not sorted after the fact.
  assert.match(shop, /\.\.\.matchingBundles\.map[\s\S]*\.\.\.matchingProducts\.map/)
  assert.match(shop, /Bundles first/)
  // The catalogue uses an explicit "Load more" control instead of automatic
  // expansion, so static HTML is bounded and accessibility is improved.
  assert.match(shop, /useCatalogLoadMore\(visible/)
  assert.doesNotMatch(shop, /Sorted by catalogue order/)
})
