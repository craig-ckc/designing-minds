import assert from 'node:assert/strict'
import test from 'node:test'
import type { Bundle, CmsSnapshot, Product } from '../../packages/cms/src/types.ts'
import { bundleValue, bundlesContaining, bundlesForGrade } from '../../packages/cms/src/lib/formatters.ts'

const product = (overrides: Partial<Product> & Pick<Product, 'slug'>): Product => ({
  id: overrides.slug,
  title: overrides.slug,
  shortDescription: '',
  fullDescription: '',
  priceZar: 0,
  grade: 'Grade 3',
  term: 'Term 1',
  year: '2026',
  resourceFormat: 'Test / Assessment',
  subjects: ['Mathematics'],
  marks: null,
  purchasedFiles: [],
  galleryImages: [],
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
  priceZar: 0,
  grade: 'Grade 3',
  term: 'Term 1',
  year: '2026',
  bundleScope: 'Term',
  galleryImages: [],
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

test('a bundle states what it saves against buying the same resources singly', () => {
  const snap = snapshot(
    [
      product({ slug: 'maths', priceZar: 60, subjects: ['Mathematics'], term: 'Term 1' }),
      product({ slug: 'english', priceZar: 60, subjects: ['English HL'], term: 'Term 2' }),
      product({ slug: 'afrikaans', priceZar: 50, subjects: ['Afrikaans FAL'], term: 'Term 2' }),
    ],
    [bundle({ slug: 'term-bundle', priceZar: 140, includedProductSlugs: ['maths', 'english', 'afrikaans'] })],
  )

  const value = bundleValue(snap, snap.bundles[0])

  assert.ok(value)
  assert.equal(value.itemCount, 3)
  assert.equal(value.singlesTotalZar, 170)
  assert.equal(value.savingZar, 30)
  assert.equal(value.savingPercent, 18)
  assert.deepEqual(value.subjects, ['Afrikaans FAL', 'English HL', 'Mathematics'])
  assert.deepEqual(value.terms, ['Term 1', 'Term 2'])
})

test('an unpublished included resource is left out of the value claim', () => {
  const snap = snapshot(
    [product({ slug: 'maths', priceZar: 60 }), product({ slug: 'draft', priceZar: 60, published: false })],
    [bundle({ slug: 'bundle', priceZar: 50, includedProductSlugs: ['maths', 'draft'] })],
  )

  const value = bundleValue(snap, snap.bundles[0])

  assert.ok(value)
  assert.equal(value.itemCount, 1)
  assert.equal(value.singlesTotalZar, 60)
})

test('a bundle listing nothing yet reports no value rather than a R0 saving', () => {
  const snap = snapshot([], [bundle({ slug: 'empty', priceZar: 300 })])

  assert.equal(bundleValue(snap, snap.bundles[0]), null)
})

test('a bundle priced above its parts never advertises a negative saving', () => {
  const snap = snapshot(
    [product({ slug: 'maths', priceZar: 40 })],
    [bundle({ slug: 'overpriced', priceZar: 90, includedProductSlugs: ['maths'] })],
  )

  const value = bundleValue(snap, snap.bundles[0])

  assert.ok(value)
  assert.equal(value.savingZar, 0)
  assert.equal(value.savingPercent, 0)
})

test('grade bundles lead with the cheapest entry point and ignore other grades', () => {
  const snap = snapshot(
    [product({ slug: 'single', grade: 'Grade 4' })],
    [
      bundle({ slug: 'year', grade: 'Grade 4', priceZar: 1200, bundleScope: 'Full Year' }),
      bundle({ slug: 'term', grade: 'Grade 4', priceZar: 350 }),
      bundle({ slug: 'mid', grade: 'Grade 4', priceZar: 400 }),
      bundle({ slug: 'other-grade', grade: 'Grade 5', priceZar: 100 }),
    ],
  )

  assert.deepEqual(
    bundlesForGrade(snap, 'Grade 4').map((entry) => entry.slug),
    ['term', 'mid', 'year'],
  )
})

test('a resource can find the bundles that already include it', () => {
  const snap = snapshot(
    [product({ slug: 'maths' })],
    [
      bundle({ slug: 'year', priceZar: 1200, includedProductSlugs: ['maths'] }),
      bundle({ slug: 'term', priceZar: 350, includedProductSlugs: ['maths'] }),
      bundle({ slug: 'unrelated', priceZar: 90, includedProductSlugs: ['english'] }),
    ],
  )

  assert.deepEqual(
    bundlesContaining(snap, snap.products[0]).map((entry) => entry.slug),
    ['term', 'year'],
  )
})

test('an unpublished bundle never cross-sells itself on a resource page', () => {
  const snap = snapshot(
    [product({ slug: 'maths' })],
    [bundle({ slug: 'draft', published: false, includedProductSlugs: ['maths'] })],
  )

  assert.deepEqual(bundlesContaining(snap, snap.products[0]), [])
})

test('bundle membership is the whole entitlement — no rule-based grants survive', async () => {
  const { resourceUnlockedByBundle } = await import('../../packages/cms/src/lib/entitlements.ts')
  const owned = bundle({ slug: 'maths-bundle', includedProductSlugs: ['listed'] })

  assert.equal(resourceUnlockedByBundle(owned, product({ slug: 'listed' })), true)
  // Same grade, same subject, same term — but not listed. Before the split this
  // would have been granted by rule; now only membership counts.
  assert.equal(resourceUnlockedByBundle(owned, product({ slug: 'unlisted' })), false)
})
