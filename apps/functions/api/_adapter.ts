import type { Handler } from '../src/lib/http.ts'
import { observeHandler } from '../src/lib/diagnostics.ts'

interface VercelRequest extends AsyncIterable<Uint8Array> {
  method?: string
  url?: string
  headers: Record<string, string | undefined>
}

interface VercelResponse {
  setHeader: (key: string, value: string) => void
  status: (code: number) => VercelResponse
  json: (body: unknown) => void
  end: () => void
}

class BodyTooLargeError extends Error {}

const MAX_BODY_BYTES = 1024 * 1024

const readRawBody = async (req: AsyncIterable<Uint8Array>): Promise<string> => {
  const chunks: Uint8Array[] = []
  let total = 0
  for await (const chunk of req) {
    total += chunk.byteLength
    if (total > MAX_BODY_BYTES) throw new BodyTooLargeError('Request body is too large.')
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString('utf8')
}

const parseBody = (raw: string, contentType = ''): unknown => {
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

const corsOrigin = (origin: string | undefined) => {
  const allowed = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
  if (!origin) return ''
  if (allowed.includes(origin)) return origin
  return ''
}

const setCorsHeaders = (req: VercelRequest, res: VercelResponse) => {
  const origin = corsOrigin(req.headers.origin ?? req.headers.Origin)
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type, x-request-id, x-session-id')
  res.setHeader('Access-Control-Expose-Headers', 'x-request-id')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
}

export const handleVercel = async (handler: Handler, req: VercelRequest, res: VercelResponse) => {
  try {
    setCorsHeaders(req, res)
    if (req.method === 'OPTIONS') {
      res.status(204).end()
      return
    }

    const rawBody = await readRawBody(req)
    const headers = req.headers
    const request = {
      method: req.method ?? 'GET',
      headers,
      body: parseBody(rawBody, headers['content-type']),
      rawBody,
    }
    const route = (req.url ?? '/other').split('?')[0]
    const response = route === '/api/diagnostics' ? await handler(request) : await observeHandler(handler, request, route)

    for (const [key, value] of Object.entries(response.headers ?? {})) {
      res.setHeader(key, value)
    }
    res.status(response.status).json(response.body)
  } catch (error) {
    res.status(error instanceof BodyTooLargeError ? 413 : 500).json({ error: error instanceof BodyTooLargeError ? 'Request body is too large.' : 'Unable to process request.' })
  }
}
