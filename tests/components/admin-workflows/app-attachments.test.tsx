import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeProduct, makeSnapshot } from '../../../tests/support/fixtures'

const { auth, getSnapshot, saveProduct, uploads } = vi.hoisted(() => ({
  auth: { session: { user: { id: 'user-1' } }, loading: false, isAdmin: true, roleError: null, retryRole: vi.fn(), recovery: false, logout: vi.fn(), signIn: vi.fn(), resetPassword: vi.fn(), updatePassword: vi.fn() },
  getSnapshot: vi.fn(), saveProduct: vi.fn(), uploads: { onOrphaned: null as null | ((job: any, file: any) => Promise<void>) },
}))

vi.mock('../../../apps/admin/src/lib/auth', () => ({ useAdminAuth: () => auth }))
vi.mock('../../../apps/admin/src/repository', () => ({ repository: { canWrite: true, getSnapshot, saveProduct } }))
vi.mock('../../../apps/admin/src/lib/supabase', () => ({ supabase: {} }))
vi.mock('../../../apps/admin/src/components/Shell', () => ({ Shell: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }))
vi.mock('../../../apps/admin/src/lib/uploads', async () => {
  const actual = await vi.importActual<typeof import('../../../apps/admin/src/lib/uploads')>('../../../apps/admin/src/lib/uploads')
  return {
    ...actual,
    UploadsProvider: ({ children, onOrphaned }: { children: React.ReactNode; onOrphaned: typeof uploads.onOrphaned }) => {
      uploads.onOrphaned = onOrphaned
      return <>{children}</>
    },
  }
})
vi.mock('../../../apps/admin/src/pages/DashboardPage', () => ({ DashboardPage: () => <h1>Dashboard</h1> }))
vi.mock('../../../apps/admin/src/screens/AdminWorkspace', () => ({ AdminWorkspace: () => null }))
vi.mock('../../../apps/admin/src/pages/DiagnosticsPage', () => ({ DiagnosticsPage: () => null }))
vi.mock('../../../apps/admin/src/pages/LoginPage', () => ({ LoginPage: () => null }))
vi.mock('../../../apps/admin/src/pages/ResetPasswordPage', () => ({ ResetPasswordPage: () => null }))

import App from '../../../apps/admin/src/App'

describe('App orphan attachment consistency', () => {
  beforeEach(() => {
    saveProduct.mockReset()
    uploads.onOrphaned = null
    getSnapshot.mockResolvedValue({ ...makeSnapshot({ products: [makeProduct({ slug: 'one', purchasedFiles: [] })] }), coupons: [] })
  })

  it('rejects a replacement whose original file is no longer attached without saving unchanged data', async () => {
    render(<MemoryRouter><App /></MemoryRouter>)
    await screen.findByRole('heading', { name: 'Dashboard' })
    expect(uploads.onOrphaned).toBeTypeOf('function')
    const job = {
      id: 'job-1', collectionId: 'products', recordId: 'one', fieldKey: 'purchasedFiles',
      purpose: 'purchased', filename: 'replacement.pdf', sizeBytes: 1, progress: 1,
      status: 'done', replacesFileId: 'already-removed',
    }
    const artifact = { id: 'new-file', storageKey: 'new-file', filename: 'replacement.pdf', url: '/replacement.pdf', label: 'Replacement' }
    await expect(act(async () => uploads.onOrphaned!(job, artifact))).rejects.toThrow(/no longer attached/)
    expect(saveProduct).not.toHaveBeenCalled()
  })

  it('saves consecutive orphan attachments against the latest snapshot', async () => {
    saveProduct.mockImplementation(async (product) => product)
    render(<MemoryRouter><App /></MemoryRouter>)
    await screen.findByRole('heading', { name: 'Dashboard' })
    const attach = uploads.onOrphaned!
    const job = (id: string) => ({
      id, collectionId: 'products', recordId: 'one', fieldKey: 'purchasedFiles', purpose: 'purchased' as const,
      filename: `${id}.pdf`, sizeBytes: 1, progress: 1, status: 'done' as const,
    })
    const artifact = (id: string) => ({ id, storageKey: id, filename: `${id}.pdf`, url: `/${id}.pdf`, label: id })
    await Promise.all([attach(job('job-1'), artifact('file-1')), attach(job('job-2'), artifact('file-2'))])
    expect(saveProduct).toHaveBeenCalledTimes(2)
    expect(saveProduct.mock.calls[1][0].purchasedFiles.map((file: { id: string }) => file.id)).toEqual(['file-1', 'file-2'])
  })
})
