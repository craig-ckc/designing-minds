import { diagnosticId, sanitizeEvent, type DiagnosticEvent, type DiagnosticEventName } from '../../../../packages/utils/src/diagnostics.ts'

interface Options {
  sessionId: string
  route: () => string
  fetch: typeof fetch
  send: (events: DiagnosticEvent[]) => Promise<boolean>
  origin?: string
  supabaseOrigin?: string
  release?: string
}

/** No retries of application requests; only a bounded queue of diagnostic events. */
export function createDiagnostics(options: Options) {
  let queue: DiagnosticEvent[] = []
  let flushing = false
  let windowStart = Date.now()
  let count = 0
  const record = (event: DiagnosticEventName, fields: Record<string, unknown> = {}) => {
    if (Date.now() - windowStart > 60_000) { windowStart = Date.now(); count = 0 }
    if (count >= 120) return
    const row = sanitizeEvent({ sessionId: options.sessionId, route: options.route(), release: options.release, ...fields, sequence: count, event }, 'browser')
    if (!row) return
    count++
    // Preserve errors over routine breadcrumbs if the queue fills while offline.
    if (queue.length >= 50) {
      const info = queue.findIndex((e) => e.level === 'info')
      if (info >= 0) queue.splice(info, 1)
      else if (row.level === 'info') return
      else queue.shift()
    }
    queue.push(row)
  }
  const flush = async () => {
    if (flushing || queue.length === 0) return
    flushing = true
    queue = queue.filter((e) => Date.now() - Date.parse(e.occurredAt) < 15 * 60_000)
    const batch = queue.slice(0, 20)
    try {
      if (batch.length && await options.send(batch)) {
        const ids = new Set(batch.map((e) => e.id))
        queue = queue.filter((e) => !ids.has(e.id))
      }
    } catch { /* A logging failure must never affect the application. */ }
    finally { flushing = false }
  }
  const observedFetch: typeof fetch = async (input, init) => {
    const origin = options.origin ?? 'https://www.designingminds.co.za'
    const url = new URL(input instanceof Request ? input.url : String(input), origin)
    const api = url.origin === origin && url.pathname.startsWith('/api/') && url.pathname !== '/api/diagnostics'
    const supabase = options.supabaseOrigin && url.origin === options.supabaseOrigin
    if (!api && !supabase) return options.fetch(input, init)
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined))
    const requestId = diagnosticId(headers.get('x-request-id')) ?? crypto.randomUUID()
    if (api) {
      headers.set('x-request-id', requestId)
      headers.set('x-session-id', options.sessionId)
    }
    const fields = { requestId, route: url.pathname }
    const started = Date.now()
    record('http.started', fields)
    try {
      const response = await options.fetch(input, api ? { ...init, headers } : init)
      record(response.ok ? 'http.completed' : 'http.failed', { ...fields, status: response.status, durationMs: Date.now() - started })
      return response
    } catch (error) {
      record('http.failed', { ...fields, durationMs: Date.now() - started, errorKind: error instanceof Error ? error.name : 'Error' })
      throw error
    }
  }
  return { record, flush, fetch: observedFetch, pending: () => queue.length }
}
