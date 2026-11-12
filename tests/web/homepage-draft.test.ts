import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { after, before, test } from 'node:test'
import { createElement, type ComponentType, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer, type ViteDevServer } from 'vite'
import type { Bundle, CmsSnapshot, Product, Testimonial } from '../../packages/cms/src/types.ts'
import { makeSnapshot } from '../support/fixtures.ts'

let server: ViteDevServer
let catalog: typeof import('../../apps/web/src/lib/featured-catalog.ts')
type SectionProps = { snapshot: CmsSnapshot | null; loadError?: string | null }
let HomePage: ComponentType
let Featured: ComponentType<SectionProps>
let Hero: ComponentType<{ snapshot: CmsSnapshot | null }>
let Explore: ComponentType<SectionProps>
let Support: ComponentType
let Testimonials: ComponentType<{ snapshot: CmsSnapshot | null }>
let Navbar: ComponentType<{ snapshot: CmsSnapshot | null }>
let AuthProvider: ComponentType<{ children: ReactNode }>
let CatalogContext: typeof import('../../apps/web/src/lib/catalog.tsx').CatalogContext

before(async () => {
  server = await createServer({
    configFile: false,
    root: fileURLToPath(new URL('../../apps/web', import.meta.url)),
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
    ssr: { noExternal: ['@designing-minds/cms', '@designing-minds/utils'] },
  })
  catalog = (await server.ssrLoadModule('/src/lib/featured-catalog.ts')) as typeof catalog
  ;({ HomePage } = await server.ssrLoadModule('/src/pages/home-page.tsx'))
  ;({ HomeFeaturedSection: Featured } = await server.ssrLoadModule('/src/components/sections/home-featured-section.tsx'))
  ;({ HomeHeroSection: Hero } = await server.ssrLoadModule('/src/components/sections/home-hero-section.tsx'))
  ;({ GradeFinderSection: Explore } = await server.ssrLoadModule('/src/components/sections/grade-finder-section.tsx'))
  ;({ GetToKnowSection: Support } = await server.ssrLoadModule('/src/components/sections/get-to-know-section.tsx'))
  ;({ HomeTestimonialsSection: Testimonials } = await server.ssrLoadModule('/src/components/sections/home-testimonials-section.tsx'))
  ;({ Navbar } = await server.ssrLoadModule('/src/components/layout/navbar.tsx'))
  ;({ AuthProvider } = await server.ssrLoadModule('/src/lib/auth.tsx'))
  ;({ CatalogContext } = await server.ssrLoadModule('/src/lib/catalog.tsx'))
})
after(async () => { await server?.close() })

const product = (slug: string, overrides: Partial<Product> = {}): Product => ({
  id: slug, slug, title: `Resource ${slug}`, shortDescription: 'Focused practice for the school term.', fullDescription: '',
  priceZar: 60, grade: 'Grade 4', term: 'Term 1', year: '2026', resourceFormat: 'Test / Assessment', subjects: ['Mathematics'], marks: 20,
  purchasedFiles: [], galleryImages: [], previewPdfs: [], featured: false, published: true, status: 'published', sortOrder: 0,
  seo: { title: '', description: '' }, faqs: [], updatedAt: '2026-01-01', ...overrides,
})
const bundle = (slug: string, overrides: Partial<Bundle> = {}): Bundle => ({
  ...product(slug), title: `Bundle ${slug}`, priceZar: 100, bundleScope: 'Term', includedProductIds: [], includedProductSlugs: [], ...overrides,
})
const testimonial = (id: string, overrides: Partial<Testimonial> = {}): Testimonial => ({
  id, customerName: `Parent ${id}`, quote: `Real feedback from ${id}.`, context: 'Grade 4 parent', learnerGrade: 'Grade 4',
  sourceDate: '2026-01-01', featured: false, sortOrder: 0, published: true, status: 'published', updatedAt: '2026-01-01', ...overrides,
})
const snapshot = (products: Product[] = [], bundles: Bundle[] = [], testimonials: Testimonial[] = []): CmsSnapshot => makeSnapshot({
  products, bundles, testimonials,
  valueLists: {
    grades: ['Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'], terms: ['Term 1'], years: ['2026'], subjects: ['Mathematics'], resourceFormats: ['Test / Assessment'],
  },
  stats: { productCount: products.length, subjectCount: 0, gradeCount: 0, bundleCount: bundles.length, orderCount: 0, customerCount: 0 },
})
const slugs = (data: CmsSnapshot, category: 'all' | 'resources' | 'bundles' = 'all') =>
  catalog.featuredCatalog(data, category).map((entry) => entry.kind === 'bundle' ? entry.bundle.slug : entry.product.slug)
const catalogValue = (snapshot: CmsSnapshot | null, status: 'loading' | 'ready' | 'error' = snapshot ? 'ready' : 'loading', error: string | null = null) => ({
  state: { snapshot, status, error },
  actions: { retry: () => {} },
  meta: { now: Date.UTC(2026, 0, 1) },
})
const render = (element: ReturnType<typeof createElement>, value = catalogValue(null)) => renderToStaticMarkup(
  createElement(CatalogContext.Provider, { value }, createElement(MemoryRouter, null, element)),
)

test('featured catalogue balances real bundles and resources within each featured tier, capped at four', () => {
  const data = snapshot([
    product('resource-later', { featured: true, sortOrder: 5 }),
    product('resource-first', { featured: true, sortOrder: 1 }),
    product('unfeatured-resource', { sortOrder: -100 }),
  ], [
    bundle('bundle-later', { featured: true, sortOrder: 9 }),
    bundle('bundle-first', { featured: true, sortOrder: 2 }),
    bundle('unfeatured-bundle', { sortOrder: -100 }),
  ])
  assert.deepEqual(slugs(data), ['bundle-first', 'resource-first', 'bundle-later', 'resource-later'])
  assert.deepEqual(slugs(data, 'resources'), ['resource-first', 'resource-later', 'unfeatured-resource'])
  assert.deepEqual(slugs(data, 'bundles'), ['bundle-first', 'bundle-later', 'unfeatured-bundle'])
})

test('featured records outrank unfeatured records even when a category has no featured entries', () => {
  const data = snapshot([
    product('feature-2', { featured: true, sortOrder: 2 }),
    product('feature-1', { featured: true, sortOrder: 1 }),
    product('ordinary', { sortOrder: -99 }),
  ], [bundle('ordinary-bundle', { sortOrder: -999 })])
  assert.deepEqual(slugs(data), ['feature-1', 'feature-2', 'ordinary-bundle', 'ordinary'])
})

test('featured selection excludes drafts, handles empty and sparse types, and never invents records', () => {
  const draft = product('draft-resource', { published: false, featured: true })
  const draftBundle = bundle('draft-bundle', { published: false, featured: true })
  assert.deepEqual(slugs(snapshot()), [])
  assert.deepEqual(slugs(snapshot([draft], [draftBundle])), [])
  assert.deepEqual(slugs(snapshot([product('only')], [draftBundle])), ['only'])
  assert.deepEqual(slugs(snapshot([draft], [bundle('only-bundle')])), ['only-bundle'])
  assert.deepEqual(slugs(snapshot([product('only')]), 'bundles'), [])
  const resources = Array.from({ length: 8 }, (_, index) => product(`resource-${index}`, { sortOrder: index }))
  assert.deepEqual(slugs(snapshot(resources)), ['resource-0', 'resource-1', 'resource-2', 'resource-3'])
  assert.deepEqual(slugs(snapshot(resources, [bundle('one-bundle')])), ['one-bundle', 'resource-0', 'resource-1', 'resource-2'])
})

test('featured selection preserves editorial tie order and leaves catalogue arrays and records unchanged', () => {
  const data = snapshot([
    product('second-in-input', { sortOrder: 3 }), product('tied-a', { sortOrder: 1 }), product('tied-b', { sortOrder: 1 }),
  ], [bundle('tied-bundle-a'), bundle('tied-bundle-b')])
  const original = structuredClone(data)
  assert.deepEqual(slugs(data, 'resources'), ['tied-a', 'tied-b', 'second-in-input'])
  assert.deepEqual(slugs(data, 'bundles'), ['tied-bundle-a', 'tied-bundle-b'])
  slugs(data)
  assert.deepEqual(data, original)
})

test('homepage places featured products after the hero and bundle offers before testimonials', () => {
  const data = snapshot([product('maths', { featured: true })], [bundle('term', { featured: true })], [testimonial('amy')])
  const html = render(createElement(HomePage), catalogValue(data))
  const sections = [...html.matchAll(/<section\b[^>]*\bid="([^"]+)"/g)].map((match) => match[1])
  assert.deepEqual(sections, ['home-intro', 'featured-products', 'explore-resources', 'learning-support', 'bundles', 'parent-stories', 'start-shopping'])
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1)
  assert.match(html, /href="\/shop\/maths"/)
  assert.match(html, /href="\/shop\/term"/)
  assert.match(html, /aria-label="Add Resource maths to cart"/)
  assert.match(html, /aria-label="Add Bundle term to cart"/)
  assert.doesNotMatch(html, /growth-chart|<h2\b[^>]*>Get to know Designing Minds/)
  assert.doesNotMatch(html.replace(/<[^>]*>/g, ''), /Frequently asked questions|\b360\b/)
})

test('hero renders a decorative background and an unrestricted shopping CTA without needing catalogue data', () => {
  for (const data of [snapshot(), null]) {
    const html = render(createElement(Hero, { snapshot: data }))
    assert.match(html, /<h1[^>]*>Practice resources that build confidence at home<\/h1>/)
    assert.match(html, /<a\b[^>]*href="\/shop"[^>]*>Browse resources/)
    assert.match(html, /<img[^>]*src="\/images\/paintings\/home-hero\.avif"[^>]*alt=""[^>]*width="1536"[^>]*height="864"/)
    assert.doesNotMatch(html, /resource-stack|aria-label="Choose a grade"/)
    assert.doesNotMatch(html, /href="\/packages"/)
    assert.doesNotMatch(html, /href="#parent-stories"/)
  }
  assert.match(render(createElement(Hero, { snapshot: snapshot([], [], [testimonial('real')]) })), /href="#parent-stories"/)
  assert.doesNotMatch(render(createElement(Hero, { snapshot: snapshot([], [], [testimonial('draft', { published: false })]) })), /href="#parent-stories"/)
})

test('homepage bundle offers show the lowest published price and link to the matching catalogue filter', () => {
  const data = snapshot([], [
    bundle('term-cheapest', { priceZar: 195 }),
    bundle('term-expensive', { priceZar: 350 }),
    bundle('full-year', { bundleScope: 'Full Year', priceZar: 1200 }),
    bundle('full-year-draft', { bundleScope: 'Full Year', priceZar: 1, published: false }),
  ])
  const html = render(createElement(HomePage), catalogValue(data))
  const offers = html.match(/<section\b[^>]*id="bundles"[\s\S]*?<\/section>/)?.[0] ?? ''
  assert.match(offers, /Save with a term or full-year bundle/)
  assert.match(offers, /From<\/span>[^<]*<span[^>]*>R<\/span>[^<]*<strong[^>]*>195<\/strong>/)
  assert.match(offers, /<strong[^>]*>1[\s\u00a0]+200<\/strong>/)
  assert.match(offers, /href="\/packages\?offer=Term%20bundles"[^>]*>Browse term bundles/)
  assert.match(offers, /href="\/packages\?offer=Full-year%20bundles"[^>]*>Browse full-year bundles/)
})

test('homepage bundle offers omit unpublished tiers and hide the comparison when no offers exist', () => {
  const unpublished = bundle('year-draft', { bundleScope: 'Full Year', published: false })
  const termOnly = snapshot([], [bundle('term'), unpublished])
  const offers = render(createElement(HomePage), catalogValue(termOnly))
  assert.match(offers, /Browse term bundles/)
  assert.doesNotMatch(offers, /Browse full-year bundles/)
  assert.doesNotMatch(render(createElement(HomePage), catalogValue(snapshot([], [unpublished]))), /id="bundles"/)
})

test('featured section reuses real catalogue cards and exposes categories only when both published types exist', () => {
  const html = render(createElement(Featured, { snapshot: snapshot([product('single')], [bundle('set')]) }))
  assert.equal((html.match(/<article\b/g) ?? []).length, 2)
  assert.match(html, /catalog-card-product/)
  assert.match(html, /catalog-card-bundle/)
  assert.match(html, /aria-pressed="true"[^>]*>All(?: products)?<\/button>/)
  assert.match(html, />Resources<\/button>/)
  assert.match(html, />Bundles<\/button>/)
  assert.doesNotMatch(html, /Keyring|Physical products|Bestseller|Best seller/)
  for (const data of [snapshot([product('single')]), snapshot([], [bundle('set')]), snapshot([product('single')], [bundle('draft', { published: false })])]) {
    assert.doesNotMatch(render(createElement(Featured, { snapshot: data })), /aria-pressed/)
  }
})

test('featured loading, failure, and empty states retain discovery without fabricated products', () => {
  const loading = render(createElement(Featured, { snapshot: null }))
  const failure = render(createElement(Featured, { snapshot: null, loadError: 'The catalogue could not load.' }))
  const empty = render(createElement(Featured, { snapshot: snapshot() }))
  assert.match(loading, /Loading|loading/)
  assert.match(failure, /The catalogue could not load\./)
  assert.match(empty, /No products are available right now/)
  assert.doesNotMatch(empty, /on their way|coming soon/i)
  for (const html of [loading, failure, empty]) {
    assert.match(html, /id="featured-products"/)
    assert.match(html, /href="\/shop"/)
    assert.doesNotMatch(html, /<article\b|Add .+ to cart|aria-pressed/)
  }
})

test('the full homepage remains usable when catalogue loading fails', () => {
  const html = render(createElement(HomePage), catalogValue(null, 'error', 'The catalogue could not load.'))
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1)
  assert.match(html, /The catalogue could not load\./)
  assert.match(html, /id="home-intro"/)
  assert.match(html, /id="featured-products"/)
  assert.match(html, /id="learning-support"/)
  assert.match(html, /id="start-shopping"/)
  assert.match(html, /href="\/shop"/)
  assert.match(html, /Bundles are unavailable/)
  assert.doesNotMatch(html, /id="parent-stories"|catalog-card|Add .+ to cart/)
})

test('explore offers optional Grades 3–7 routes and a general catalogue link without duplicate products', () => {
  const html = render(createElement(Explore, { snapshot: snapshot([product('maths')]) }))
  assert.match(html, /Explore our resources/)
  assert.match(html, /CAPS-aligned tests, memos and summaries for Grades 3 to 7\. Pick your child’s grade, or browse everything\./)
  assert.match(html, /<a class="(?=[^"]*rounded-full)(?=[^"]*border-\[1\.5px\])[^"]*" href="\/shop"[^>]*>Browse all resources/)
  assert.match(html, /href="\/shop"/)
  for (let grade = 3; grade <= 7; grade += 1) assert.match(html, new RegExp(`href="/shop\\?grade=grade-${grade}"`))
  assert.doesNotMatch(html, /catalog-card|Add .+ to cart/)
})

test('learning support combines benefits and getting started in the established illustrated accordion', () => {
  const html = render(createElement(Support))
  assert.match(html, /id="learning-support"/)
  assert.match(html, /How Designing Minds works/)
  assert.equal((html.match(/aria-expanded=/g) ?? []).length, 5)
  assert.match(html, /aria-expanded="true"/)
  assert.match(html, /aria-expanded="false"/)
  assert.match(html, /<img[^>]*src="\/images\/paintings\/how-it-works-kitchen-table\.avif"[^>]*alt=""/)
  assert.doesNotMatch(html, /image-04\.png/)
  assert.match(html, /Find the right test/)
  assert.match(html, /Download again any time/)
  assert.match(html, /Everything follows CAPS/)
  assert.match(html, /href="\/about"/)
  assert.doesNotMatch(html, /growth-chart|aria-current="step"/)
})

test('testimonials preserve the lead illustration and original carousel using only published customer feedback', () => {
  const longQuote = 'Our child can practise a little at a time. '.repeat(12)
  const data = snapshot([], [], [
    testimonial('lead', { quote: 'The first real parent story.' }),
    testimonial('draft', { featured: true, published: false, sortOrder: -99 }),
    testimonial('carousel-long', { quote: longQuote }),
    testimonial('carousel-short'),
  ])
  const html = render(createElement(Testimonials, { snapshot: data }))
  assert.match(html, /src="\/images\/image-05\.png"/)
  assert.match(html, /The first real parent story\./)
  assert.match(html, /Parent lead/)
  assert.ok(html.indexOf('Parent lead') < html.indexOf('testimonial-carousel'))
  assert.match(html, /testimonial-carousel-track/)
  assert.match(html, /testimonial-carousel-copy" aria-hidden="true"/)
  assert.match(html, /Parent carousel-long/)
  assert.match(html, /Parent carousel-short/)
  assert.ok(html.includes(longQuote))
  assert.match(html, /<blockquote class="line-clamp-7[^"]*">/)
  assert.doesNotMatch(html, /Parent draft|More parent stories|Read full story|Show less|<button\b|<details\b/)
})

test('no testimonials means no invented stories; one real lead retains its illustration without an empty carousel', () => {
  for (const data of [null, snapshot(), snapshot([], [], [testimonial('draft', { published: false })])]) {
    assert.equal(render(createElement(Testimonials, { snapshot: data })), '')
  }
  const single = render(createElement(Testimonials, { snapshot: snapshot([], [], [testimonial('only')]) }))
  assert.equal((single.match(/<blockquote\b/g) ?? []).length, 1)
  assert.match(single, /src="\/images\/image-05\.png"/)
  assert.match(single, /Real feedback from only\./)
  assert.doesNotMatch(single, /More parent stories|testimonial-carousel/)
})

test('a single testimonial in the carousel renders statically, without the duplicated marquee group', async () => {
  const { TestimonialCarousel } = await server.ssrLoadModule('/src/components/sections/testimonial-carousel.tsx') as { TestimonialCarousel: ComponentType<{ testimonials: Testimonial[] }> }
  const one = render(createElement(TestimonialCarousel, { testimonials: [testimonial('solo')] }))
  assert.equal((one.match(/<blockquote\b/g) ?? []).length, 1)
  assert.doesNotMatch(one, /testimonial-carousel/)
  const two = render(createElement(TestimonialCarousel, { testimonials: [testimonial('a'), testimonial('b')] }))
  assert.equal((two.match(/<blockquote\b/g) ?? []).length, 4)
  assert.match(two, /testimonial-carousel-copy" aria-hidden="true"/)
})

test('header search submits real catalogue queries from the bar while preserving account and cart routes', () => {
  const html = render(createElement(AuthProvider, { children: createElement(Navbar, { snapshot: snapshot() }) }))
  const searches = [...html.matchAll(/<form\b[^>]*action="\/shop"[^>]*>[\s\S]*?<\/form>/g)].map((match) => match[0])
  // Desktop search is in the bar; the mobile search lives inside the (closed) menu dialog — see navbar-render.test.ts.
  assert.equal(searches.length, 1)
  for (const form of searches) {
    assert.match(form, /method="[Gg][Ee][Tt]"/)
    assert.match(form, /type="search"[^>]*name="q"|name="q"[^>]*type="search"/)
    assert.match(form, /aria-label="[^"]+"/)
    assert.match(form, /type="submit"/)
  }
  assert.match(html, /href="\/account"|href="\/login"/)
  assert.match(html, /href="\/cart"/)
  assert.match(html, /aria-label="Open navigation menu"/)
  assert.doesNotMatch(html, /role="dialog"/)
})

test('phones get a swipeable featured row instead of four stacked cards, and four picks never orphan one card on desktop', async () => {
  const html = render(createElement(Featured, { snapshot: snapshot([product('a'), product('b')], [bundle('c'), bundle('d')]) }))
  assert.match(html, /id="featured-catalog" class="catalog-grid featured-rail"/)
  const css = (await import('node:fs')).readFileSync(new URL('../../apps/web/src/index.css', import.meta.url), 'utf8')
  const phone = css.match(/@media \(max-width: 639px\) \{\s*\.featured-rail \{[^}]*\}/)?.[0] ?? ''
  assert.match(phone, /grid-auto-flow: column/)
  assert.match(phone, /scroll-snap-type: x mandatory/)
  assert.match(phone, /grid-auto-columns: min\(80%, 20rem\)/)
  assert.match(css, /\.featured-rail > \* \{ scroll-snap-align: start; \}/)
  assert.match(css, /@media \(min-width: 1024px\) \{\s*\.featured-rail \{ grid-template-columns: repeat\(4, minmax\(0, 1fr\)\); \}/)
})

test('homepage grade tiles are compact on phones while the Grades page keeps the full tile', async () => {
  const { GradeCard } = await server.ssrLoadModule('/src/components/ui/grade-card.tsx') as { GradeCard: ComponentType<{ grade: string; count?: number; compact?: boolean }> }
  const compact = render(createElement(GradeCard, { grade: 'Grade 4', count: 12, compact: true }))
  assert.match(compact, /min-h-28 sm:min-h-56/)
  assert.match(compact, /line-clamp-2[^"]*hidden sm:block/)
  assert.match(compact, /<span class="hidden sm:inline">Browse<\/span>/)
  assert.match(compact, /12 resources/)
  assert.match(compact, /href="\/shop\?grade=grade-4"/)
  const full = render(createElement(GradeCard, { grade: 'Grade 4', count: 12 }))
  assert.match(full, /flex min-h-56 flex-col/)
  assert.doesNotMatch(full, /hidden sm:block|hidden sm:inline|min-h-28/)
  const explore = render(createElement(Explore, { snapshot: snapshot([product('maths')]) }))
  assert.match(explore, /class="grade-grid grade-grid--compact"/)
  assert.equal((explore.match(/min-h-28 sm:min-h-56/g) ?? []).length, 5)
})

test('learning support introduces its steps from the same column on the story band', () => {
  const html = render(createElement(Support))
  assert.match(html, /<section id="learning-support" class="section bg-surface-alt">/)
  const heading = html.indexOf('How Designing Minds works')
  const firstStep = html.indexOf('aria-expanded=')
  // React hoists a <link rel="preload"> for the image ahead of the section, so match the <img> itself.
  const illustration = html.indexOf('src="/images/paintings/how-it-works-kitchen-table.avif"')
  assert.ok(heading > -1 && heading < firstStep && firstStep < illustration)
  assert.equal((html.match(/lg:grid-cols-2/g) ?? []).length, 1)
})

test('the testimonial illustration is desktop-only so phones reach the quotes first', () => {
  const html = render(createElement(Testimonials, { snapshot: snapshot([], [], [testimonial('lead'), testimonial('next')]) }))
  assert.match(html, /<div class="hidden lg:block"><img src="\/images\/image-05\.png"/)
  assert.match(html, /<blockquote class="[^"]*font-semibold/)
  assert.ok(html.indexOf('/images/image-05.png') < html.indexOf('<blockquote'))
})

test('the homepage keeps the grade range together and closes on decorative real-catalogue covers', () => {
  const data = snapshot([product('maths', { featured: true })], [], [testimonial('amy')])
  const html = render(createElement(HomePage), catalogValue(data))
  assert.match(html, /<span class="whitespace-nowrap">Grades 3–7<\/span>/)
  const close = html.slice(html.indexOf('id="start-shopping"'))
  assert.match(close, /bg-primary text-ink/)
  assert.match(close, /class="cta-panel__artwork" aria-hidden="true"><img src="\/images\/paintings\/cta-practice-booklets\.avif"/)
  // Decorative artwork only: the close keeps exactly one real route.
  assert.equal((close.match(/<a\b/g) ?? []).length, 1)
})
