/* Request plumbing shared by the Vercel adapter (api/_adapter.ts) and the local
   dev server (src/server.ts), so body limits, parsing and CORS cannot drift
   between production and development. */

export const MAX_BODY_BYTES = 1024 * 1024

export class BodyTooLargeError extends Error {}

/** Reads a request body as UTF-8, rejecting with BodyTooLargeError past `maxBytes`. */
export const readRawBody = async (stream: AsyncIterable<Uint8Array>, maxBytes = MAX_BODY_BYTES): Promise<string> => {
  const chunks: Uint8Array[] = []
  let total = 0
  for await (const chunk of stream) {
    total += chunk.byteLength
    if (total > maxBytes) throw new BodyTooLargeError('Request body is too large.')
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString('utf8')
}

/** urlencoded → flat object (native form posts and PayFast ITNs); otherwise JSON, or undefined when unparseable. */
export const parseBody = (raw: string, contentType = ''): unknown => {
  if (!raw) return undefined
  if (contentType.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(raw))
  }
  try {
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

/** The ALLOWED_ORIGINS list: exact origins, comma-separated. */
export const allowedOrigins = (): string[] =>
  (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)

const LOOPBACK_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/

/**
 * Exact-match CORS allow-list (no wildcard, no credentials). `allowLoopback`
 * additionally admits localhost origins; only the local dev server sets it.
 */
export const corsOrigin = (origin: string | undefined, { allowLoopback = false } = {}): string => {
  if (!origin) return ''
  if (allowedOrigins().includes(origin)) return origin
  if (allowLoopback && LOOPBACK_ORIGIN.test(origin)) return origin
  return ''
}
