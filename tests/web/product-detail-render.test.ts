import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { after, before, test } from 'node:test'
import { createElement, type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { createServer, type ViteDevServer } from 'vite'
import type { Bundle, CmsSnapshot, Product, ProductImage } from '../../packages/cms/src/types.ts'

let server: ViteDevServer
let ProductPage: ComponentType<{ snapshot: CmsSnapshot }>
let ProductGallery: ComponentType<{ item: Product; images: ProductImage[]; stacked?: boolean }>

before(async () => {
  server = await createServer({
    configFile: false,
    root: fileURLToPath(new URL('../../apps/web', import.meta.url)),
    server: { middlewareMode: true }, appType: 'custom',
    ssr: { noExternal: ['@designing-minds/cms', '@designing-minds/utils'] },
  })
  ;({ ProductPage } = await server.ssrLoadModule('/src/pages/product-page.tsx'))
  ;({ ProductGallery } = await server.ssrLoadModule('/src/components/ui/product-gallery.tsx'))
})
after(async () => { await server?.close() })

const product: Product = {
  id: 'english', slug: 'english', title: 'Grade 4 English HL Term 1 Test',
  shortDescription: 'Focused language practice.', fullDescription: 'A complete **assessment** with a memo.',
  priceZar: 60, grade: 'Grade 4', term: 'Term 1', year: '2026',
  resourceFormat: 'Test / Assessment', subjects: ['English HL'], marks: 30,
  purchasedFiles: [{ id: 'test', filename: 'test.pdf', label: 'Test' }],
  galleryImages: [], previewPdfs: [{ id: 'preview', label: 'Sample', filename: 'sample.pdf', storageKey: 'sample.pdf', url: 'https://example.com/sample.pdf' }],
  featured: false, published: true, status: 'published', sortOrder: 0,
  seo: { title: '', description: '' }, faqs: ['download'], updatedAt: '',
}
const bundle: Bundle = {
  ...product, id: 'bundle', slug: 'bundle', title: 'Grade 4 Term 1 Bundle',
  shortDescription: 'All your term resources together.', fullDescription: 'Bundle description retained.',
  priceZar: 40, bundleScope: 'Term', includedProductIds: [product.id], includedProductSlugs: [product.slug],
}
const snapshot = (resource = product, pack = bundle) => ({
  products: [resource], bundles: [pack],
  faqs: [{ id: 'download', question: 'Where do I download?', answer: 'Open Order Detail after payment.', published: true }],
}) as CmsSnapshot
const renderPage = (slug: string, data = snapshot()) => renderToStaticMarkup(
  createElement(MemoryRouter, { initialEntries: [`/shop/${slug}`] },
    createElement(Routes, null,
      createElement(Route, { path: '/shop/:slug', element: createElement(ProductPage, { snapshot: data }) }),
    ),
  ),
).replace(/\u00a0/g, ' ')

test('both detail views put purchase controls ahead of the collapsible information in a full-width layout', () => {
  for (const slug of [product.slug, bundle.slug]) {
    const html = renderPage(slug)
    assert.match(html, /max-w-none/)
    assert.match(html, /<h1 class="text-2xl/)
    const buy = html.indexOf('Add to cart')
    const firstDisclosure = html.indexOf('<details')
    assert.ok(buy > 0 && buy < firstDisclosure)
    assert.match(html, /<details[^>]*>[\s\S]*<summary/)
    assert.doesNotMatch(html, /<details[^>]*\sopen(?:=|>)/)
    assert.match(html, /order-first/)
  }
})

test('resource information, preview downloads, FAQs and complete licence terms remain in the static page', () => {
  const html = renderPage(product.slug)
  assert.match(html, /A complete <strong>assessment<\/strong> with a memo/)
  assert.match(html, /30 marks/)
  assert.match(html, /HL = Home Language/)
  assert.match(html, /Instant download on Order Detail/)
  assert.match(html, /sample.pdf\?download=Sample.pdf/)
  assert.match(html, /Open Order Detail after payment/)
  assert.match(html, /Each additional user\/classroom must purchase their own copy or licence/)
  assert.match(html, /Terms of Use/)
  assert.match(html, /Ask about classroom licensing/)
  assert.match(html, /Also included in/)
})

test('bundle accordions retain every published member and the derived value comparison', () => {
  const html = renderPage(bundle.slug)
  assert.match(html, /What’s included \(1 resource\)/)
  assert.match(html, /1 downloadable item/)
  assert.match(html, /Bundle description retained/)
  assert.match(html, /Grade 4 English HL Term 1 Test/)
  assert.match(html, /this bundle saves R 20 \(33%\)/)
  assert.match(html, /<s[^>]*>R 60<\/s>/)
  assert.match(html, /Bundle price/)
})

test('placeholder descriptions and missing previews omit their accordions without losing details or the purchase action', () => {
  const html = renderPage(product.slug, snapshot({ ...product, fullDescription: '..', previewPdfs: [] }))
  assert.doesNotMatch(html, /About this resource|Preview before you buy/)
  assert.match(html, /Resource details/)
  assert.match(html, /Add to cart/)
})

test('a bundle with no published members explains the empty contents without claiming savings', () => {
  const html = renderPage(bundle.slug, snapshot({ ...product, published: false }, { ...bundle, fullDescription: '.' }))
  assert.match(html, /Included resources are being finalised/)
  assert.doesNotMatch(html, /About this bundle|this bundle saves|Saves R|<s[\s>]/)
})

test('a gallery with only a cover has no navigation controls or thumbnails', () => {
  const html = renderToStaticMarkup(createElement(ProductGallery, { item: product, images: [] }))
  assert.match(html, /product-gallery-stage/)
  assert.doesNotMatch(html, /<button|Image thumbnails|carousel/)
})

test('gallery thumbnails represent the cover and every upload, with controls outside the media frame', () => {
  const images = Array.from({ length: 16 }, (_, index): ProductImage => ({
    id: `image-${index}`, url: `https://example.com/image-${index}.png`, alt: `Sample page ${index + 1}`,
    width: 595, height: 842, filename: `image-${index}.png`, storageKey: `image-${index}.png`,
  }))
  const html = renderToStaticMarkup(createElement(ProductGallery, { item: product, images, stacked: true }))
  assert.equal((html.match(/aria-label="Show /g) ?? []).length, 17)
  assert.match(html, /aria-label="Show the cover" aria-current="true"/)
  assert.match(html, /Image 1 of 17/)
  assert.match(html, /alt="Sample page 16"/)
  assert.match(html, /aria-label="Previous image"[^>]*disabled/)
  assert.ok(html.indexOf('aria-label="Next image"') > html.indexOf('Image 1 of 17'))
  assert.doesNotMatch(html, /class="absolute (left|right)-0 top-1\/2/)
})
