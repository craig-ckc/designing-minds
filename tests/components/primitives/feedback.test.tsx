import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { FeedbackMessages } from '../../../apps/admin/src/components/FeedbackMessages'

it('keeps announcement regions mounted and gives an error priority over a success', () => {
  const dismiss = vi.fn()
  const { rerender } = render(<FeedbackMessages message={null} error={null} onDismissError={dismiss} />)
  const status = screen.getByRole('status')
  const alert = screen.getByRole('alert')
  rerender(<FeedbackMessages message="Saved product" error={null} onDismissError={dismiss} />)
  expect(screen.getByRole('status')).toBe(status)
  expect(status.textContent).toBe('Saved product')
  rerender(<FeedbackMessages message="Saved product" error="Unable to save another product" onDismissError={dismiss} />)
  expect(screen.getByRole('alert')).toBe(alert)
  expect(alert.textContent).toContain('Unable to save another product')
  expect(status.textContent).toBe('')
  fireEvent.click(screen.getByRole('button', { name: 'Dismiss error' }))
  expect(dismiss).toHaveBeenCalledOnce()
})
