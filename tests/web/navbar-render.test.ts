import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { after, before, test } from 'node:test'
import { createElement, type ComponentType, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer, type ViteDevServer } from 'vite'
import type { BundleTier } from '../../packages/cms/src/lib/formatters.ts'
import { makeBundle, makeSnapshot } from '../support/fixtures.ts'

let server: ViteDevServer
let AnnouncementBar: ComponentType
let CartLinkView: ComponentType<{ count: number }>
let CartLink: ComponentType
let CatalogSearch: ComponentType
let ShopMenuContent: ComponentType<{ tiers: BundleTier[]; onNavigate: () => void }>
let MobileMenuContent: ComponentType<{ tiers: BundleTier[]; onNavigate: () => void }>
let NavigationMenu: Record<'Root' | 'List' | 'Item', ComponentType<{ children?: ReactNode }>>
let Navbar: ComponentType<{ snapshot: unknown }>
let AuthProvider: ComponentType<{ children: ReactNode }>

before(async () => {
  server = await createServer({
    configFile: false,
    root: fileURLToPath(new URL('../../apps/web', import.meta.url)),
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
    ssr: { noExternal: ['@designing-minds/cms', '@designing-minds/utils', '@base-ui/react'] },
  })
  const load = (path: string) => server.ssrLoadModule(`/src/components/layout/navbar/${path}`)
  ;({ AnnouncementBar } = await load('announcement-bar.tsx'))
  ;({ CartLinkView, CartLink } = await load('account-actions.tsx'))
  ;({ CatalogSearch } = await load('catalog-search.tsx'))
  ;({ ShopMenuContent } = await load('shop-menu.tsx'))
  ;({ MobileMenuContent } = await load('mobile-menu.tsx'))
  ;({ Navbar } = await server.ssrLoadModule('/src/components/layout/navbar.tsx'))
  ;({ AuthProvider } = await server.ssrLoadModule('/src/lib/auth.tsx'))
  ;({ NavigationMenu } = await server.ssrLoadModule('@base-ui/react/navigation-menu'))
})
after(async () => { await server?.close() })

const render = (node: ReturnType<typeof createElement>) =>
  renderToStaticMarkup(createElement(MemoryRouter, null, node)).replace(/ /g, ' ')

// The shop panel's links are NavigationMenu parts, so they need the menu's context.
const inMenu = (node: ReturnType<typeof createElement>) =>
  createElement(NavigationMenu.Root, null, createElement(NavigationMenu.List, null, createElement(NavigationMenu.Item, null, node)))

const tiers: BundleTier[] = [
  { scope: 'Term', title: 'Term bundles', fromPriceZar: 200, gradeCount: 2, featured: false },
  { scope: 'Full Year', title: 'Full-year bundles', fromPriceZar: 1200, gradeCount: 5, featured: true },
]

test('cart link shows an accessible item-count badge, capped at 99+, and hides it when empty', () => {
  const empty = render(createElement(CartLinkView, { count: 0 }))
  assert.match(empty, /aria-label="Cart, 0 items"/)
  assert.doesNotMatch(empty, /ring-canvas/)

  const one = render(createElement(CartLinkView, { count: 1 }))
  assert.match(one, /aria-label="Cart, 1 item"/)
  assert.match(one, /ring-canvas[^>]*>1</)

  const many = render(createElement(CartLinkView, { count: 3 }))
  assert.match(many, /aria-label="Cart, 3 items"/)
  assert.match(many, /ring-canvas[^>]*>3</)

  assert.match(render(createElement(CartLinkView, { count: 150 })), /ring-canvas[^>]*>99\+</)

  // The visible label stays plain "Cart" (the count lives in the badge and aria-label).
  assert.match(many, /<span class="hidden sm:inline">Cart<\/span>/)
  assert.doesNotMatch(many, /Cart \(3\)/)
})

test('cart link reads its count from the live cart hook (empty during SSR)', () => {
  assert.match(render(createElement(CartLink)), /aria-label="Cart, 0 items"/)
  const source = readFileSync(new URL('../../apps/web/src/components/layout/navbar/account-actions.tsx', import.meta.url), 'utf8')
  assert.match(source, /useCartSlugs\(\)\.length/)
})

test('announcement bar uses the AA-safe deep pink including its hover state', () => {
  const html = render(createElement(AnnouncementBar))
  assert.match(html, /href="\/shop"/)
  assert.match(html, /bg-primary-deep/)
  assert.match(html, /hover:bg-primary-ink/)
  assert.doesNotMatch(html, /(?<![-\w])bg-primary(?![-\w])|hover:bg-primary-strong/)
})

test('search submit shows a magnifying glass, not the arrow', () => {
  const html = render(createElement(CatalogSearch))
  assert.match(html, /action="\/shop"/)
  assert.match(html, /name="q"/)
  // Phosphor MagnifyingGlass path (lens + handle); the old ArrowRight glyph is a different path.
  const button = html.match(/<button[^>]*aria-label="Submit search"[\s\S]*?<\/button>/)?.[0] ?? ''
  assert.match(button, /M229\.66,218\.34l-50\.07-50\.06/)
})

test('shop menu lists Browse links and bundle tiers with their filtered offers; no access plans', () => {
  const html = render(inMenu(createElement(ShopMenuContent, { tiers, onNavigate: () => {} })))
  for (const label of ['All resources', 'Grades', 'Bundles']) assert.ok(html.includes(label), label)
  assert.match(html, /href="\/shop"/)
  assert.match(html, /href="\/grades"/)
  assert.match(html, /href="\/packages"/)
  assert.match(html, /href="\/packages\?offer=Term%20bundles"/)
  assert.match(html, /href="\/packages\?offer=Full-year%20bundles"/)
  assert.match(html, /Best value/)
  assert.match(html, /Choose from 5 grades\./)
  assert.match(html, /Choose from 2 grades, any term\./)
  assert.match(html, />R 200</)
  assert.match(html, />R 1 200</)
  assert.doesNotMatch(html, /Access plans|access plans|Essential|Premium/)

  const none = render(inMenu(createElement(ShopMenuContent, { tiers: [], onNavigate: () => {} })))
  assert.match(none, /No bundles published yet\./)
})

test('mobile menu content has search, every route, and compact tier cards without the description line', () => {
  const html = render(createElement(MobileMenuContent, { tiers, onNavigate: () => {} }))
  assert.equal((html.match(/<form\b[^>]*action="\/shop"/g) ?? []).length, 1)
  for (const href of ['/', '/about', '/contact', '/help']) assert.match(html, new RegExp(`href="${href}"`))
  assert.match(html, />Help</)
  // Shop is a collapsed Collapsible until opened: its trigger exists, its panel does not render.
  assert.match(html, /<button[^>]*>Shop/)
  assert.doesNotMatch(html, /Choose from/)
})

test('desktop bar offers Shop (collapsed menu trigger) plus Home, About, Contact, Help and search; mobile toggle is closed', () => {
  const html = render(createElement(AuthProvider, { children: createElement(Navbar, { snapshot: makeSnapshot({ bundles: [makeBundle({ slug: 'b', bundleScope: 'Term', priceZar: 200 })] }) }) }))
  const searches = [...html.matchAll(/<form\b[^>]*action="\/shop"[^>]*>[\s\S]*?<\/form>/g)]
  assert.equal(searches.length, 1, 'desktop search form (mobile search lives inside the dialog)')
  for (const href of ['/', '/about', '/contact', '/help', '/cart']) assert.match(html, new RegExp(`href="${href}"`))
  assert.match(html, /<button[^>]*aria-expanded="false"[^>]*>Shop/)
  assert.match(html, /aria-label="Open navigation menu"/)
  assert.match(html, /href="\/account"|href="\/login"/)
  // Closed overlays render nothing on the server (no portal, no window access).
  assert.doesNotMatch(html, /role="dialog"|Choose from/)
})
