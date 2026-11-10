import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { makeProduct, makeSnapshot } from '../../support/fixtures'

const mocks = vi.hoisted(() => ({ publish: vi.fn(), status: vi.fn(), refresh: vi.fn(), localPreview: false }))
vi.mock('../../../apps/admin/src/lib/publish', () => ({ publishWebsite: mocks.publish, fetchBuildStatus: mocks.status }))
vi.mock('../../../apps/admin/src/lib/supabase', () => ({ supabase: {} }))
vi.mock('../../../apps/admin/src/lib/site-status', () => ({ useSiteStatus: () => ({ build: null, localPreview: mocks.localPreview, refresh: mocks.refresh }) }))
import { PublishButton } from '../../../apps/admin/src/components/PublishButton'

const snapshot = makeSnapshot({ products: [makeProduct({ slug: 'queued', status: 'queued' })] })
beforeEach(() => {
  window.sessionStorage.clear()
  mocks.publish.mockReset()
  mocks.status.mockReset()
  mocks.refresh.mockReset()
  mocks.localPreview = false
})
afterEach(() => { vi.useRealTimers() })

it('shows the publish failure reason at every width and allows retry without dropping the pending work', async () => {
  mocks.publish.mockRejectedValueOnce(new Error('The connection dropped. Your queued changes are still waiting.'))
    .mockResolvedValueOnce({ state: 'debounced', message: 'A publish was just started. Try again in a moment.' })
  render(<PublishButton snapshot={snapshot} onPublished={vi.fn()} />)
  fireEvent.click(screen.getByRole('button', { name: 'Publish 1 change' }))
  const message = await screen.findByRole('alert')
  expect(message.textContent).toContain('Your queued changes are still waiting')
  expect(message.getAttribute('aria-live')).toBeNull()
  expect(message.className.split(' ')).not.toContain('hidden')
  fireEvent.click(screen.getByRole('button', { name: 'Retry publish' }))
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('A publish was just started'))
  expect(mocks.publish).toHaveBeenCalledTimes(2)
})

it('keeps publication progress visible and the action disabled while starting', async () => {
  mocks.publish.mockImplementation(() => new Promise(() => {}))
  render(<PublishButton snapshot={snapshot} onPublished={vi.fn()} />)
  fireEvent.click(screen.getByRole('button', { name: 'Publish 1 change' }))
  const message = screen.getByRole('status')
  expect(message.textContent).toBe('Publishing content…')
  expect(message.className.split(' ')).not.toContain('hidden')
  expect((screen.getByRole('button', { name: 'Publishing…' }) as HTMLButtonElement).disabled).toBe(true)
})

it('shows local completion without claiming a production deployment is live', async () => {
  mocks.localPreview = true
  mocks.publish.mockResolvedValue({ state: 'queued', localPreview: true, requestedAt: new Date().toISOString() })
  const onPublished = vi.fn()
  render(<PublishButton snapshot={snapshot} onPublished={onPublished} />)
  fireEvent.click(screen.getByRole('button', { name: 'Publish 1 change' }))
  expect((await screen.findByRole('status')).textContent).toContain('Local preview published. Refresh the storefront')
  expect((screen.getByRole('button', { name: 'Preview published' }) as HTMLButtonElement).disabled).toBe(true)
  expect(onPublished).toHaveBeenCalledTimes(1)
  expect(mocks.status).not.toHaveBeenCalled()
})

it('keeps a failed build log reachable alongside retry feedback', async () => {
  vi.useFakeTimers()
  mocks.publish.mockResolvedValue({ state: 'queued', requestedAt: new Date().toISOString() })
  mocks.status.mockResolvedValue({ state: 'error', inspectorUrl: 'https://vercel.com/example/build' })
  render(<PublishButton snapshot={snapshot} onPublished={vi.fn()} />)
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Publish 1 change' })) })
  expect(screen.getByRole('status').textContent).toContain('Website build queued')
  await act(async () => { await vi.advanceTimersByTimeAsync(4_000) })
  expect(screen.getByRole('alert').textContent).toContain('Build failed')
  expect(screen.getByRole('link', { name: 'View build log' }).getAttribute('href')).toBe('https://vercel.com/example/build')
  expect((screen.getByRole('button', { name: 'Retry publish' }) as HTMLButtonElement).disabled).toBe(false)
})

it('announces live only after the ready build has a matching storefront content stamp', async () => {
  vi.useFakeTimers()
  const requestedAt = new Date().toISOString()
  mocks.publish.mockResolvedValue({ state: 'queued', requestedAt })
  mocks.status.mockResolvedValue({ state: 'ready' })
  mocks.refresh.mockResolvedValue({ contentAt: requestedAt })
  render(<PublishButton snapshot={snapshot} onPublished={vi.fn()} />)
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Publish 1 change' })) })
  await act(async () => { await vi.advanceTimersByTimeAsync(4_000) })
  expect(screen.getByRole('status').textContent).toBe('Everything is live.')
  expect(mocks.refresh).toHaveBeenCalledTimes(1)
  expect(window.sessionStorage.getItem('dm-admin:publish-in-flight')).toBeNull()
})
