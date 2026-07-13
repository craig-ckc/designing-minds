import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  mailchimpDatacenter,
  subscriberHash,
  unsubscribeContact,
  unsubscribeToken,
  upsertContact,
  verifyUnsubscribeToken,
} from '../../apps/functions/src/lib/mailchimp.ts'

describe('subscriberHash', () => {
  it('is the MD5 of the lowercased email', () => {
    expect(subscriberHash('user@example.com')).toBe('b58996c504c5638798eb6b511e6f49af')
  })

  it('lowercases and trims before hashing', () => {
    expect(subscriberHash('  User@Example.COM  ')).toBe(subscriberHash('user@example.com'))
  })
})

describe('mailchimpDatacenter', () => {
  it('extracts the datacenter suffix from the API key', () => {
    expect(mailchimpDatacenter('abc123def456-us5')).toBe('us5')
  })

  it('returns null when the key has no datacenter suffix', () => {
    expect(mailchimpDatacenter('abc123def456')).toBeNull()
  })
})

describe('upsertContact', () => {
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

  it('skips the request (no throw) when Mailchimp is not configured', async () => {
    delete process.env.MAILCHIMP_API_KEY
    delete process.env.MAILCHIMP_AUDIENCE_ID
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(upsertContact({ email: 'a@b.com' })).resolves.toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('PUTs to the datacenter/audience/subscriber-hash URL with Basic auth and an upsert body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      upsertContact({ email: 'User@Example.com', firstName: 'Jane', lastName: 'Doe', tags: ['contact-form'] }),
    ).resolves.toBe(true)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://us5.api.mailchimp.com/3.0/lists/list123/members/b58996c504c5638798eb6b511e6f49af')
    expect(init.method).toBe('PUT')
    expect(init.headers.authorization).toBe(`Basic ${Buffer.from('anystring:abc123def456-us5').toString('base64')}`)
    expect(JSON.parse(init.body)).toEqual({
      email_address: 'User@Example.com',
      status_if_new: 'subscribed',
      merge_fields: { FNAME: 'Jane', LNAME: 'Doe' },
      tags: ['contact-form'],
    })
  })

  it('omits merge_fields and tags when none are provided and honours statusIfNew', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await upsertContact({ email: 'a@b.com', statusIfNew: 'pending' })

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      email_address: 'a@b.com',
      status_if_new: 'pending',
    })
  })

  it('throws on a non-2xx Mailchimp response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"title":"Invalid Resource"}', { status: 400 })))
    await expect(upsertContact({ email: 'a@b.com' })).rejects.toThrow(/400/)
  })

  it('throws when the API key has no datacenter suffix', async () => {
    process.env.MAILCHIMP_API_KEY = 'keywithoutdc'
    vi.stubGlobal('fetch', vi.fn())
    await expect(upsertContact({ email: 'a@b.com' })).rejects.toThrow(/datacenter/)
  })
})

describe('unsubscribeContact', () => {
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

  it('PATCHes the member to unsubscribed at the subscriber-hash URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(unsubscribeContact('user@example.com')).resolves.toBe(true)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://us5.api.mailchimp.com/3.0/lists/list123/members/b58996c504c5638798eb6b511e6f49af')
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(init.body)).toEqual({ status: 'unsubscribed' })
  })

  it('treats a 404 (never a member) as success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 404 })))
    await expect(unsubscribeContact('a@b.com')).resolves.toBe(true)
  })

  it('returns false without a request when Mailchimp is not configured', async () => {
    delete process.env.MAILCHIMP_API_KEY
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(unsubscribeContact('a@b.com')).resolves.toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('throws on a non-2xx (non-404) response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 500 })))
    await expect(unsubscribeContact('a@b.com')).rejects.toThrow(/500/)
  })
})

describe('unsubscribe token', () => {
  const original = process.env.MAILCHIMP_API_KEY

  beforeEach(() => {
    process.env.MAILCHIMP_API_KEY = 'abc123def456-us5'
  })

  afterEach(() => {
    if (original === undefined) delete process.env.MAILCHIMP_API_KEY
    else process.env.MAILCHIMP_API_KEY = original
  })

  it('verifies a token it produced for the same (case-insensitive) email', () => {
    const token = unsubscribeToken('User@Example.com')
    expect(verifyUnsubscribeToken('user@example.com', token)).toBe(true)
  })

  it('rejects a token issued for a different email', () => {
    const token = unsubscribeToken('someone@else.com')
    expect(verifyUnsubscribeToken('victim@example.com', token)).toBe(false)
  })

  it('rejects a tampered or empty token', () => {
    const token = unsubscribeToken('a@b.com')
    const tampered = (token[0] === 'a' ? 'b' : 'a') + token.slice(1) // flip first hex char, same length
    expect(verifyUnsubscribeToken('a@b.com', tampered)).toBe(false)
    expect(verifyUnsubscribeToken('a@b.com', '')).toBe(false)
  })

  it('changes when the signing secret (API key) changes', () => {
    const token = unsubscribeToken('a@b.com')
    process.env.MAILCHIMP_API_KEY = 'different-us5'
    expect(verifyUnsubscribeToken('a@b.com', token)).toBe(false)
  })
})
