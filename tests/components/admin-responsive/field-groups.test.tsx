import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { makeSnapshot } from '../../support/fixtures'
import type { AdminField, FieldContext } from '../../../apps/admin/src/cms/types'
vi.mock('../../../apps/admin/src/lib/supabase', () => ({ supabase: {} }))
import { FieldControl } from '../../../apps/admin/src/components/editor/FieldControl'

const ctx: FieldContext = { valueLists: makeSnapshot().valueLists, optionsForSelect: () => [], optionsForReference: () => [] }
it.each<AdminField['type']>(['customizationRules', 'physicalVariants', 'variantOptions'])('names the %s controls as a group rather than labeling a nonexistent input', (type) => {
  render(<FieldControl field={{ key: 'configuration', label: 'Product configuration', type } as AdminField}
    record={{ id: 'product', configuration: [] }} collectionId="products" ctx={ctx} onUpdate={vi.fn()} />)
  const group = screen.getByRole('group', { name: 'Product configuration' })
  expect(group.querySelector('[id="product:configuration:label"]')?.tagName).toBe('SPAN')
  expect(group.querySelector('label[for="product:configuration"]')).toBeNull()
  expect(screen.getAllByRole('button', { name: /^Add / }).length).toBeGreaterThan(0)
})

it('makes the boolean state caption activate its named switch', () => {
  const onUpdate = vi.fn()
  const field = { key: 'featured', label: 'Featured', type: 'boolean' } as AdminField
  const props = { field, record: { id: 'product', featured: false }, collectionId: 'products', ctx, onUpdate }
  const { rerender } = render(<FieldControl {...props} />)
  expect(screen.getByRole('switch', { name: 'Featured' }).getAttribute('aria-checked')).toBe('false')
  fireEvent.click(screen.getByText('Off'))
  expect(onUpdate).toHaveBeenCalledExactlyOnceWith('featured', true)

  onUpdate.mockClear()
  rerender(<FieldControl {...props} disabled />)
  fireEvent.click(screen.getByText('Off'))
  expect(onUpdate).not.toHaveBeenCalled()
})
