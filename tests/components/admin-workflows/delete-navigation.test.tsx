import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { collectionRegistry } from '../../../apps/admin/src/cms/registry'
import { RecordEditor } from '../../../apps/admin/src/components/editor/RecordEditor'
import { makeProduct } from '../../../tests/support/fixtures'
import type { AdminRecord } from '../../../apps/admin/src/cms/types'

vi.mock('../../../apps/admin/src/lib/site-status', () => ({ useSite: () => ({ status: 'unknown' }) }))
vi.mock('../../../apps/admin/src/lib/supabase', () => ({ supabase: {} }))
vi.mock('../../../apps/admin/src/components/primitives', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
  ConfirmDialog: ({ open, onConfirm, onCancel }: { open: boolean; onConfirm: () => void; onCancel: () => void }) => open ? <div><button onClick={onConfirm}>Confirm delete</button><button onClick={onCancel}>Cancel</button></div> : null,
  MenuChoice: () => null,
  ScrollArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SplitButton: () => null,
}))
vi.mock('../../../apps/admin/src/components/editor/EditorSection', () => ({ EditorSection: ({ children }: { children: React.ReactNode }) => <section>{children}</section> }))
vi.mock('../../../apps/admin/src/components/editor/FieldControl', () => ({ FieldControl: () => null }))
vi.mock('../../../apps/admin/src/components/editor/OrderFulfillment', () => ({ OrderFulfillment: () => null }))

describe('RecordEditor delete navigation', () => {
  it('clears dirty state before navigating after delete, and stays put on failure', async () => {
    const collection = collectionRegistry.find((entry) => entry.id === 'products')!
    const calls: string[] = []
    const props = {
      collection,
      record: makeProduct({ slug: 'delete-me', title: 'Delete me' }) as unknown as AdminRecord,
      ctx: { valueLists: {}, commerceReady: false } as never,
      onUpdate: vi.fn(), onSave: vi.fn(), onSaveAs: vi.fn(), onDuplicate: vi.fn(),
      onDelete: vi.fn(async () => true), onDeleted: () => calls.push('clear'), onBack: () => calls.push('back'),
      isNew: false, saving: false, dirty: true, justSaved: false, error: null, canWrite: true,
    }
    const { rerender } = render(<RecordEditor {...props} />)
    fireEvent.click(screen.getByRole('button', { name: 'Delete Delete me' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }))
    await screen.findByRole('button', { name: 'Delete Delete me' })
    expect(calls).toEqual(['clear', 'back'])

    calls.length = 0
    rerender(<RecordEditor {...props} onDelete={async () => false} />)
    fireEvent.click(screen.getByRole('button', { name: 'Delete Delete me' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }))
    await Promise.resolve()
    expect(calls).toEqual([])
  })
})
