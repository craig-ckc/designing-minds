import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const productPageSource = readFileSync(new URL('../../apps/web/src/pages/product-page.tsx', import.meta.url), 'utf8')

test('product detail media uses the centered shared product cover', () => {
  assert.match(productPageSource, /import \{ ProductCover \} from '\.\.\/components\/ui\/product-cover'/)
  assert.match(productPageSource, /className="flex justify-center[^\"]*"[\s\S]*<ProductCover product=\{product\}/)
  assert.doesNotMatch(productPageSource, /<Placeholder/)
})

test('product cover thumbnails do not repeat the full inline logo SVG', () => {
  const coverSource = readFileSync(new URL('../../apps/web/src/components/ui/product-cover.tsx', import.meta.url), 'utf8')

  assert.doesNotMatch(coverSource, /import \{ Logo \}/)
  assert.match(coverSource, />\s*Designing Minds\s*<\/span>/)
})

test('bundle and access-plan contents use the non-interactive included product component', () => {
  assert.match(productPageSource, /import \{ IncludedProduct \} from '\.\.\/components\/ui\/included-product'/)
  assert.match(productPageSource, /included\.map\(\(entry\) => \([\s\S]*<IncludedProduct key=\{entry\.id\} product=\{entry\} \/>/)
  assert.doesNotMatch(productPageSource, /isAccessPlan \? null : included\.length/)
})

test('a product page withholds the About section when the CMS body is a placeholder', () => {
  assert.match(productPageSource, /const hasDescription = product\.fullDescription\.replace\(\/\[\.\\s\]\/g, ''\)\.length > 0/)
  assert.match(productPageSource, /\{hasDescription \? \([\s\S]*About this \{isComposite \? 'offer' : 'resource'\}/)
})

test('a product page surfaces classroom licensing and bundle cross-sell', () => {
  assert.match(productPageSource, /Ask about classroom licensing/)
  assert.match(productPageSource, /packagesContaining\(snapshot, product\)/)
  // Cross-sell is for singles; a bundle must not advertise itself.
  assert.match(productPageSource, /const inPackages = isComposite \? \[\] : packagesContaining/)
  assert.match(productPageSource, /inPackages\.length > 0/)
})

test('the product page CTA uses the shared text button, not a one-off underline', () => {
  assert.doesNotMatch(productPageSource, /border-b-\[1\.5px\] border-current/)
  assert.match(productPageSource, /<Button to=\{`\/shop\?grade=/)
})
