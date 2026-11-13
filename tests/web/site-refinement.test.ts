import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { after, before, test } from 'node:test'
import { createElement, type ComponentType, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Link, MemoryRouter } from 'react-router-dom'
import { createServer, type ViteDevServer } from 'vite'
import type { CmsSnapshot, Product } from '../../packages/cms/src/types.ts'

let server: ViteDevServer
let sorting: typeof import('../../apps/web/src/lib/catalog-sort.ts')
let HomeHero: ComponentType<{ snapshot: CmsSnapshot | null }>
let AboutHero: ComponentType
let BundleCta: ComponentType<{ snapshot?: CmsSnapshot | null }>
let FinalCta: ComponentType
let Cart: ComponentType<{ snapshot: CmsSnapshot }>
let Shop: ComponentType<{ snapshot: CmsSnapshot }>
let Bundles: ComponentType<{ snapshot: CmsSnapshot }>
let SortControl: ComponentType<{ value: string; onChange: (value: string) => void }>
let FormSelect: ComponentType<{ label: string; name: string; value: string; options: string[]; onChange: (value: string) => void }>
let AuthLayout: ComponentType<{ title: string; intro: string; children: ReactNode; footer: ReactNode }>
let CatalogContext: typeof import('../../apps/web/src/lib/catalog.tsx').CatalogContext
before(async () => {
  server = await createServer({ configFile: false, root: fileURLToPath(new URL('../../apps/web', import.meta.url)), server: { middlewareMode: true, hmr: false }, appType: 'custom', ssr: { noExternal: ['@designing-minds/cms', '@designing-minds/utils'] } })
  sorting = (await server.ssrLoadModule('/src/lib/catalog-sort.ts')) as typeof sorting
  ;({ HomeHeroSection: HomeHero } = await server.ssrLoadModule('/src/components/sections/home-hero-section.tsx'))
  ;({ AboutHeroSection: AboutHero } = await server.ssrLoadModule('/src/components/sections/about-hero-section.tsx'))
  ;({ BundleCtaSection: BundleCta } = await server.ssrLoadModule('/src/components/sections/bundle-cta-section.tsx'))
  ;({ FinalCtaSection: FinalCta } = await server.ssrLoadModule('/src/components/sections/final-cta-section.tsx'))
  ;({ ShopPage: Shop } = await server.ssrLoadModule('/src/pages/shop-page.tsx'))
  ;({ PackagesPage: Bundles } = await server.ssrLoadModule('/src/pages/packages-page.tsx'))
  ;({ CartPage: Cart } = await server.ssrLoadModule('/src/pages/cart-page.tsx'))
  ;({ CatalogSortControl: SortControl } = await server.ssrLoadModule('/src/components/ui/catalog-sort-control.tsx'))
  ;({ Select: FormSelect } = await server.ssrLoadModule('/src/components/ui/select.tsx'))
  ;({ AuthLayout } = await server.ssrLoadModule('/src/pages/auth/auth-layout.tsx'))
  ;({ CatalogContext } = await server.ssrLoadModule('/src/lib/catalog.tsx'))
})
after(async () => { await server?.close() })
const read = (name: string) => readFileSync(new URL(`../../apps/web/src/${name}`, import.meta.url), 'utf8')
const catalogValue = (snapshot: CmsSnapshot | null = null) => ({
  state: { snapshot, status: snapshot ? 'ready' as const : 'loading' as const, error: null },
  actions: { retry: () => {} },
  meta: { now: Date.UTC(2026, 0, 1) },
})
const render = (element: ReturnType<typeof createElement>, route = '/', value = catalogValue()) => renderToStaticMarkup(
  createElement(CatalogContext.Provider, { value }, createElement(MemoryRouter, { initialEntries: [route] }, element)),
)
const product = (slug: string, priceZar: number, overrides: Partial<Product> = {}): Product => ({
  id: slug, slug, title: slug, shortDescription: 'A ready-to-print practice test.', fullDescription: '',
  priceZar, grade: 'Grade 4', term: 'Term 1', year: '2026', resourceFormat: 'Test / Assessment', subjects: ['Mathematics'], marks: 20,
  purchasedFiles: [], galleryImages: [], previewPdfs: [], featured: false, published: true, status: 'published', sortOrder: 0,
  seo: { title: '', description: '' }, faqs: [], updatedAt: '2026-01-01', ...overrides,
})
const snapshot = (products: Product[] = []) => ({ products, bundles: [], testimonials: [], stats: { productCount: products.length }, valueLists: { grades: ['Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'], terms: ['Term 1'], subjects: ['Mathematics'], resourceFormats: ['Test / Assessment'] } }) as unknown as CmsSnapshot

test('sort parsing rejects unknown values and recommended retains curated order without mutation', () => {
  for (const value of [null, '', 'invalid', 'PRICE']) assert.equal(sorting.readCatalogSort(value), 'recommended')
  for (const option of sorting.CATALOG_SORT_OPTIONS) assert.equal(sorting.readCatalogSort(option.value), option.value)
  const input = [product('b', 90), product('a', 50)]
  assert.deepEqual(sorting.sortCatalogItems(input, 'recommended', (item) => item), input)
  assert.notEqual(sorting.sortCatalogItems(input, 'recommended', (item) => item), input)
  assert.deepEqual(sorting.sortCatalogItems([], 'title', (item: Product) => item), [])
})

test('price sorts use current sale prices and preserve equal-price order', () => {
  const input = [product('regular', 70), product('sale', 100, { salePriceZar: 40 }), product('same', 70)]
  assert.deepEqual(sorting.sortCatalogItems(input, 'price-asc', (item) => item).map((item) => item.slug), ['sale', 'regular', 'same'])
  assert.deepEqual(sorting.sortCatalogItems(input, 'price-desc', (item) => item).map((item) => item.slug), ['regular', 'same', 'sale'])
  assert.deepEqual(input.map((item) => item.slug), ['regular', 'sale', 'same'])
  const expired = product('expired', 120, { salePriceZar: 20, saleEndsAt: '2025-01-01', priceAsOf: Date.parse('2026-01-01') } as Partial<Product>)
  assert.equal(sorting.sortCatalogItems([expired, input[0]], 'price-asc', (item) => item)[0].slug, 'regular')
})

test('recent and alphabetical sorts handle missing dates, case and numeric titles', () => {
  const input = [product('lesson 10', 50, { updatedAt: 'invalid' }), product('Lesson 2', 50, { updatedAt: '2026-09-01' }), product('another', 50, { updatedAt: '' })]
  assert.deepEqual(sorting.sortCatalogItems(input, 'newest', (item) => item).map((item) => item.slug), ['Lesson 2', 'lesson 10', 'another'])
  assert.deepEqual(sorting.sortCatalogItems(input, 'title', (item) => item).map((item) => item.slug), ['another', 'Lesson 2', 'lesson 10'])
})

test('shop sorts the filtered selection and keeps search, grade and sort in the controls', () => {
  const data = snapshot([product('expensive', 90), product('affordable', 30), product('other-grade', 10, { grade: 'Grade 5' })])
  const html = render(createElement(Shop), '/shop?q=practice&grade=Grade%204&sort=price-asc', catalogValue(data))
  assert.ok(html.indexOf('View affordable') < html.indexOf('View expensive'))
  assert.doesNotMatch(html, /View other-grade/)
  assert.match(html, /aria-label="Sort resources"/)
  assert.match(html, /value="practice"/)
  assert.match(html, /Price: low to high/)
  assert.doesNotMatch(html, /Quick grade filters/)
  const empty = render(createElement(Bundles), '/packages?sort=title', catalogValue(data))
  assert.match(empty, /No matching bundles/)
  assert.match(empty, /aria-label="Sort resources"/)
  assert.doesNotMatch(empty, /Quick grade filters/)
})

test('the themed sort trigger displays labels for every URL value and retains accessible naming', () => {
  for (const option of sorting.CATALOG_SORT_OPTIONS) {
    const html = render(createElement(SortControl, { value: option.value, onChange: () => {} }))
    assert.match(html, /role="combobox"/)
    assert.match(html, /aria-label="Sort resources"/)
    assert.ok(html.includes(option.label))
    assert.doesNotMatch(html, /<select\b/)
  }
})

test('the shared themed form select retains its native field name and current value', () => {
  const html = render(createElement(FormSelect, { label: 'Topic', name: 'topic', value: 'General enquiry', options: ['General enquiry', 'Download help'], onChange: () => {} }))
  assert.match(html, /name="topic"/)
  assert.match(html, /value="General enquiry"/)
  assert.match(html, /aria-label="Topic"/)
})

test('auth renders the painted backdrop card, one support link, and preserves the checkout context and form content', () => {
  const props = {
    title: 'Log in', intro: 'Access your resources.',
    footer: createElement('span', null, createElement(Link, { to: '/sign-up' }, 'Create an account')),
    children: createElement('input', { type: 'email', required: true, name: 'email' }),
  }
  for (const route of ['/login', '/login?redirect=%2Fcheckout']) {
    const html = render(createElement(AuthLayout, props), route)
    const footer = html.match(/<div class="auth-footer">([\s\S]*?)<\/div><\/div><\/section>/)?.[1]
    assert.ok(footer)
    assert.match(html, /<img[^>]*class="auth-stage__backdrop"[^>]*auth-hills-wildflowers\.avif/)
    assert.equal((html.match(/Visit support/g) ?? []).length, 1)
    assert.match(footer, /href="\/sign-up"/)
    assert.match(footer, /href="\/help"/)
    assert.match(footer.replace(/<[^>]*>/g, ''), /Create an account\s*Need help\? Visit support/)
    assert.match(html, /<form/)
    assert.match(html, /name="email"/)
    assert.equal(html.includes('Return to checkout'), route.includes('redirect'))
    assert.equal(html.includes('You need an account to complete checkout'), route.includes('redirect'))
  }
})

test('home and about heroes use visual assets while the repeated badge, pricing and obsolete graph are retired', () => {
  const home = render(createElement(HomeHero, { snapshot: snapshot() }))
  assert.match(home, /Practice resources that build confidence at home/)
  assert.match(home, /<img[^>]*class="home-hero__image"/)
  assert.match(home, /Browse resources/)
  assert.match(home, /href="\/shop"/)
  assert.doesNotMatch(home, /Individual resources start|New · Resources/)
  assert.match(render(createElement(AboutHero)), /<img[^>]*src="\/images\/paintings\/about-hero-study-corner\.avif"[^>]*alt=""/)
  assert.doesNotMatch(home, /hero-doodle|Little minds|Big confidence/)
  assert.doesNotMatch(render(createElement(AboutHero)), /portrait|spark|teacher’s heart/)
  assert.doesNotMatch(read('pages/home-page.tsx'), /HowItWorksSection/)
  assert.match(read('components/sections/home-faq-section.tsx'), /Frequently asked questions/)
})

test('CTA variants share a component; the homepage close is the brand band in ink text', () => {
  const brand = render(createElement(BundleCta))
  assert.match(brand, /bg-primary text-on-primary/)
  assert.match(brand, /resource-stack/)
  assert.match(brand, /Browse bundles/)
  // The final CTA is the page's closing colour peak: white on the logo pink, as drawn
  // in Figma (an accepted sub-AA exception, see color-contrast.test.ts).
  const final = render(createElement(FinalCta, {}))
  assert.match(final, /cta-panel relative isolate rounded-lg bg-primary text-on-primary/)
  assert.doesNotMatch(final, /cta-panel--inline/)
  assert.doesNotMatch(final, /cta-panel__texture/)
  // The closing CTA's artwork is the painted pastel binders, not the cover stack, and has one light button with no icon.
  assert.match(final, /<img[^>]*src="\/images\/paintings\/cta-practice-binders\.avif"[^>]*alt=""[^>]*width="888"[^>]*height="570"/)
  assert.doesNotMatch(final, /resource-stack/)
  assert.match(final, /Ready to help your child practise/)
  assert.match(final, /href="\/packages"[^>]*>View bundles<\/a>/)
  assert.equal((final.match(/<a\b/g) ?? []).length, 1)
  assert.match(final, /border-line bg-surface text-ink/)
  for (const html of [brand, final]) {
    assert.match(html, /cta-panel__content/)
    assert.match(html, /cta-panel__actions/)
  }
})

test('the cart empty state has one page heading, one next action and no promotional banner', () => {
  const html = render(createElement(Cart), '/', catalogValue(snapshot()))
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1)
  assert.match(html, /<h1[^>]*>Your cart is empty<\/h1>/)
  assert.match(html, /Browse resources/)
  assert.doesNotMatch(html, /cta-panel|resource-stack|<h1[^>]*>Your cart<\/h1>/)
})

test('the about connection cards are cards with painted headers', () => {
  const source = read('components/sections/about-connect-section.tsx')
  assert.match(source, /<Card as="article"/)
  assert.doesNotMatch(source, /CtaBanner|min-h-\[36rem\]/)
})

test('grade grids share the three-plus-two layout with a full-width last row, and Inter is a real local font', () => {
  const css = read('index.css')
  // Home and Grades both render the shared GradeFinderSection grid (Figma GradeFinderSection).
  assert.match(read('pages/grades-page.tsx'), /<GradeFinderSection/)
  assert.match(read('components/sections/grade-finder-section.tsx'), /grade-grid/)
  assert.match(css, /nth-child\(4\):nth-last-child\(2\),\s*\.grade-grid > :nth-child\(5\):last-child \{ @apply lg:col-span-3; \}/)
  assert.doesNotMatch(css, /lg:col-start-[24]/)
  const font = new URL('../../apps/web/public/fonts/inter-latin-variable.woff2', import.meta.url)
  assert.ok(existsSync(font))
  assert.equal(readFileSync(font).subarray(0, 4).toString(), 'wOF2')
})
