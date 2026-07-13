import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the Resend SDK so no network call is made; capture what we'd send.
const sendMock = vi.hoisted(() => vi.fn())
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock }
  },
}))

import { sendSubscriptionConfirmation } from '../../apps/functions/src/lib/email.ts'

describe('sendSubscriptionConfirmation', () => {
  const original = { ...process.env }

  beforeEach(() => {
    sendMock.mockReset()
    process.env.RESEND_API_KEY = 're_test_key'
    process.env.RESEND_FROM = 'Designing Minds <noreply@designingminds.co.za>'
  })

  afterEach(() => {
    process.env.RESEND_API_KEY = original.RESEND_API_KEY
    process.env.RESEND_FROM = original.RESEND_FROM
  })

  it('skips (returns false, no send) when Resend is not configured', async () => {
    delete process.env.RESEND_API_KEY
    await expect(sendSubscriptionConfirmation({ to: 'a@b.com' })).resolves.toBe(false)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('sends a branded confirmation to the subscriber and greets them by first name', async () => {
    sendMock.mockResolvedValue({ error: null })

    await expect(sendSubscriptionConfirmation({ to: 'jane@b.com', firstName: 'Jane' })).resolves.toBe(true)

    expect(sendMock).toHaveBeenCalledTimes(1)
    const message = sendMock.mock.calls[0][0]
    expect(message.to).toBe('jane@b.com')
    expect(message.from).toBe('Designing Minds <noreply@designingminds.co.za>')
    expect(message.subject).toMatch(/subscribed/i)
    expect(message.html).toContain('Hi Jane,')
    expect(message.html).toContain('Designing Minds')
  })

  it('falls back to a generic greeting when no first name is given', async () => {
    sendMock.mockResolvedValue({ error: null })
    await sendSubscriptionConfirmation({ to: 'a@b.com' })
    expect(sendMock.mock.calls[0][0].html).toContain('Hi there,')
  })

  it('throws when Resend returns an error', async () => {
    sendMock.mockResolvedValue({ error: { message: 'Invalid recipient' } })
    await expect(sendSubscriptionConfirmation({ to: 'a@b.com' })).rejects.toThrow(/Invalid recipient/)
  })
})
