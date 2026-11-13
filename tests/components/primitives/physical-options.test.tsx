import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import type { PhysicalCatalogProduct } from '@designing-minds/cms'
import { ProductOptionChoices } from '../../../apps/web/src/components/ui/product-option-choices'

vi.mock('../../../apps/web/src/lib/supabase', () => ({ supabase: null }))
import { PhysicalProductDetail } from '../../../apps/web/src/components/physical-product-detail'

const colours = (value: string, onChange = vi.fn()) => render(
  <ProductOptionChoices id="colour" label="Colour" colour value={value} onChange={onChange}
    options={[{ value: 'Pink' }, { value: 'Yellow' }, { value: 'Blue', disabled: true }]} />,
)
const swatchOf = (name: string) => screen.getByRole('radio', { name }).nextElementSibling as HTMLElement

it('draws 40px swatches with a soft primary ring and a check on the selected colour', () => {
  colours('Pink')
  const pink = swatchOf('Pink')
  expect(pink.className).toMatch(/\bsize-10\b/)
  expect(pink.className).toContain('rounded-sm border border-ink/20')
  expect(pink.className).toContain('ring-3 ring-primary/40')
  expect(pink.querySelector('svg')).toBeTruthy()
  const yellow = swatchOf('Yellow')
  expect(yellow.className).not.toContain('ring-3')
  expect(yellow.querySelector('svg')).toBeNull()
})

it('keeps the selected colour in the radio state and lets a shopper pick another', () => {
  const onChange = vi.fn()
  colours('Pink', onChange)
  expect(screen.getByRole<HTMLInputElement>('radio', { name: 'Pink' }).checked).toBe(true)
  fireEvent.click(screen.getByRole('radio', { name: 'Yellow' }))
  expect(onChange).toHaveBeenCalledWith('Yellow')
  expect(screen.getByRole<HTMLInputElement>('radio', { name: /Blue/ }).disabled).toBe(true)
})

it('sets text choices at 40px tall, 48px wide minimum, small radius and body size', () => {
  render(<ProductOptionChoices id="font" label="Font" value="Script" onChange={() => {}} options={[{ value: 'Rounded' }, { value: 'Script' }]} />)
  const chip = screen.getByRole('radio', { name: 'Rounded' }).nextElementSibling as HTMLElement
  expect(chip.className).toMatch(/\bmin-h-10\b.*\bmin-w-12\b.*\brounded-sm\b.*\btext-body\b/)
  const selected = screen.getByRole('radio', { name: 'Script' }).nextElementSibling as HTMLElement
  expect(selected.className).toContain('border-primary-ink bg-primary-tint')
})

const product: PhysicalCatalogProduct = {
  id: 'keyring', slug: 'keyring', title: 'Keyring', shortDescription: '', fullDescription: '',
  productType: 'physical', priceZar: 89, pricingMode: 'fixed', pricingFieldKey: null, billableCharacters: null,
  customizationRules: [], galleryImages: [], published: true,
  variants: [{ id: 'pink', sku: null, optionValues: { colour: 'Pink' }, unitPriceZar: null, available: true }],
}

it('keeps the quantity stepper compact and left-aligned instead of stretching across the form', () => {
  render(<MemoryRouter><PhysicalProductDetail product={product} /></MemoryRouter>)
  const stepper = screen.getByRole('spinbutton', { name: 'Quantity' }).parentElement!
  expect(stepper.className).toContain('inline-flex')
  expect(stepper.className).toContain('justify-self-start')
})
