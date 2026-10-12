import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { after, before, test } from 'node:test'
import { createElement, type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer, type ViteDevServer } from 'vite'
import type { Bundle, CmsSnapshot, Product } from '../../packages/cms/src/types.ts'

let server: ViteDevServer
let ProductCard: ComponentType<{ product: Product }>
let BundleCard: ComponentType<{ bundle: Bundle; snapshot: CmsSnapshot }>
let GradeCard: ComponentType<{ grade: string; count?: number }>

before(async () => {
  // Load the real TSX components through the app's existing Vite toolchain.
  server = await createServer({
    configFile: false,
    root: fileURLToPath(new URL('../../apps/web', import.meta.url)),
    server: { middlewareMode: true },
    appType: 'custom',
    ssr: { noExternal: ['@designing-minds/cms', '@designing-minds/utils'] },
  })
  ;({ ProductCard } = await server.ssrLoadModule('/src/components/ui/product-card.tsx'))
  ;({ BundleCard } = await server.ssrLoadModule('/src/components/ui/bundle-card.tsx'))
  ;({ GradeCard } = await server.ssrLoadModule('/src/components/ui/grade-card.tsx'))
})
after(async () => { await server?.close() })

const product: Product = {
  id: 'maths', slug: 'maths', title: 'Grade 4 Mathematics Term 1',
  shortDescription: 'Build confidence with focused maths practice.', fullDescription: '',
  priceZar: 60, grade: 'Grade 4', term: 'Term 1', year: '2026',
  resourceFormat: 'Test / Assessment', subjects: ['Mathematics'], marks: 30,
  purchasedFiles: [{ id: 'test', filename: 'test.pdf', label: 'Test' }],
  galleryImages: [], previewPdfs: [], featured: false, published: true,
  status: 'published', sortOrder: 0, seo: { title: '', description: '' }, faqs: [], updatedAt: '',
}
const bundle: Bundle = {
  ...product, id: 'bundle', slug: 'bundle', title: 'Grade 4 Term 1 Bundle',
  shortDescription: 'Prepare for the term with resources in one place.', priceZar: 40,
  bundleScope: 'Term', includedProductIds: [product.id], includedProductSlugs: [product.slug],
}
const snapshot = (products: Product[]) => ({ products, bundles: [bundle] }) as CmsSnapshot
const render = (component: ReturnType<typeof createElement>) =>
  renderToStaticMarkup(createElement(MemoryRouter, null, component)).replace(/\u00a0/g, ' ')

test('resource cards render the mini description before price and retain a separate basket button', () => {
  const html = render(createElement(ProductCard, { product }))
  assert.ok(html.includes(product.shortDescription))
  assert.ok(html.includes('R 60'))
  assert.ok(html.indexOf(product.shortDescription) < html.indexOf('R 60'))
  assert.match(html, /href="\/shop\/maths"/)
  assert.match(html, /<button[^>]*aria-label="Add Grade 4 Mathematics Term 1 to cart"/)
  assert.equal((html.match(/<article/g) ?? []).length, 1)
})

test('blank resource descriptions fall back to factual metadata without a PDF claim for archives', () => {
  const html = render(createElement(ProductCard, { product: {
    ...product, shortDescription: ' \n ', purchasedFiles: [{ id: 'zip', label: 'Archive', filename: 'test.zip' }],
  } }))
  assert.match(html, /Test \/ Assessment · 30 marks/)
  assert.doesNotMatch(html, /PDF/)
})

test('sale prices keep the original and sale labels in the redesigned price row', () => {
  const html = render(createElement(ProductCard, { product: { ...product, salePriceZar: 45 } }))
  assert.match(html, /Original price/)
  assert.match(html, /<s[^>]*>R 60<\/s>/)
  assert.match(html, /Sale price/)
  assert.match(html, /R 45/)
})

test('bundles show descriptions and only derive counts and savings from published members', () => {
  const html = render(createElement(BundleCard, {
    bundle: { ...bundle, includedProductSlugs: [product.slug, 'draft'] },
    snapshot: snapshot([product, { ...product, slug: 'draft', published: false }]),
  }))
  assert.match(html, /Prepare for the term with resources in one place/)
  assert.match(html, /1 resource · 1 subject/)
  assert.match(html, /Save 33%/)
  assert.match(html, /R 60<\/s> bought singly/)
  assert.match(html, /about R 40 each/)
  assert.match(html, /aria-label="Add Grade 4 Term 1 Bundle to cart"/)
})

test('empty bundles keep a useful fallback without fabricated savings or zero counts', () => {
  const html = render(createElement(BundleCard, { bundle: { ...bundle, shortDescription: '' }, snapshot: snapshot([]) }))
  assert.match(html, /Included resources are being finalised/)
  assert.doesNotMatch(html, /Save \d|bought singly|about R|0 resources/)
})

test('a bundle without a saving still shows its per-resource price without a saving badge', () => {
  const html = render(createElement(BundleCard, { bundle: { ...bundle, priceZar: 70 }, snapshot: snapshot([product]) }))
  assert.match(html, /about R 70 each/)
  assert.doesNotMatch(html, /Save \d|bought singly/)
})

test('grade cards link to the grade, pluralise counts and keep Browse when no count is supplied', () => {
  const single = render(createElement(GradeCard, { grade: 'Grade 4', count: 1 }))
  assert.match(single, /href="\/grades\/grade-4"/)
  assert.match(single, /1 resource<\/span>/)
  assert.match(render(createElement(GradeCard, { grade: 'Grade 4', count: 0 })), /0 resources/)
  const unknown = render(createElement(GradeCard, { grade: 'Grade 8' }))
  assert.match(unknown, /CAPS-aligned tests and summaries/)
  assert.match(unknown, /Browse/)
  assert.doesNotMatch(unknown, /undefined|NaN/)
})
