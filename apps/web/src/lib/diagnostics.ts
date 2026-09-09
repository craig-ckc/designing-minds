import { createDiagnostics } from './diagnostics-client.ts'
import { diagnosticId, type DiagnosticEventName } from '../../../../packages/utils/src/diagnostics.ts'

let monitor: ReturnType<typeof createDiagnostics> | undefined
export const trackEvent = (event: DiagnosticEventName, fields: Record<string, unknown> = {}) => monitor?.record(event, fields)
export const flushDiagnostics = () => monitor?.flush()

export function reportRuntimeError(error: unknown, event: 'runtime.error' | 'runtime.unhandled' | 'runtime.react' = 'runtime.error') {
  // File/line/column from a built asset is useful without collecting stack messages or URLs.
  const asset = error instanceof Error ? error.stack?.match(/\/assets\/([\w-]+\.js:\d+:\d+)/)?.[1] : undefined
  trackEvent(event, { errorKind: error instanceof Error ? error.name : 'Error', asset })
}

export function installDiagnostics() {
  if (typeof window === 'undefined' || monitor) return
  let sessionId = crypto.randomUUID() as string
  try {
    sessionId = diagnosticId(sessionStorage.getItem('dm.diagnostics.session')) ?? sessionId
    sessionStorage.setItem('dm.diagnostics.session', sessionId)
  } catch { /* Restricted storage still gets an in-memory session. */ }
  const originalFetch = window.fetch.bind(window)
  monitor = createDiagnostics({
    sessionId, route: () => location.pathname, fetch: originalFetch,
    origin: location.origin, supabaseOrigin: import.meta.env.VITE_SUPABASE_URL,
    release: import.meta.env.VITE_APP_RELEASE,
    send: async (events) => {
      const response = await originalFetch('/api/diagnostics', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ events }), keepalive: true, signal: AbortSignal.timeout(3000),
      })
      // Disabled/unavailable storage is retried later within the bounded in-memory queue.
      return response.ok
    },
  })
  window.fetch = monitor.fetch
  window.addEventListener('error', (event) => reportRuntimeError(event.error))
  window.addEventListener('unhandledrejection', (event) => reportRuntimeError(event.reason, 'runtime.unhandled'))
  window.addEventListener('online', () => { void monitor?.flush() })
  window.addEventListener('pagehide', () => { void monitor?.flush() })
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') void monitor?.flush() })
  window.setInterval(() => { void monitor?.flush() }, 5000)
}
