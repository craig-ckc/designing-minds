import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import type { ProductImage } from '@designing-minds/cms'
import { CartLine } from '../../../apps/web/src/components/ui/cart-line'
import { SummaryRow } from '../../../apps/web/src/components/ui/summary-row'
import { PhysicalProductGallery } from '../../../apps/web/src/components/ui/physical-product-gallery'

const wrap = (node: React.ReactNode) => render(<MemoryRouter><ul>{node}</ul></MemoryRouter>)

it('digital cart line has a delete button and no quantity input', () => {
  const onRemove = vi.fn()
  wrap(<CartLine type="digital" context="cart" title="Maths" meta="Grade 4 · Term 1" price="R 60" onRemove={onRemove} />)
  fireEvent.click(screen.getByRole('button', { name: 'Remove Maths from cart' }))
  expect(onRemove).toHaveBeenCalledOnce()
  expect(screen.queryByRole('spinbutton')).toBeNull()
})

it('physical cart line has a labelled quantity input and options line', () => {
  const onQuantityChange = vi.fn()
  wrap(<CartLine type="physical" context="cart" title="Keyring" options="Colour: Pink · Name: Thandi" price="R 90" quantity={2} quantityLabel="Quantity for Keyring, Pink" onQuantityChange={onQuantityChange} onRemove={() => {}} />)
  expect(screen.getByText('Colour: Pink · Name: Thandi')).toBeTruthy()
  expect(screen.getByRole('spinbutton', { name: 'Quantity for Keyring, Pink' })).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Increase quantity' }))
  expect(onQuantityChange).toHaveBeenCalledWith(3)
})

it('shows an alert for an unavailable line', () => {
  wrap(<CartLine type="physical" context="cart" title="Keyring" price="R 90" alert="This option is currently unavailable." onQuantityChange={() => {}} />)
  expect(screen.getByRole('alert').textContent).toContain('unavailable')
})

it('summary lines have no delete button or quantity input', () => {
  wrap(<CartLine type="physical" context="summary" title="Keyring" meta="Quantity 2" price="R 90" quantity={2} onQuantityChange={() => {}} onRemove={() => {}} />)
  expect(screen.queryByRole('button')).toBeNull()
  expect(screen.queryByRole('spinbutton')).toBeNull()
  expect(screen.getByText('R 90')).toBeTruthy()
})

it('SummaryRow total renders a hairline and heading style; default does not', () => {
  const { container } = render(<><SummaryRow label="Subtotal" value="R 10" /><SummaryRow label="Total" value="R 10" emphasis="total" /></>)
  const [plain, total] = Array.from(container.children)
  expect(plain.className).not.toContain('border-t')
  expect(plain.className).toContain('text-body')
  expect(total.className).toContain('border-t border-line')
  expect(total.className).toContain('text-h6')
})

const image = (n: number): ProductImage => ({ id: `i${n}`, storageKey: `${n}.png`, url: `https://img.test/${n}.png`, filename: `${n}.png`, alt: `View ${n}` })

it('gallery shows thumbnails only for more than one image and switching changes the main image', () => {
  const { container, rerender } = render(<PhysicalProductGallery product={{ title: 'Keyring', galleryImages: [image(1)] }} />)
  expect(screen.queryByRole('button')).toBeNull()
  rerender(<PhysicalProductGallery product={{ title: 'Keyring', galleryImages: [image(1), image(2)] }} />)
  expect(container.querySelector('img')?.getAttribute('src')).toBe('https://img.test/1.png')
  fireEvent.click(screen.getByRole('button', { name: 'Show image 2 of 2' }))
  expect(container.querySelector('img')?.getAttribute('src')).toBe('https://img.test/2.png')
  expect(screen.getByRole('button', { name: 'Show image 2 of 2' }).getAttribute('aria-current')).toBe('true')
})

it('gallery renders an empty frame with no images', () => {
  const { container } = render(<PhysicalProductGallery product={{ title: 'Keyring', galleryImages: [] }} />)
  expect(container.querySelector('img')).toBeNull()
  expect(screen.getByRole('img', { name: 'Keyring product preview not available' })).toBeTruthy()
})
