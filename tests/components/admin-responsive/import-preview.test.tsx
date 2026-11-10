import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import type { AdminCollection, AdminRecord, FieldContext } from '../../../apps/admin/src/cms/types'
import { ImportDialog } from '../../../apps/admin/src/components/workspace/ImportDialog'

const collection: AdminCollection = {
  id: 'products',
  label: 'Products',
  singular: 'product',
  group: 'Catalogue',
  titleField: 'title',
  searchFields: ['title'],
  fields: [
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'amount', label: 'Amount', type: 'number', required: true },
  ],
  sections: [],
  listColumns: [],
}

const ctx: FieldContext = {
  valueLists: {} as FieldContext['valueLists'],
  optionsForSelect: () => [],
  optionsForReference: () => [],
}

function setup(onSave = vi.fn(async (record: AdminRecord) => record)) {
  const onClose = vi.fn()
  const createBlank = vi.fn(() => ({ id: 'new-product', title: '', amount: null }))
  render(
    <ImportDialog
      open
      onClose={onClose}
      collection={collection}
      records={[]}
      ctx={ctx}
      createBlank={createBlank}
      onSave={onSave}
    />,
  )
  return { onClose, createBlank, onSave }
}

function chooseCsv(text: string, name = 'preview.csv') {
  const file = new File([text], name, { type: 'text/csv' })
  Object.defineProperty(file, 'text', { value: async () => text })
  fireEvent.change(screen.getByLabelText('CSV file'), { target: { files: [file] } })
}

it('shows each invalid row as a readable phone card and keeps import disabled until a new file is chosen', async () => {
  const { onSave } = setup()
  chooseCsv('title,amount\nUnusable row,not-a-number', 'a-very-long-preview-file-name-that-must-wrap.csv')

  expect(await screen.findByText('a-very-long-preview-file-name-that-must-wrap.csv')).toBeTruthy()
  const rows = screen.getByRole('list', { name: 'CSV preview rows' })
  expect(rows.parentElement?.className).toContain('lg:hidden')
  const row = within(rows).getByRole('listitem', { name: 'Line 2: Unusable row' })
  expect(within(row).getByText('create')).toBeTruthy()
  expect(within(row).getByText('Issues')).toBeTruthy()
  expect(within(row).getByText('Amount: "not-a-number" is not a number')).toBeTruthy()
  expect((screen.getByRole('button', { name: 'Import 0 rows' }) as HTMLButtonElement).disabled).toBe(true)
  expect(onSave).not.toHaveBeenCalled()

  fireEvent.click(screen.getByRole('button', { name: 'Choose another file' }))
  expect(await screen.findByLabelText('CSV file')).toBeTruthy()
  expect(screen.queryByRole('list', { name: 'CSV preview rows' })).toBeNull()
  expect(onSave).not.toHaveBeenCalled()
})

it('keeps the desktop comparison table and imports a valid preview only after confirmation', async () => {
  const onSave = vi.fn(async (record: AdminRecord) => record)
  setup(onSave)
  chooseCsv('title,amount\nPreview product,42')

  const table = await screen.findByRole('table')
  expect(table.parentElement?.parentElement?.parentElement?.className).toContain('lg:flex')
  const rows = screen.getByRole('list', { name: 'CSV preview rows' })
  expect(rows.parentElement?.className).toContain('lg:hidden')
  expect(within(rows).getByRole('listitem', { name: 'Line 2: Preview product' })).toBeTruthy()

  const importButton = screen.getByRole('button', { name: 'Import 1 row' }) as HTMLButtonElement
  expect(importButton.disabled).toBe(false)
  expect(onSave).not.toHaveBeenCalled()

  fireEvent.click(importButton)
  await waitFor(() => expect(onSave).toHaveBeenCalledOnce())
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ title: 'Preview product', amount: 42 }))
  expect(await screen.findByText(/Imported 1 record/)).toBeTruthy()
})
