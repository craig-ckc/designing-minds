import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { QuantityInput } from '../../../apps/web/src/components/ui/quantity-input'

const LABEL = 'Quantity for Personalised name keyring'
const setup = (props: Partial<Parameters<typeof QuantityInput>[0]> = {}) => {
  const onChange = vi.fn()
  render(<QuantityInput value={2} onChange={onChange} label={LABEL} {...props} />)
  return { onChange, input: screen.getByRole('spinbutton', { name: LABEL }) as HTMLInputElement }
}

it('exposes accessible names and a numeric input', () => {
  const { input } = setup()
  expect(input.type).toBe('number')
  expect(input.inputMode).toBe('numeric')
  expect(screen.getByRole('button', { name: 'Decrease quantity' }).getAttribute('type')).toBe('button')
  expect(screen.getByRole('button', { name: 'Increase quantity' }).getAttribute('type')).toBe('button')
})

it('increments and decrements', () => {
  const { onChange } = setup()
  fireEvent.click(screen.getByRole('button', { name: 'Increase quantity' }))
  expect(onChange).toHaveBeenLastCalledWith(3)
  fireEvent.click(screen.getByRole('button', { name: 'Decrease quantity' }))
  expect(onChange).toHaveBeenLastCalledWith(1)
})

it('disables minus at min and plus at max', () => {
  setup({ value: 1, max: 1 })
  expect((screen.getByRole('button', { name: 'Decrease quantity' }) as HTMLButtonElement).disabled).toBe(true)
  expect((screen.getByRole('button', { name: 'Increase quantity' }) as HTMLButtonElement).disabled).toBe(true)
})

it('commits a typed value on blur, clamped to max', () => {
  const { onChange, input } = setup({ max: 5 })
  fireEvent.change(input, { target: { value: '9' } })
  expect(onChange).not.toHaveBeenCalled()
  fireEvent.blur(input)
  expect(onChange).toHaveBeenCalledWith(5)
})

it('clamps below min on blur', () => {
  const { onChange, input } = setup({ value: 3 })
  fireEvent.change(input, { target: { value: '0' } })
  fireEvent.blur(input)
  expect(onChange).toHaveBeenCalledWith(1)
})

it('ignores non-numeric input and reverts to the current value', () => {
  const { onChange, input } = setup()
  fireEvent.change(input, { target: { value: '' } })
  fireEvent.blur(input)
  expect(onChange).not.toHaveBeenCalled()
  expect(input.value).toBe('2')
})

it('works controlled end to end', () => {
  function Harness() {
    const [v, setV] = useState(1)
    return <QuantityInput value={v} onChange={setV} label={LABEL} max={3} />
  }
  render(<Harness />)
  const input = screen.getByRole('spinbutton', { name: LABEL }) as HTMLInputElement
  fireEvent.click(screen.getByRole('button', { name: 'Increase quantity' }))
  expect(input.value).toBe('2')
  fireEvent.change(input, { target: { value: '7' } })
  fireEvent.blur(input)
  expect(input.value).toBe('3')
})

it('disables everything when disabled', () => {
  const { input } = setup({ disabled: true })
  expect(input.disabled).toBe(true)
  expect((screen.getByRole('button', { name: 'Increase quantity' }) as HTMLButtonElement).disabled).toBe(true)
  expect((screen.getByRole('button', { name: 'Decrease quantity' }) as HTMLButtonElement).disabled).toBe(true)
})
