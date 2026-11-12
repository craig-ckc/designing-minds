import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import type { PhysicalCatalogProduct } from '@designing-minds/cms'
import { PhysicalProductDetail } from '../../../apps/web/src/components/physical-product-detail'

const query = vi.hoisted(() => ({
  from: vi.fn(), select: vi.fn(), eq: vi.fn(), abortSignal: vi.fn(), maybeSingle: vi.fn(),
}))
vi.mock('../../../apps/web/src/lib/supabase', () => ({ supabase: query }))

const product: PhysicalCatalogProduct = {
  id: 'gift-bag', slug: 'gift-bag', title: 'Gift bag', shortDescription: '', fullDescription: '',
  productType: 'physical', priceZar: 100, pricingMode: 'fixed', pricingFieldKey: null, billableCharacters: null,
  customizationRules: [], galleryImages: [], published: true,
  variants: [
    { id: 'pink', sku: null, optionValues: { colour: 'Pink' }, unitPriceZar: null, available: false },
    { id: 'blue', sku: null, optionValues: { colour: 'Blue' }, unitPriceZar: null, available: false },
  ],
}

const response = (pink: boolean, blue: boolean) => ({
  data: { variants: [{ id: 'pink', available: pink }, { id: 'blue', available: blue }] }, error: null,
})

const openProduct = () => render(<MemoryRouter><PhysicalProductDetail product={product} /></MemoryRouter>)
const returnToTab = () => fireEvent(document, new Event('visibilitychange'))
const purchaseButton = (name: string) => screen.getByRole<HTMLButtonElement>('button', { name })

beforeEach(() => {
  query.from.mockReturnValue(query)
  query.select.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  query.abortSignal.mockReturnValue(query)
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
})

it('refreshes a stale snapshot and preserves an explicit option selection on a later refresh', async () => {
  query.maybeSingle.mockResolvedValueOnce(response(true, true)).mockResolvedValueOnce(response(true, false))
  openProduct()

  expect(purchaseButton('Out of stock').disabled).toBe(true)
  await screen.findByRole('button', { name: 'Add to cart' })
  expect(query.from).toHaveBeenCalledWith('catalog_physical_products')
  expect(query.select).toHaveBeenCalledWith('variants')
  expect(query.eq).toHaveBeenCalledWith('id', product.id)

  fireEvent.click(screen.getByRole('radio', { name: 'Blue' }))
  returnToTab()
  await screen.findByRole('button', { name: 'Out of stock' })
  const blue = screen.getByRole<HTMLInputElement>('radio', { name: /Blue/ })
  expect(blue.checked).toBe(true)
  expect(blue.disabled).toBe(true)

  fireEvent.click(screen.getByRole('radio', { name: 'Pink' }))
  expect(purchaseButton('Add to cart').disabled).toBe(false)
})

it('keeps the last known availability after a failed refresh and lets the shopper retry', async () => {
  query.maybeSingle.mockResolvedValueOnce(response(true, false))
    .mockResolvedValueOnce({ data: null, error: { message: 'Unavailable' } })
    .mockResolvedValueOnce({ data: null, error: null })
  openProduct()

  await screen.findByRole('button', { name: 'Add to cart' })
  returnToTab()
  const retry = await screen.findByRole('button', { name: 'Check stock again' })
  expect(purchaseButton('Add to cart').disabled).toBe(false)
  fireEvent.click(retry)

  await waitFor(() => expect(screen.queryByRole('button', { name: 'Check stock again' })).toBeNull())
  expect(purchaseButton('Out of stock').disabled).toBe(true)
})

it('cancels an in-flight stock check when leaving the product', () => {
  query.maybeSingle.mockReturnValueOnce(new Promise(() => {}))
  const { unmount } = openProduct()
  const signal: AbortSignal = query.abortSignal.mock.calls[0][0]
  expect(signal.aborted).toBe(false)
  unmount()
  expect(signal.aborted).toBe(true)
})
