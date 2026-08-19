import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const productPageSource = readFileSync(new URL('../../apps/web/src/pages/product-page.tsx', import.meta.url), 'utf8')

test('product detail media goes through the shared gallery, cover first', () => {
  // The page no longer places a cover directly: the gallery owns that slot and
  // composes the cover as its first slide, so both detail views get arrows the
  // moment a record has uploads without either of them knowing about it.
  assert.match(productPageSource, /import \{ ProductGallery \} from '\.\.\/components\/ui\/product-gallery'/)
  assert.match(productPageSource, /<ProductGallery item=\{product\} images=\{product\.galleryImages \?\? \[\]\} \/>/)
  assert.match(productPageSource, /<ProductGallery[\s\S]*images=\{bundle\.galleryImages \?\? \[\]\}[\s\S]*stacked/)
  assert.doesNotMatch(productPageSource, /<ProductCover/)
  assert.doesNotMatch(productPageSource, /<Placeholder/)
})

test('product cover thumbnails do not repeat the full inline logo SVG', () => {
  const coverSource = readFileSync(new URL('../../apps/web/src/components/ui/product-cover.tsx', import.meta.url), 'utf8')

  assert.doesNotMatch(coverSource, /import \{ Logo \}/)
  assert.match(coverSource, />\s*Designing Minds\s*<\/span>/)
})

test('bundle contents use the non-interactive included product component', () => {
  assert.match(productPageSource, /import \{ IncludedProduct \} from '\.\.\/components\/ui\/included-product'/)
  assert.match(productPageSource, /contents\.map\(\(entry\) => \([\s\S]*<IncludedProduct key=\{entry\.id\} product=\{entry\} \/>/)
})

test('one /shop/<slug> route resolves either Collection', () => {
  // Products and bundles share the URL space, so the slug is resolved once and
  // dispatched — a shopper never has to know which one they are looking at.
  assert.match(productPageSource, /getCatalogItemBySlug\(snapshot, slug\)/)
  assert.match(productPageSource, /item\.kind === 'bundle'/)
  assert.match(productPageSource, /<BundleDetail bundle=\{item\.bundle\}/)
  assert.match(productPageSource, /<ResourceDetail product=\{item\.product\}/)
  // An unpublished record of either kind is a 404, not a hidden page.
  assert.match(productPageSource, /item\.bundle\.published \? [\s\S]*: <NotFoundPage \/>/)
  assert.match(productPageSource, /item\.product\.published \? [\s\S]*: <NotFoundPage \/>/)
})

test('a detail page withholds the About section when the CMS body is a placeholder', () => {
  assert.match(productPageSource, /const hasRealCopy = \(value: string\) => value\.replace\(\/\[\.\\s\]\/g, ''\)\.length > 0/)
  assert.match(productPageSource, /\{hasRealCopy\(product\.fullDescription\) \? \([\s\S]*About this resource/)
  assert.match(productPageSource, /\{hasRealCopy\(bundle\.fullDescription\) \? \([\s\S]*About this bundle/)
})

test('a product page surfaces classroom licensing and bundle cross-sell', () => {
  assert.match(productPageSource, /Ask about classroom licensing/)
  // Cross-sell lives on the resource view only — a bundle must not advertise
  // itself, which the split now guarantees structurally.
  assert.match(productPageSource, /const inBundles = bundlesContaining\(snapshot, product\)/)
  assert.match(productPageSource, /inBundles\.length > 0/)
})

test('the product page CTA uses the shared text button, not a one-off underline', () => {
  assert.doesNotMatch(productPageSource, /border-b-\[1\.5px\] border-current/)
  assert.match(productPageSource, /<Button to=\{`\/shop\?grade=/)
})
