import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DiagnosticsPage } from '../../../apps/admin/src/pages/DiagnosticsPage'

const db = vi.hoisted(() => {
  const query = {
    select: vi.fn(), gte: vi.fn(), lte: vi.fn(), order: vi.fn(), range: vi.fn(), eq: vi.fn(),
    abortSignal: vi.fn(),
  }
  for (const method of [query.select, query.gte, query.lte, query.order, query.range, query.eq]) method.mockReturnValue(query)
  return { query, result: { data: [] as unknown[] | null, error: null as unknown }, from: vi.fn(() => query) }
})

vi.mock('../../../apps/admin/src/lib/supabase', () => ({ supabase: { from: db.from } }))

function row(index = 0) {
  return {
    id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    receivedAt: '2026-11-10T08:00:00.000Z', occurredAt: '2026-11-10T08:00:00.000Z', sequence: index,
    source: 'server', level: 'error', event: `event-${index}-${'e'.repeat(80)}`,
    route: `/api/diagnostics/${'route-segment-'.repeat(12)}`, requestId: '11111111-1111-4111-8111-111111111111',
    sessionId: null, orderId: null, status: 500, durationMs: 42, errorKind: 'UnhandledError',
    code: 'E'.repeat(120), asset: null, release: null,
  }
}

describe('diagnostics responsive page', () => {
  beforeEach(() => {
    db.result = { data: [], error: null }
    db.query.abortSignal.mockImplementation(async () => db.result)
    db.from.mockClear()
    for (const method of [db.query.select, db.query.gte, db.query.lte, db.query.order, db.query.range, db.query.eq, db.query.abortSignal]) method.mockClear()
  })

  it('keeps filters and controls bounded at narrow widths and contains table overflow locally', async () => {
    db.result = { data: [row()], error: null }
    render(<DiagnosticsPage />)
    await screen.findByText(/Page 1 · 1 events/)

    expect(screen.getByRole('main').className).toContain('min-w-0')
    for (const label of ['Level', 'Period', 'Reference type', 'Reference ID']) {
      expect(screen.getByLabelText(label).className).toContain('w-full')
      expect(screen.getByLabelText(label).className).toContain('min-w-0')
    }
    const tableRegion = screen.getByRole('region', { name: 'Diagnostic events table' })
    expect(tableRegion.className).toContain('overflow-hidden')
    expect(tableRegion.querySelector('table')?.className).toContain('min-w-[760px]')
    expect(tableRegion.querySelector('table')?.className).toContain('table-fixed')
    expect(screen.getByRole('button', { name: 'Search / refresh' }).className).toContain('w-full')
    expect(screen.getByRole('button', { name: 'Newer' }).hasAttribute('disabled')).toBe(true)
  })

  it('shows the empty state when the query succeeds without rows', async () => {
    render(<DiagnosticsPage />)
    expect((await screen.findByRole('status')).textContent).toContain('No matching events.')
    expect(screen.queryByRole('region', { name: 'Diagnostic events table' })).toBeNull()
  })

  it('reports query failures without showing a stale table', async () => {
    db.result = { data: null, error: new Error('permission denied') }
    render(<DiagnosticsPage />)
    expect((await screen.findByRole('alert')).textContent).toContain('Logs could not be loaded.')
    expect(screen.queryByRole('region', { name: 'Diagnostic events table' })).toBeNull()
  })

  it('rejects incomplete reference IDs without issuing a second query', async () => {
    render(<DiagnosticsPage />)
    await screen.findByRole('status')
    fireEvent.change(screen.getByLabelText('Reference ID'), { target: { value: 'incomplete-id' } })
    fireEvent.click(screen.getByRole('button', { name: 'Search / refresh' }))
    expect((await screen.findByRole('alert')).textContent).toContain('Enter the complete reference ID')
    expect(db.from).toHaveBeenCalledTimes(1)
  })

  it('applies valid filters and paginates using the existing 100-row query window', async () => {
    db.result = { data: Array.from({ length: 100 }, (_, index) => row(index)), error: null }
    render(<DiagnosticsPage />)
    await screen.findByText(/Page 1 · 100 events/)
    fireEvent.change(screen.getByLabelText('Level'), { target: { value: 'warning' } })
    fireEvent.change(screen.getByLabelText('Reference ID'), { target: { value: '11111111-1111-4111-8111-111111111111' } })
    fireEvent.click(screen.getByRole('button', { name: 'Search / refresh' }))
    await waitFor(() => expect(db.query.range).toHaveBeenCalledTimes(2))
    expect(db.query.eq).toHaveBeenCalledWith('level', 'warning')
    expect(db.query.eq).toHaveBeenCalledWith('requestId', '11111111-1111-4111-8111-111111111111')
    expect(db.query.range).toHaveBeenLastCalledWith(0, 99)

    fireEvent.click(screen.getByRole('button', { name: 'Older' }))
    await waitFor(() => expect(db.query.range).toHaveBeenCalledTimes(3))
    expect(db.query.range).toHaveBeenLastCalledWith(100, 199)
    expect(await screen.findByText(/Page 2 · 100 events/)).toBeTruthy()
  })

  it('follows a trace from a later page and clears the level filter to include the whole request', async () => {
    const event = row()
    db.result = { data: Array.from({ length: 100 }, (_, index) => row(index)), error: null }
    render(<DiagnosticsPage />)
    await screen.findByText(/Page 1 · 100 events/)
    fireEvent.click(screen.getByRole('button', { name: 'Older' }))
    await screen.findByText(/Page 2 · 100 events/)
    db.query.eq.mockClear()
    fireEvent.click(screen.getAllByRole('button', { name: `request: ${event.requestId}` })[0])

    await screen.findByText(/Page 1 · 100 events/)
    expect((screen.getByLabelText('Level') as HTMLSelectElement).value).toBe('')
    expect((screen.getByLabelText('Reference type') as HTMLSelectElement).value).toBe('requestId')
    expect((screen.getByLabelText('Reference ID') as HTMLInputElement).value).toBe(event.requestId)
    expect(db.query.eq).toHaveBeenCalledWith('requestId', event.requestId)
    expect(db.query.eq).not.toHaveBeenCalledWith('level', expect.anything())
    expect(db.query.range).toHaveBeenLastCalledWith(0, 99)
  })
})
