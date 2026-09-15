import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { vi } from 'vitest'

/* The handler only ever touches Supabase/email/Mailchimp through these three
   modules, so mocking the modules (not the network) lets us assert on what
   would have been written/sent without any real side effects. */
const mocks = vi.hoisted(() => ({
  insert: vi.fn(async () => ({ error: null as { message: string } | null })),
  sendFormNotification: vi.fn(async () => {}),
  sendSubscriptionConfirmation: vi.fn(async () => false),
  upsertContact: vi.fn(async () => false),
}))

vi.mock('../../apps/functions/src/lib/supabase.ts', () => ({
  createServiceClient: () => ({ from: () => ({ insert: mocks.insert }) }),
}))
vi.mock('../../apps/functions/src/lib/email.ts', () => ({
  sendFormNotification: mocks.sendFormNotification,
  sendSubscriptionConfirmation: mocks.sendSubscriptionConfirmation,
}))
vi.mock('../../apps/functions/src/lib/mailchimp.ts', () => ({
  upsertContact: mocks.upsertContact,
  unsubscribeToken: () => 'x',
}))

import { forms } from '../../apps/functions/src/handlers/forms.ts'

const jsonReq = (body: unknown, headers: Record<string, string> = {}) => ({
  method: 'POST',
  headers: { 'content-type': 'application/json', ...headers },
  body,
})

// A native <form> POST arrives at the handler already parsed into a flat
// object (that parsing is the adapter's job, covered elsewhere) — so tests
// only need the urlencoded content-type to trigger the navigation path.
const formReq = (fields: Record<string, string>, headers: Record<string, string> = {}) => ({
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers },
  body: fields,
})

describe('forms handler', () => {
  const originalSiteUrl = process.env.SITE_URL

  beforeEach(() => {
    delete process.env.SITE_URL
    mocks.insert.mockClear()
    mocks.insert.mockResolvedValue({ error: null })
    mocks.sendFormNotification.mockClear()
    mocks.sendSubscriptionConfirmation.mockClear()
    mocks.upsertContact.mockClear()
  })

  afterEach(() => {
    if (originalSiteUrl === undefined) delete process.env.SITE_URL
    else process.env.SITE_URL = originalSiteUrl
  })

  it('still returns JSON for a JSON contact submission and inserts the name/email columns', async () => {
    const response = await forms(
      jsonReq({ form: 'contact', fields: { name: 'Jane Doe', email: 'jane@example.com', message: 'Hello there' } }),
    )

    expect(response.status).toBe(201)
    expect(response.body).toEqual({ ok: true })
    expect(mocks.insert).toHaveBeenCalledTimes(1)
    const row = mocks.insert.mock.calls[0][0] as Record<string, unknown>
    expect(row.name).toBe('Jane Doe')
    expect(row.email).toBe('jane@example.com')
  })

  it('still returns 400 JSON for a bad JSON request (missing email)', async () => {
    const response = await forms(jsonReq({ form: 'contact', fields: { name: 'Jane Doe', message: 'Hello there' } }))

    expect(response.status).toBe(400)
    expect(response.body).toMatchObject({ error: expect.any(String) })
    expect(response.headers?.location).toBeUndefined()
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  it('redirects a urlencoded newsletter submission to the return path with a sent fragment', async () => {
    const response = await forms(
      formReq(
        { form: 'newsletter', email: 'reader@example.com', source: 'Footer', website: '', _return: '/grades/grade-4' },
        { origin: 'https://www.designingminds.co.za' },
      ),
    )

    expect(response.status).toBe(303)
    expect(response.headers?.location).toBe('https://www.designingminds.co.za/grades/grade-4#newsletter-sent')
    expect(mocks.insert).toHaveBeenCalledTimes(1)
    expect((mocks.insert.mock.calls[0][0] as Record<string, unknown>).email).toBe('reader@example.com')
  })

  it('redirects a urlencoded contact submission, composing the name and keeping the rest in the data bag', async () => {
    const response = await forms(
      formReq(
        {
          form: 'contact',
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          topic: 'General enquiry',
          message: 'Hello there',
          marketing: 'on',
          website: '',
          _return: '/contact',
        },
        { origin: 'https://www.designingminds.co.za' },
      ),
    )

    expect(response.status).toBe(303)
    expect(response.headers?.location).toBe('https://www.designingminds.co.za/contact#contact-sent')
    expect(mocks.insert).toHaveBeenCalledTimes(1)
    const row = mocks.insert.mock.calls[0][0] as Record<string, unknown>
    expect(row.name).toBe('Jane Doe')
    expect(row.data).toMatchObject({
      topic: 'General enquiry',
      message: 'Hello there',
      firstName: 'Jane',
      lastName: 'Doe',
      marketing: 'on',
    })
  })

  it('redirects a urlencoded contact submission missing a required field to a failed fragment, without inserting', async () => {
    const response = await forms(
      formReq(
        { form: 'contact', firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', website: '', _return: '/contact' },
        { origin: 'https://www.designingminds.co.za' },
      ),
    )

    expect(response.status).toBe(303)
    expect(response.headers?.location).toBe('https://www.designingminds.co.za/contact#contact-failed')
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  it('pretends success on a filled honeypot without inserting anything', async () => {
    const response = await forms(
      formReq(
        { form: 'newsletter', email: 'bot@example.com', website: 'http://spam.example', _return: '/' },
        { origin: 'https://www.designingminds.co.za' },
      ),
    )

    expect(response.status).toBe(303)
    expect(response.headers?.location).toBe('https://www.designingminds.co.za/#newsletter-sent')
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  it.each([['//evil.example'], ['http://evil.example/x'], ['grades']])(
    'falls back to the default path for an unsafe _return %s',
    async (unsafeReturn) => {
      const response = await forms(
        formReq(
          { form: 'newsletter', email: 'reader@example.com', website: '', _return: unsafeReturn },
          { origin: 'https://www.designingminds.co.za' },
        ),
      )

      expect(response.headers?.location).toBe('https://www.designingminds.co.za/#newsletter-sent')
    },
  )

  it('falls back to the referer origin when there is no origin header', async () => {
    const response = await forms(
      formReq(
        { form: 'newsletter', email: 'reader@example.com', website: '', _return: '/' },
        { referer: 'https://www.designingminds.co.za/about?x=1' },
      ),
    )

    expect(response.headers?.location?.startsWith('https://www.designingminds.co.za/')).toBe(true)
  })

  it('falls back to SITE_URL when there is no origin or referer header', async () => {
    process.env.SITE_URL = 'designingminds.co.za/'

    const response = await forms(formReq({ form: 'newsletter', email: 'reader@example.com', website: '', _return: '/' }))

    expect(response.headers?.location).toBe('https://designingminds.co.za/#newsletter-sent')
  })

  it('redirects an unknown form to the root with a generic failed fragment', async () => {
    const response = await forms(formReq({ form: 'unknown-form', website: '' }))

    expect(response.status).toBe(303)
    expect(response.headers?.location).toBe('/#form-failed')
    expect(mocks.insert).not.toHaveBeenCalled()
  })
})
