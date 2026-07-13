import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const productPageSource = readFileSync(new URL('../../apps/web/src/pages/product-page.tsx', import.meta.url), 'utf8')

test('product detail media uses the centered shared product cover', () => {
  assert.match(productPageSource, /import \{ ProductCover \} from '\.\.\/components\/ui\/product-cover'/)
  assert.match(productPageSource, /className="flex justify-center[^\"]*"[\s\S]*<ProductCover product=\{product\}/)
  assert.doesNotMatch(productPageSource, /<Placeholder/)
})

test('bundle and access-plan contents use the non-interactive included product component', () => {
  assert.match(productPageSource, /import \{ IncludedProduct \} from '\.\.\/components\/ui\/included-product'/)
  assert.match(productPageSource, /included\.map\(\(entry\) => \([\s\S]*<IncludedProduct key=\{entry\.id\} product=\{entry\} \/>/)
  assert.doesNotMatch(productPageSource, /isAccessPlan \? null : included\.length/)
})
