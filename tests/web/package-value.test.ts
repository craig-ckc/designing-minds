import assert from 'node:assert/strict'
import test from 'node:test'
import type { CmsSnapshot, Product } from '../../packages/cms/src/types.ts'
import { packageValue, packagesContaining, packagesForGrade } from '../../packages/cms/src/lib/formatters.ts'

const product = (overrides: Partial<Product> & Pick<Product, 'slug'>): Product => ({
  id: overrides.slug,
  title: overrides.slug,
  shortDescription: '',
  fullDescription: '',
  priceZar: 0,
  grade: 'Grade 3',
  term: 'Term 1',
  year: '2026',
  productKind: 'Single',
  resourceFormat: 'Test / Assessment',
  subjects: ['Mathematics'],
  marks: null,
  purchasedFiles: [],
  featured: false,
  published: true,
  sortOrder: 0,
  seo: { title: '', description: '' },
  faqs: [],
  updatedAt: '2026-01-01',
  ...overrides,
})

const snapshot = (products: Product[]) => ({ products }) as CmsSnapshot

test('a bundle states what it saves against buying the same resources singly', () => {
  const snap = snapshot([
    product({ slug: 'maths', priceZar: 60, subjects: ['Mathematics'], term: 'Term 1' }),
    product({ slug: 'english', priceZar: 60, subjects: ['English HL'], term: 'Term 2' }),
    product({ slug: 'afrikaans', priceZar: 50, subjects: ['Afrikaans FAL'], term: 'Term 2' }),
    product({
      slug: 'term-bundle',
      productKind: 'Bundle',
      priceZar: 140,
      includedProductSlugs: ['maths', 'english', 'afrikaans'],
    }),
  ])

  const value = packageValue(snap, snap.products[3])

  assert.ok(value)
  assert.equal(value.itemCount, 3)
  assert.equal(value.singlesTotalZar, 170)
  assert.equal(value.savingZar, 30)
  assert.equal(value.savingPercent, 18)
  assert.deepEqual(value.subjects, ['Afrikaans FAL', 'English HL', 'Mathematics'])
  assert.deepEqual(value.terms, ['Term 1', 'Term 2'])
})

test('an unpublished included resource is left out of the value claim', () => {
  const snap = snapshot([
    product({ slug: 'maths', priceZar: 60 }),
    product({ slug: 'draft', priceZar: 60, published: false }),
    product({ slug: 'bundle', productKind: 'Bundle', priceZar: 50, includedProductSlugs: ['maths', 'draft'] }),
  ])

  const value = packageValue(snap, snap.products[2])

  assert.ok(value)
  assert.equal(value.itemCount, 1)
  assert.equal(value.singlesTotalZar, 60)
})

test('a package listing nothing yet reports no value rather than a R0 saving', () => {
  const snap = snapshot([product({ slug: 'empty', productKind: 'Bundle', priceZar: 300 })])

  assert.equal(packageValue(snap, snap.products[0]), null)
})

test('a package priced above its parts never advertises a negative saving', () => {
  const snap = snapshot([
    product({ slug: 'maths', priceZar: 40 }),
    product({ slug: 'overpriced', productKind: 'Bundle', priceZar: 90, includedProductSlugs: ['maths'] }),
  ])

  const value = packageValue(snap, snap.products[1])

  assert.ok(value)
  assert.equal(value.savingZar, 0)
  assert.equal(value.savingPercent, 0)
})

test('grade packages exclude singles and lead with the cheapest entry point', () => {
  const snap = snapshot([
    product({ slug: 'single', grade: 'Grade 4' }),
    product({ slug: 'year', productKind: 'Bundle', grade: 'Grade 4', priceZar: 1200 }),
    product({ slug: 'term', productKind: 'Bundle', grade: 'Grade 4', priceZar: 350 }),
    product({ slug: 'plan', productKind: 'Access Plan', grade: 'Grade 4', priceZar: 400 }),
    product({ slug: 'other-grade', productKind: 'Bundle', grade: 'Grade 5', priceZar: 100 }),
  ])

  assert.deepEqual(
    packagesForGrade(snap, 'Grade 4').map((entry) => entry.slug),
    ['term', 'plan', 'year'],
  )
})

test('a single resource can find the packages that already include it', () => {
  const snap = snapshot([
    product({ slug: 'maths' }),
    product({ slug: 'year', productKind: 'Bundle', priceZar: 1200, includedProductSlugs: ['maths'] }),
    product({ slug: 'term', productKind: 'Bundle', priceZar: 350, includedProductSlugs: ['maths'] }),
    product({ slug: 'unrelated', productKind: 'Bundle', priceZar: 90, includedProductSlugs: ['english'] }),
  ])

  assert.deepEqual(
    packagesContaining(snap, snap.products[0]).map((entry) => entry.slug),
    ['term', 'year'],
  )
})

test('an unpublished package never cross-sells itself on a resource page', () => {
  const snap = snapshot([
    product({ slug: 'maths' }),
    product({ slug: 'draft', productKind: 'Bundle', published: false, includedProductSlugs: ['maths'] }),
  ])

  assert.deepEqual(packagesContaining(snap, snap.products[0]), [])
})
