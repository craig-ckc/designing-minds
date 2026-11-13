import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { priceLabel, type Order, type OrderItem, type Payment } from '@designing-minds/cms'
import { makeProduct, makeSnapshot } from '../../support/fixtures'

vi.mock('../../../apps/web/src/lib/auth', () => ({
  useAuth: () => ({
    customer: { id: 'customer', name: 'Thandi Mokoena', email: 'thandi@example.com', createdAt: '2026-03-12T10:00:00Z' },
    getAccessToken: async () => 'token',
    logout: async () => {},
  }),
}))
vi.mock('../../../apps/web/src/lib/physical-cart', () => ({ consumePurchasedPhysicalCart: vi.fn() }))
vi.mock('../../../apps/web/src/lib/supabase', () => ({ supabase: null }))

import { AccountPage } from '../../../apps/web/src/pages/account/account-page'
import { OrderDetailPage } from '../../../apps/web/src/pages/account/order-detail-page'
import { OrderRow } from '../../../apps/web/src/pages/account/order-row'

const digital = (id: string, title: string): OrderItem => ({ id, productSlug: id, title, productKind: 'Single', productType: 'digital', priceZar: 95 })
const physical: OrderItem = { id: 'keyring', productSlug: 'keyring', title: 'Personalised name keyring', productKind: 'Physical', productType: 'physical', priceZar: 178, quantity: 2, unitPriceZar: 89, optionValues: { colour: 'Pink' }, customizations: { name: 'Thandi' } }
const order = (overrides: Partial<Order>): Order => ({
  id: 'o1', reference: 'DM-20261104-3F9A1C2B', customerId: 'customer', customerName: 'Thandi Mokoena', customerEmail: 'thandi@example.com',
  status: 'fulfilled', placedAt: '2026-11-04T10:00:00Z', totalZar: 190, paymentId: 'p1', items: [digital('maths', 'Grade 4 Maths'), digital('english', 'Grade 4 English')],
  ...overrides,
})
const courierOrder = (overrides: Partial<Order> = {}) => order({
  id: 'o4', reference: 'DM-20261108-7B2E4D1A', status: 'paid', placedAt: '2026-11-08T10:00:00Z', totalZar: 327, subtotalZar: 228, paymentId: 'p4',
  hasPhysical: true, shippingZar: 99, shippingMethod: 'Courier delivery', fulfillmentStatus: 'shipped',
  delivery: { recipientName: 'Thandi Nkosi', addressLine1: '14 Disa Road', suburb: 'Walmer', city: 'Gqeberha', province: 'Eastern Cape', postalCode: '6070', phone: '082 555 0142', country: 'ZA' },
  items: [digital('maths', 'Grade 4 Maths'), physical],
  ...overrides,
})
/** Testing Library collapses whitespace (incl. the no-break spaces in prices) before matching text. */
const shown = (amount: number) => priceLabel(amount).replace(/\s/g, ' ')
const payment: Payment = { id: 'p4', orderId: 'o4', status: 'succeeded', provider: 'PayFast', reference: 'PF-1048223', amountZar: 327, createdAt: '2026-11-08T10:00:00Z' }

const dashboard = (orders: Order[]) => render(<MemoryRouter initialEntries={['/account']}><AccountPage snapshot={makeSnapshot({ orders })} /></MemoryRouter>)
const detail = (purchase: Order, extra: Parameters<typeof makeSnapshot>[0] = {}) => render(
  <MemoryRouter initialEntries={[`/account/orders/${purchase.id}`]}>
    <Routes><Route path="/account/orders/:orderId" element={<OrderDetailPage snapshot={makeSnapshot({ orders: [purchase], ...extra })} onRefresh={async () => {}} />} /></Routes>
  </MemoryRouter>,
)

describe('AccountPage', () => {
  it('lists the latest order’s files and links Download files to the downloads section', () => {
    dashboard([order({})])
    const files = screen.getByRole('list', { name: 'Included files' })
    expect(within(files).getAllByRole('listitem').map((item) => item.textContent)).toEqual(['Grade 4 Maths', 'Grade 4 English'])
    const cta = screen.getByRole('link', { name: 'Download files' })
    expect(cta.getAttribute('href')).toBe('/account/orders/o1#order-downloads')
    expect(cta.querySelector('svg')).toBeTruthy()
    expect(screen.queryByText('Go to downloads')).toBeNull()
  })

  it('lists only the digital lines of a mixed order and gives a physical-only order no download prompt', () => {
    const { unmount } = dashboard([courierOrder()])
    expect(within(screen.getByRole('list', { name: 'Included files' })).getAllByRole('listitem').map((item) => item.textContent)).toEqual(['Grade 4 Maths'])
    unmount()
    dashboard([courierOrder({ items: [physical] })])
    expect(screen.queryByText('Your latest order is ready to download')).toBeNull()
    expect(screen.queryByRole('link', { name: 'Download files' })).toBeNull()
  })

  it('shows no download prompt for an unpaid latest order', () => {
    dashboard([order({ status: 'pending' })])
    expect(screen.queryByRole('list', { name: 'Included files' })).toBeNull()
  })

  it('sets the side cards as outlined spec lists with H5 titles', () => {
    dashboard([order({})])
    const summary = screen.getByRole('heading', { name: 'Summary' })
    expect(summary.className).toContain('text-h5')
    expect(summary.parentElement?.className).toContain('border-line')
    const rows = within(summary.parentElement!).getAllByRole('listitem')
    expect(rows.map((row) => row.textContent)).toEqual(['Total orders1', 'Ready to download1', `Lifetime spend${priceLabel(190)}`])
    expect(screen.getByRole('heading', { name: 'Recent orders' }).className).toContain('text-h4')
  })

  it('aligns the header bottom edges and has no breadcrumb', () => {
    dashboard([order({})])
    expect(screen.getByRole('heading', { level: 1 }).parentElement?.parentElement?.className).toContain('items-end')
    expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).toBeNull()
  })
})

describe('OrderDetailPage', () => {
  it('shows the Account / Order history / reference breadcrumb and the status and date under the title', () => {
    detail(courierOrder(), { payments: [payment] })
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(within(crumbs).getByRole('link', { name: 'Account' }).getAttribute('href')).toBe('/account')
    expect(within(crumbs).getByRole('link', { name: 'Order history' }).getAttribute('href')).toBe('/account/orders')
    expect(within(crumbs).getByText('DM-20261108-7B2E4D1A').getAttribute('aria-current')).toBe('page')
    const heading = screen.getByRole('heading', { level: 1, name: 'Order DM-20261108-7B2E4D1A' })
    expect(heading.parentElement?.textContent).toContain('paidPlaced 8 Nov 2026')
  })

  it('shows the courier method and fee above tracking only when the order recorded them', () => {
    const { unmount } = detail(courierOrder(), { payments: [payment] })
    expect(screen.getByText(`Courier delivery · ${shown(99)}`)).toBeTruthy()
    unmount()
    detail(courierOrder({ shippingMethod: null }))
    expect(screen.queryByText(`Courier delivery · ${shown(99)}`)).toBeNull()
  })

  it('itemises the receipt: payment without status, a subtotal, and the shipping row keeps its divider', () => {
    detail(courierOrder(), { payments: [payment] })
    const receipt = screen.getByRole('heading', { name: 'Receipt' }).parentElement!
    expect(receipt.className).toContain('border-line')
    const rows = within(receipt).getAllByRole('listitem')
    expect(rows.map((row) => row.firstElementChild?.textContent)).toEqual(['Reference', 'Account', 'Email', 'Payment', 'Subtotal', 'Courier delivery'])
    expect(rows[3].textContent).toBe('PaymentPayFast · PF-1048223')
    expect(rows[4].textContent).toBe(`Subtotal${priceLabel(228)}`)
    expect(rows[5].className).toContain('border-b')
  })

  it('always shows a subtotal, deriving it without shipping for older orders', () => {
    detail(courierOrder({ subtotalZar: null }))
    const subtotal = within(screen.getByRole('heading', { name: 'Receipt' }).parentElement!).getByText('Subtotal')
    expect(subtotal.parentElement?.textContent).toBe(`Subtotal${priceLabel(228)}`)
  })

  it('ends the help line without a full stop', () => {
    detail(courierOrder())
    const help = screen.getByRole('link', { name: 'Contact support' }).parentElement!
    expect(help.textContent).toBe('Problem with a download? Contact support')
  })

  it('marks completed delivery steps as regular soft ink and the current step as semibold ink', () => {
    detail(courierOrder())
    const steps = within(screen.getByRole('list', { name: 'Delivery progress' })).getAllByRole('listitem')
    expect(steps.map((step) => step.getAttribute('data-state'))).toEqual(['complete', 'current', 'upcoming'])
    expect(steps[0].className).toContain('text-ink-soft')
    expect(steps[0].className).not.toContain('font-semibold')
    expect(steps[1].className).toContain('font-semibold text-ink')
    expect(steps[2].className).toContain('text-muted')
  })

  it('lists each file under a hairline with a 24px document icon', () => {
    const maths = makeProduct({ slug: 'maths', title: 'Grade 4 Maths', purchasedFiles: [{ id: 'f1', label: 'Assessment (PDF)', filename: 'a.pdf' }, { id: 'f2', label: 'Memo (PDF)', filename: 'm.pdf' }] })
    detail(order({}), { products: [maths] })
    const row = screen.getByRole('button', { name: 'Download Assessment (PDF)' }).closest('li')!
    expect(row.className).toContain('border-t border-line pt-3')
    expect(row.querySelector('svg')?.getAttribute('width')).toBe('24')
    expect(screen.getByText(`Single · ${maths.grade} · ${maths.term}`)).toBeTruthy()
  })
})

describe('OrderRow', () => {
  it('sets the meta as a caption and gives status and total right-aligned slots', () => {
    render(<MemoryRouter><OrderRow order={order({ status: 'paid', totalZar: 1200 })} /></MemoryRouter>)
    expect(screen.getByText('4 Nov 2026 · 2 items').className).toContain('text-caption')
    expect(screen.getByText('paid').closest('span.flex')?.className).toContain('sm:min-w-30')
    expect(screen.getByText(shown(1200)).className).toMatch(/text-right.*sm:min-w-18/)
  })
})
