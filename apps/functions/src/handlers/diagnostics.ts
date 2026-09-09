import { badRequest, type Handler } from '../lib/http.ts'
import { persistEvents } from '../lib/diagnostics.ts'
import { sanitizeEvent, type DiagnosticEvent } from '../../../../packages/utils/src/diagnostics.ts'

/** Public, write-only telemetry. No client-supplied event can claim server provenance. */
export const diagnostics: Handler = async (req) => {
  if (req.method !== 'POST' || !(req.headers['content-type'] ?? '').toLowerCase().startsWith('application/json')) {
    return badRequest('Expected a JSON POST.')
  }
  if (!req.body || typeof req.body !== 'object' || JSON.stringify(req.body).length > 24_000) return badRequest('Invalid diagnostic batch.')
  const input = (req.body as { events?: unknown }).events
  if (!Array.isArray(input) || input.length === 0 || input.length > 20) return badRequest('Expected 1–20 events.')
  const events = input.map((event) => sanitizeEvent(event, 'browser'))
  if (events.some((event) => !event)) return badRequest('Invalid diagnostic event.')
  const stored = await persistEvents(events as DiagnosticEvent[])
  return stored ? { status: 202, body: { accepted: true } } : { status: 503, body: { accepted: false }, headers: { 'retry-after': '60' } }
}
