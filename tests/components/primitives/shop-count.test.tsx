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
  expect(screen.queryByText(/Find CAPS-aligned tests, summaries and bundles/)).toBeNull()
})

it('leads a resources-only shop with the published resource count, not the result count', () => {
  render(<MemoryRouter><ShopPage /></MemoryRouter>)
  const lead = screen.getByText('Browse 2 CAPS-aligned resources across grades, terms, subjects and formats, or start with a bundle.')
  expect(lead.className).toContain('lead')
})

it('labels the bundles-first ordering in the muted body size', () => {
  render(<MemoryRouter><ShopPage /></MemoryRouter>)
  const note = screen.getByText('Bundles first')
  expect(note.className).toContain('text-body')
  expect(note.className).toContain('text-muted')
})
