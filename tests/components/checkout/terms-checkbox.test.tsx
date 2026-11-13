import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TermsCheckbox } from '../../../apps/web/src/components/checkout/terms-checkbox'

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

describe('TermsCheckbox', () => {
  it('toggles through its visible label and keyboard interaction', () => {
    const onChange = vi.fn()
    render(<TermsCheckbox checked={false} onChange={onChange} disabled={false}>I agree to Terms of Use</TermsCheckbox>)
    const checkbox = screen.getByRole('checkbox', { name: 'I agree to Terms of Use' })

    fireEvent.click(screen.getByText('I agree to Terms of Use'))
    expect(onChange).toHaveBeenCalledWith(true)
    fireEvent.keyDown(checkbox, { key: ' ' })
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('exposes checked and disabled state to assistive technology', () => {
    const onChange = vi.fn()
    const view = render(<TermsCheckbox checked onChange={onChange} disabled={false}>I agree to Terms of Use</TermsCheckbox>)
    const checkbox = screen.getByRole('checkbox', { name: 'I agree to Terms of Use' })
    expect(checkbox.getAttribute('aria-checked')).toBe('true')
    fireEvent.click(checkbox)
    expect(onChange).toHaveBeenCalledWith(false)

    view.rerender(<TermsCheckbox checked onChange={onChange} disabled>I agree to Terms of Use</TermsCheckbox>)
    const disabledCheckbox = screen.getByRole('checkbox', { name: 'I agree to Terms of Use' })
    expect((disabledCheckbox as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(disabledCheckbox)
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('draws the 8px-radius box on the cream terms row', () => {
    render(<TermsCheckbox checked={false} onChange={() => {}} disabled={false}>I agree to Terms of Use</TermsCheckbox>)
    const checkbox = screen.getByRole('checkbox', { name: 'I agree to Terms of Use' })
    expect(checkbox.className).toContain('rounded-sm')
    expect(checkbox.className).not.toContain('rounded-[')
    expect(checkbox.parentElement?.className).toContain('bg-surface-alt')
  })
})
