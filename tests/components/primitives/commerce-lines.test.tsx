import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import type { ProductImage } from '@designing-minds/cms'
import { CartLine } from '../../../apps/web/src/components/ui/cart-line'
import { CatalogPrice } from '../../../apps/web/src/components/ui/catalog-price'
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
  wrap(<CartLine type="physical" context="summary" title="Keyring" meta="Qty 2" price="R 90" quantity={2} onQuantityChange={() => {}} onRemove={() => {}} />)
  expect(screen.queryByRole('button')).toBeNull()
  expect(screen.queryByRole('spinbutton')).toBeNull()
  expect(screen.getByText('R 90')).toBeTruthy()
})

it('cart delete is a 36px solid-light icon button with the default 12px radius beside a digital title', () => {
  wrap(<CartLine type="digital" context="cart" title="Maths" meta="Grade 4 · Term 1" price="R 60" onRemove={() => {}} />)
  const remove = screen.getByRole('button', { name: 'Remove Maths from cart' })
  expect(remove.className).toContain('h-9 w-9')
  expect(remove.className).toContain('border-line bg-surface')
  expect(remove.className).toContain('rounded-md')
  expect(remove.className).not.toContain('rounded-full')
  expect(remove.className).not.toMatch(/(^|\s)-m[rt]-/)
  // Same row as the title, vertically centred on it.
  expect(remove.parentElement?.textContent).toContain('Maths')
  expect(remove.parentElement?.className).toContain('items-center')
})

it('physical cart line keeps delete and stepper out of the title row, delete first', () => {
  wrap(<CartLine type="physical" context="cart" title="Keyring" options="Colour: Pink" price="R 90" quantity={2} onQuantityChange={() => {}} onRemove={() => {}} />)
  const remove = screen.getByRole('button', { name: 'Remove Keyring from cart' })
  const stepper = screen.getByRole('spinbutton', { name: 'Quantity for Keyring' })
  const title = screen.getByText('Keyring')
  const details = title.closest('div')!.parentElement!
  expect(details.contains(remove)).toBe(false)
  expect(details.contains(stepper)).toBe(false)
  expect(remove.compareDocumentPosition(stepper) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  expect(screen.getByText('Colour: Pink').className).toContain('text-caption text-muted')
})

it('a struck compare price in the cart reads as a caption but keeps its strike and spoken label', () => {
  const record = { priceZar: 200 }
  const { container } = wrap(<CartLine type="digital" context="cart" title="Bundle" price={<CatalogPrice record={record} compareAtPriceZar={360} />} onRemove={() => {}} />)
  const struck = container.querySelector('s')!
  expect(struck.textContent).toMatch(/360/)
  expect(struck.closest('strong')?.className).toContain('[&_s]:text-caption')
  expect(container.textContent).toContain('Price bought individually')
  expect(container.textContent).toContain('Bundle price')
})

it('summary lines put the price in its own right-aligned column after the details', () => {
  const { container } = wrap(<CartLine type="digital" context="summary" title="Maths" meta="Grade 4 · Term 1" price="R 60" />)
  const row = container.querySelector('li')!
  expect(row.className).toContain('items-center')
  expect(row.className).toContain('py-2')
  const priceColumn = row.lastElementChild!
  expect(priceColumn.textContent).toBe('R 60')
  expect(priceColumn.className).toContain('items-end')
  expect(screen.getByText('Maths').className).toContain('text-body font-semibold')
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

it('gallery thumbnails are 96×72 framed tiles; the selected one gets a primary-ink border, the rest stay fully opaque', () => {
  const { container } = render(<PhysicalProductGallery product={{ title: 'Keyring', galleryImages: [image(1), image(2)] }} />)
  expect(container.firstElementChild?.className).toContain('gap-4')
  const list = screen.getByRole('list', { name: 'Product images' }).className
  expect(list).toContain('gap-3')
  // Phones: four-up grid so 4 thumbs never wrap 3 + 1; from sm: the Figma 96×72 tiles.
  expect(list).toMatch(/\bgrid-cols-4\b.*\bsm:flex\b/)
  const [first, second] = screen.getAllByRole('button')
  expect(first.className).toMatch(/\baspect-\[4\/3\].*\brounded-sm\b.*\bbg-surface-alt\b.*\bp-0\.5\b.*\bsm:h-18\b.*\bsm:w-24\b/)
  expect(first.className).toContain('border-primary-ink')
  expect(second.className).toContain('border-transparent')
  expect(second.className).not.toMatch(/opacity-/)
  expect(second.querySelector('img')?.className).toContain('object-cover')
})

it('gallery renders an empty frame with no images', () => {
  const { container } = render(<PhysicalProductGallery product={{ title: 'Keyring', galleryImages: [] }} />)
  expect(container.querySelector('img')).toBeNull()
  expect(screen.getByRole('img', { name: 'Keyring product preview not available' })).toBeTruthy()
})
