import { createHash } from 'node:crypto'
import { promises as dns } from 'node:dns'
import { isIP } from 'node:net'
import { fetchWithTimeout, withTimeout } from './fetch-timeout.ts'
import { signedKeys } from './itn-fields.ts'

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

interface EncodeOptions {
  trim?: boolean
  // PHP's urlencode() (which PayFast's servers use) also escapes "~", which
  // encodeURIComponent leaves alone.
  phpTilde?: boolean
}

// Mirrors PHP urlencode(): spaces become "+" and !'()* are percent-encoded.
const encodeValue = (value: string, { trim = true, phpTilde = false }: EncodeOptions = {}) => {
  let encoded = encodeURIComponent(trim ? value.trim() : value)
    .replace(/%20/g, '+')
    .replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
  if (phpTilde) encoded = encoded.replace(/~/g, '%7E')
  return encoded
}

const encode = (value: string) => encodeValue(value)

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

export type PayfastPassphraseSource = 'configured' | 'sandbox-fallback' | 'none'

const resolvePayfastPassphrase = (): { passphrase: string; source: PayfastPassphraseSource } => {
  const configured = process.env.PAYFAST_PASSPHRASE
  if (configured) return { passphrase: configured, source: 'configured' }
  const usesSandboxFallback =
    payfastMode() === 'sandbox' && !process.env.PAYFAST_MERCHANT_ID && !process.env.PAYFAST_MERCHANT_KEY
  if (usesSandboxFallback) return { passphrase: SANDBOX_PASSPHRASE, source: 'sandbox-fallback' }
  return { passphrase: '', source: 'none' }
}

const payfastPassphrase = (): string => resolvePayfastPassphrase().passphrase

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

// Canonicalisations of an ITN payload. "received-order" is PayFast's reference
// algorithm (docs sample and official PHP SDK): every posted field *up to* the
// signature, in the order received, PHP-urlencoded, then the passphrase.
// Anything PayFast posts after the signature is not part of what it signed —
// the reference code breaks out of its loop at "signature" — so it is ignored.
// The other variants differ in one detail each so that a mismatch can be
// attributed precisely from the logs.
export type PayfastSignatureVariant =
  | 'received-order'
  | 'exclude-empty'
  | 'no-trim'
  | 'php-tilde'
  | 'exclude-empty-no-trim'
  | 'no-passphrase'

interface VariantSpec {
  skipEmpty?: boolean
  trim?: boolean
  phpTilde?: boolean
  passphrase?: boolean
}

const VARIANTS: Record<PayfastSignatureVariant, VariantSpec> = {
  'received-order': {},
  'exclude-empty': { skipEmpty: true },
  'no-trim': { trim: false },
  'php-tilde': { phpTilde: true },
  'exclude-empty-no-trim': { skipEmpty: true, trim: false },
  'no-passphrase': { passphrase: false },
}

// A signature that omits the passphrase can be forged by anyone who saw the
// fields, so it is reported for diagnosis but never accepted.
const ACCEPTED_VARIANTS: readonly PayfastSignatureVariant[] = [
  'received-order',
  'exclude-empty',
  'no-trim',
  'php-tilde',
  'exclude-empty-no-trim',
]

const itnSignature = (fields: PayfastFields, passphrase: string, spec: VariantSpec): string => {
  const pairs: string[] = []
  for (const key of signedKeys(fields)) {
    const value = fields[key]
    if (value === undefined || value === null) continue
    // PayFast includes present-but-empty ITN fields in its signed payload. This
    // intentionally differs from outbound form signing, which omits empties.
    if (spec.skipEmpty && String(value) === '') continue
    pairs.push(`${key}=${encodeValue(String(value), { trim: spec.trim ?? true, phpTilde: spec.phpTilde ?? false })}`)
  }
  if (passphrase && spec.passphrase !== false) pairs.push(`passphrase=${encodeValue(passphrase)}`)
  return createHash('md5').update(pairs.join('&')).digest('hex')
}

export interface PayfastSignatureCheck {
  accepted: boolean
  /** Signature PayFast sent ("" when absent). */
  received: string
  /** What PayFast's documented algorithm yields for these fields. */
  expected: string
  /** Which canonicalisation reproduced the received signature, if any. */
  matchedVariant: PayfastSignatureVariant | null
  passphraseSource: PayfastPassphraseSource
  passphraseLength: number
  /** Field names PayFast signed: those received before the signature, in order. */
  keys: string[]
  /** Field names received after the signature; posted but not signed. */
  trailingKeys: string[]
}

// Verifies an ITN signature and explains the outcome, so a rejected ITN can be
// diagnosed from the logs without logging the shopper's details.
export const explainPayfastSignature = (fields: PayfastFields): PayfastSignatureCheck => {
  const received = typeof fields.signature === 'string' ? fields.signature.trim().toLowerCase() : ''
  const { passphrase, source } = resolvePayfastPassphrase()
  const keys = signedKeys(fields)
  const trailingKeys = Object.keys(fields).slice(keys.length + 1)
  const expected = itnSignature(fields, passphrase, VARIANTS['received-order'])
  let matchedVariant: PayfastSignatureVariant | null = null
  if (received) {
    for (const variant of Object.keys(VARIANTS) as PayfastSignatureVariant[]) {
      if (itnSignature(fields, passphrase, VARIANTS[variant]) === received) {
        matchedVariant = variant
        break
      }
    }
  }
  const accepted = matchedVariant !== null && ACCEPTED_VARIANTS.includes(matchedVariant)
  return { accepted, received, expected, matchedVariant, passphraseSource: source, passphraseLength: passphrase.length, keys, trailingKeys }
}

export const verifyPayfastSignature = (fields: PayfastFields): boolean => explainPayfastSignature(fields).accepted

export const buildPayfastProcess = (fields: PayfastFields) => {
  const signedFields = { ...fields, signature: signPayfastFields(fields) }
  return {
    url: PAYFAST_PROCESS_URLS[payfastMode()],
    fields: signedFields,
  }
}

/** PayFast's validate call sits on the ITN critical path, so it gets a hard limit. */
export const PAYFAST_VALIDATE_TIMEOUT_MS = 8_000

export const validatePayfastData = async (fields: PayfastFields, timeoutMs = PAYFAST_VALIDATE_TIMEOUT_MS): Promise<boolean> => {
  const body = new URLSearchParams()
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === '') continue
    body.set(key, String(value))
  }
  const response = await fetchWithTimeout(
    PAYFAST_VALIDATE_URLS[payfastMode()],
    { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body },
    timeoutMs,
  )
  if (!response.ok) throw new Error(`PayFast validate endpoint returned ${response.status}.`)
  const text = (await response.text()).trim()
  return text === 'VALID'
}

/*
 * Which forwarding header is trusted.
 *
 * On Vercel the platform OVERWRITES `x-real-ip` and `x-forwarded-for` with the
 * address it saw connecting, discarding anything the caller sent, so the values
 * below cannot be forged by an ITN sender. `x-real-ip` is read first, then the
 * first `x-forwarded-for` entry. Outside Vercel (the local dev server, another
 * host) these headers are caller-controlled: only run this handler behind a
 * proxy that overwrites them, and keep PAYFAST_ALLOWED_IPS empty in dev.
 */
const ipFromHeaders = (headers: Record<string, string | undefined>) =>
  headers['x-real-ip'] ||
  headers['X-Real-IP'] ||
  (headers['x-forwarded-for'] ?? headers['X-Forwarded-For'] ?? '').split(',').at(0)?.trim() ||
  ''

/**
 * Canonical text for an address so equal addresses compare equal: IPv4 as is,
 * IPv4-mapped IPv6 (`::ffff:1.2.3.4`) as the IPv4 address, other IPv6 in its
 * compressed lower-case form, brackets removed.
 */
export const normaliseIp = (value: string): string => {
  let ip = value.trim()
  if (ip.startsWith('[') && ip.endsWith(']')) ip = ip.slice(1, -1)
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(ip)
  if (mapped?.[1]) return mapped[1]
  if (isIP(ip) === 6) {
    try {
      return new URL(`http://[${ip}]`).hostname.slice(1, -1)
    } catch {
      return ip.toLowerCase()
    }
  }
  return ip
}

const configuredPayfastIps = (): string[] =>
  (process.env.PAYFAST_ALLOWED_IPS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

const DNS_TIMEOUT_MS = 4_000
const SOURCE_IP_TTL_MS = 60_000
const sourceIpCache = new Map<PayfastMode, { expiresAt: number; ips: Set<string> }>()

// Resolves PayFast's valid ITN source hosts to their current IPv4 AND IPv6
// addresses (PayFast's reference pfValidIP() is IPv4-only; an IPv6 callback
// would otherwise be rejected for good). Each lookup is time-limited.
const resolvePayfastSourceIps = async (mode: PayfastMode): Promise<Set<string>> => {
  const ips = new Set<string>()
  const lookups = await Promise.allSettled(
    PAYFAST_VALID_HOSTS[mode].flatMap((host) => [
      withTimeout(dns.resolve4(host), DNS_TIMEOUT_MS, `DNS A lookup for ${host}`),
      withTimeout(dns.resolve6(host), DNS_TIMEOUT_MS, `DNS AAAA lookup for ${host}`),
    ]),
  )
  for (const lookup of lookups) {
    if (lookup.status === 'fulfilled') for (const ip of lookup.value) ips.add(normaliseIp(ip))
  }
  return ips
}

// Confirms the ITN came from PayFast. Sandbox and live resolve the same canonical
// source hosts because PayFast shares callback infrastructure. A manual
// PAYFAST_ALLOWED_IPS override short-circuits DNS (useful for pinning IPs or
// offline tests). A total DNS failure throws so the webhook retries rather than
// permanently dropping a real payment; a resolved-but-non-matching IP returns
// false (rejected as spoofed).
//
// Resolved addresses are cached for 60 s, but only to ACCEPT faster: an address
// missing from the cache triggers a fresh lookup, so a PayFast IP rotation is
// never rejected because of a stale entry.
export const verifyPayfastSourceIp = async (headers: Record<string, string | undefined>): Promise<boolean> => {
  const rawIp = ipFromHeaders(headers)
  if (!rawIp) return false
  const sourceIp = normaliseIp(rawIp)

  const configured = configuredPayfastIps()
  if (configured.includes(rawIp) || configured.some((entry) => normaliseIp(entry) === sourceIp)) return true

  const mode = payfastMode()
  const cached = sourceIpCache.get(mode)
  if (cached && cached.expiresAt > Date.now() && cached.ips.has(sourceIp)) return true

  const resolved = await resolvePayfastSourceIps(mode)
  if (resolved.size === 0 && configured.length === 0) {
    throw new Error('Could not resolve PayFast source IPs for ITN validation.')
  }
  if (resolved.size > 0) sourceIpCache.set(mode, { expiresAt: Date.now() + SOURCE_IP_TTL_MS, ips: resolved })
  return resolved.has(sourceIp)
}
