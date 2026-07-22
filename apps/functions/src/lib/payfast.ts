import { createHash } from 'node:crypto'
import { promises as dns } from 'node:dns'

export type PayfastMode = 'sandbox' | 'live'

export const PAYFAST_PROCESS_URLS: Record<PayfastMode, string> = {
  sandbox: 'https://sandbox.payfast.co.za/eng/process',
  live: 'https://www.payfast.co.za/eng/process',
}

export const PAYFAST_VALIDATE_URLS: Record<PayfastMode, string> = {
  sandbox: 'https://sandbox.payfast.co.za/eng/query/validate',
  live: 'https://www.payfast.co.za/eng/query/validate',
}

// PayFast's canonical ITN source hosts (see developers.payfast.co.za — "Step 4:
// Confirm payment"). Sandbox callbacks can originate from the same infrastructure
// as live callbacks, so both modes must resolve the complete documented host set.
// PayFast rotates the underlying IPs, so do not pin the current addresses here.
const PAYFAST_SOURCE_HOSTS = ['www.payfast.co.za', 'sandbox.payfast.co.za', 'w1w.payfast.co.za', 'w2w.payfast.co.za'] as const

export const PAYFAST_VALID_HOSTS: Record<PayfastMode, readonly string[]> = {
  sandbox: PAYFAST_SOURCE_HOSTS,
  live: PAYFAST_SOURCE_HOSTS,
}

// Public passphrase-enabled sandbox credentials published by PayFast. The older
// 10000100 account accepts unsigned forms but currently rejects signed forms,
// so it cannot exercise the production-style signed checkout and ITN flow.
export const SANDBOX_MERCHANT_ID = '10004002'
export const SANDBOX_MERCHANT_KEY = 'q1cd2rdny4a53'
export const SANDBOX_PASSPHRASE = 'payfast'

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

// Resolves the merchant credentials for the current mode. In sandbox we fall
// back to PayFast's public test credentials so a fresh checkout works without
// any configuration; in live mode both values must be set explicitly.
export const payfastCredentials = (): { merchantId: string; merchantKey: string } => {
  const merchantId = process.env.PAYFAST_MERCHANT_ID
  const merchantKey = process.env.PAYFAST_MERCHANT_KEY
  if (Boolean(merchantId) !== Boolean(merchantKey)) {
    throw new Error('PAYFAST_MERCHANT_ID and PAYFAST_MERCHANT_KEY must both be set or both be blank.')
  }
  if (merchantId && merchantKey) return { merchantId, merchantKey }
  if (payfastMode() === 'sandbox') return { merchantId: SANDBOX_MERCHANT_ID, merchantKey: SANDBOX_MERCHANT_KEY }
  throw new Error('PAYFAST_MERCHANT_ID and PAYFAST_MERCHANT_KEY must be set.')
}

const payfastPassphrase = (): string => {
  const configured = process.env.PAYFAST_PASSPHRASE
  const usesSandboxFallback =
    payfastMode() === 'sandbox' && !process.env.PAYFAST_MERCHANT_ID && !process.env.PAYFAST_MERCHANT_KEY
  return configured || (usesSandboxFallback ? SANDBOX_PASSPHRASE : '')
}

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
  const passphrase = payfastPassphrase()
  return createHash('md5').update(signaturePayload(fields, passphrase, order)).digest('hex')
}

export const verifyPayfastSignature = (fields: PayfastFields): boolean => {
  const received = typeof fields.signature === 'string' ? fields.signature : ''
  if (!received) return false
  const order = Object.keys(fields).filter((key) => key !== 'signature')
  const pairs: string[] = []
  for (const key of order) {
    const value = fields[key]
    if (value === undefined || value === null) continue
    // PayFast includes present-but-empty ITN fields in its signed payload. This
    // intentionally differs from outbound form signing, which omits empties.
    pairs.push(`${key}=${encode(String(value))}`)
  }
  const passphrase = payfastPassphrase()
  if (passphrase) pairs.push(`passphrase=${encode(passphrase)}`)
  return createHash('md5').update(pairs.join('&')).digest('hex') === received
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

const configuredPayfastIps = (): string[] =>
  (process.env.PAYFAST_ALLOWED_IPS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

// Resolves PayFast's valid ITN source hosts to their current IPv4 addresses,
// mirroring PayFast's reference pfValidIP() (gethostbynamel over the host list).
const resolvePayfastSourceIps = async (mode: PayfastMode): Promise<Set<string>> => {
  const ips = new Set<string>()
  const lookups = await Promise.allSettled(PAYFAST_VALID_HOSTS[mode].map((host) => dns.resolve4(host)))
  for (const lookup of lookups) {
    if (lookup.status === 'fulfilled') for (const ip of lookup.value) ips.add(ip)
  }
  return ips
}

// Confirms the ITN came from PayFast. Sandbox and live resolve the same canonical
// source hosts because PayFast shares callback infrastructure. A manual
// PAYFAST_ALLOWED_IPS override short-circuits DNS (useful for pinning IPs or
// offline tests). A total DNS
// failure throws so the webhook retries rather than permanently dropping a real
// payment; a resolved-but-non-matching IP returns false (rejected as spoofed).
export const verifyPayfastSourceIp = async (headers: Record<string, string | undefined>): Promise<boolean> => {
  const sourceIp = ipFromHeaders(headers)
  if (!sourceIp) return false

  const configured = configuredPayfastIps()
  if (configured.includes(sourceIp)) return true

  const resolved = await resolvePayfastSourceIps(payfastMode())
  if (resolved.size === 0 && configured.length === 0) {
    throw new Error('Could not resolve PayFast source IPs for ITN validation.')
  }
  return resolved.has(sourceIp)
}
