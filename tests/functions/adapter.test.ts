import { describe, expect, it, vi } from 'vitest'
import { handleVercel } from '../../apps/functions/api/_adapter.ts'

const request = (body = '') => ({
  method: 'POST',
  headers: { origin: 'https://www.designingminds.co.za', 'content-type': 'application/json' },
  async *[Symbol.asyncIterator]() {
    if (body) yield Buffer.from(body)
  },
})

describe('Vercel API adapter', () => {
  it('reports unexpected handler failures as 500 without exposing exception messages', async () => {
    const response = { setHeader: vi.fn(), status: vi.fn(function (this: typeof response) { return this }), json: vi.fn(), end: vi.fn() }
    await handleVercel(async () => { throw new Error('private secret') }, request(), response)
    expect(response.status).toHaveBeenCalledWith(500)
    expect(JSON.stringify(response.json.mock.calls)).not.toContain('private secret')
  })

  it('retains 413 for oversized bodies', async () => {
    const response = { setHeader: vi.fn(), status: vi.fn(function (this: typeof response) { return this }), json: vi.fn(), end: vi.fn() }
    const handler = vi.fn()
    await handleVercel(handler, request('x'.repeat(1024 * 1024 + 1)), response)
    expect(response.status).toHaveBeenCalledWith(413)
    expect(handler).not.toHaveBeenCalled()
  })
  it('marks API responses as private and non-sniffable', async () => {
    const headers = new Map<string, string>()
    const response = {
      setHeader: vi.fn((key: string, value: string) => headers.set(key.toLowerCase(), value)),
      status: vi.fn(function (this: typeof response) { return this }),
      json: vi.fn(),
      end: vi.fn(),
    }

    await handleVercel(async () => ({ status: 200, body: { ok: true } }), request(), response)

    expect(headers.get('cache-control')).toBe('no-store')
    expect(headers.get('x-content-type-options')).toBe('nosniff')
    expect(response.status).toHaveBeenCalledWith(200)
  })
})
