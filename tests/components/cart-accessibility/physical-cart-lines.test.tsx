import { act, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import type { PhysicalCatalogProduct } from '@designing-minds/cms'

const state = vi.hoisted(() => ({
  lines: [
    { id: 'one', productSlug: 'book', variantId: 'paper', quantity: 1, customizations: {} },
    { id: 'two', productSlug: 'book', variantId: 'paper', quantity: 1, customizations: {} },
  ],
  rerender: (() => {}) as () => void,
}))
vi.mock('../../../apps/web/src/lib/physical-cart', () => ({
  removePhysicalCartLine: (id: string) => { state.lines = state.lines.filter((line) => line.id !== id); state.rerender() },
  updatePhysicalCartLine: vi.fn(),
}))
vi.mock('../../../apps/web/src/lib/commerce-label', () => ({ commerceFieldLabel: (key: string) => key }))
vi.mock('@designing-minds/cms', () => ({ physicalUnitPriceZar: () => 20, priceLabel: (value: number) => `R${value}`, quantityValidation: (value: number) => Number.isInteger(value) && value > 0 ? null : 'Quantity must be a positive whole number.' }))

import { PhysicalCartRow } from '../../../apps/web/src/components/physical-cart-row'
import { LiveRegionProvider } from '../../../apps/web/src/components/ui/live-region'

const catalogue: PhysicalCatalogProduct[] = [{
  id: 'book-id',
  slug: 'book',
  title: 'Workbook',
  shortDescription: '',
  fullDescription: '',
  productType: 'physical',
  priceZar: 20,
  pricingMode: 'fixed',
  pricingFieldKey: null,
  billableCharacters: null,
  customizationRules: [],
  galleryImages: [],
  variants: [{ id: 'paper', sku: null, available: true, optionValues: {}, unitPriceZar: 20 }],
  published: true,
}]

function Harness() {
  const [, setTick] = useState(0)
  state.rerender = () => setTick((value) => value + 1)
  return <MemoryRouter><LiveRegionProvider><ul>{state.lines.map((line) => <PhysicalCartRow key={line.id} line={line} product={catalogue[0]} fallbackFocusSelector="[data-cart-heading]" />)}</ul></LiveRegionProvider></MemoryRouter>
}

beforeEach(() => {
  state.lines = [
    { id: 'one', productSlug: 'book', variantId: 'paper', quantity: 1, customizations: {} },
    { id: 'two', productSlug: 'book', variantId: 'paper', quantity: 1, customizations: {} },
  ]
  vi.useFakeTimers()
})

it('keeps focus on the next physical line and announces its removal', () => {
  render(<Harness />)
  fireEvent.click(screen.getAllByRole('button', { name: 'Remove Workbook from cart' })[0])
  act(() => { vi.advanceTimersByTime(0) })
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Remove Workbook from cart' }))
  act(() => { vi.advanceTimersByTime(50) })
  expect(screen.getByRole('status').textContent).toBe('Workbook removed from cart.')
})

it('shows the delete, a quantity stepper with the line label, and validates typed quantities', () => {
  render(<Harness />)
  expect(screen.getAllByRole('spinbutton', { name: 'Quantity for Workbook' })).toHaveLength(2)
  fireEvent.click(screen.getAllByRole('button', { name: 'Increase quantity' })[0])
  expect(screen.queryAllByRole('alert').filter((node) => node.textContent)).toHaveLength(0)
})
