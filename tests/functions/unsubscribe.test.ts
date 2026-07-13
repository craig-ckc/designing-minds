import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { unsubscribe } from '../../apps/functions/src/handlers/unsubscribe.ts'
import { unsubscribeToken } from '../../apps/functions/src/lib/mailchimp.ts'

const req = (method: string, body: unknown) => ({ method, body, headers: {} })

describe('unsubscribe handler', () => {
  const original = { ...process.env }

  beforeEach(() => {
    process.env.MAILCHIMP_API_KEY = 'abc123def456-us5'
    process.env.MAILCHIMP_AUDIENCE_ID = 'list123'
  })

  afterEach(() => {
    process.env.MAILCHIMP_API_KEY = original.MAILCHIMP_API_KEY
    process.env.MAILCHIMP_AUDIENCE_ID = original.MAILCHIMP_AUDIENCE_ID
    vi.unstubAllGlobals()
  })

  it('rejects non-POST methods', async () => {
    expect((await unsubscribe(req('GET', undefined))).status).toBe(400)
  })

  it('rejects a malformed body', async () => {
    expect((await unsubscribe(req('POST', { email: 'a@b.com' }))).status).toBe(400)
  })

  it('rejects an invalid token without calling Mailchimp', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const response = await unsubscribe(req('POST', { email: 'a@b.com', token: 'not-a-real-token' }))

    expect(response.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('unsubscribes the contact when the token is valid', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const token = unsubscribeToken('a@b.com')
    const response = await unsubscribe(req('POST', { email: 'a@b.com', token }))

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ unsubscribed: true })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][1].method).toBe('PATCH')
  })
})
