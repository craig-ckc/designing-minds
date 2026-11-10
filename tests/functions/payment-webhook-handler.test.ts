import { createHash } from 'node:crypto'
import { promises as dns } from 'node:dns'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/* The PayFast ITN endpoint at the HTTP-handler level. Unlike
   payment-webhook-completion.test.ts (which stubs the whole payfast module),
   the REAL signature, source-IP and validate code runs here; only the network
   edges are faked: DNS, the PayFast validate call, and Supabase. Every
   rejection reason is exercised through the handler, and a genuine
   sandbox-shaped ITN must still be accepted. */

const PASSPHRASE = 'itn-test-passphrase'
const PAYMENT_ID = '22345678-1234-4234-8234-123456789012'
const ORDER_ID = '12345678-1234-4234-8234-123456789012'
const PAYFAST_IP = '41.74.179.194'

const db = vi.hoisted(() => ({
  payment: undefined as Record<string, unknown> | undefined,
  rpcCalls: [] as { name: string; args: Record<string, unknown> }[],
  updates: [] as unknown[],
  completions: 0,
}))
vi.mock('../../apps/functions/src/lib/diagnostics.ts', () => ({ logEvent: vi.fn() }))
vi.mock('../../apps/functions/src/lib/supabase.ts', () => ({
  createServiceClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: db.payment, error: db.payment ? null : { message: 'no rows' } }) }) }),
      update: (patch: unknown) => {
        db.updates.push(patch)
        const chain = { eq: () => chain, is: () => chain, select: () => chain, maybeSingle: async () => ({ data: { id: PAYMENT_ID }, error: null }), then: (resolve: (v: unknown) => unknown) => resolve({ error: null }) }
        return chain
      },
    }),
    rpc: async (name: string, args: Record<string, unknown>) => {
      db.rpcCalls.push({ name, args })
      // The real function is idempotent on the PayFast transaction id.
      db.completions += 1
      return { data: db.completions === 1 ? 'processed' : 'duplicate', error: null }
    },
  }),
}))

const { paymentWebhook } = await import('../../apps/functions/src/handlers/payment-webhook.ts')
const { parseBody } = await import('../../apps/functions/src/lib/request.ts')

// PHP urlencode(), written independently of the code under test.
const phpEncode = (value: string) =>
  encodeURIComponent(value.trim()).replace(/%20/g, '+').replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)

const sign = (pairs: [string, string][], passphrase = PASSPHRASE) =>
  createHash('md5')
    .update([...pairs.map(([k, v]) => `${k}=${phpEncode(v)}`), `passphrase=${phpEncode(passphrase)}`].join('&'))
    .digest('hex')

/** What PayFast posts for a sandbox card payment: fixed order, empties present, signature last. */
const genuineItn = (overrides: Record<string, string> = {}): [string, string][] => {
  const base: Record<string, string> = {
    m_payment_id: PAYMENT_ID,
    pf_payment_id: '1089250',
    payment_status: 'COMPLETE',
    item_name: 'Designing Minds DM-20261110-ABCD1234',
    item_description: '3 digital resources',
    amount_gross: '100.00',
    amount_fee: '-2.30',
    amount_net: '97.70',
    custom_str1: '',
    custom_str2: '',
    custom_str3: '',
    custom_str4: '',
    custom_str5: '',
    custom_int1: '',
    custom_int2: '',
    custom_int3: '',
    custom_int4: '',
    custom_int5: '',
    name_first: 'Test',
    name_last: '',
    email_address: 'sbtu01@payfast.io',
    merchant_id: '10004002',
    token: '',
    billing_date: '',
    ...overrides,
  }
  return Object.entries(base)
}

/** Serialises like PayFast (urlencoded, signature last) and parses like the adapter does. */
const post = (pairs: [string, string][], { signature, ip = PAYFAST_IP }: { signature?: string; ip?: string | null } = {}) => {
  const all: [string, string][] = [...pairs, ['signature', signature ?? sign(pairs)]]
  const rawBody = all.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
  const headers: Record<string, string> = { 'content-type': 'application/x-www-form-urlencoded' }
  if (ip) headers['x-forwarded-for'] = ip
  return paymentWebhook({ method: 'POST', headers, rawBody, body: parseBody(rawBody, headers['content-type']) })
}

const stubValidate = (text = 'VALID', status = 200) => {
  const fetchMock = vi.fn(async () => new Response(text, { status }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

beforeEach(() => {
  vi.stubEnv('PAYFAST_MODE', 'sandbox')
  vi.stubEnv('PAYFAST_PASSPHRASE', PASSPHRASE)
  vi.stubEnv('PAYFAST_ALLOWED_IPS', PAYFAST_IP)
  db.payment = { id: PAYMENT_ID, orderId: ORDER_ID, amountZar: '100.00', status: 'pending', processedAt: null }
  db.rpcCalls = []
  db.updates = []
  db.completions = 0
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('POST /api/payment-webhook', () => {
  it('accepts a genuine sandbox-shaped COMPLETE ITN and completes the payment exactly once', async () => {
    const validate = stubValidate()
    const response = await post(genuineItn())

    expect(response).toEqual({ status: 200, body: { received: true, processed: true } })
    expect(validate).toHaveBeenCalledTimes(1)
    expect(db.rpcCalls).toEqual([
      { name: 'complete_payfast_payment', args: { p_payment_id: PAYMENT_ID, p_pf_payment_id: '1089250', p_amount_zar: '100.00' } },
    ])
    // Completion is one RPC; the handler never writes order/payment rows itself.
    expect(db.updates).toEqual([])
  })

  it('posts the signed fields (signature last) to the PayFast validate endpoint', async () => {
    const validate = stubValidate()
    await post(genuineItn())
    const calls = validate.mock.calls as unknown as [string, RequestInit][]
    expect(calls[0]?.[0]).toBe('https://sandbox.payfast.co.za/eng/query/validate')
    const body = calls[0]?.[1].body as URLSearchParams
    expect(body.get('m_payment_id')).toBe(PAYMENT_ID)
    expect(body.get('signature')).toBeTruthy()
    // Empty ITN fields are not re-posted (unchanged behaviour).
    expect(body.has('custom_str1')).toBe(false)
  })

  it('treats a repeated ITN as a harmless duplicate: still 200, completed only once', async () => {
    stubValidate()
    const itn = genuineItn()
    const first = await post(itn)
    const second = await post(itn)

    expect(first.body).toEqual({ received: true, processed: true })
    expect(second).toEqual({ status: 200, body: { received: true, duplicate: true } })
    // Both deliveries reach the idempotent database function; it, not the
    // handler, decides, so a retry can never double-complete.
    expect(db.rpcCalls.map((call) => call.name)).toEqual(['complete_payfast_payment', 'complete_payfast_payment'])
  })

  describe('rejections (answered 200 so PayFast stops retrying, and nothing is completed)', () => {
    const rejected = (response: { status: number; body: unknown }) => {
      expect(response).toEqual({ status: 200, body: { received: true, processed: false } })
      expect(db.rpcCalls).toEqual([])
    }

    it('rejects a bad signature before any network call or database read', async () => {
      const validate = stubValidate()
      db.payment = undefined // a lookup would throw → 503, so a clean 200 proves none happened
      rejected(await post(genuineItn(), { signature: '0'.repeat(32) }))
      expect(validate).not.toHaveBeenCalled()
    })

    it('rejects an ITN signed without the passphrase', async () => {
      stubValidate()
      const pairs = genuineItn()
      const noPassphrase = createHash('md5').update(pairs.map(([k, v]) => `${k}=${phpEncode(v)}`).join('&')).digest('hex')
      rejected(await post(pairs, { signature: noPassphrase }))
    })

    it('rejects a tampered amount (signature no longer matches)', async () => {
      stubValidate()
      const pairs = genuineItn()
      const signature = sign(pairs)
      rejected(await post(genuineItn({ amount_gross: '1.00' }), { signature }))
    })

    it('rejects a correctly signed ITN from an untrusted source address', async () => {
      vi.stubEnv('PAYFAST_ALLOWED_IPS', '')
      vi.spyOn(dns, 'resolve4').mockResolvedValue(['196.33.227.224'])
      vi.spyOn(dns, 'resolve6').mockRejectedValue(Object.assign(new Error('ENODATA'), { code: 'ENODATA' }))
      const validate = stubValidate()
      rejected(await post(genuineItn(), { ip: '203.0.113.50' }))
      expect(validate).not.toHaveBeenCalled()
    })

    it('rejects an ITN that carries no source address at all', async () => {
      stubValidate()
      rejected(await post(genuineItn(), { ip: null }))
    })

    it('rejects an amount that differs from the stored payment, without asking PayFast', async () => {
      db.payment = { id: PAYMENT_ID, orderId: ORDER_ID, amountZar: '250.00', status: 'pending', processedAt: null }
      const validate = stubValidate()
      rejected(await post(genuineItn()))
      expect(validate).not.toHaveBeenCalled()
    })

    it('rejects an ITN the PayFast validate endpoint does not confirm', async () => {
      stubValidate('INVALID')
      rejected(await post(genuineItn()))
    })

    it('does not complete a payment for a non-COMPLETE status', async () => {
      stubValidate()
      const pairs = genuineItn({ payment_status: 'PENDING' })
      rejected(await post(pairs))
    })

    it('marks a still-pending payment failed on a FAILED ITN, and never completes it', async () => {
      stubValidate()
      rejected(await post(genuineItn({ payment_status: 'FAILED' })))
      expect(db.updates).toEqual([{ status: 'failed' }, { status: 'failed' }])
    })
  })

  describe('retryable failures (503 so PayFast retries)', () => {
    it('asks PayFast to retry when its validate endpoint errors', async () => {
      stubValidate('oops', 500)
      const response = await post(genuineItn())
      expect(response.status).toBe(503)
      expect(db.rpcCalls).toEqual([])
    })

    it('asks PayFast to retry when the payment row cannot be read', async () => {
      stubValidate()
      db.payment = undefined
      expect((await post(genuineItn())).status).toBe(503)
    })

    it('asks PayFast to retry when its validate endpoint hangs, instead of holding the function open', async () => {
      vi.stubGlobal('fetch', (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => init.signal?.addEventListener('abort', () => reject(init.signal?.reason))),
      )
      // validatePayfastData has a fixed 8s ceiling; shorten the clock rather than waiting it out.
      const timeout = AbortSignal.timeout.bind(AbortSignal)
      vi.spyOn(AbortSignal, 'timeout').mockImplementation(() => timeout(20))
      const response = await post(genuineItn())
      expect(response.status).toBe(503)
    })
  })

  describe('unsigned trailing fields (BS-27)', () => {
    it('fails closed when a duplicated key tries to override a signed value', async () => {
      stubValidate()
      const pairs = genuineItn()
      const rawBody = [...pairs, ['signature', sign(pairs)], ['amount_gross', '1.00'], ['m_payment_id', 'other-payment']]
        .map(([k, v]) => `${encodeURIComponent(k as string)}=${encodeURIComponent(v as string)}`)
        .join('&')
      const response = await paymentWebhook({
        method: 'POST',
        headers: { 'x-forwarded-for': PAYFAST_IP, 'content-type': 'application/x-www-form-urlencoded' },
        rawBody,
        body: parseBody(rawBody, 'application/x-www-form-urlencoded'),
      })
      // Object.fromEntries folds the duplicate keys into their EARLIER position
      // with the later value, so the signed values change and the signature
      // check fails closed.
      expect(response).toEqual({ status: 200, body: { received: true, processed: false } })
      expect(db.rpcCalls).toEqual([])
    })

    it('does not read genuinely new trailing fields', async () => {
      const validate = stubValidate()
      const pairs = genuineItn()
      const fields = Object.fromEntries([...pairs, ['signature', sign(pairs)], ['payment_method', 'cc'], ['extra', 'x']])
      const response = await paymentWebhook({ method: 'POST', headers: { 'x-forwarded-for': PAYFAST_IP }, body: fields })
      expect(response.body).toEqual({ received: true, processed: true })
      const body = (validate.mock.calls as unknown as [string, RequestInit][])[0]?.[1].body as URLSearchParams
      expect(body.has('extra')).toBe(false)
      expect(body.has('payment_method')).toBe(false)
    })
  })

  it('does nothing for a non-POST request', async () => {
    expect(await paymentWebhook({ method: 'GET', headers: {}, body: undefined })).toEqual({ status: 200, body: { received: true } })
  })

  it('never writes the expected signature or the passphrase length to the logs (BS-13)', async () => {
    stubValidate()
    const pairs = genuineItn()
    const expected = sign(pairs)
    await post(pairs, { signature: '1'.repeat(32) })
    const logged = (console.error as unknown as ReturnType<typeof vi.fn>).mock.calls.flat().join(' ')
    expect(logged).toContain('signature mismatch')
    expect(logged).not.toContain(expected)
    expect(logged).toContain(expected.slice(0, 6))
    expect(logged).not.toContain('passphraseLength')
    expect(logged).not.toContain(PASSPHRASE)
  })
})
