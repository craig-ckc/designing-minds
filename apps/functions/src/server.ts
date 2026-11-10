import { createServer } from 'node:http'
import { observeHandler } from './lib/diagnostics.ts'
import { handlers } from './index.ts'
import { notFound, type HandlerRequest } from './lib/http.ts'
import { BodyTooLargeError, corsOrigin, parseBody, readRawBody } from './lib/request.ts'

/**
 * Minimal local dev server for the shared handlers. In production each handler
 * deploys through the Vercel API adapter; this lets you exercise the same
 * logic locally with `npm run dev`.
 */
const PORT = Number(process.env.PORT ?? 8787)
// Loopback only by default: this server runs with real service keys, so it must
// not be reachable from the network. Set HOST=0.0.0.0 deliberately to expose it.
const HOST = process.env.HOST ?? '127.0.0.1'

const corsHeaders = (origin: string | undefined) => {
  const allowedOrigin = corsOrigin(origin, { allowLoopback: true })
  return {
    ...(allowedOrigin ? { 'access-control-allow-origin': allowedOrigin } : {}),
    vary: 'Origin',
    'access-control-expose-headers': 'x-request-id',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'authorization, content-type, x-request-id, x-session-id',
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
  let rawBody: string
  try {
    rawBody = await readRawBody(req)
  } catch (error) {
    const tooLarge = error instanceof BodyTooLargeError
    res.writeHead(tooLarge ? 413 : 400, { 'content-type': 'application/json', ...headers })
    res.end(JSON.stringify({ error: tooLarge ? 'Request body is too large.' : 'Unable to read the request.' }))
    return
  }
  const request: HandlerRequest = {
    method: req.method ?? 'GET',
    body: parseBody(rawBody, req.headers['content-type']),
    rawBody,
    headers: req.headers as Record<string, string | undefined>,
  }

  const response = handler ? (path === '/diagnostics' ? await handler(request) : await observeHandler(handler, request, `/api${path}`)) : notFound(`No handler for ${path}`)
  res.writeHead(response.status, { 'content-type': 'application/json', ...headers, ...response.headers })
  res.end(JSON.stringify(response.body))
})

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use — another functions server is probably running.`)
    console.error(`Stop it with: lsof -ti tcp:${PORT} | xargs kill   (or set PORT to a free port)`)
    process.exit(1)
  }
  throw error
})

// Close the listener on exit so `node --watch` restarts (and Ctrl-C) release the
// port before the next process binds it, instead of racing into EADDRINUSE.
for (const signal of ['SIGTERM', 'SIGINT'] as NodeJS.Signals[]) {
  process.on(signal, () => server.close(() => process.exit(0)))
}

server.listen(PORT, HOST, () => {
  console.log(`Functions dev server on http://${HOST}:${PORT}`)
  console.log('Routes:', Object.keys(handlers).join(', '))
})
