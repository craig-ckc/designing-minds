import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const gallery = readFileSync(new URL('../../apps/web/src/components/ui/product-gallery.tsx', import.meta.url), 'utf8')

test('the gallery track is the positioning context for its slides', () => {
  // Each slide carries an absolutely positioned sr-only caption. An absolutely
  // positioned box is only clipped by a scroll container when its containing
  // block is inside that container, so the track itself must be positioned —
  // otherwise the captions resolve against the outer wrapper, escape the clip
  // and widen the page by one slide width per upload (490px at 375px wide).
  assert.match(gallery, /className="relative flex snap-x snap-mandatory overflow-x-auto/)
  assert.match(gallery, /<span className="sr-only">\{`Image \$\{index \+ 2\} of \$\{total\}`\}<\/span>/)
})

test('gallery indicator dots wrap and detail-page columns may shrink below min-content', () => {
  const productPage = readFileSync(new URL('../../apps/web/src/pages/product-page.tsx', import.meta.url), 'utf8')

  // Sixteen 24px dots in one non-wrapping row are wider than a phone.
  assert.match(gallery, /className="mt-4 flex flex-wrap items-center justify-center gap-1"/)
  // Both grid columns of each detail view opt out of the min-content minimum.
  assert.equal(productPage.match(/<div className="min-w-0">\s*<ProductGallery/g)?.length, 2)
  assert.equal(productPage.match(/<aside className="grid min-w-0 gap-\[18px\]/g)?.length, 2)
})
