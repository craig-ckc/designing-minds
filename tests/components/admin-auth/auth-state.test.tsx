import { createElement } from 'react'
import { act, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  lookup: vi.fn(),
  authListener: undefined as ((event: string, session: unknown) => void) | undefined,
}))

vi.mock('../../../apps/admin/src/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mocks.getSession,
      onAuthStateChange: mocks.onAuthStateChange,
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.lookup }) }) }),
  },
}))

import { AdminAuthProvider, useAdminAuth } from '../../../apps/admin/src/lib/auth'

const session = (id: string) => ({ user: { id } }) as never
function Probe() {
  const auth = useAdminAuth()
  return createElement('output', {
    'data-testid': 'state',
    'data-user': auth.session?.user.id ?? '',
    'data-loading': String(auth.loading),
    'data-admin': String(auth.isAdmin),
    'data-error': auth.roleError ?? '',
    'data-recovery': String(auth.recovery),
    onClick: () => void auth.retryRole(),
  })
}
const renderAuth = () => render(createElement(AdminAuthProvider, null, createElement(Probe)))

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getSession.mockResolvedValue({ data: { session: null }, error: null })
  mocks.lookup.mockResolvedValue({ data: { role: 'admin' }, error: null })
  mocks.onAuthStateChange.mockImplementation((callback) => {
    mocks.authListener = callback
    return { data: { subscription: { unsubscribe: vi.fn() } } }
  })
})

describe('admin auth state recovery', () => {
  it('settles on role lookup errors and retries against the retained session', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: session('u1') }, error: null })
    mocks.lookup.mockResolvedValueOnce({ data: null, error: { message: 'role lookup failed' } })
    renderAuth()
    const state = await screen.findByTestId('state')
    await waitFor(() => expect(state.getAttribute('data-loading')).toBe('false'))
    expect(state.getAttribute('data-admin')).toBe('false')
    expect(state.getAttribute('data-error')).toBe('role lookup failed')
    expect(state.getAttribute('data-user')).toBe('u1')
    await act(async () => { state.click() })
    await waitFor(() => expect(state.getAttribute('data-admin')).toBe('true'))
    expect(state.getAttribute('data-user')).toBe('u1')
    expect(mocks.lookup).toHaveBeenCalledTimes(2)
  })

  it('ignores a stale role result after logout', async () => {
    let finishLookup!: (value: unknown) => void
    mocks.getSession.mockResolvedValue({ data: { session: session('u1') }, error: null })
    mocks.lookup.mockImplementationOnce(() => new Promise((resolve) => { finishLookup = resolve }))
    renderAuth()
    const state = await screen.findByTestId('state')
    await waitFor(() => expect(mocks.lookup).toHaveBeenCalledTimes(1))
    act(() => mocks.authListener?.('SIGNED_OUT', null))
    await waitFor(() => expect(state.getAttribute('data-loading')).toBe('false'))
    await act(async () => { finishLookup({ data: { role: 'admin' }, error: null }) })
    expect(state.getAttribute('data-user')).toBe('')
    expect(state.getAttribute('data-admin')).toBe('false')
  })

  it('ignores a stale role result after an account change', async () => {
    let finishOld!: (value: unknown) => void
    mocks.getSession.mockResolvedValue({ data: { session: session('u1') }, error: null })
    mocks.lookup.mockImplementationOnce(() => new Promise((resolve) => { finishOld = resolve }))
    renderAuth()
    const state = await screen.findByTestId('state')
    await waitFor(() => expect(mocks.lookup).toHaveBeenCalledTimes(1))
    act(() => mocks.authListener?.('SIGNED_IN', session('u2')))
    await waitFor(() => expect(state.getAttribute('data-admin')).toBe('true'))
    await act(async () => { finishOld({ data: { role: 'admin' }, error: null }) })
    expect(state.getAttribute('data-user')).toBe('u2')
  })

  it('keeps an authenticated same-user session stable while refreshing its role', async () => {
    let finishRefresh!: (value: unknown) => void
    mocks.getSession.mockResolvedValue({ data: { session: session('u1') }, error: null })
    mocks.lookup.mockResolvedValueOnce({ data: { role: 'admin' }, error: null })
    renderAuth()
    const state = await screen.findByTestId('state')
    await waitFor(() => expect(state.getAttribute('data-admin')).toBe('true'))
    mocks.lookup.mockImplementationOnce(() => new Promise((resolve) => { finishRefresh = resolve }))
    act(() => mocks.authListener?.('TOKEN_REFRESHED', session('u1')))
    await waitFor(() => expect(mocks.lookup).toHaveBeenCalledTimes(2))
    expect(state.getAttribute('data-loading')).toBe('false')
    expect(state.getAttribute('data-admin')).toBe('true')
    await act(async () => { finishRefresh({ data: { role: 'admin' }, error: null }) })
    expect(state.getAttribute('data-loading')).toBe('false')
    expect(state.getAttribute('data-admin')).toBe('true')
  })

  it('clears password recovery state when the user signs out', async () => {
    renderAuth()
    const state = await screen.findByTestId('state')
    act(() => mocks.authListener?.('PASSWORD_RECOVERY', session('u1')))
    await waitFor(() => expect(state.getAttribute('data-recovery')).toBe('true'))
    act(() => mocks.authListener?.('SIGNED_OUT', null))
    await waitFor(() => expect(state.getAttribute('data-recovery')).toBe('false'))
  })

  it('settles loading when the initial session read rejects', async () => {
    mocks.getSession.mockRejectedValue(new Error('session unavailable'))
    renderAuth()
    const state = await screen.findByTestId('state')
    await waitFor(() => expect(state.getAttribute('data-loading')).toBe('false'))
    expect(state.getAttribute('data-admin')).toBe('false')
    expect(state.getAttribute('data-error')).toBe('session unavailable')
  })
})
