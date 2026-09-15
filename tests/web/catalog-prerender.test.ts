import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  CATALOG_INITIAL_LIMIT,
  catalogItemsForRender,
} from '../../apps/web/src/lib/deferred-catalog.ts'

test('catalogue rendering stays bounded until a load-more action reveals more items', () => {
  const overLimit = Array.from({ length: CATALOG_INITIAL_LIMIT + 10 }, (_, index) => index)
  assert.equal(catalogItemsForRender(overLimit, CATALOG_INITIAL_LIMIT).length, CATALOG_INITIAL_LIMIT)
  assert.deepEqual(catalogItemsForRender(overLimit, overLimit.length), overLimit)
  assert.deepEqual(catalogItemsForRender([], CATALOG_INITIAL_LIMIT), [])
})

test('shop, packages, and grade pages wire up useCatalogLoadMore', () => {
  for (const page of [
    'pages/shop-page.tsx',
    'pages/packages-page.tsx',
    'pages/grade-detail-page.tsx',
    'components/sections/grade-package-section.tsx',
  ]) {
    const source = readFileSync(new URL(`../../apps/web/src/${page}`, import.meta.url), 'utf8')
    assert.match(source, /useCatalogLoadMore\(/, page)
  }
})

test('all catalog views reset the visible count when filter inputs change', () => {
  const shop = readFileSync(new URL('../../apps/web/src/pages/shop-page.tsx', import.meta.url), 'utf8')
  assert.match(shop, /useCatalogLoadMore\(visible,\s*CATALOG_INITIAL_LIMIT,\s*catalogResetKey\)/)

  const packages = readFileSync(new URL('../../apps/web/src/pages/packages-page.tsx', import.meta.url), 'utf8')
  assert.match(packages, /useCatalogLoadMore\(visible,\s*CATALOG_INITIAL_LIMIT,\s*catalogResetKey\)/)

  const gradeDetail = readFileSync(new URL('../../apps/web/src/pages/grade-detail-page.tsx', import.meta.url), 'utf8')
  assert.match(gradeDetail, /useCatalogLoadMore\(visible,\s*CATALOG_INITIAL_LIMIT,\s*term\)/)
})

test('product covers reuse external artwork instead of repeating path payloads', () => {
  const component = readFileSync(new URL('../../apps/web/src/components/ui/product-cover.tsx', import.meta.url), 'utf8')
  const sprite = readFileSync(new URL('../../apps/web/public/icons.svg', import.meta.url), 'utf8')

  assert.match(component, /<use href="\/icons\.svg#cover-band-shape" \/>/)
  assert.match(component, /<use href="\/icons\.svg#cover-band-accent" \/>/)
  assert.doesNotMatch(component, /<path\b/)
  assert.match(sprite, /<symbol id="cover-band-shape" viewBox="0 0 595 513">/)
  assert.match(sprite, /<symbol id="cover-band-accent" viewBox="0 0 595 339">/)
})
