import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import { makeBundle, makeProduct, makeSnapshot } from '../../support/fixtures'

const maths = makeProduct({ slug: 'maths', title: 'Maths test', grade: 'Grade 4', term: 'Term 3', priceZar: 50 })
const english = makeProduct({ slug: 'english', title: 'English test', grade: 'Grade 4', term: 'Term 3', priceZar: 60 })
const bundle = makeBundle({ slug: 'term-3', title: 'Term 3 bundle', grade: 'Grade 4', term: 'Term 3', priceZar: 80, includedProductSlugs: ['maths', 'english'] })
const state = vi.hoisted(() => ({ slugs: [] as string[] }))
vi.mock('../../../apps/web/src/lib/catalog', () => ({ useCatalogSnapshot: () => makeSnapshot({ products: [maths, english], bundles: [bundle] }) }))
vi.mock('../../../apps/web/src/lib/use-noindex', () => ({ useNoindex: () => {} }))
vi.mock('../../../apps/web/src/lib/use-cart', () => ({ useCartSlugs: () => state.slugs }))
vi.mock('../../../apps/web/src/lib/cart', () => ({ removeCartSlug: vi.fn() }))
vi.mock('../../../apps/web/src/lib/physical-cart', () => ({ usePhysicalCartLines: () => [] }))

import { CartPage } from '../../../apps/web/src/pages/cart-page'
import { LiveRegionProvider } from '../../../apps/web/src/components/ui/live-region'

const mount = () => render(<MemoryRouter><LiveRegionProvider><CartPage /></LiveRegionProvider></MemoryRouter>)

beforeEach(() => { state.slugs = [] })

it('compares a bundle line with buying its resources individually; single resources show one price', () => {
  state.slugs = ['term-3', 'maths']
  const { container } = mount()
  const [bundleLine, mathsLine] = Array.from(container.querySelectorAll('li'))
  expect(bundleLine.querySelector('s')?.textContent).toMatch(/^R\s?110$/)
  expect(bundleLine.textContent).toContain('Price bought individually')
  expect(bundleLine.textContent).toContain('Bundle · Grade 4 · Term 3 · 2 resources')
  expect(mathsLine.querySelector('s')).toBeNull()
})

it('keeps the summary totals tight and continue shopping as a plain ink link', () => {
  state.slugs = ['maths']
  mount()
  const subtotal = screen.getByText('Subtotal (1 items)').closest('[data-emphasis]')!
  expect(subtotal.parentElement?.className).toContain('gap-2')
  const link = screen.getByRole('link', { name: 'Continue shopping' })
  expect(link.className).toContain('text-ink')
  expect(link.className).not.toMatch(/(^|\s)underline(\s|$)/)
})

it('sets the empty cart title in bold', () => {
  mount()
  const heading = screen.getByRole('heading', { level: 1, name: 'Your cart is empty' })
  expect(heading.className).toContain('font-bold')
  expect(heading.className).toContain('leading-[1.2]')
})
