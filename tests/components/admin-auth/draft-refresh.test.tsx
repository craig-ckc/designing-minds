import { useState, type ReactNode } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import { makeProduct, makeSnapshot } from '../../support/fixtures'

const mocks = vi.hoisted(() => ({
  session: { user: { id: 'admin-1' }, access_token: 'original' },
  getSnapshot: vi.fn(),
  refresh: () => {},
}))
vi.mock('../../../apps/admin/src/lib/auth', () => ({ useAdminAuth: () => ({
  session: mocks.session, loading: false, isAdmin: true, roleError: null, recovery: false,
  logout: vi.fn(), retryRole: vi.fn(),
}) }))
vi.mock('../../../apps/admin/src/repository', () => ({ repository: { canWrite: true, getSnapshot: mocks.getSnapshot } }))
vi.mock('../../../apps/admin/src/lib/supabase', () => ({ supabase: {} }))
vi.mock('../../../apps/admin/src/components/Shell', () => ({ Shell: ({ children }: { children: ReactNode }) => <>{children}</> }))
vi.mock('../../../apps/admin/src/components/editor/RecordEditor', () => ({ RecordEditor: ({ record, onUpdate, dirty }: {
  record: { title: string }
  onUpdate: (key: string, value: unknown) => void
  dirty: boolean
}) => <>
  <label>Name<input value={record.title} onChange={(event) => onUpdate('title', event.target.value)} /></label>
  {dirty ? <p>Unsaved changes</p> : null}
</> }))
import App from '../../../apps/admin/src/App'
import { UnsavedChangesProvider } from '../../../apps/admin/src/lib/unsaved'

function AuthEventHarness() {
  const [, refresh] = useState(0)
  mocks.refresh = () => refresh((value) => value + 1)
  return <App />
}

it('keeps the real record draft and unsaved guard state across a same-user token refresh', async () => {
  mocks.getSnapshot.mockResolvedValue(makeSnapshot({ products: [makeProduct({ id: 'product-1', slug: 'resource', title: 'Original resource' })] }))
  const router = createMemoryRouter([{ path: '*', element: <UnsavedChangesProvider><AuthEventHarness /></UnsavedChangesProvider> }], { initialEntries: ['/products/product-1'] })
  render(<RouterProvider router={router} />)
  const name = await screen.findByRole('textbox', { name: 'Name' })
  fireEvent.change(name, { target: { value: 'Unsaved resource title' } })
  expect(screen.getByText('Unsaved changes')).toBeTruthy()
  act(() => {
    mocks.session = { user: { id: 'admin-1' }, access_token: 'refreshed' }
    mocks.refresh()
  })
  expect((screen.getByRole('textbox', { name: 'Name' }) as HTMLInputElement).value).toBe('Unsaved resource title')
  expect(screen.getByText('Unsaved changes')).toBeTruthy()
  expect(mocks.getSnapshot).toHaveBeenCalledOnce()
})
