import { createServer } from 'node:http'
import { handlers } from './index.ts'
import { notFound, type HandlerRequest } from './lib/http.ts'

/**
 * Minimal local dev server for the shared handlers. In production each handler
 * deploys through the Vercel API adapter; this lets you exercise the same
 * logic locally with `npm run dev`.
 */
const PORT = Number(process.env.PORT ?? 8787)

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

const readRawBody = async (stream: AsyncIterable<Uint8Array>): Promise<string> => {
  const chunks: Uint8Array[] = []
  for await (const chunk of stream) chunks.push(chunk)
  return Buffer.concat(chunks).toString('utf8')
}

const corsOrigin = (origin: string | undefined) => {
  const allowed = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
  if (!origin) return ''
  if (allowed.includes(origin)) return origin
  if (/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin)) return origin
  return ''
}

const corsHeaders = (origin: string | undefined) => {
  const allowedOrigin = corsOrigin(origin)
  return {
    ...(allowedOrigin ? { 'access-control-allow-origin': allowedOrigin } : {}),
    vary: 'Origin',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'authorization, content-type',
  }
}

const server = createServer(async (req, res) => {
  const headers = corsHeaders(req.headers.origin)
  if (req.method === 'OPTIONS') {
    res.writeHead(204, headers)
    res.end()
    return
  }

  const path = (req.url ?? '').split('?')[0]
  const handler = handlers[path]
  const rawBody = await readRawBody(req)
  const request: HandlerRequest = {
    method: req.method ?? 'GET',
    body: parseBody(rawBody, req.headers['content-type']),
    rawBody,
    headers: req.headers as Record<string, string | undefined>,
  }

  const response = handler ? await handler(request) : notFound(`No handler for ${path}`)
  res.writeHead(response.status, { 'content-type': 'application/json', ...headers, ...response.headers })
  res.end(JSON.stringify(response.body))
})

server.listen(PORT, () => {
  console.log(`Functions dev server on http://localhost:${PORT}`)
  console.log('Routes:', Object.keys(handlers).join(', '))
})
