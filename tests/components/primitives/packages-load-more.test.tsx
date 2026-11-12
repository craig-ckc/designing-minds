import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import { makeBundle, makeSnapshot } from '../../support/fixtures'

vi.mock('../../../apps/web/src/lib/catalog', () => ({ useCatalogSnapshot: () => makeSnapshot({
  bundles: Array.from({ length: 49 }, (_, index) => makeBundle({ slug: `bundle-${index}`, title: `Bundle ${index}` })),
}) }))
import { PackagesPage } from '../../../apps/web/src/pages/packages-page'

it('shows a Load more control when there are more bundles than the initial limit', () => {
  render(<MemoryRouter><PackagesPage /></MemoryRouter>)
  expect(screen.getByRole('button', { name: /Load more bundles/ })).toBeTruthy()
  expect(screen.getByText(/1 remaining/)).toBeTruthy()
})
