import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const includedProductSource = readFileSync(
  new URL('../../apps/web/src/components/ui/included-product.tsx', import.meta.url),
  'utf8',
)

test('included product renders only an informational product title', () => {
  assert.match(includedProductSource, /product\.title/)
  assert.doesNotMatch(includedProductSource, /\bLink\b|\bButton\b|\bonClick\b|\bto=|\bhref=/)
})
