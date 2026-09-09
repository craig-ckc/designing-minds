import assert from 'node:assert/strict'
import test from 'node:test'
import { createDiagnostics } from '../../apps/web/src/lib/diagnostics-client.ts'

const sessionId = '12345678-1234-4234-8234-123456789012'
test('records request milestones, shares a request ID, and never records request bodies', async () => {
  const sent: unknown[] = []
  let headers: Headers | undefined
  const monitor = createDiagnostics({ sessionId, route: () => '/checkout', send: async (events) => { sent.push(...events); return true },
    fetch: async (_url, init) => { headers = new Headers(init?.headers); return new Response('{}', { status: 201 }) } })
  const response = await monitor.fetch('/api/checkout', { method: 'POST', body: '{"password":"secret"}' })
  await monitor.flush()
  assert.equal(response.status, 201)
  assert.ok(headers?.get('x-request-id'))
  assert.equal(headers?.get('x-session-id'), sessionId)
  assert.equal(sent.length, 2)
  assert.deepEqual(sent.map((event) => (event as { sequence: number }).sequence), [0, 1])
  assert.doesNotMatch(JSON.stringify(sent), /secret|password/)
})

test('network failures are recorded and rethrown without retrying a purchase', async () => {
  let calls = 0
  const sent: unknown[] = []
  const monitor = createDiagnostics({ sessionId, route: () => '/checkout', send: async (events) => { sent.push(...events); return true },
    fetch: async () => { calls++; throw new TypeError('Failed to fetch') } })
  await assert.rejects(monitor.fetch('/api/checkout', { method: 'POST' }), /Failed to fetch/)
  await monitor.flush()
  assert.equal(calls, 1)
  assert.match(JSON.stringify(sent), /http.failed/)
})

test('logging outages do not fail requests and queues stay bounded', async () => {
  const sizes: number[] = []
  const monitor = createDiagnostics({ sessionId, route: () => '/', send: async (events) => { sizes.push(events.length); throw Error('offline') }, fetch })
  for (let i = 0; i < 200; i++) monitor.record('runtime.error')
  await monitor.flush()
  assert.ok(sizes[0] <= 20)
  assert.ok(monitor.pending() <= 50)
})
