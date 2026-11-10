import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { RecordsToolbar } from '../../../apps/admin/src/components/workspace/RecordsToolbar'

const defaults = () => ({
  title: 'Products', selectionTitle: '1 product selected', query: '', onQueryChange: vi.fn(),
  facets: [], filters: {}, onFiltersChange: vi.fn(), selecting: true, selectedCount: 1,
  onStartSelecting: vi.fn(), onCancelSelecting: vi.fn(), onExport: vi.fn(), onDelete: vi.fn(), onBulkStatus: vi.fn(),
})

it('offers the same status choices from the compact phone menu', async () => {
  const props = defaults()
  render(<RecordsToolbar {...props} />)
  fireEvent.click(screen.getByRole('button', { name: 'Set status' }))
  fireEvent.click(await screen.findByRole('menuitem', { name: /^Save as draft/ }))
  expect(props.onBulkStatus).toHaveBeenCalledExactlyOnceWith('draft')
  expect(props.onDelete).not.toHaveBeenCalled()
})

it('keeps export and deletion separately named and lets selection be cancelled', async () => {
  const props = defaults()
  render(<RecordsToolbar {...props} />)
  fireEvent.click(screen.getByRole('button', { name: 'More actions' }))
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Export selected as CSV' }))
  expect(props.onExport).toHaveBeenCalledTimes(1)
  fireEvent.click(screen.getByRole('button', { name: 'More actions' }))
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Delete selected products' }))
  expect(props.onDelete).toHaveBeenCalledTimes(1)
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(props.onCancelSelecting).toHaveBeenCalledTimes(1)
})

it('holds all compact actions while a write is in flight', () => {
  render(<RecordsToolbar {...defaults()} busy />)
  for (const name of ['Set status', 'More actions', 'Cancel']) {
    const button = screen.getByRole('button', { name }) as HTMLButtonElement
    expect(button.disabled).toBe(true)
    fireEvent.click(button)
  }
  expect(screen.queryByRole('menuitem')).toBeNull()
})
