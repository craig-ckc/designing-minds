import { beforeEach, describe, expect, it, vi } from 'vitest'
const persistEvents = vi.hoisted(() => vi.fn(async () => true))
vi.mock('../../apps/functions/src/lib/diagnostics.ts', () => ({ persistEvents }))
import { diagnostics } from '../../apps/functions/src/handlers/diagnostics.ts'
const req = (events: unknown) => ({ method: 'POST', headers: { 'content-type': 'application/json' }, body: { events } })
beforeEach(() => persistEvents.mockReset().mockResolvedValue(true))
describe('diagnostic ingestion', () => {
  it('accepts a sanitized batch and forces browser provenance', async () => {
    const result = await diagnostics(req([{ event: 'checkout.failed', source: 'server', message: 'secret' }]))
    expect(result.status).toBe(202)
    expect(persistEvents.mock.calls[0][0][0].source).toBe('browser')
    expect(JSON.stringify(persistEvents.mock.calls)).not.toContain('secret')
  })
  it.each([[], new Array(21).fill({ event: 'http.failed' }), [{ event: 'unknown' }]])('rejects malformed or oversized batches', async (events) => {
    expect((await diagnostics(req(events))).status).toBe(400)
    expect(persistEvents).not.toHaveBeenCalled()
  })
  it('returns unavailable when persistence fails so clients can retain their bounded queue', async () => {
    persistEvents.mockResolvedValue(false)
    expect((await diagnostics(req([{ event: 'runtime.error' }]))).status).toBe(503)
  })
  it('rejects simple cross-origin form submissions', async () => {
    expect((await diagnostics({ ...req([{ event: 'page.view' }]), headers: { 'content-type': 'text/plain' } })).status).toBe(400)
  })
})
