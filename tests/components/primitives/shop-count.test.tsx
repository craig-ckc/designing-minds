import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import { makeBundle, makeProduct, makeSnapshot } from '../../support/fixtures'

vi.mock('../../../apps/web/src/lib/catalog', () => ({ useCatalogSnapshot: () => makeSnapshot({
  products: [makeProduct({ slug: 'test' }), makeProduct({ slug: 'summary' })],
  bundles: [makeBundle({ slug: 'bundle' })],
}) }))
import { ShopPage } from '../../../apps/web/src/pages/shop-page'

it('gives the combined resource and bundle results one authoritative count', () => {
  render(<MemoryRouter><ShopPage /></MemoryRouter>)
  expect(screen.getByRole('heading', { name: '3 results' })).toBeTruthy()
  // The header lead is gone: the count and the filter sheet carry the page.
  expect(screen.queryByText(/Find CAPS-aligned tests, summaries and bundles/)).toBeNull()
  expect(screen.queryByText(/Browse \d+ CAPS-aligned resources/)).toBeNull()
})
