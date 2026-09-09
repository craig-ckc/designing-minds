import { AsyncLocalStorage } from 'node:async_hooks'
import { createClient } from '@supabase/supabase-js'
import { diagnosticId, sanitizeEvent, type DiagnosticEvent, type DiagnosticEventName } from '../../../../packages/utils/src/diagnostics.ts'
import { serverError, type Handler, type HandlerRequest, type HandlerResponse } from './http.ts'

interface Context { requestId: string; sessionId: string | null; route: string; events: DiagnosticEvent[] }
const context = new AsyncLocalStorage<Context>()

export function logEvent(event: DiagnosticEventName, fields: Record<string, unknown> = {}) {
  const ctx = context.getStore()
  const row = sanitizeEvent({ ...ctx, ...fields, sequence: ctx?.events.length ?? 0, event, release: process.env.VERCEL_GIT_COMMIT_SHA }, 'server')!
  console[row.level === 'error' ? 'error' : row.level === 'warning' ? 'warn' : 'info'](JSON.stringify(row))
  if (ctx && ctx.events.length < 30) ctx.events.push(row)
}

/** Await a short, abortable write so serverless shutdown cannot silently lose it. */
export async function persistEvents(events: DiagnosticEvent[]): Promise<boolean> {
  if (process.env.DIAGNOSTICS_ENABLED !== 'true') return false
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key) return false
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 750)
  try {
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data, error } = await client.rpc('record_diagnostic_events', { p_events: events }).abortSignal(controller.signal)
    if (error) throw error
    return data === true
  } catch {
    // Never log raw database errors here, or recursively try to persist this warning.
    console.warn(JSON.stringify({ event: 'diagnostics.storage_unavailable', level: 'warning' }))
    return false
  } finally { clearTimeout(timer) }
}

export async function observeHandler(handler: Handler, req: HandlerRequest, route: string): Promise<HandlerResponse> {
  const requestId = diagnosticId(req.headers['x-request-id']) ?? crypto.randomUUID()
  const ctx: Context = { requestId, sessionId: diagnosticId(req.headers['x-session-id']), route, events: [] }
  return context.run(ctx, async () => {
    const started = Date.now()
    logEvent('http.started')
    let response: HandlerResponse
    try {
      response = await handler(req)
    } catch (error) {
      logEvent('http.failed', { errorKind: error instanceof Error ? error.name : 'Error' })
      response = serverError('An unexpected error occurred. Please contact support with the reference shown.')
    }
    logEvent(response.status >= 400 ? 'http.failed' : 'http.completed', { status: response.status, durationMs: Date.now() - started })
    await persistEvents(ctx.events)
    return { ...response, headers: { ...response.headers, 'x-request-id': requestId } }
  })
}
