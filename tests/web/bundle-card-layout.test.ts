import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(new URL(`../../apps/web/src/${path}`, import.meta.url), 'utf8')

test('resource and bundle cards share a vertical artwork, description and price hierarchy', () => {
  for (const name of ['product', 'bundle']) {
    const card = read(`components/ui/${name}-card.tsx`)
    assert.match(card, /group flex min-w-0 flex-col/)
    assert.match(card, /className="catalog-card-media"/)
    assert.match(card, /className="catalog-card-body"/)
    assert.match(card, /catalog-card-description/)
    assert.match(card, /className="catalog-card-price"/)
    assert.ok(card.indexOf('catalog-card-media') < card.indexOf('catalog-card-description'))
    assert.ok(card.indexOf('catalog-card-description') < card.indexOf('catalog-card-price'))
  }
  assert.match(read('components/ui/bundle-card.tsx'), /className\?: string/)
})
