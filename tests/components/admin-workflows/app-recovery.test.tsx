import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeSnapshot } from '../../../tests/support/fixtures'

const { auth, getSnapshot } = vi.hoisted(() => ({
  auth: { session: null as unknown, loading: false, isAdmin: false, roleError: null as string | null, retryRole: vi.fn(async () => {}), recovery: false, logout: vi.fn(async () => {}), signIn: vi.fn(), resetPassword: vi.fn(), updatePassword: vi.fn() },
  getSnapshot: vi.fn(),
}))
vi.mock('../../../apps/admin/src/lib/auth', () => ({ useAdminAuth: () => auth }))
vi.mock('../../../apps/admin/src/repository', () => ({ repository: { canWrite: true, getSnapshot } }))
vi.mock('../../../apps/admin/src/lib/supabase', () => ({ supabase: {} }))
vi.mock('../../../apps/admin/src/components/Shell', () => ({ Shell: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }))

import App from '../../../apps/admin/src/App'

describe('admin recovery actions', () => {
  beforeEach(() => {
    auth.session = { user: { id: 'user-1' } }
    auth.loading = false
    auth.isAdmin = true
    auth.roleError = null
    auth.retryRole.mockClear()
    auth.logout.mockClear()
    getSnapshot.mockReset()
  })

  it('retries initial CMS content loading', async () => {
    getSnapshot.mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce(makeSnapshot())
    render(<MemoryRouter><App /></MemoryRouter>)
    expect(await screen.findByText('Offline')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    await waitFor(() => expect(getSnapshot).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(screen.queryByText('Content unavailable')).toBeNull())
  })

  it('offers logout when the session is denied access', () => {
    auth.isAdmin = false
    render(<MemoryRouter><App /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Log out' }))
    expect(auth.logout).toHaveBeenCalledOnce()
  })

  it('distinguishes an unavailable role check and lets the administrator retry', () => {
    auth.isAdmin = false
    auth.roleError = 'Network failed'
    render(<MemoryRouter><App /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Access check unavailable' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Retry access check' }))
    expect(auth.retryRole).toHaveBeenCalledOnce()
  })

  it('keeps data on token refresh but starts a clean workspace on account change', async () => {
    getSnapshot.mockResolvedValueOnce(makeSnapshot())
    const { rerender } = render(<MemoryRouter><App /></MemoryRouter>)
    await screen.findByRole('heading', { name: 'Dashboard' })
    auth.session = { user: { id: 'user-1' }, access_token: 'refreshed' }
    rerender(<MemoryRouter><App /></MemoryRouter>)
    expect(getSnapshot).toHaveBeenCalledTimes(1)
    getSnapshot.mockImplementationOnce(() => new Promise(() => {}))
    auth.session = { user: { id: 'user-2' } }
    rerender(<MemoryRouter><App /></MemoryRouter>)
    expect(screen.queryByRole('heading', { name: 'Dashboard' })).toBeNull()
    await waitFor(() => expect(getSnapshot).toHaveBeenCalledTimes(2))
  })
})
