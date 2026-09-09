import assert from 'node:assert/strict'
import test from 'node:test'
import { requestJson, RequestError } from '../../apps/web/src/lib/request-json.ts'

test('a network failure provides actionable wording and reference without retrying POST', async () => {
  let calls = 0
  await assert.rejects(requestJson('/api/checkout', { method: 'POST' }, async () => { calls++; throw new TypeError('Failed to fetch') }),
    (error: unknown) => error instanceof RequestError && /connection/.test(error.message) && !!error.requestId)
  assert.equal(calls, 1)
})
test('proxy HTML errors do not surface JSON parser failures', async () => {
  await assert.rejects(requestJson('/api/checkout', {}, async () => new Response('<html>gateway</html>', { status: 502 })), /temporarily unavailable/)
})
test('returns successful JSON and preserves validation messages', async () => {
  assert.deepEqual(await requestJson('/api/checkout', {}, async () => Response.json({ ok: true })), { ok: true })
  await assert.rejects(requestJson('/api/checkout', {}, async () => Response.json({ error: 'Your cart is empty.' }, { status: 400 })), /Your cart is empty/)
})
test('times out a stuck request without replaying it', async () => {
  await assert.rejects(requestJson('/api/checkout', {}, async (_url, init) => new Promise((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(init.signal?.reason))
  }), 10), /longer than expected/)
})
