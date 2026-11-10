import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { after, before, test } from 'node:test'
import { createServer, type ViteDevServer } from 'vite'
import type { PhysicalCatalogProduct } from '../../packages/cms/src/lib/commerce.ts'
import { makeBundle, makeProduct, makeSnapshot } from '../support/fixtures.ts'

let server: ViteDevServer
let routes: typeof import('../../apps/web/src/static-routes.ts')
let seo: typeof import('../../apps/web/src/seo.ts')
const origin = 'https://www.designingminds.co.za'

before(async () => {
  server = await createServer({
    configFile: false,
    root: fileURLToPath(new URL('../../apps/web', import.meta.url)),
    server: { middlewareMode: true, hmr: false }, appType: 'custom',
    ssr: { noExternal: ['@designing-minds/cms', '@designing-minds/utils'] },
  })
  routes = await server.ssrLoadModule('/src/static-routes.ts') as typeof routes
  seo = await server.ssrLoadModule('/src/seo.ts') as typeof seo
})
after(async () => { await server?.close() })

const physical = (overrides: Partial<PhysicalCatalogProduct> = {}): PhysicalCatalogProduct => ({
  id: 'gift', slug: 'large-gift-bag', title: 'Large Christmas gift bag', shortDescription: 'A thoughtful gift with a personalised keyring.',
  fullDescription: 'Choose a name for the included keyring.', productType: 'physical', priceZar: 235,
  pricingMode: 'fixed', pricingFieldKey: null, billableCharacters: null, customizationRules: [],
  galleryImages: [{ id: 'image', storageKey: 'private-provider-key', url: '/images/gift-bag.svg', filename: 'gift-bag.svg', alt: 'Christmas gift bag', width: 800, height: 600 }],
  variants: [{ id: 'large', sku: 'GIFT-LARGE', optionValues: { size: 'Large' }, unitPriceZar: null, available: true }],
  published: true,
  ...overrides,
})

const structuredData = (head: string) => [...head.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((match) => JSON.parse(match[1]) as Record<string, unknown>)

test('physical public products are prerendered and match the same /shop URL space', () => {
  const snapshot = makeSnapshot({ products: [makeProduct({ slug: 'maths' })], bundles: [makeBundle({ slug: 'bundle' })], physicalCatalog: [physical()] })
  const generated = routes.getPublicRoutes(snapshot)
  assert.ok(generated.some((route) => route.path === '/shop/maths'))
  assert.ok(generated.some((route) => route.path === '/shop/bundle'))
  assert.deepEqual(generated.find((route) => route.path === '/shop/large-gift-bag'), { path: '/shop/large-gift-bag', kind: 'product', productSlug: 'large-gift-bag' })
  assert.deepEqual(routes.matchPath('/shop/large-gift-bag/', snapshot), { path: '/shop/large-gift-bag', kind: 'product', productSlug: 'large-gift-bag' })
  assert.equal(routes.matchPath('/shop/not-a-product', snapshot), null)
  assert.equal(routes.matchPath('/checkout/payment/sample', snapshot), null)
  assert.match(seo.sitemapXml(generated, origin), /https:\/\/www\.designingminds\.co\.za\/shop\/large-gift-bag/)
})

test('private physical drafts do not create public routes or metadata', () => {
  const snapshot = makeSnapshot({ physicalProducts: [physical() as never] })
  assert.equal(routes.matchPath('/shop/large-gift-bag', snapshot), null)
  assert.ok(!routes.getPublicRoutes(snapshot).some((route) => route.path === '/shop/large-gift-bag'))
  assert.throws(() => seo.pageMetaFor({ path: '/shop/large-gift-bag', kind: 'product', productSlug: 'large-gift-bag' }, snapshot, origin), /no product or bundle/)
})

test('physical metadata uses product copy and gallery image without invented education/download claims', () => {
  const snapshot = makeSnapshot({ physicalCatalog: [physical()] })
  const route = routes.matchPath('/shop/large-gift-bag', snapshot)!
  const meta = seo.pageMetaFor(route, snapshot, 'http://localhost:5191')
  assert.deepEqual(meta, {
    title: 'Large Christmas gift bag | Designing Minds', description: 'A thoughtful gift with a personalised keyring.',
    canonical: `${origin}/shop/large-gift-bag`, ogType: 'product', image: `${origin}/images/gift-bag.svg`, imageAlt: 'Christmas gift bag', imageWidth: 800, imageHeight: 600,
  })
  const head = seo.renderHead(route, snapshot, origin)
  assert.match(head, /property="og:image:width" content="800"/)
  assert.match(head, /property="og:image:alt" content="Christmas gift bag"/)
  assert.doesNotMatch(head, /LearningResource|educationalLevel|Instant download|CAPS|storageKey|private-provider-key|customizationRules/)
  const product = structuredData(head).find((entry) => entry['@type'] === 'Product')!
  const offers = product.offers as Record<string, unknown>[]
  assert.equal(offers[0].price, 235)
  assert.equal(offers[0].availability, 'https://schema.org/InStock')
})

test('offer availability and price follow each public variant, including out-of-stock variants', () => {
  const product = physical({ variants: [
    { id: 'large', sku: 'LARGE', optionValues: { size: 'Large' }, unitPriceZar: 245, available: false },
    { id: 'small', sku: 'SMALL', optionValues: { size: 'Small' }, unitPriceZar: 165, available: true },
  ] })
  const snapshot = makeSnapshot({ physicalCatalog: [product] })
  const head = seo.renderHead(routes.matchPath('/shop/large-gift-bag', snapshot)!, snapshot, origin)
  const data = structuredData(head).find((entry) => entry['@type'] === 'Product')!
  const offers = data.offers as Record<string, unknown>[]
  assert.deepEqual(offers.map((offer) => [offer.price, offer.availability]), [[245, 'https://schema.org/OutOfStock'], [165, 'https://schema.org/InStock']])
})

test('name-based pricing is a letter rate instead of a misleading fixed whole-product price', () => {
  const product = physical({ priceZar: 30, pricingMode: 'per_character', pricingFieldKey: 'name', billableCharacters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' })
  const snapshot = makeSnapshot({ physicalCatalog: [product] })
  const data = structuredData(seo.renderHead(routes.matchPath('/shop/large-gift-bag', snapshot)!, snapshot, origin)).find((entry) => entry['@type'] === 'Product')!
  const offer = (data.offers as Record<string, unknown>[])[0]
  assert.equal(offer.price, undefined)
  assert.deepEqual(offer.priceSpecification, { '@type': 'UnitPriceSpecification', price: 30, priceCurrency: 'ZAR', unitText: 'letter', referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitText: 'letter' } })
  assert.doesNotMatch(JSON.stringify(data), /ABCDEFGHIJKLMNOPQRSTUVWXYZ|pricingFieldKey|billableCharacters/)
})

test('unsafe gallery URLs are ignored and blank physical descriptions get a physical fallback', () => {
  const product = physical({ shortDescription: '', galleryImages: [{ id: 'bad', storageKey: 'key', filename: '', url: 'javascript:alert(1)', alt: '' }] })
  const snapshot = makeSnapshot({ physicalCatalog: [product] })
  const meta = seo.pageMetaFor(routes.matchPath('/shop/large-gift-bag', snapshot)!, snapshot, origin)
  assert.equal(meta.image, `${origin}/og-image.png`)
  assert.match(meta.description, /Delivery availability/)
  assert.doesNotMatch(meta.description, /CAPS|download|Grade/)
  const head = seo.renderHead(routes.matchPath('/shop/large-gift-bag', snapshot)!, snapshot, origin)
  assert.doesNotMatch(head, /javascript:/)
})

test('the mixed shop ItemList includes physical URLs while old digital-only metadata is preserved', () => {
  const snapshot = makeSnapshot({ products: [makeProduct({ slug: 'maths' })], bundles: [makeBundle({ slug: 'bundle' })], physicalCatalog: [physical()] })
  const head = seo.renderHead({ path: '/shop', kind: 'static' }, snapshot, origin)
  const list = structuredData(head).find((entry) => entry['@type'] === 'ItemList')!
  assert.equal(list.numberOfItems, 3)
  assert.match(head, /resources, gifts &amp; keyrings/)
  assert.match(JSON.stringify(list), /large-gift-bag/)
  assert.match(seo.pageMetaFor({ path: '/shop', kind: 'static' }, makeSnapshot(), origin).title, /Shop CAPS-aligned resources/)
})

test('physical titles cannot break out of HTML tags or the JSON-LD script', () => {
  const product = physical({ title: '</script><script>alert(1)</script>' })
  const snapshot = makeSnapshot({ physicalCatalog: [product] })
  const head = seo.renderHead(routes.matchPath('/shop/large-gift-bag', snapshot)!, snapshot, origin)
  assert.doesNotMatch(head, /<script>alert/)
  assert.match(head, /&lt;\/script&gt;/)
  assert.match(head, /\\u003c\/script>/)
})
