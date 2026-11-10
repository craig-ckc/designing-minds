import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { after, before, test } from 'node:test'
import { createElement, type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { createServer, type ViteDevServer } from 'vite'
import type { PhysicalCatalogProduct } from '../../packages/cms/src/lib/commerce.ts'
import type { CmsSnapshot } from '../../packages/cms/src/types.ts'
import { makeProduct, makeSnapshot } from '../support/fixtures.ts'

let server: ViteDevServer
let ProductPage: ComponentType
let RelatedPhysicalProducts: ComponentType<{ product: PhysicalCatalogProduct; catalog: PhysicalCatalogProduct[] }>
let CatalogContext: typeof import('../../apps/web/src/lib/catalog.tsx').CatalogContext

before(async () => {
  server = await createServer({
    configFile: false,
    root: fileURLToPath(new URL('../../apps/web', import.meta.url)),
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
    ssr: { noExternal: ['@designing-minds/cms', '@designing-minds/utils'] },
  })
  ;({ ProductPage } = await server.ssrLoadModule('/src/pages/product-page.tsx'))
  ;({ RelatedPhysicalProducts } = await server.ssrLoadModule('/src/components/related-physical-products.tsx'))
  ;({ CatalogContext } = await server.ssrLoadModule('/src/lib/catalog.tsx'))
})
after(async () => { await server?.close() })

const gift = (slug: string, overrides: Partial<PhysicalCatalogProduct> = {}): PhysicalCatalogProduct => ({
  id: slug, slug, title: `Gift ${slug}`, shortDescription: 'A thoughtful gift.', fullDescription: '',
  productType: 'physical', priceZar: 165, pricingMode: 'fixed', pricingFieldKey: null,
  billableCharacters: null, customizationRules: [], galleryImages: [],
  variants: [{ id: `${slug}-variant`, sku: null, optionValues: {}, unitPriceZar: null, available: true }],
  published: true, ...overrides,
})

const renderRelated = (product: PhysicalCatalogProduct, catalog: PhysicalCatalogProduct[]) =>
  renderToStaticMarkup(createElement(MemoryRouter, null, createElement(RelatedPhysicalProducts, { product, catalog })))

const renderPage = (snapshot: CmsSnapshot) => renderToStaticMarkup(
  createElement(CatalogContext.Provider, {
    value: { state: { snapshot, status: 'ready', error: null }, actions: { retry: () => {} }, meta: { now: Date.UTC(2026, 0, 1) } },
  }, createElement(MemoryRouter, { initialEntries: ['/shop/current'] },
    createElement(Routes, null, createElement(Route, { path: '/shop/:slug', element: createElement(ProductPage) })),
  )),
)

test('physical details end with other curated physical products and a category link', () => {
  const html = renderPage(makeSnapshot({
    products: [makeProduct({ slug: 'digital', title: 'Digital resource' })],
    physicalCatalog: [gift('current'), gift('small'), gift('large')],
  }))
  assert.match(html, /Related products/)
  assert.match(html, /href="\/shop\?type=physical"/)
  assert.match(html, /href="\/shop\/small"/)
  assert.match(html, /href="\/shop\/large"/)
  assert.doesNotMatch(html, /View Gift current|Digital resource/)
  assert.ok(html.indexOf('related-products-heading') > html.indexOf('Continue browsing'))
})

test('related cards exclude current identity, duplicate ids and duplicate URLs', () => {
  const current = gift('current')
  const html = renderRelated(current, [
    current, gift('renamed-current', { id: current.id }), gift(current.slug, { id: 'new-current-id' }),
    gift('small'), gift('renamed-small', { id: 'small' }), gift('small', { id: 'duplicate-small' }), gift('large'),
  ])
  assert.equal((html.match(/<article/g) ?? []).length, 2)
  assert.doesNotMatch(html, /renamed-current|renamed-small|View Gift current/)
})

test('related cards are bounded to four published products', () => {
  const unpublished = { ...gift('draft'), published: false } as unknown as PhysicalCatalogProduct
  const html = renderRelated(gift('current'), [unpublished, ...['one', 'two', 'three', 'four', 'five'].map((slug) => gift(slug))])
  assert.equal((html.match(/<article/g) ?? []).length, 4)
  assert.doesNotMatch(html, /Gift draft|Gift five/)
  assert.match(html, /Gift four/)
})

test('the section is omitted when no other curated published products exist', () => {
  const current = gift('current')
  assert.equal(renderRelated(current, []), '')
  assert.equal(renderRelated(current, [current]), '')
  const html = renderPage(makeSnapshot({ physicalCatalog: [current] }))
  assert.doesNotMatch(html, /Related products|related-products-heading/)
})
