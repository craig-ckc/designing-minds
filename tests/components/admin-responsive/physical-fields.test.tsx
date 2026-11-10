import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import type { CustomizationRule, PhysicalVariantDraft } from '@designing-minds/cms'
import { CustomizationRulesField } from '../../../apps/admin/src/components/editor/CustomizationRulesField'
import { PhysicalVariantsField } from '../../../apps/admin/src/components/editor/PhysicalVariantsField'

const variants: PhysicalVariantDraft[] = [
  { id: 'pink', productId: 'product', sku: 'KEYRING-PINK', optionValues: { color: 'Pink' }, unitPriceZar: 30, active: true, sortOrder: 1, onHand: 12 },
  { id: 'blue', productId: 'product', sku: 'KEYRING-BLUE', optionValues: { color: 'Blue' }, unitPriceZar: 30, active: false, sortOrder: 2, onHand: 9 },
]

const rules: CustomizationRule[] = [
  { key: 'name', label: 'Keyring name', type: 'text', required: true, constraints: { allowSpaces: false } },
  { key: 'message', label: 'Gift message', type: 'text', required: false, constraints: { allowSpaces: false } },
]

it('labels variant switches uniquely and a caption click updates only its variant', () => {
  const onChange = vi.fn()
  render(<PhysicalVariantsField value={variants} productId="product" onChange={onChange} />)

  const pinkSwitch = screen.getByRole('switch', { name: 'Available to shoppers for SKU KEYRING-PINK' })
  const blueSwitch = screen.getByRole('switch', { name: 'Available to shoppers for SKU KEYRING-BLUE' })
  expect(pinkSwitch.getAttribute('aria-labelledby')).not.toBe(blueSwitch.getAttribute('aria-labelledby'))

  fireEvent.click(within(screen.getAllByRole('article')[1]).getByText('Available to shoppers'))
  expect(onChange).toHaveBeenLastCalledWith([
    variants[0],
    { ...variants[1], active: true },
  ])
})

it('makes variant switches disabled without emitting a change', () => {
  const onChange = vi.fn()
  render(<PhysicalVariantsField value={variants} productId="product" disabled onChange={onChange} />)

  const pinkSwitch = screen.getByRole('switch', { name: 'Available to shoppers for SKU KEYRING-PINK' }) as HTMLButtonElement
  expect(pinkSwitch.getAttribute('aria-disabled')).toBe('true')
  fireEvent.click(within(screen.getAllByRole('article')[0]).getByText('Available to shoppers'))
  expect(onChange).not.toHaveBeenCalled()
})

it('adds and removes option choices on only the selected variant', () => {
  const onChange = vi.fn()
  const { rerender } = render(<PhysicalVariantsField value={variants} productId="product" onChange={onChange} />)
  const articles = screen.getAllByRole('article')
  fireEvent.click(within(articles[1]).getByRole('button', { name: 'Add option choice' }))
  expect(onChange).toHaveBeenLastCalledWith([
    variants[0],
    { ...variants[1], optionValues: { color: 'Blue', '': '' } },
  ])

  onChange.mockClear()
  rerender(<PhysicalVariantsField value={variants} productId="product" onChange={onChange} />)
  fireEvent.click(screen.getAllByRole('article')[1].querySelector('button[aria-label="Remove option"]')!)
  expect(onChange).toHaveBeenLastCalledWith([
    variants[0],
    { ...variants[1], optionValues: {} },
  ])
})

it('associates required and allow-spaces captions with distinct customization switches', () => {
  const onChange = vi.fn()
  render(<CustomizationRulesField value={rules} onChange={onChange} />)

  const required = screen.getByRole('switch', { name: 'Answer required for Gift message' })
  const allowSpaces = screen.getByRole('switch', { name: 'Allow spaces for Keyring name' })
  expect(required.getAttribute('aria-labelledby')).not.toBe(allowSpaces.getAttribute('aria-labelledby'))
  fireEvent.click(within(screen.getAllByRole('article')[1]).getByText('Answer required'))
  expect(onChange).toHaveBeenLastCalledWith([
    rules[0],
    { ...rules[1], required: true },
  ])

  onChange.mockClear()
  fireEvent.click(within(screen.getAllByRole('article')[0]).getByText('Allow spaces'))
  expect(onChange).toHaveBeenLastCalledWith([
    { ...rules[0], constraints: { allowSpaces: true } },
    rules[1],
  ])
})

it('disables required and allow-spaces switches without changing another rule', () => {
  const onChange = vi.fn()
  render(<CustomizationRulesField value={rules} disabled onChange={onChange} />)

  expect(screen.getByRole('switch', { name: 'Answer required for Gift message' }).getAttribute('aria-disabled')).toBe('true')
  expect(screen.getByRole('switch', { name: 'Allow spaces for Keyring name' }).getAttribute('aria-disabled')).toBe('true')
  fireEvent.click(within(screen.getAllByRole('article')[0]).getByText('Allow spaces'))
  expect(onChange).not.toHaveBeenCalled()
})
