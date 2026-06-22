import { createServer } from 'node:http'
import { handlers } from './index.ts'
import { notFound, type HandlerRequest } from './lib/http.ts'

/**
 * Minimal local dev server for the shared handlers. In production each handler
 * deploys as its own Supabase Edge Function; this just lets you exercise them
 * locally with `npm run dev`.
 */
const PORT = Number(process.env.PORT ?? 8787)

const readBody = async (stream: AsyncIterable<Uint8Array>): Promise<unknown> => {
  const chunks: Uint8Array[] = []
  for await (const chunk of stream) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return undefined
  try {
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

const server = createServer(async (req, res) => {
  const path = (req.url ?? '').split('?')[0]
  const handler = handlers[path]
  const body = await readBody(req)
  const request: HandlerRequest = {
    method: req.method ?? 'GET',
    body,
    headers: req.headers as Record<string, string | undefined>,
  }

  const response = handler ? await handler(request) : notFound(`No handler for ${path}`)
  res.writeHead(response.status, { 'content-type': 'application/json' })
  res.end(JSON.stringify(response.body))
})

server.listen(PORT, () => {
  console.log(`Functions dev server on http://localhost:${PORT}`)
  console.log('Routes:', Object.keys(handlers).join(', '))
})
