import { afterEach, describe, expect, it, vi } from 'vitest'
import { sanitizeEvent } from '../../packages/utils/src/diagnostics.ts'
import { observeHandler } from '../../apps/functions/src/lib/diagnostics.ts'

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

describe('diagnostic privacy boundary', () => {
  it('keeps correlation and outcome but drops payloads, query strings, identities and arbitrary errors', () => {
    const event = sanitizeEvent({ event: 'http.failed', route: '/api/checkout?token=secret', status: 500,
      requestId: '12345678-1234-4234-8234-123456789012', email: 'private@example.com',
      body: { password: 'secret' }, message: 'Bearer secret', stack: 'secret', errorKind: 'TypeError' }, 'browser')
    expect(event).toMatchObject({ event: 'http.failed', route: '/api/checkout', status: 500, errorKind: 'TypeError', source: 'browser' })
    expect(JSON.stringify(event)).not.toMatch(/secret|private|password|message|stack/)
  })
  it('rejects unknown events and discards invalid identifiers and unsafe paths', () => {
    expect(sanitizeEvent({ event: 'arbitrary data' }, 'browser')).toBeNull()
    expect(sanitizeEvent({ event: 'page.view', route: '/reset-password/private@example.com', requestId: 'secret' }, 'browser'))
      .toMatchObject({ route: '/other', requestId: null })
  })
})

describe('request observation', () => {
  it('keeps a successful business response when diagnostic storage rejects the write', async () => {
    vi.stubEnv('DIAGNOSTICS_ENABLED', 'true')
    vi.stubEnv('SUPABASE_URL', 'https://diagnostics.example.test')
    vi.stubEnv('SUPABASE_SECRET_KEY', 'test-server-key')
    vi.stubGlobal('fetch', async () => Response.json({ message: 'private database detail' }, { status: 400 }))
    const response = await observeHandler(async () => ({ status: 201, body: { orderId: 'created' } }),
      { method: 'POST', headers: {}, body: {} }, '/api/checkout')
    expect(response.status).toBe(201)
    expect(response.body).toEqual({ orderId: 'created' })
  })

  it('isolates correlation across concurrent server requests', async () => {
    vi.stubEnv('DIAGNOSTICS_ENABLED', 'true')
    vi.stubEnv('SUPABASE_URL', 'https://diagnostics.example.test')
    vi.stubEnv('SUPABASE_SECRET_KEY', 'test-server-key')
    const batches: { requestId: string; route: string }[][] = []
    vi.stubGlobal('fetch', async (_url: unknown, init: RequestInit) => {
      batches.push(JSON.parse(String(init.body)).p_events)
      return Response.json(true)
    })
    const ids = ['12345678-1234-4234-8234-123456789012', '22345678-1234-4234-8234-123456789012']
    await Promise.all(ids.map((id, index) => observeHandler(async () => {
      await new Promise((resolve) => setTimeout(resolve, index ? 1 : 5))
      return { status: 200, body: {} }
    }, { method: 'POST', headers: { 'x-request-id': id }, body: {} }, index ? '/api/forms' : '/api/checkout')))
    expect(batches).toHaveLength(2)
    for (const batch of batches) {
      expect(new Set(batch.map((event) => event.requestId)).size).toBe(1)
      expect(new Set(batch.map((event) => event.route)).size).toBe(1)
      expect(batch.map((event) => (event as { sequence?: number }).sequence)).toEqual([0, 1])
    }
    expect(new Set(batches.map((batch) => batch[0].requestId))).toEqual(new Set(ids))
  })
  it('returns a correlation ID and records success without changing the response body', async () => {
    vi.stubEnv('DIAGNOSTICS_ENABLED', 'false')
    const response = await observeHandler(async () => ({ status: 201, body: { ok: true } }),
      { method: 'POST', headers: {}, body: {} }, '/api/checkout')
    expect(response.status).toBe(201)
    expect(response.body).toEqual({ ok: true })
    expect(response.headers?.['x-request-id']).toMatch(/^[\da-f-]{36}$/)
  })
  it('turns an unexpected handler exception into a generic 500, not a 413 or leaked secret', async () => {
    vi.stubEnv('DIAGNOSTICS_ENABLED', 'false')
    const response = await observeHandler(async () => { throw new Error('password=secret') },
      { method: 'POST', headers: {}, body: {} }, '/api/checkout')
    expect(response.status).toBe(500)
    expect(JSON.stringify(response.body)).not.toContain('secret')
  })
})
