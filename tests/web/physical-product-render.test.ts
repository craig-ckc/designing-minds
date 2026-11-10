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
let ShopPage: ComponentType
let PhysicalProductCard: ComponentType<{ product: PhysicalCatalogProduct }>
let CatalogContext: typeof import('../../apps/web/src/lib/catalog.tsx').CatalogContext
let selectPhysicalVariant: typeof import('../../apps/web/src/lib/physical-variants.ts').selectPhysicalVariant
let physicalSelectionMessage: typeof import('../../apps/web/src/lib/physical-variants.ts').physicalSelectionMessage
let optionColour: typeof import('../../apps/web/src/lib/product-option-colours.ts').optionColour

before(async () => {
  server = await createServer({
    configFile: false,
    root: fileURLToPath(new URL('../../apps/web', import.meta.url)),
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
    ssr: { noExternal: ['@designing-minds/cms', '@designing-minds/utils'] },
  })
  ;({ ProductPage } = await server.ssrLoadModule('/src/pages/product-page.tsx'))
  ;({ ShopPage } = await server.ssrLoadModule('/src/pages/shop-page.tsx'))
  ;({ PhysicalProductCard } = await server.ssrLoadModule('/src/components/ui/physical-product-card.tsx'))
  ;({ selectPhysicalVariant, physicalSelectionMessage } = await server.ssrLoadModule('/src/lib/physical-variants.ts'))
  ;({ optionColour } = await server.ssrLoadModule('/src/lib/product-option-colours.ts'))
  ;({ CatalogContext } = await server.ssrLoadModule('/src/lib/catalog.tsx'))
})
after(async () => { await server?.close() })

const keyring = (overrides: Partial<PhysicalCatalogProduct> = {}): PhysicalCatalogProduct => ({
  id: 'keyring', slug: 'sample-keyring', title: 'Sample personalised clicker keyring',
  shortDescription: 'Each letter clicks.', fullDescription: 'A sample **3D-printed** keyring.',
  productType: 'physical', priceZar: 30, pricingMode: 'per_character',
  pricingFieldKey: 'name', billableCharacters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  customizationRules: [{ key: 'name', label: 'Child’s name', type: 'text', required: true, constraints: { minLength: 1, maxLength: 12, allowedCharacters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz' } }],
  galleryImages: [{ id: 'sample', storageKey: 'sample.svg', url: 'http://127.0.0.1:58012/preview-media/keyring.svg', filename: 'keyring.svg', alt: 'Local sample keyring illustration' }],
  variants: [
    { id: 'pink', sku: null, optionValues: { colour: 'Pink' }, unitPriceZar: null, available: true },
    { id: 'blue', sku: null, optionValues: { colour: 'Blue' }, unitPriceZar: null, available: false },
  ], published: true,
  ...overrides,
})

const bag = (overrides: Partial<PhysicalCatalogProduct> = {}): PhysicalCatalogProduct => keyring({
  id: 'large-bag', slug: 'sample-large-bag', title: 'Sample large Christmas gift bag', priceZar: 235,
  pricingMode: 'fixed', pricingFieldKey: null, billableCharacters: null,
  customizationRules: [{ key: 'teacherName', label: 'Teacher’s name', type: 'text', required: true, constraints: { minLength: 2, maxLength: 60, allowSpaces: true } }],
  variants: [{ id: 'large', sku: null, optionValues: {}, unitPriceZar: null, available: true }],
  ...overrides,
})

const render = (path: string, snapshot: CmsSnapshot) => renderToStaticMarkup(
  createElement(CatalogContext.Provider, {
    value: { state: { snapshot, status: 'ready', error: null }, actions: { retry: () => {} }, meta: { now: Date.UTC(2026, 0, 1) } },
  }, createElement(MemoryRouter, { initialEntries: [path] },
    createElement(Routes, null,
      createElement(Route, { path: '/shop', element: createElement(ShopPage) }),
      createElement(Route, { path: '/shop/:slug', element: createElement(ProductPage) }),
    ),
  )),
).replace(/\u00a0/g, ' ')

test('a keyring uses the existing product URL with required name, colour options and per-letter pricing', () => {
  const html = render('/shop/sample-keyring', makeSnapshot({ physicalCatalog: [keyring()] }))
  assert.match(html, /<h1[^>]*>Sample personalised clicker keyring<\/h1>/)
  assert.match(html, /R 30 per letter/)
  assert.match(html, /Child’s name<span[^>]*aria-hidden="true"[^>]*>\*<\/span>/)
  assert.match(html, /id="custom-keyring-name"[^>]*required=""/)
  assert.match(html, /Up to 12 characters/)
  assert.match(html, /<legend[^>]*>Colour<\/legend>/)
  assert.match(html, /<input(?=[^>]*type="radio")(?=[^>]*name="variant-keyring-colour")(?=[^>]*value="Pink")(?=[^>]*checked="")[^>]*>/)
  assert.match(html, /<input(?=[^>]*type="radio")(?=[^>]*value="Blue")(?=[^>]*disabled="")[^>]*>/)
  assert.match(html, /Out of stock/)
  assert.doesNotMatch(html, /<select|>Personalisation</)
  assert.ok(html.indexOf('id="custom-keyring-name"') < html.indexOf('name="variant-keyring-colour"'))
  assert.match(html, /<form[^>]*novalidate=""/i)
  assert.match(html, /type="submit"/)
  assert.match(html, /Add to cart/)
  assert.doesNotMatch(html, /Instant download|Grade null|purchasedFiles|digital resource/i)
})

test('a large gift bag requires the teacher name without using digital classification fields', () => {
  const html = render('/shop/sample-large-bag', makeSnapshot({ physicalCatalog: [bag()] }))
  assert.match(html, /Teacher’s name<span[^>]*aria-hidden="true"[^>]*>\*<\/span>/)
  assert.match(html, /required=""/)
  assert.match(html, /R 235/)
  assert.doesNotMatch(html, /per letter|Grade [0-9]|Resource details|Download/)
})

test('an out-of-stock physical listing exposes its state and disables purchase', () => {
  const product = keyring({ variants: keyring().variants.map((variant) => ({ ...variant, available: false })) })
  const html = render('/shop/sample-keyring', makeSnapshot({ physicalCatalog: [product] }))
  assert.match(html, /Out of stock/)
  assert.match(html, /<button[^>]*type="submit"[^>]*disabled=""/)
  assert.doesNotMatch(html, />Add to cart</)
})

test('product text and gallery alternative text are escaped rather than interpreted as markup', () => {
  const product = keyring({ title: '<script>bad()</script>', galleryImages: [] })
  const html = render('/shop/sample-keyring', makeSnapshot({ physicalCatalog: [product] }))
  assert.match(html, /&lt;script&gt;bad\(\)&lt;\/script&gt;/)
  assert.doesNotMatch(html, /<script>bad\(\)/)
  assert.match(html, /role="img" aria-label="&lt;script&gt;bad\(\)&lt;\/script&gt; product preview not available"/)
})

test('physical cards show a product preview and per-letter rate without digital cover or stock counts', () => {
  const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(PhysicalProductCard, { product: keyring() }))).replace(/\u00a0/g, ' ')
  assert.match(html, /alt="Local sample keyring illustration"/)
  assert.match(html, /R 30 per letter/)
  assert.match(html, /href="\/shop\/sample-keyring"/)
  assert.doesNotMatch(html, /Grade [0-9]|onHand|stock count/)
})

test('one shop combines digital and physical entries and offers a visible gift category', () => {
  const snapshot = makeSnapshot({ products: [makeProduct({ slug: 'maths', title: 'Digital Maths resource', priceZar: 60 })], physicalCatalog: [keyring(), bag()] })
  const html = render('/shop', snapshot)
  assert.match(html, /All products/)
  assert.match(html, /Digital resources/)
  assert.match(html, /Gifts &amp; keyrings/)
  assert.match(html, /Digital Maths resource/)
  assert.match(html, /Sample personalised clicker keyring/)
  assert.match(html, /Sample large Christmas gift bag/)
  assert.match(html, /3 results/)
})

test('gift category and search use the same shop while educational filters do not claim physical matches', () => {
  const snapshot = makeSnapshot({ products: [makeProduct({ slug: 'maths', title: 'Digital Maths resource' })], physicalCatalog: [keyring(), bag()] })
  const gifts = render('/shop?type=physical', snapshot)
  assert.match(gifts, /Sample personalised clicker keyring/)
  assert.doesNotMatch(gifts, /Digital Maths resource/)
  const digital = render('/shop?type=digital', snapshot)
  assert.match(digital, /Digital Maths resource/)
  assert.doesNotMatch(digital, /Sample personalised clicker keyring/)
  const search = render('/shop?q=Christmas', snapshot)
  assert.match(search, /Sample large Christmas gift bag/)
  assert.doesNotMatch(search, /Sample personalised clicker keyring|Digital Maths resource/)
  const grade = render('/shop?grade=Grade+3', snapshot)
  assert.match(grade, /Digital Maths resource/)
  assert.doesNotMatch(grade, /Sample personalised clicker keyring|Sample large Christmas gift bag/)
})

test('a database without physical listings retains the digital shop language', () => {
  const html = render('/shop', makeSnapshot({ products: [makeProduct({ slug: 'maths' })] }))
  assert.match(html, /All resources/)
  assert.doesNotMatch(html, /Gifts &amp; keyrings|Product category/)
})

test('choosing an option can reach a valid variant when there is no combination with the previous choices', () => {
  const variants = [
    { id: 'pink-small', sku: null, optionValues: { colour: 'Pink', size: 'Small' }, unitPriceZar: null, available: true },
    { id: 'blue-large', sku: null, optionValues: { colour: 'Blue', size: 'Large' }, unitPriceZar: null, available: true },
  ]
  assert.equal(selectPhysicalVariant(variants, variants[0], 'colour', 'Blue')?.id, 'blue-large')
  const html = render('/shop/sample-keyring', makeSnapshot({ physicalCatalog: [keyring({ variants })] }))
  assert.match(html, /type="radio"[^>]*value="Blue"/)
  assert.doesNotMatch(html, /<input(?=[^>]*type="radio")(?=[^>]*value="Blue")(?=[^>]*disabled)[^>]*>/)
})

test('sizes are visible single-choice options and the price-driving name is the first question', () => {
  const product = keyring({
    customizationRules: [
      { key: 'size', label: 'Size', type: 'select', required: true, options: ['Small', 'Medium', 'Large'] },
      ...keyring().customizationRules,
    ],
  })
  const html = render('/shop/sample-keyring', makeSnapshot({ physicalCatalog: [product] }))
  assert.ok(html.indexOf('id="custom-keyring-name"') < html.indexOf('name="custom-keyring-size"'))
  for (const size of ['Small', 'Medium', 'Large']) {
    assert.match(html, new RegExp(`<input(?=[^>]*type="radio")(?=[^>]*name="custom-keyring-size")(?=[^>]*value="${size}")(?=[^>]*required="")[^>]*>`))
  }
  assert.doesNotMatch(html, /<select/)
  assert.match(html, /<label[^>]*text-primary-ink[^>]*>Child’s name/)
  assert.match(html, /\(required\)/)
})

test('variant size choices expose every option and mark unavailable sizes as disabled', () => {
  const variants = [
    { id: 'small', sku: null, optionValues: { size: 'Small' }, unitPriceZar: null, available: true },
    { id: 'large', sku: null, optionValues: { size: 'Large' }, unitPriceZar: null, available: false },
  ]
  const html = render('/shop/sample-keyring', makeSnapshot({ physicalCatalog: [keyring({ variants })] }))
  assert.match(html, /<legend[^>]*>Size<\/legend>/)
  assert.match(html, /<input(?=[^>]*type="radio")(?=[^>]*name="variant-keyring-size")(?=[^>]*value="Small")(?=[^>]*checked="")[^>]*>/)
  assert.match(html, /<input(?=[^>]*type="radio")(?=[^>]*name="variant-keyring-size")(?=[^>]*value="Large")(?=[^>]*disabled="")[^>]*>/)
})

test('optional selections offer a way to remove the selection', () => {
  const product = bag({ customizationRules: [{ key: 'ribbon', label: 'Ribbon', type: 'select', required: false, options: ['Satin', 'Cotton'] }] })
  const html = render('/shop/sample-large-bag', makeSnapshot({ physicalCatalog: [product] }))
  assert.match(html, /type="radio"[^>]*name="custom-large-bag-ribbon"[^>]*checked=""[^>]*value=""/)
  assert.match(html, />None<\/span>/)
  assert.doesNotMatch(html, /required=""/)
})

test('colour swatches support labelled names and exact hex values without inventing unknown finishes', () => {
  assert.equal(optionColour('Pink'), '#f3a0c2')
  assert.equal(optionColour('#AABBCC'), '#aabbcc')
  assert.equal(optionColour('Rainbow glitter'), undefined)
  assert.equal(optionColour('constructor'), undefined)
  assert.equal(optionColour('url(https://example.test/a.svg)'), undefined)
  const html = render('/shop/sample-keyring', makeSnapshot({ physicalCatalog: [keyring({ variants: [
    { id: 'pink', sku: null, optionValues: { colour: 'Pink' }, unitPriceZar: null, available: true },
    { id: 'finish', sku: null, optionValues: { colour: 'Rainbow glitter' }, unitPriceZar: null, available: true },
  ] })] }))
  assert.match(html, /background-color:#f3a0c2/)
  assert.match(html, />Rainbow glitter<\/span>/)
})

test('an out-of-stock card retains the actual variant price rather than reverting to an unrelated base price', () => {
  const product = bag({ priceZar: 100, variants: [{ id: 'large', sku: null, optionValues: {}, unitPriceZar: 235, available: false }] })
  const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(PhysicalProductCard, { product }))).replace(/\u00a0/g, ' ')
  assert.match(html, /R 235/)
  assert.doesNotMatch(html, /R 100/)
})

test('custom field keys matching Object prototype properties still start with an empty input', () => {
  const product = bag({ customizationRules: [{ key: 'constructor', label: 'Teacher’s name', type: 'text', required: true }] })
  const html = render('/shop/sample-large-bag', makeSnapshot({ physicalCatalog: [product] }))
  assert.match(html, /id="custom-large-bag-constructor"[^>]*value=""/)
  assert.doesNotMatch(html, /function Object|native code/)
})

test('customer validation uses question labels and useful constraints rather than internal field keys', () => {
  assert.equal(physicalSelectionMessage(bag(), 'Customization value "teacherName" is required.'), 'Teacher’s name is required.')
  assert.equal(physicalSelectionMessage(bag(), 'Customization value "teacherName" is shorter than minLength.'), 'Enter at least 2 characters for Teacher’s name.')
  assert.equal(physicalSelectionMessage(keyring(), 'Customization value "name" is longer than maxLength.'), 'Use no more than 12 characters for Child’s name.')
  assert.equal(physicalSelectionMessage(keyring(), 'Customization value "name" contains a character that is not allowed.'), 'Use the allowed characters for Child’s name.')
  assert.equal(physicalSelectionMessage(keyring(), 'Quantity must be a positive whole number.'), 'Quantity must be a positive whole number.')
})
