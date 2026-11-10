import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { ReferencePicker } from '../../../apps/admin/src/components/primitives/ReferencePicker'

const options = [{ value: 'first', label: 'How do downloads work?' }, { value: 'second', label: 'Can I print this resource?' }]

it('removes only the chosen reference and returns keyboard focus to the picker', () => {
  const onChange = vi.fn()
  const { rerender } = render(<ReferencePicker options={options} selected={['first', 'second']} onChange={onChange} />)
  const remove = screen.getByRole('button', { name: 'Remove How do downloads work?' })
  remove.focus()
  fireEvent.click(remove)
  expect(onChange).toHaveBeenCalledExactlyOnceWith(['second'])
  rerender(<ReferencePicker options={options} selected={['second']} onChange={onChange} />)
  expect(document.activeElement).toBe(screen.getByRole('combobox'))
  expect(screen.queryByRole('button', { name: 'Remove How do downloads work?' })).toBeNull()
  expect(screen.getByRole('button', { name: 'Remove Can I print this resource?' })).toBeTruthy()
})

it('keeps disabled reference values readable without offering removal', () => {
  const onChange = vi.fn()
  render(<ReferencePicker options={options} selected={['first']} disabled onChange={onChange} />)
  expect(screen.getByText('How do downloads work?')).toBeTruthy()
  expect(screen.queryByRole('button')).toBeNull()
  expect(screen.queryByRole('combobox')).toBeNull()
  expect(onChange).not.toHaveBeenCalled()
})
