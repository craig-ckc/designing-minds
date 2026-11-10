import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { OrderStatus } from '@designing-minds/cms'
import { expect, it } from 'vitest'
import { OrderRecoveryNotice } from '../../../apps/web/src/pages/account/order-recovery-notice'

it.each<OrderStatus>(['failed'])('offers a cart recovery path after a %s payment', (status) => {
  render(<MemoryRouter><OrderRecoveryNotice status={status} /></MemoryRouter>)
  expect(screen.getByText(/Payment was not completed/)).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Review cart' }).getAttribute('href')).toBe('/cart')
})

it.each<OrderStatus>(['pending', 'paid', 'fulfilled', 'payment_review', 'refunded'])('does not encourage another checkout for a %s order', (status) => {
  render(<MemoryRouter><OrderRecoveryNotice status={status} /></MemoryRouter>)
  expect(screen.queryByRole('link', { name: 'Review cart' })).toBeNull()
})
