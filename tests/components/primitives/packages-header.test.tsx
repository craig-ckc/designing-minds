import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import type { Bundle } from '../../../packages/cms/src/types'
import { makeBundle, makeSnapshot } from '../../support/fixtures'

const state = vi.hoisted(() => ({ bundles: [] as Bundle[] }))
vi.mock('../../../apps/web/src/lib/catalog', () => ({ useCatalogSnapshot: () => makeSnapshot({ bundles: state.bundles }) }))
import { PackagesPage } from '../../../apps/web/src/pages/packages-page'

afterEach(cleanup)

const renderPage = (count: number, url = '/packages') => {
  state.bundles = Array.from({ length: count }, (_, index) => makeBundle({ slug: `bundle-${index}`, title: `Bundle ${index}` }))
  return render(<MemoryRouter initialEntries={[url]}><PackagesPage /></MemoryRouter>)
}

it('states the once-off ownership promise in the lead and keeps the classroom licensing pointer', () => {
  renderPage(4)
  expect(screen.getByText('Bundles group the resources for a grade into one discounted, once-off purchase. Nothing renews automatically. You own what you buy.')).toBeTruthy()
  expect(screen.getByRole('link', { name: 'See classroom licensing' }).getAttribute('href')).toBe('/help#licensing')
})

it('counts the matching bundles in a single heading with no sort label beside it', () => {
  renderPage(4)
  const heading = screen.getByRole('heading', { level: 2, name: '4 bundles' })
  expect(heading.className).toContain('text-body-lg')
  expect(heading.className).toContain('font-semibold')
  expect(screen.queryByText(/Curated for you|Sorted by your choice/)).toBeNull()
})

it('uses the singular for one bundle', () => {
  renderPage(1)
  expect(screen.getByRole('heading', { level: 2, name: '1 bundle' })).toBeTruthy()
})

it('counts zero bundles when filters match nothing', () => {
  renderPage(2, '/packages?grade=Grade%207&q=nothing-matches')
  expect(screen.getByRole('heading', { level: 2, name: '0 bundles' })).toBeTruthy()
  expect(screen.getByText('No matching bundles')).toBeTruthy()
})
