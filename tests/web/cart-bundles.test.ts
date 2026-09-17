import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import type { Bundle, CmsSnapshot, Product } from '../../packages/cms/src/types.ts'
import { resolveCartItems } from '../../packages/cms/src/lib/formatters.ts'

const product = (overrides: Partial<Product> & Pick<Product, 'slug'>): Product => ({
  id: overrides.slug,
  title: overrides.slug,
  shortDescription: '',
  fullDescription: '',
  priceZar: 100,
  grade: 'Grade 4',
  term: 'Term 3',
  year: '2026',
  resourceFormat: 'Test / Assessment',
  subjects: ['Mathematics'],
  marks: null,
  purchasedFiles: [],
  galleryImages: [],
  previewPdfs: [],
  featured: false,
  published: true,
  sortOrder: 0,
  seo: { title: '', description: '' },
  faqs: [],
  updatedAt: '2026-01-01',
  ...overrides,
})

const bundle = (overrides: Partial<Bundle> & Pick<Bundle, 'slug'>): Bundle => ({
  id: overrides.slug,
  title: overrides.slug,
  shortDescription: '',
  fullDescription: '',
  priceZar: 350,
  grade: 'Grade 4',
  term: 'Term 3',
  year: '2026',
  bundleScope: 'Term',
  galleryImages: [],
  previewPdfs: [],
  featured: false,
  published: true,
  sortOrder: 0,
  seo: { title: '', description: '' },
  faqs: [],
  updatedAt: '2026-01-01',
  includedProductIds: [],
  includedProductSlugs: [],
  ...overrides,
})

const snapshot = (products: Product[], bundles: Bundle[] = []) => ({ products, bundles }) as CmsSnapshot

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')

// --- The regression: bundle slugs dropped from the cart --------------------

test('a cart holding a resource and a bundle resolves both, in cart order', () => {
  const snap = snapshot(
    [product({ slug: 'maths-test', priceZar: 100 })],
    [bundle({ slug: 'grade-4-term-3-bundle', priceZar: 350 })],
  )

  const items = resolveCartItems(snap, ['grade-4-term-3-bundle', 'maths-test'])

  assert.equal(items.length, 2)
  assert.equal(items[0].kind, 'bundle')
  if (items[0].kind === 'bundle') assert.equal(items[0].bundle.slug, 'grade-4-term-3-bundle')
  assert.equal(items[1].kind, 'product')
  if (items[1].kind === 'product') assert.equal(items[1].product.slug, 'maths-test')
})

test('unknown slugs are ignored instead of emptying the cart', () => {
  const snap = snapshot(
    [product({ slug: 'maths-test' })],
    [bundle({ slug: 'grade-4-term-3-bundle' })],
  )

  const items = resolveCartItems(snap, ['nope', 'maths-test', 'grade-4-term-3-bundle', 'gone'])

  assert.deepEqual(
    items.map((item) => (item.kind === 'product' ? item.product.slug : item.bundle.slug)),
    ['maths-test', 'grade-4-term-3-bundle'],
  )
})

test('unpublished products and bundles never resolve into the cart', () => {
  const snap = snapshot(
    [product({ slug: 'draft-test', published: false }), product({ slug: 'maths-test' })],
    [bundle({ slug: 'draft-bundle', published: false }), bundle({ slug: 'live-bundle' })],
  )

  const items = resolveCartItems(snap, ['draft-test', 'draft-bundle', 'maths-test', 'live-bundle'])

  assert.deepEqual(
    items.map((item) => (item.kind === 'product' ? item.product.slug : item.bundle.slug)),
    ['maths-test', 'live-bundle'],
  )
})

test('an empty cart resolves to no lines', () => {
  const snap = snapshot([product({ slug: 'maths-test' })], [bundle({ slug: 'live-bundle' })])

  assert.deepEqual(resolveCartItems(snap, []), [])
})

// --- Wiring: both pages resolve bundles, not products only -----------------

test('the cart page resolves bundles and gives bundle lines meaningful details', () => {
  const cartPage = read('apps/web/src/pages/cart-page.tsx')
  assert.match(cartPage, /resolveCartItems/)
  // No products-only lookup may remain on the cart's resolution path.
  assert.doesNotMatch(cartPage, /publishedProducts\(snapshot\)\.find|publishedProducts\(snapshot\)\s*\n?\s*\.map/)
  // Bundle lines carry more than a title: cover art plus the grade/term context.
  assert.match(cartPage, /stacked/)
  assert.match(cartPage, /grade.*term|term.*grade/i)
})

test('the checkout page resolves bundles and submits their slugs to the payment flow', () => {
  const checkoutPage = read('apps/web/src/pages/checkout-page.tsx')
  assert.match(checkoutPage, /resolveCartItems/)
  assert.doesNotMatch(checkoutPage, /publishedProducts\(snapshot\)\.find/)
  assert.match(checkoutPage, /items\.map\(\(item\) => \(\{\s*productSlug:/)
})
