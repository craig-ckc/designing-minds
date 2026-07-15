import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  CATALOG_PRERENDER_LIMIT,
  catalogItemsForRender,
} from '../../apps/web/src/lib/deferred-catalog.ts'

test('catalogue SSR is bounded while hydrated pages retain every result', () => {
  const items = Array.from({ length: CATALOG_PRERENDER_LIMIT + 10 }, (_, index) => index)

  assert.equal(catalogItemsForRender(items, false).length, CATALOG_PRERENDER_LIMIT)
  assert.equal(catalogItemsForRender(items.slice(0, CATALOG_PRERENDER_LIMIT), false).length, CATALOG_PRERENDER_LIMIT)
  assert.equal(catalogItemsForRender([], false).length, 0)
  assert.deepEqual(catalogItemsForRender(items, true), items)
})

test('shop and packages both defer catalogue markup until after hydration', () => {
  for (const page of ['shop-page.tsx', 'packages-page.tsx']) {
    const source = readFileSync(new URL(`../../apps/web/src/pages/${page}`, import.meta.url), 'utf8')
    assert.match(source, /useDeferredCatalog\(visible\)/, page)
  }
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
