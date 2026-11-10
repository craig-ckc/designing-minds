import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { createMemoryRouter, Outlet, RouterProvider, useBlocker, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { UnsavedChangesProvider } from '../../../apps/admin/src/lib/unsaved'
import { Shell } from '../../../apps/admin/src/components/Shell'
import { ConfirmDialog } from '../../../apps/admin/src/components/primitives'
import { AdminWorkspace } from '../../../apps/admin/src/screens/AdminWorkspace'
import { collectionRegistry } from '../../../apps/admin/src/cms/registry'
import { makeProduct, makeSnapshot } from '../../../tests/support/fixtures'

vi.mock('../../../apps/admin/src/lib/auth', () => ({
  useAdminAuth: () => ({ session: { user: { email: 'admin@example.test' } }, logout: vi.fn() }),
}))
vi.mock('../../../apps/admin/src/repository', () => ({ repository: { canWrite: true } }))
vi.mock('../../../apps/admin/src/lib/supabase', () => ({ supabase: {} }))
vi.mock('../../../apps/admin/src/components/PublishButton', () => ({ PublishButton: () => null }))
vi.mock('../../../apps/admin/src/lib/site-status', () => ({ useSite: () => ({ status: 'unknown' }) }))
vi.mock('../../../apps/admin/src/components/editor/FieldControl', () => ({
  FieldControl: ({ field, record, onUpdate }: { field: { key: string; label: string }; record: Record<string, unknown>; onUpdate: (key: string, value: unknown) => void }) =>
    field.key === 'title' ? <label>{field.label}<input value={String(record.title ?? '')} onChange={(event) => onUpdate(field.key, event.target.value)} /></label> : null,
}))

function GuardedWorkspace({ guardNavigation }: { guardNavigation: boolean }) {
  const location = useLocation()
  const blocker = useBlocker(({ currentLocation, nextLocation }) => guardNavigation && currentLocation.pathname !== nextLocation.pathname)
  return (
    <section>
      <h1>Workspace {location.pathname}</h1>
      <input aria-label="Draft field" defaultValue="Unsaved draft" />
      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title="Discard unsaved changes?"
        description="Keep editing or discard your changes."
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        onCancel={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
      />
    </section>
  )
}

function renderShell(initialEntry = '/products/edit', guardNavigation = true) {
  const router = createMemoryRouter([
    {
      element: <Shell snapshot={makeSnapshot()} message={null} error={null} onPublished={() => {}}><Outlet /></Shell>,
      children: [{ path: '*', element: <GuardedWorkspace guardNavigation={guardNavigation} /> }],
    },
  ], { initialEntries: [initialEntry] })
  return render(<UnsavedChangesProvider><RouterProvider router={router} /></UnsavedChangesProvider>)
}

describe('narrow admin navigation', () => {
  it('opens the shared collection tree, navigates, and closes the dialog', async () => {
    renderShell('/', false)
    const trigger = screen.getByRole('button', { name: 'Open collections' })
    expect(trigger.className).toContain('lg:hidden')
    fireEvent.click(trigger)
    const dialog = await screen.findByRole('dialog', { name: 'Collections' })
    fireEvent.click(within(dialog).getByRole('link', { name: 'Dashboard' }))
    await screen.findByRole('heading', { name: 'Workspace /' })
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Collections' })).toBeNull())
  })

  it('keeps the editor route when navigation is blocked and returns focus after Keep editing', async () => {
    renderShell()
    const trigger = screen.getByRole('button', { name: 'Open collections' })
    fireEvent.click(trigger)
    const navDialog = await screen.findByRole('dialog', { name: 'Collections' })
    fireEvent.click(within(navDialog).getByRole('link', { name: 'Dashboard' }))
    const blocker = await screen.findByRole('dialog', { name: 'Discard unsaved changes?' })
    fireEvent.click(within(blocker).getByRole('button', { name: 'Keep editing' }))
    expect(screen.getByRole('heading', { name: 'Workspace /products/edit' })).toBeTruthy()
    expect(trigger).toBeTruthy()
  })

  it('returns focus to the record editor when a dirty draft blocks drawer navigation', async () => {
    const snapshot = makeSnapshot({ products: [makeProduct({ slug: 'p1', title: 'Product one', productType: 'digital' })] })
    const collection = collectionRegistry.find((entry) => entry.id === 'products')!
    const router = createMemoryRouter([
      {
        element: <Shell snapshot={snapshot} message={null} error={null} onPublished={() => {}}><Outlet /></Shell>,
        children: [
          { path: '/products/:recordId', element: <AdminWorkspace collection={collection} snapshot={snapshot} saving={false} onSave={async (_c, record) => record} onDelete={async () => true} /> },
          { path: '/', element: <h1>Dashboard destination</h1> },
        ],
      },
    ], { initialEntries: ['/products/p1'] })
    render(<UnsavedChangesProvider><RouterProvider router={router} /></UnsavedChangesProvider>)
    expect(screen.getByRole('region', { name: 'Products records' }).className).toContain('hidden lg:flex lg:w-pane lg:flex-none')
    const name = await screen.findByLabelText('Name')
    fireEvent.change(name, { target: { value: 'Changed title' } })
    await screen.findByText('Unsaved changes')
    fireEvent.click(screen.getByRole('button', { name: 'Open collections' }))
    const navDialog = await screen.findByRole('dialog', { name: 'Collections' })
    fireEvent.click(within(navDialog).getByRole('link', { name: 'Dashboard' }))
    const blocker = await screen.findByRole('dialog', { name: 'Discard unsaved changes?' })
    fireEvent.click(within(blocker).getByRole('button', { name: 'Keep editing' }))
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Changed title' })).toBeTruthy())
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Back to list' })))
  })

  it('closes the collection dialog from its close button and Escape', async () => {
    renderShell()
    fireEvent.click(screen.getByRole('button', { name: 'Open collections' }))
    const dialog = await screen.findByRole('dialog', { name: 'Collections' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close collections' }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Collections' })).toBeNull())
    fireEvent.click(screen.getByRole('button', { name: 'Open collections' }))
    await screen.findByRole('dialog', { name: 'Collections' })
    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Collections' })).toBeNull())
  })
})
