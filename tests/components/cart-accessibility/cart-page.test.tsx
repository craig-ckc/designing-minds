import { act, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  slugs: ['first', 'second'],
  rerender: (() => {}) as () => void,
}))
vi.mock('../../../apps/web/src/lib/catalog', () => ({ useCatalogSnapshot: () => ({ products: [], bundles: [], physicalCatalog: null }) }))
vi.mock('../../../apps/web/src/lib/use-noindex', () => ({ useNoindex: () => {} }))
vi.mock('../../../apps/web/src/lib/use-cart', () => ({ useCartSlugs: () => state.slugs }))
vi.mock('../../../apps/web/src/lib/cart', () => ({ removeCartSlug: (slug: string) => { state.slugs = state.slugs.filter((value) => value !== slug); state.rerender() } }))
vi.mock('../../../apps/web/src/lib/physical-cart', () => ({ usePhysicalCartLines: () => [] }))
vi.mock('@designing-minds/cms', () => ({
  bundleContents: () => [],
  priceLabel: (value: number) => `R${value}`,
  promotionPrice: (record: { priceZar: number }) => record.priceZar,
  resolveCartItems: (_snapshot: unknown, slugs: string[]) => slugs.map((slug) => ({ kind: 'product', product: { slug, title: slug === 'first' ? 'First resource' : 'Second resource', grade: 'Grade 4', term: 'Term 1', subjects: [], priceZar: 10 } })),
  physicalUnitPriceZar: () => 0,
}))

import { CartPage } from '../../../apps/web/src/pages/cart-page'
import { LiveRegionProvider } from '../../../apps/web/src/components/ui/live-region'

function Harness() {
  const [, setTick] = useState(0)
  state.rerender = () => setTick((value) => value + 1)
  return <MemoryRouter><LiveRegionProvider><CartPage /></LiveRegionProvider></MemoryRouter>
}

describe('cart removal accessibility', () => {
  beforeEach(() => { state.slugs = ['first', 'second']; vi.useRealTimers() })

  it('moves focus to the next removal action and announces the removed product', () => {
    vi.useFakeTimers()
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove First resource from cart' }))
    act(() => { vi.advanceTimersByTime(0) })
    const nextRemove = screen.getByRole('button', { name: 'Remove Second resource from cart' })
    expect(document.activeElement).toBe(nextRemove)
    act(() => { vi.advanceTimersByTime(50) })
    expect(screen.getByRole('status').textContent).toBe('First resource removed from cart.')
    expect(screen.queryByRole('button', { name: 'Remove First resource from cart' })).toBeNull()
  })

  it('moves focus to the empty-cart action when the final row is removed', () => {
    vi.useFakeTimers()
    state.slugs = ['first']
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove First resource from cart' }))
    act(() => { vi.advanceTimersByTime(0) })
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Browse resources' }))
    act(() => { vi.advanceTimersByTime(50) })
    expect(screen.getByRole('status').textContent).toBe('First resource removed from cart.')
  })
})
