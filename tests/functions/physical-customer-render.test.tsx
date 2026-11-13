import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import { makeProduct, makeSnapshot } from '../support/fixtures.ts'
import type { Order } from '../../packages/cms/src/types.ts'
import type { PhysicalCartLine } from '../../packages/cms/src/lib/commerce.ts'

const state = vi.hoisted(() => ({ snapshot: null as unknown, lines: [] as unknown[], customer: { id: 'customer', name: 'Sample Customer', email: 'sample@example.test' } }))
vi.mock('../../apps/web/src/lib/auth.tsx', () => ({ useAuth: () => ({ customer: state.customer, loading: false, getAccessToken: async () => 'token', logout: async () => {} }) }))
vi.mock('../../apps/web/src/lib/catalog.tsx', () => ({ useCatalogSnapshot: () => state.snapshot }))
vi.mock('../../apps/web/src/lib/physical-cart.ts', () => ({ usePhysicalCartLines: () => state.lines, consumePurchasedPhysicalCart: vi.fn(), getPhysicalCartLines: () => state.lines, removePhysicalCartLine: vi.fn(), updatePhysicalCartLine: vi.fn() }))
vi.mock('../../apps/web/src/lib/use-cart.ts', () => ({ useCartSlugs: () => [] }))
vi.mock('../../apps/web/src/lib/supabase.ts', () => ({ supabase: null }))
import { CheckoutPage } from '../../apps/web/src/pages/checkout-page.tsx'
import { OrderDetailPage } from '../../apps/web/src/pages/account/order-detail-page.tsx'
import { CommercePaymentPage } from '../../apps/web/src/pages/commerce-payment-page.tsx'
import { commerceFieldLabel } from '../../apps/web/src/lib/commerce-label.ts'
import { matchingPaymentState, type PaymentOrderState } from '../../apps/web/src/lib/commerce-payment-state.ts'

const render = (element: ReturnType<typeof createElement>, path = '/', route = '*') => renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [path] }, createElement(Routes, {}, createElement(Route, { path: route, element }))))
const physicalLine: PhysicalCartLine = { id: 'line', productSlug: 'keyring', variantId: 'pink', quantity: 2, customizations: { name: 'Ava' } }
const order = (status: Order['status']): Order => ({
  id: 'order', reference: 'DM-SAMPLE', customerId: 'customer', customerName: 'Sample Customer', customerEmail: 'sample@example.test', status,
  items: [{ id: 'physical', productSlug: 'keyring', title: 'Name keyring', productKind: 'Physical', productType: 'physical', priceZar: 180, quantity: 2, unitPriceZar: 90, customizations: { name: 'Ava' }, optionValues: { colour: 'Pink' }, cartLineId: 'line' }],
  totalZar: 255, subtotalZar: 180, shippingZar: 75, shippingMethod: 'Sample delivery', hasPhysical: true, fulfillmentStatus: 'unfulfilled', paymentId: 'payment', placedAt: '2026-11-10T00:00:00Z',
  delivery: { recipientName: 'Sample Recipient', phone: '0821234567', addressLine1: '1 Example Road', suburb: 'Gardens', city: 'Cape Town', province: 'Western Cape', postalCode: '8001', country: 'ZA' },
})

it('shows conditional recipient/address fields for a physical cart and a simulated payment label', () => {
  state.snapshot = makeSnapshot({ localCommercePreview: true })
  state.lines = [physicalLine]
  const html = render(createElement(CheckoutPage))
  expect(html).toContain('Delivery details')
  expect(html).toContain('Recipient name')
  expect(html).toContain('Postal code')
  expect(html).toContain('Continue to sample payment')
  expect(html).toMatch(/<button(?=[^>]*type="submit")(?=[^>]*class="[^"]*border-primary-ink-strong)[^>]*>Continue to sample payment/)
  expect(html).toContain('Delivery is charged once and is never discounted.')
  // Discount codes now cover physical items too, so the note must not limit them to digital resources.
  expect(html).not.toContain('digital resources only')
})

it('does not require delivery for a digital-only sample checkout', () => {
  state.snapshot = makeSnapshot({ localCommercePreview: true })
  state.lines = []
  const html = render(createElement(CheckoutPage))
  expect(html).not.toContain('Delivery details')
  expect(html).toContain('Your cart is empty')
})

it('physical order receipts preserve quantities, names, delivery and no downloadable-file claims', () => {
  const purchase = order('paid')
  const snapshot = makeSnapshot({ orders: [purchase] })
  const html = render(createElement(OrderDetailPage, { snapshot, onRefresh: async () => {} }), '/account/orders/order', '/account/orders/:orderId')
  expect(html).toMatch(/Qty 2 × R\s?90/)
  expect(html).toContain('Ava')
  expect(html).toContain('Pink')
  expect(html).toContain('1 Example Road')
  expect(html).toContain('Awaiting fulfilment')
  expect(html).toContain('aria-label="Delivery progress"')
  expect(html).not.toContain('>Download<')
})

it('review orders unlock the paid-for digital lines while physical stock is reviewed', () => {
  // A stock review concerns physical items only; the payment succeeded, so
  // digital resources in the same order are already paid for.
  const purchase = order('payment_review')
  const digital = makeProduct({ slug: 'maths', purchasedFiles: [{ id: 'file', label: 'Assessment', filename: 'maths.pdf' }] })
  purchase.items.push({ id: 'digital', productSlug: 'maths', productKind: 'Single', priceZar: 60, title: 'Maths resource', productType: 'digital' })
  const snapshot = makeSnapshot({ orders: [purchase], products: [digital] })
  const html = render(createElement(OrderDetailPage, { snapshot, onRefresh: async () => {} }), '/account/orders/order', '/account/orders/:orderId')
  expect(html).toContain('Payment under review')
  expect(html).toContain('needs a stock review')
  expect(html).toContain('Your downloads are ready above.')
  expect(html).not.toContain('Downloads unlock here once payment succeeds')
  const downloadButton = html.match(/<button[^>]*aria-label="Download[^"]*"[^>]*>/)?.[0]
  expect(downloadButton).toBeDefined()
  expect(downloadButton).not.toMatch(/\sdisabled=""/)
})

it('does not render unsafe tracking URLs', () => {
  const purchase = { ...order('paid'), trackingNumber: 'SAMPLE', trackingUrl: 'javascript:alert(1)' }
  const snapshot = makeSnapshot({ orders: [purchase] })
  expect(render(createElement(OrderDetailPage, { snapshot, onRefresh: async () => {} }), '/account/orders/order', '/account/orders/:orderId')).not.toContain('javascript:')
})

it('failed physical-only receipts do not promise dispatch or refer to downloads', () => {
  const purchase = order('failed')
  purchase.items[0].customizations = { teacherName: 'Ms Sample' }
  const html = render(createElement(OrderDetailPage, { snapshot: makeSnapshot({ orders: [purchase] }), onRefresh: async () => {} }), '/account/orders/order', '/account/orders/:orderId')
  expect(html).toContain('No physical products will be dispatched.')
  expect(html).not.toContain('Delivery progress')
  expect(html).toContain('Teacher name')
  expect(html).not.toContain('teacherName:')
  expect(html).not.toContain('This item will be delivered')
  expect(html).not.toContain('Downloads unlock')
  expect(html).not.toContain('Problem with a download')
})

it('uses configured personalisation labels or readable historical fallbacks', () => {
  expect(commerceFieldLabel('teacherName')).toBe('Teacher name')
  expect(commerceFieldLabel('size')).toBe('Size')
  expect(commerceFieldLabel('color')).toBe('Colour')
  expect(commerceFieldLabel('teacherName', { customizationRules: [{ key: 'teacherName', label: 'Teacher’s name', type: 'text', required: true }] })).toBe('Teacher’s name')
})

it('the sample payment screen is unavailable outside the local preview context', () => {
  state.snapshot = makeSnapshot()
  expect(render(createElement(CommercePaymentPage), '/checkout/payment/order', '/checkout/payment/:orderId')).toContain('Sample payment unavailable')
})

it('never displays a payment result from a previous customer or route', () => {
  const loaded: PaymentOrderState = { customerId: 'customer', orderId: 'order', order: order('pending'), error: null }
  expect(matchingPaymentState(loaded, 'another-customer', 'order')).toBeNull()
  expect(matchingPaymentState(loaded, 'customer', 'another-order')).toBeNull()
  expect(matchingPaymentState(loaded, undefined, 'order')).toBeNull()
  expect(matchingPaymentState(loaded, 'customer', 'order')).toBe(loaded)
})

it('rejects a loaded payment snapshot whose underlying order does not belong to its tagged account', () => {
  const loaded: PaymentOrderState = { customerId: 'customer', orderId: 'order', order: { ...order('pending'), customerId: 'another-customer' }, error: null }
  expect(matchingPaymentState(loaded, 'customer', 'order')).toBeNull()
})

it('hides a previous account error while a new payment lookup is pending', () => {
  const failure: PaymentOrderState = { customerId: 'previous', orderId: 'order', order: null, error: 'Previous account lookup failed' }
  expect(matchingPaymentState(failure, 'customer', 'order')).toBeNull()
  expect(matchingPaymentState(failure, 'previous', 'order')?.error).toBe('Previous account lookup failed')
})
