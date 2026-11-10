import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

if (!window.PointerEvent) {
  class TestPointerEvent extends MouseEvent {
    pointerId = 1
    pointerType: string
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init)
      this.pointerType = init.pointerType ?? 'mouse'
    }
  }
  Object.defineProperty(window, 'PointerEvent', { configurable: true, value: TestPointerEvent })
}

const requestJson = vi.fn()
const auth = { customer: { id: 'customer-1', email: 'user@example.com' }, getAccessToken: vi.fn(async () => 'token') }
const snapshot = { products: [], bundles: [], localCommercePreview: false, physicalCatalog: null }
let physical = false
let digitalSlugs = ['resource']
let physicalLines = [{ id: 'line-1', productSlug: 'physical', quantity: 1 }]
vi.mock('../../../apps/web/src/lib/auth', () => ({ useAuth: () => auth }))
vi.mock('../../../apps/web/src/lib/catalog', () => ({ useCatalogSnapshot: () => snapshot }))
vi.mock('../../../apps/web/src/lib/use-cart', () => ({ useCartSlugs: () => digitalSlugs }))
vi.mock('../../../apps/web/src/lib/physical-cart', () => ({ usePhysicalCartLines: () => physical ? physicalLines : [] }))
vi.mock('../../../apps/web/src/lib/api', () => ({ apiUrl: (value: string) => value }))
vi.mock('../../../apps/web/src/lib/request-json', () => ({ requestJson: (...args: unknown[]) => requestJson(...args), RequestError: class extends Error { requestId = 'request-1' } }))
vi.mock('../../../apps/web/src/lib/diagnostics', () => ({ trackEvent: vi.fn(), flushDiagnostics: vi.fn() }))
vi.mock('../../../apps/web/src/lib/use-noindex', () => ({ useNoindex: vi.fn() }))
vi.mock('../../../apps/web/src/lib/commerce-label', () => ({ commerceFieldLabel: (key: string) => key }))
vi.mock('@designing-minds/cms', () => ({
  priceLabel: (value: number) => `R${value}`,
  promotionPrice: () => 100,
  resolveCartItems: () => [{ kind: 'product', product: { slug: 'resource', title: 'Resource', priceZar: 100 } }],
  deliveryValidation: () => null,
  normalizeDeliveryPhone: (phone: string) => phone,
}))

import { CheckoutPage } from '../../../apps/web/src/pages/checkout-page'

const quoteDigital = { items: [{ productSlug: 'resource', title: 'Resource', priceZar: 100, originalPriceZar: 100, onSale: false }], subtotalZar: 100, discountZar: 0, totalZar: 100, couponCode: null }
const quoteCommerce = { items: [{ id: 'resource', productSlug: 'resource', title: 'Resource', productType: 'digital', quantity: 1, priceZar: 100, optionValues: {}, customizations: {} }], subtotalZar: 100, discountZar: 0, totalZar: 100, shippingZar: 0, shippingOption: null }
const handoff = { orderId: 'order-1', payfast: { url: 'https://payfast.invalid', fields: { amount: 100 } } }

function mount() { return render(<MemoryRouter><CheckoutPage /></MemoryRouter>) }
async function settleQuote() { await waitFor(() => expect(requestJson).toHaveBeenCalled()); }

beforeEach(() => {
  document.querySelectorAll('form[action=\"https://payfast.invalid\"]').forEach((form) => form.remove())
  physical = false
  digitalSlugs = ['resource']
  physicalLines = [{ id: 'line-1', productSlug: 'physical', quantity: 1 }]
  requestJson.mockReset()
  auth.getAccessToken.mockClear()
  auth.getAccessToken.mockImplementation(async () => 'token')
  vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {})
  requestJson.mockImplementation(async (url: string) => url.includes('commerce/quote') ? quoteCommerce : quoteDigital)
})

describe('checkout behavior', () => {
  it('requires terms and keeps a successful digital PayFast handoff locked against repeat clicks', async () => {
    mount(); await settleQuote()
    const pay = await screen.findByRole('button', { name: 'Pay with PayFast' })
    fireEvent.submit(pay.closest('form')!)
    expect((await screen.findByRole('alert')).textContent).toContain('Terms of Use')
    fireEvent.click(screen.getByRole('checkbox'))
    requestJson.mockImplementation(async (url: string) => url.includes('checkout-quote') ? quoteDigital : handoff)
    fireEvent.click(pay)
    await waitFor(() => expect(requestJson.mock.calls.filter(([url]) => url === '/api/checkout')).toHaveLength(1))
    await waitFor(() => expect((pay as HTMLButtonElement).disabled).toBe(true))
    fireEvent.click(pay)
    expect(requestJson.mock.calls.filter(([url]) => url === '/api/checkout')).toHaveLength(1)
  })

  it('requires terms, preserves commerce failure through re-quote, then allows retry', async () => {
    physical = true
    requestJson.mockImplementation(async (url: string) => {
      if (url.includes('commerce/quote')) return quoteCommerce
      throw new Error('Checkout could not start')
    })
    mount(); await settleQuote()
    fireEvent.click(screen.getByRole('checkbox'))
    const pay = screen.getByRole('button', { name: 'Pay with PayFast' })
    fireEvent.submit(pay.closest('form')!)
    expect((await screen.findByRole('alert')).textContent).toContain('Checkout could not start')
    await waitFor(() => expect(requestJson).toHaveBeenCalledTimes(3))
    expect(screen.getByRole('alert').textContent).toContain('Checkout could not start')
    requestJson.mockImplementation(async (url: string) => url.includes('commerce/quote') ? quoteCommerce : handoff)
    await waitFor(() => expect((screen.getByRole('button', { name: 'Pay with PayFast' }) as HTMLButtonElement).disabled).toBe(false))
    fireEvent.submit(screen.getByRole('button', { name: 'Pay with PayFast' }).closest('form')!)
    await waitFor(() => expect(requestJson.mock.calls.some(([url]) => String(url).includes('/api/commerce/checkout'))).toBe(true))
  })

  it('locks coupon editing while commerce submission is pending', async () => {
    physical = true
    let resolveCheckout!: (value: unknown) => void
    requestJson.mockImplementation((url: string) => url.includes('commerce/quote') ? Promise.resolve(quoteCommerce) : new Promise((resolve) => { resolveCheckout = resolve }))
    mount(); await settleQuote()
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.submit(screen.getByRole('button', { name: 'Pay with PayFast' }).closest('form')!)
    await waitFor(() => expect((screen.getByLabelText('Discount code') as HTMLInputElement).disabled).toBe(true))
    resolveCheckout(handoff)
  })

  it('blocks commerce checkout until terms are accepted', async () => {
    physical = true
    mount(); await settleQuote()
    fireEvent.submit(screen.getByRole('button', { name: 'Pay with PayFast' }).closest('form')!)
    expect((await screen.findByRole('alert')).textContent).toContain('agree to the Terms of Use')
    expect(requestJson.mock.calls.some(([url]) => String(url).includes('/api/commerce/checkout'))).toBe(false)
  })

  it('does not hand off a checkout result after the commerce basket changes', async () => {
    physical = true
    let resolveCheckout!: (value: unknown) => void
    requestJson.mockImplementation((url: string) => url.includes('/api/commerce/quote')
      ? Promise.resolve(quoteCommerce)
      : new Promise((resolve) => { resolveCheckout = resolve }))
    const view = mount(); await settleQuote()
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.submit(screen.getByRole('button', { name: 'Pay with PayFast' }).closest('form')!)
    await waitFor(() => expect(requestJson.mock.calls.some(([url]) => String(url).includes('/api/commerce/checkout'))).toBe(true))

    physicalLines = [{ id: 'line-2', productSlug: 'different-physical', quantity: 1 }]
    view.rerender(<MemoryRouter><CheckoutPage /></MemoryRouter>)
    resolveCheckout(handoff)
    await screen.findByRole('button', { name: 'Pay with PayFast' })
    expect(document.querySelector('form[action="https://payfast.invalid"]')).toBeNull()
  })

  it('drops a digital handoff response when the account changes during checkout', async () => {
    let resolveCheckout!: (value: unknown) => void
    requestJson.mockImplementation((url: string) => url.includes('/api/checkout-quote')
      ? Promise.resolve(quoteDigital)
      : new Promise((resolve) => { resolveCheckout = resolve }))
    const view = mount(); await settleQuote()
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Pay with PayFast' }))
    await waitFor(() => expect(requestJson.mock.calls.some(([url]) => String(url).includes('/api/checkout'))).toBe(true))

    auth.customer = { id: 'customer-2', email: 'other@example.com' }
    view.rerender(<MemoryRouter><CheckoutPage /></MemoryRouter>)
    resolveCheckout(handoff)
    await screen.findByRole('button', { name: 'Pay with PayFast' })
    expect(document.querySelector('form[action="https://payfast.invalid"]')).toBeNull()
    auth.customer = { id: 'customer-1', email: 'user@example.com' }
  })

  it('does not start commerce checkout when the basket changes while fetching a submit token', async () => {
    physical = true
    let resolveToken!: (value: string) => void
    const view = mount(); await settleQuote()
    auth.getAccessToken.mockImplementation(() => new Promise((resolve) => { resolveToken = resolve }))
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.submit(screen.getByRole('button', { name: 'Pay with PayFast' }).closest('form')!)
    await waitFor(() => expect(resolveToken).toBeDefined())
    physicalLines = [{ id: 'line-3', productSlug: 'changed-while-token-pending', quantity: 1 }]
    // Rerender the checkout with the changed basket while its token is pending.
    view.rerender(<MemoryRouter><CheckoutPage /></MemoryRouter>)
    resolveToken('token')
    await screen.findByRole('button', { name: 'Pay with PayFast' })
    expect(requestJson.mock.calls.some(([url]) => String(url).includes('/api/commerce/checkout'))).toBe(false)
    view.unmount()
  })

  it('ignores a late commerce quote for the old basket', async () => {
    physical = true
    let resolveFirstQuote!: (value: unknown) => void
    let resolveSecondQuote!: (value: unknown) => void
    let quoteCalls = 0
    requestJson.mockImplementation((url: string) => {
      if (!String(url).includes('/api/commerce/quote')) return Promise.resolve(handoff)
      quoteCalls += 1
      return new Promise((resolve) => { if (quoteCalls === 1) resolveFirstQuote = resolve; else resolveSecondQuote = resolve })
    })
    const view = mount()
    await waitFor(() => expect(resolveFirstQuote).toBeDefined())
    physicalLines = [{ id: 'line-4', productSlug: 'new-basket', quantity: 1 }]
    view.rerender(<MemoryRouter><CheckoutPage /></MemoryRouter>)
    await waitFor(() => expect(quoteCalls).toBe(2))
    resolveFirstQuote(quoteCommerce)
    await waitFor(() => expect((screen.getByRole('button', { name: 'Pay with PayFast' }) as HTMLButtonElement).disabled).toBe(true))
    resolveSecondQuote(quoteCommerce)
    await waitFor(() => expect(screen.getAllByText('R100').length).toBeGreaterThan(0))
    fireEvent.click(screen.getByRole('checkbox'))
    await waitFor(() => expect((screen.getByRole('button', { name: 'Pay with PayFast' }) as HTMLButtonElement).disabled).toBe(false))
  })
})
