import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { PAYFAST_FIELD_ORDER, signPayfastFields, signaturePayload, verifyPayfastSignature } from './payfast.ts'

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
  const original = process.env.PAYFAST_PASSPHRASE

  afterEach(() => {
    if (original === undefined) delete process.env.PAYFAST_PASSPHRASE
    else process.env.PAYFAST_PASSPHRASE = original
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
