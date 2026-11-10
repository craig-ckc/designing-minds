import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { after, before, test } from 'node:test'
import { createElement, type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer, type ViteDevServer } from 'vite'
import type { Bundle, CmsSnapshot } from '../../packages/cms/src/types.ts'
import { makeProduct } from '../support/fixtures.ts'

let server: ViteDevServer
let GradePackageSection: ComponentType<{ snapshot: CmsSnapshot; grade: string }>
before(async () => {
  server = await createServer({ configFile: false, root: fileURLToPath(new URL('../../apps/web', import.meta.url)),
    server: { middlewareMode: true, hmr: false }, appType: 'custom', ssr: { noExternal: ['@designing-minds/cms', '@designing-minds/utils'] } })
  ;({ GradePackageSection } = await server.ssrLoadModule('/src/components/sections/grade-package-section.tsx'))
})
after(async () => { await server?.close() })

const product = makeProduct({ slug: 'english', title: 'Grade 3 English test', subjects: ['English'], priceZar: 250 })
const bundle = (id: string, overrides: Partial<Bundle> = {}) => ({
  id, slug: id, title: `Grade 3 ${id} bundle`, grade: 'Grade 3', term: 'Term 4', priceZar: 200,
  shortDescription: 'Tests with memorandums, ready to print.', published: true, sortOrder: 0,
  includedProductIds: [product.id], includedProductSlugs: [product.slug], ...overrides,
}) as Bundle
const render = (bundles: Bundle[]) => renderToStaticMarkup(createElement(MemoryRouter, null,
  createElement(GradePackageSection, { grade: 'Grade 3', snapshot: { bundles, products: [product] } as CmsSnapshot }),
)).replaceAll('\u00a0', ' ')

test('one bundle uses the shared catalogue grid and standard bundle card', () => {
  const html = render([bundle('term-4')])
  assert.match(html, /Bundles for Grade 3/)
  assert.match(html, /class="catalog-grid"/)
  assert.match(html, /class="catalog-card-media"/)
  assert.match(html, /<h2 class="text-body-lg font-semibold tracking-normal"/)
  assert.match(html, /href="\/shop\/term-4"/)
  assert.match(html, /href="\/packages\?grade=Grade%203"/)
  assert.match(html, /Save 20%/)
  assert.match(html, /<s[^>]*>R 250<\/s>/)
  assert.match(html, /Bundle price <\/span>R 200/)
  assert.match(html, /aria-label="Add Grade 3 term-4 bundle to cart"/)
  assert.doesNotMatch(html, /Add to cart<\/button>|bg-primary-tint|Less prep, more practice|sm:grid-cols-/)
})

test('every bundle count uses the same catalogue grid without layout variants', () => {
  for (const count of [2, 3, 4]) {
    const html = render(Array.from({ length: count }, (_, index) => bundle(`bundle-${index}`)))
    assert.equal((html.match(/catalog-card-bundle/g) ?? []).length, count)
    assert.match(html, /class="catalog-grid"/)
    assert.doesNotMatch(html, /lg:grid-cols-|xl:grid-cols-/)
    assert.doesNotMatch(html, /Add to cart<\/button>/)
    assert.doesNotMatch(html, /Buying the term or full year together costs less/)
  }
})

test('empty, unpublished and other-grade selections do not render a promotion', () => {
  assert.equal(render([]), '')
  assert.equal(render([bundle('draft', { published: false }), bundle('other', { grade: 'Grade 4' })]), '')
})

test('the section does not claim savings when the member prices cannot support them', () => {
  const html = render([bundle('no-members', { includedProductIds: [], includedProductSlugs: [] })])
  assert.doesNotMatch(html, /Save \d+%|<s\b/)
  assert.match(html, /R 200/)
})

test('large selections retain the bounded initial render and load-more action', () => {
  const html = render(Array.from({ length: 49 }, (_, index) => bundle(`bundle-${index}`)))
  assert.equal((html.match(/catalog-card-bundle/g) ?? []).length, 48)
  assert.match(html, /Load more bundles/)
  assert.match(html, /1 remaining/)
})
