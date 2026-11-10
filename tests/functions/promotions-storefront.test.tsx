import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
const auth = vi.hoisted(() => ({ customer: null as null | { id: string; email: string }, getAccessToken: vi.fn() }))
vi.mock('../../apps/web/src/lib/auth.tsx', () => ({ useAuth: () => auth }))
vi.mock('../../apps/web/src/lib/cart.ts', () => ({ addCartSlug: vi.fn(), removeCartSlug: vi.fn() }))
vi.mock('../../apps/web/src/lib/use-cart.ts', () => ({ useCartSlugs: () => [] }))
import { ProductCard } from '../../apps/web/src/components/ui/product-card.tsx'
import { BundleCard } from '../../apps/web/src/components/ui/bundle-card.tsx'
import { CheckoutPage } from '../../apps/web/src/pages/checkout-page.tsx'
import { CatalogContext } from '../../apps/web/src/lib/catalog.tsx'
import { makeBundle, makeProduct, makeSnapshot } from '../support/fixtures.ts'
const record = makeProduct({ slug:'test', id:'1', title:'Test', grade:'Grade 4', priceZar:100, salePriceZar:80.55 })
const bundleRecord = makeBundle({ slug:'test', id:'1', title:'Test', grade:'Grade 4', priceZar:100, salePriceZar:80.55 })
const catalogValue = (snapshot: ReturnType<typeof makeSnapshot> | null = null) => ({
  state: { snapshot, status: snapshot ? 'ready' as const : 'loading' as const, error: null },
  actions: { retry: () => {} },
  meta: { now: Date.UTC(2026, 0, 1) },
})
const render = (component: ReturnType<typeof createElement>, snapshot?: ReturnType<typeof makeSnapshot>) => renderToStaticMarkup(
  createElement(CatalogContext.Provider, { value: catalogValue(snapshot ?? null) }, createElement(MemoryRouter, {}, component)),
)
it('renders sale prices with a crossed-out regular price on both catalogue cards', () => {
  for (const html of [render(createElement(ProductCard,{product:record})), render(createElement(BundleCard,{bundle:bundleRecord,snapshot:makeSnapshot()}))]) {
    expect(html).toMatch(/<s[^>]*>.*100.*<\/s>/)
    expect(html).toContain('80,55')
    expect(html).toContain('Original price')
    expect(html).toContain('Sale price')
  }
})
it('hides the crossed-out price before a sale starts or after it ends', () => {
  for (const schedule of [{saleStartsAt:'2099-01-01T00:00:00Z'},{saleEndsAt:'2020-01-01T00:00:00Z'}]) {
    const html=render(createElement(ProductCard,{product:{...record,...schedule}}))
    expect(html).not.toContain('<s ')
    expect(html).not.toContain('80,55')
  }
})
it('only asks guests to sign in before applying a discount code', () => {
  const snapshot = makeSnapshot()
  auth.customer = null
  expect(render(createElement(CheckoutPage), snapshot)).toContain('Sign in to apply a code.')
  auth.customer = { id: 'customer', email: 'customer@example.com' }
  const html = render(createElement(CheckoutPage), snapshot)
  expect(html).toContain('Each code can be used once per customer.')
  expect(html).not.toContain('Sign in to apply a code.')
  auth.customer = null
})
