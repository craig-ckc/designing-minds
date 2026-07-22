import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createHash } from 'node:crypto'
import { promises as dns } from 'node:dns'
import {
  PAYFAST_FIELD_ORDER,
  PAYFAST_VALID_HOSTS,
  SANDBOX_MERCHANT_ID,
  SANDBOX_MERCHANT_KEY,
  SANDBOX_PASSPHRASE,
  payfastCredentials,
  signPayfastFields,
  signaturePayload,
  verifyPayfastSignature,
  verifyPayfastSourceIp,
} from '../../apps/functions/src/lib/payfast.ts'

describe('signaturePayload (redirect / documentation order)', () => {
  it('emits fields in documentation order and url-encodes values', () => {
    // Intentionally pass the keys out of order to prove the output is ordered by
    // PAYFAST_FIELD_ORDER, not by object insertion order.
    const payload = signaturePayload({
      item_name: 'Test Item',
      amount: '100.00',
      return_url: 'https://example.com/return',
      merchant_key: '46f0cd694581a',
      merchant_id: '10000100',
    })
    expect(payload).toBe(
      'merchant_id=10000100&merchant_key=46f0cd694581a&return_url=https%3A%2F%2Fexample.com%2Freturn&amount=100.00&item_name=Test+Item',
    )
  })

  it('encodes spaces as + and special characters as uppercase hex', () => {
    expect(signaturePayload({ item_name: 'Designing Minds (PE)' })).toBe('item_name=Designing+Minds+%28PE%29')
  })

  it('skips empty, null and undefined fields', () => {
    expect(signaturePayload({ merchant_id: 'x', merchant_key: '', return_url: undefined, amount: '1.00' })).toBe(
      'merchant_id=x&amount=1.00',
    )
  })

  it('appends an url-encoded passphrase last when provided', () => {
    expect(signaturePayload({ merchant_id: '10000100' }, 'my pass')).toBe('merchant_id=10000100&passphrase=my+pass')
  })

  it('omits the passphrase segment when empty', () => {
    expect(signaturePayload({ merchant_id: '10000100' }, '')).toBe('merchant_id=10000100')
  })
})

describe('signPayfastFields', () => {
  const original = { ...process.env }

  beforeEach(() => {
    process.env.PAYFAST_MODE = 'sandbox'
    process.env.PAYFAST_MERCHANT_ID = 'custom-sandbox-id'
    process.env.PAYFAST_MERCHANT_KEY = 'custom-sandbox-key'
  })

  afterEach(() => {
    if (original.PAYFAST_MODE === undefined) delete process.env.PAYFAST_MODE
    else process.env.PAYFAST_MODE = original.PAYFAST_MODE
    if (original.PAYFAST_MERCHANT_ID === undefined) delete process.env.PAYFAST_MERCHANT_ID
    else process.env.PAYFAST_MERCHANT_ID = original.PAYFAST_MERCHANT_ID
    if (original.PAYFAST_MERCHANT_KEY === undefined) delete process.env.PAYFAST_MERCHANT_KEY
    else process.env.PAYFAST_MERCHANT_KEY = original.PAYFAST_MERCHANT_KEY
    if (original.PAYFAST_PASSPHRASE === undefined) delete process.env.PAYFAST_PASSPHRASE
    else process.env.PAYFAST_PASSPHRASE = original.PAYFAST_PASSPHRASE
  })

  it('is the MD5 of the signature payload', () => {
    delete process.env.PAYFAST_PASSPHRASE
    const fields = { merchant_id: '10000100', amount: '100.00', item_name: 'Test Item' }
    const expected = createHash('md5').update(signaturePayload(fields, '', PAYFAST_FIELD_ORDER)).digest('hex')
    expect(signPayfastFields(fields)).toBe(expected)
  })

  it('changes when the passphrase changes', () => {
    const fields = { merchant_id: '10000100', amount: '100.00' }
    delete process.env.PAYFAST_PASSPHRASE
    const withoutPass = signPayfastFields(fields)
    process.env.PAYFAST_PASSPHRASE = 'secret'
    expect(signPayfastFields(fields)).not.toBe(withoutPass)
  })
})

describe('verifyPayfastSignature (ITN / received order)', () => {
  const original = process.env.PAYFAST_PASSPHRASE

  beforeEach(() => {
    process.env.PAYFAST_PASSPHRASE = 'itn-secret'
  })
  afterEach(() => {
    if (original === undefined) delete process.env.PAYFAST_PASSPHRASE
    else process.env.PAYFAST_PASSPHRASE = original
  })

  const itnFields = () => ({
    m_payment_id: 'pay-123',
    pf_payment_id: '987654',
    payment_status: 'COMPLETE',
    amount_gross: '100.00',
  })

  it('accepts a signature computed over the received field order', () => {
    const fields = itnFields()
    const signature = signPayfastFields(fields, Object.keys(fields))
    expect(verifyPayfastSignature({ ...fields, signature })).toBe(true)
  })

  it('includes present-but-empty fields when verifying a PayFast ITN', () => {
    const fields = {
      m_payment_id: 'pay-123',
      pf_payment_id: '987654',
      payment_status: 'COMPLETE',
      custom_str1: '',
      custom_int1: '',
      name_first: 'Test',
      name_last: '',
      amount_gross: '100.00',
    }
    const signedPayload =
      'm_payment_id=pay-123&pf_payment_id=987654&payment_status=COMPLETE&custom_str1=&custom_int1=&name_first=Test&name_last=&amount_gross=100.00&passphrase=itn-secret'
    const signature = createHash('md5').update(signedPayload).digest('hex')

    expect(verifyPayfastSignature({ ...fields, signature })).toBe(true)
  })

  it('rejects a tampered amount', () => {
    const fields = itnFields()
    const signature = signPayfastFields(fields, Object.keys(fields))
    expect(verifyPayfastSignature({ ...fields, amount_gross: '0.01', signature })).toBe(false)
  })

  it('rejects when the passphrase differs', () => {
    const fields = itnFields()
    const signature = signPayfastFields(fields, Object.keys(fields))
    process.env.PAYFAST_PASSPHRASE = 'wrong-secret'
    expect(verifyPayfastSignature({ ...fields, signature })).toBe(false)
  })

  it('rejects a missing signature', () => {
    expect(verifyPayfastSignature(itnFields())).toBe(false)
  })
})

describe('payfastCredentials', () => {
  const original = { ...process.env }

  afterEach(() => {
    for (const key of ['PAYFAST_MODE', 'PAYFAST_MERCHANT_ID', 'PAYFAST_MERCHANT_KEY', 'PAYFAST_PASSPHRASE'] as const) {
      if (original[key] === undefined) delete process.env[key]
      else process.env[key] = original[key]
    }
  })

  it('returns the configured credentials when both are set', () => {
    process.env.PAYFAST_MERCHANT_ID = 'my-id'
    process.env.PAYFAST_MERCHANT_KEY = 'my-key'
    expect(payfastCredentials()).toEqual({ merchantId: 'my-id', merchantKey: 'my-key' })
  })

  it('falls back to the PayFast sandbox test account when unset in sandbox mode', () => {
    process.env.PAYFAST_MODE = 'sandbox'
    delete process.env.PAYFAST_MERCHANT_ID
    delete process.env.PAYFAST_MERCHANT_KEY
    delete process.env.PAYFAST_PASSPHRASE
    expect(payfastCredentials()).toEqual({ merchantId: SANDBOX_MERCHANT_ID, merchantKey: SANDBOX_MERCHANT_KEY })
    expect(signPayfastFields({ merchant_id: SANDBOX_MERCHANT_ID })).toBe(
      createHash('md5')
        .update(`merchant_id=${SANDBOX_MERCHANT_ID}&passphrase=${SANDBOX_PASSPHRASE}`)
        .digest('hex'),
    )
  })

  it('rejects partially configured merchant credentials instead of silently mixing accounts', () => {
    process.env.PAYFAST_MODE = 'sandbox'
    process.env.PAYFAST_MERCHANT_ID = 'merchant-only'
    delete process.env.PAYFAST_MERCHANT_KEY
    expect(() => payfastCredentials()).toThrow(/both be set or both be blank/)
  })

  it('throws in live mode when credentials are missing', () => {
    process.env.PAYFAST_MODE = 'live'
    delete process.env.PAYFAST_MERCHANT_ID
    delete process.env.PAYFAST_MERCHANT_KEY
    expect(() => payfastCredentials()).toThrow(/PAYFAST_MERCHANT_ID/)
  })
})

describe('verifyPayfastSourceIp', () => {
  const original = { ...process.env }

  afterEach(() => {
    for (const key of ['PAYFAST_ALLOWED_IPS', 'PAYFAST_MODE'] as const) {
      if (original[key] === undefined) delete process.env[key]
      else process.env[key] = original[key]
    }
    vi.restoreAllMocks()
  })

  it('rejects a request with no source IP header', async () => {
    expect(await verifyPayfastSourceIp({})).toBe(false)
  })

  it('accepts a source IP in the configured allowlist without a DNS lookup', async () => {
    process.env.PAYFAST_ALLOWED_IPS = '41.74.179.194, 197.97.145.144'
    expect(await verifyPayfastSourceIp({ 'x-forwarded-for': '197.97.145.144' })).toBe(true)
    expect(await verifyPayfastSourceIp({ 'x-real-ip': '41.74.179.194' })).toBe(true)
  })

  it('accepts a sandbox callback resolved from PayFast shared ITN infrastructure', async () => {
    process.env.PAYFAST_MODE = 'sandbox'
    delete process.env.PAYFAST_ALLOWED_IPS
    expect(PAYFAST_VALID_HOSTS.sandbox).toContain('w1w.payfast.co.za')
    vi.spyOn(dns, 'resolve4').mockImplementation(async (hostname) =>
      hostname === 'w1w.payfast.co.za' ? ['144.126.193.139'] : [],
    )

    expect(await verifyPayfastSourceIp({ 'x-forwarded-for': '144.126.193.139' })).toBe(true)
  })
})
