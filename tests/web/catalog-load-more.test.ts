import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(new URL(`../../apps/web/src/${path}`, import.meta.url), 'utf8')

test('useCatalogLoadMore returns the initial limit and a load-more accessor', () => {
  const source = read('lib/deferred-catalog.ts')

  // Exports the default limit that SSR and the "Load more" button depend on.
  assert.match(source, /export const CATALOG_INITIAL_LIMIT = 48/)
  // Returns the visible slice, a has-more flag, and a load function.
  assert.match(source, /visible: readonly T\[\]/)
  assert.match(source, /hasMore: boolean/)
  assert.match(source, /loadMore: \(\) => void/)
  // Uses a stable reset key so rerenders do not reset a successful load.
  assert.match(source, /state\.key === stateKey \? state\.count : pageSize/)
  assert.match(source, /current\.key === stateKey \? current\.count : pageSize/)
})

test('all catalog grids render a Load more button below the grid', () => {
  for (const page of [
    'pages/shop-page.tsx',
    'pages/packages-page.tsx',
    'pages/grade-detail-page.tsx',
    'components/sections/grade-package-section.tsx',
  ]) {
    const source = read(page)
    assert.match(source, /<LoadMoreButton[\s\S]*onLoadMore=\{loadMore\}/, `${page}: Load more button`)
  }
})

test('Load more is styled as a primary pink call to action', () => {
  const source = read('components/ui/load-more-button.tsx')
  assert.match(source, /<Button variant="solid"[^>]*type="button"/)
})

test('small lists render without a Load more button in the initial DOM', () => {
  const source = read('lib/deferred-catalog.ts')
  // When items.length <= the visible window, the shared button receives zero
  // remaining items and returns null.
  assert.match(source, /const hasMore = visible\.length < items\.length/)
})

test('filter dependencies reset the visible count to the initial limit', () => {
  const shop = read('pages/shop-page.tsx')
  const packages = read('pages/packages-page.tsx')
  const gradeDetail = read('pages/grade-detail-page.tsx')

  // Shop resets on grade, term, subject, format, and query changes.
  assert.match(shop, /const catalogResetKey = JSON\.stringify\(\[grades, terms, subjects, formats, q\]\)/)
  assert.match(shop, /useCatalogLoadMore\(visible,\s*CATALOG_INITIAL_LIMIT,\s*catalogResetKey\)/)
  // Packages resets on offer, grade, term, and query changes.
  assert.match(packages, /const catalogResetKey = JSON\.stringify\(\[offerSel, grades, terms, q\]\)/)
  assert.match(packages, /useCatalogLoadMore\(visible,\s*CATALOG_INITIAL_LIMIT,\s*catalogResetKey\)/)
  // Grade detail resets on term changes.
  assert.match(gradeDetail, /useCatalogLoadMore\(visible,\s*CATALOG_INITIAL_LIMIT,\s*term\)/)
})

test('catalog cards use content-visibility:auto for rendering performance', () => {
  const productCard = read('components/ui/product-card.tsx')
  const bundleCard = read('components/ui/bundle-card.tsx')

  assert.match(productCard, /catalog-card-product/, 'product-card opts into content-visibility')
  assert.match(bundleCard, /catalog-card-bundle/, 'bundle-card opts into content-visibility')
  const css = read('index.css')
  assert.match(css, /\.catalog-card \{[\s\S]*content-visibility:\s*auto;[\s\S]*contain-intrinsic-block-size:/)
  assert.match(css, /\.catalog-card-bundle \{ contain-intrinsic-block-size:/)
  // Never the shorthand: it also reserves an inline size, which lets a skipped
  // card widen an auto-sized mobile grid track past the viewport.
  assert.doesNotMatch(css, /contain-intrinsic-size:/)
})

test('catalog cards retain their SEO and accessibility markup alongside content-visibility', () => {
  const productCard = read('components/ui/product-card.tsx')
  const bundleCard = read('components/ui/bundle-card.tsx')

  // Product cards keep article role, product title, and price.
  assert.match(productCard, /as="article"/, 'product-card renders as article')
  assert.match(productCard, /aria-label=\{`View \$\{product\.title\}`\}/, 'product-card link has accessible name')
  assert.match(productCard, /<h3/, 'product-card keeps heading for SEO')
  // Bundle cards keep article role and accessible name.
  assert.match(bundleCard, /as="article"/, 'bundle-card renders as article')
  assert.match(bundleCard, /aria-label=\{`View \$\{bundle\.title\}`\}/, 'bundle-card link has accessible name')
  assert.match(bundleCard, /<h3/, 'bundle-card keeps heading for SEO')
})

test('product-cover copy is always visible with no hiding at compact sizes', () => {
  const css = read('index.css')
  assert.doesNotMatch(css, /\.product-cover-copy \{ display: none; \}/, 'no compact-cover hiding rule')
  assert.doesNotMatch(css, /@container\s*\(max-width.*\)\s*\{[\s\S]*display:\s*none/, 'no container query hiding')
})
