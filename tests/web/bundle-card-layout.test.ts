import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(new URL(`../../apps/web/src/${path}`, import.meta.url), 'utf8')

test('BundleCard lays out horizontally and accepts a grid className', () => {
  const card = read('components/ui/bundle-card.tsx')

  // Bundle artwork and details remain side-by-side at every viewport.
  assert.match(card, /group flex flex-row/)
  // The cover anchors the left rail in the horizontal layout.
  assert.match(card, /className="block w-2\/5 flex-none"/)
  // The caller can position the card in a grid (e.g. span two columns).
  assert.match(card, /className\?: string/)
  assert.match(card, /cn\([\s\S]*className,?[\s\S]*\)/)
})

test('bundle entries span two columns in the shop grid', () => {
  const shop = read('pages/shop-page.tsx')

  // Only the bundle branch gets the span; ProductCard entries are unchanged.
  assert.match(shop, /<BundleCard[\s\S]*className="col-span-2"/)
  assert.doesNotMatch(shop, /<ProductCard[^>]*col-span-2/)
  // Existing product-grid density remains intact; only bundle width changes.
  assert.match(shop, /grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4/)
})

test('bundle entries span two columns in the packages grid', () => {
  const packages = read('pages/packages-page.tsx')

  assert.match(packages, /<BundleCard[\s\S]*className="col-span-2"/)
  assert.match(packages, /grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4/)
})
