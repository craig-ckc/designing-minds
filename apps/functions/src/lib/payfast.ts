import { createHash } from 'node:crypto'

export type PayfastMode = 'sandbox' | 'live'

export const PAYFAST_PROCESS_URLS: Record<PayfastMode, string> = {
  sandbox: 'https://sandbox.payfast.co.za/eng/process',
  live: 'https://www.payfast.co.za/eng/process',
}

export const PAYFAST_VALIDATE_URLS: Record<PayfastMode, string> = {
  sandbox: 'https://sandbox.payfast.co.za/eng/query/validate',
  live: 'https://www.payfast.co.za/eng/query/validate',
}

export const PAYFAST_FIELD_ORDER = [
  'merchant_id',
  'merchant_key',
  'return_url',
  'cancel_url',
  'notify_url',
  'name_first',
  'name_last',
  'email_address',
  'cell_number',
  'm_payment_id',
  'amount',
  'item_name',
  'item_description',
  'custom_int1',
  'custom_int2',
  'custom_int3',
  'custom_int4',
  'custom_int5',
  'custom_str1',
  'custom_str2',
  'custom_str3',
  'custom_str4',
  'custom_str5',
  'email_confirmation',
  'confirmation_address',
  'payment_method',
] as const

export type PayfastFields = Record<string, string | number | boolean | null | undefined>

const encode = (value: string) =>
  encodeURIComponent(value.trim())
    .replace(/%20/g, '+')
    .replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)

export const payfastMode = (): PayfastMode => (process.env.PAYFAST_MODE === 'live' ? 'live' : 'sandbox')

export const signaturePayload = (fields: PayfastFields, passphrase = '', order: readonly string[] = PAYFAST_FIELD_ORDER): string => {
  const pairs: string[] = []
  for (const key of order) {
    const value = fields[key]
    if (value === undefined || value === null || value === '') continue
    pairs.push(`${key}=${encode(String(value))}`)
  }
  if (passphrase) pairs.push(`passphrase=${encode(passphrase)}`)
  return pairs.join('&')
}

export const signPayfastFields = (fields: PayfastFields, order: readonly string[] = PAYFAST_FIELD_ORDER): string => {
  const passphrase = process.env.PAYFAST_PASSPHRASE ?? ''
  return createHash('md5').update(signaturePayload(fields, passphrase, order)).digest('hex')
}

export const verifyPayfastSignature = (fields: PayfastFields): boolean => {
  const received = typeof fields.signature === 'string' ? fields.signature : ''
  if (!received) return false
  const order = Object.keys(fields).filter((key) => key !== 'signature')
  return signPayfastFields(fields, order) === received
}

export const buildPayfastProcess = (fields: PayfastFields) => {
  const signedFields = { ...fields, signature: signPayfastFields(fields) }
  return {
    url: PAYFAST_PROCESS_URLS[payfastMode()],
    fields: signedFields,
  }
}

export const validatePayfastData = async (fields: PayfastFields): Promise<boolean> => {
  const body = new URLSearchParams()
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === '') continue
    body.set(key, String(value))
  }
  const response = await fetch(PAYFAST_VALIDATE_URLS[payfastMode()], {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!response.ok) throw new Error(`PayFast validate endpoint returned ${response.status}.`)
  const text = (await response.text()).trim()
  return text === 'VALID'
}

const ipFromHeaders = (headers: Record<string, string | undefined>) =>
  headers['x-real-ip'] ||
  headers['X-Real-IP'] ||
  (headers['x-forwarded-for'] ?? headers['X-Forwarded-For'] ?? '').split(',').at(0)?.trim() ||
  ''

export const verifyPayfastSourceIp = (headers: Record<string, string | undefined>): boolean => {
  const allowed = (process.env.PAYFAST_ALLOWED_IPS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  if (allowed.length === 0) return payfastMode() === 'sandbox'
  return allowed.includes(ipFromHeaders(headers))
}
