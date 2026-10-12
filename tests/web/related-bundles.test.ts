import assert from 'node:assert/strict'
import test from 'node:test'
import type { Bundle, CmsSnapshot } from '../../packages/cms/src/types.ts'
import { relatedBundles } from '../../packages/cms/src/lib/formatters.ts'

const bundle = (slug: string, overrides: Partial<Bundle> = {}): Bundle => ({
  id: slug, slug, title: slug, shortDescription: '', fullDescription: '',
  priceZar: 100, grade: 'Grade 4', term: 'Term 1', year: '2026', bundleScope: 'Term',
  galleryImages: [], previewPdfs: [], featured: false, published: true, status: 'published',
  sortOrder: 0, seo: { title: '', description: '' }, faqs: [], updatedAt: '',
  includedProductIds: [], includedProductSlugs: [], ...overrides,
})
const snapshot = (bundles: Bundle[]) => ({ bundles }) as CmsSnapshot

test('bundle suggestions stay in the same grade and exclude the current bundle and drafts', () => {
  const current = bundle('current')
  const data = snapshot([current, bundle('matching'), bundle('other-grade', { grade: 'Grade 5' }), bundle('draft', { published: false })])
  assert.deepEqual(relatedBundles(data, current).map((entry) => entry.slug), ['matching'])
})

test('same-term bundles lead, then catalogue order and title provide stable ordering', () => {
  const current = bundle('current')
  const data = snapshot([
    bundle('later-term', { term: 'Term 2', sortOrder: -10 }),
    bundle('same-term-last', { sortOrder: 5 }),
    bundle('b', { sortOrder: 1 }), bundle('a', { sortOrder: 1 }),
  ])
  const before = data.bundles.map((entry) => entry.slug)
  assert.deepEqual(relatedBundles(data, current).map((entry) => entry.slug), ['a', 'b', 'same-term-last', 'later-term'])
  assert.deepEqual(data.bundles.map((entry) => entry.slug), before)
})

test('suggestions honour the limit and return nothing when there are no other relevant bundles', () => {
  const current = bundle('current')
  const data = snapshot([bundle('a'), bundle('b')])
  assert.equal(relatedBundles(data, current, 1).length, 1)
  assert.deepEqual(relatedBundles(data, current, 0), [])
  assert.deepEqual(relatedBundles(data, current, -1), [])
  assert.deepEqual(relatedBundles(snapshot([current]), current), [])
  assert.deepEqual(relatedBundles(snapshot([]), current), [])
})
