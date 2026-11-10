import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { collectionRegistry } from '../../../apps/admin/src/cms/registry'
vi.mock('../../../apps/admin/src/lib/site-status', () => ({ useSite: () => ({ build: null }) }))
import { RecordTable } from '../../../apps/admin/src/components/workspace/RecordTable'

// jsdom 26 lacks PointerEvent; Base UI forwards click activation with this constructor.
vi.stubGlobal('PointerEvent', MouseEvent)

const collection = collectionRegistry.find((entry) => entry.id === 'products')!
const records = [{ id: 'one', title: 'Mathematics test', priceZar: 50, status: 'draft' }]

it('exposes a native action for opening a record without triggering navigation twice', () => {
  const open = vi.fn()
  render(<RecordTable collection={collection} records={records} onSelect={open} />)
  const button = screen.getByRole('button', { name: 'Mathematics test' })
  expect(button.tagName).toBe('BUTTON')
  expect(button.getAttribute('type')).toBe('button')
  fireEvent.click(button)
  expect(open).toHaveBeenCalledExactlyOnceWith('one')
})

it('keeps selection mode on the checkbox/row without exposing an edit action', () => {
  const open = vi.fn()
  const toggle = vi.fn()
  render(<RecordTable collection={collection} records={records} onSelect={open}
    selection={{ selectedIds: new Set(), onToggle: toggle, onToggleAll: vi.fn() }} />)
  expect(screen.queryByRole('button', { name: 'Mathematics test' })).toBeNull()
  fireEvent.click(screen.getByRole('checkbox', { name: 'Select Mathematics test' }))
  expect(toggle).toHaveBeenCalledExactlyOnceWith('one')
  expect(open).not.toHaveBeenCalled()
})
