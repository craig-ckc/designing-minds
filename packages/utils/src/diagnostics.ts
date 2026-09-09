/** Only allowlisted operational metadata crosses the logging boundary. */
export const diagnosticEvents = [
  'page.view', 'runtime.error', 'runtime.unhandled', 'runtime.react',
  'http.started', 'http.completed', 'http.failed',
  'checkout.started', 'checkout.handoff', 'checkout.failed', 'checkout.order.created',
  'checkout.auth', 'checkout.catalogue', 'checkout.ownership', 'checkout.order', 'checkout.configuration',
  'payment.signature', 'payment.source', 'payment.lookup', 'payment.amount', 'payment.validation', 'payment.commit',
  'payment.recovered', 'payment.completed', 'payment.rejected', 'payment.failed', 'payment.duplicate',
  'auth.cart_sync.failed', 'cart.persist.failed',
  'forms.submission.failed', 'forms.notification.failed', 'forms.mailchimp.failed', 'forms.confirmation.failed',
  'download.failed', 'admin.upload.failed', 'admin.publish.failed', 'unsubscribe.failed',
] as const
export type DiagnosticEventName = typeof diagnosticEvents[number]
export type DiagnosticSource = 'browser' | 'server'
export interface DiagnosticEvent {
  id: string
  occurredAt: string
  sequence: number
  event: DiagnosticEventName
  source: DiagnosticSource
  level: 'info' | 'warning' | 'error'
  route: string
  requestId: string | null
  sessionId: string | null
  orderId: string | null
  status: number | null
  durationMs: number | null
  errorKind: string | null
  code: string | null
  asset: string | null
  release: string | null
}
export const diagnosticId = (value: unknown): string | null =>
  typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : null

const paths = new Set(['/', '/shop', '/cart', '/checkout', '/checkout/return', '/checkout/cancel', '/login', '/sign-up',
  '/forgot-password', '/reset-password', '/contact', '/help', '/about', '/terms', '/privacy', '/unsubscribe', '/account',
  '/account/orders', '/grades', '/packages', '/api/checkout', '/api/forms', '/api/issue-download', '/api/payment-webhook',
  '/api/unsubscribe', '/api/admin/upload-url', '/api/admin/rebuild-web', '/api/diagnostics'])
export function diagnosticRoute(value: unknown): string {
  if (typeof value !== 'string') return '/other'
  const path = value.split(/[?#]/, 1)[0]
  if (paths.has(path)) return path
  if (/^\/shop\/[^/]+$/.test(path)) return '/shop/:slug'
  if (/^\/account\/orders\/[^/]+$/.test(path)) return '/account/orders/:id'
  if (/^\/grades\/[^/]+$/.test(path)) return '/grades/:grade'
  // Supabase operation classes only: no table filters, storage keys or user data.
  if (path.startsWith('/auth/v1/')) return '/auth/v1/:operation'
  if (path.startsWith('/rest/v1/')) return '/rest/v1/:resource'
  if (path.startsWith('/storage/v1/')) return '/storage/v1/:resource'
  if (['/other', '/shop/:slug', '/account/orders/:id', '/grades/:grade'].includes(path)) return path
  return '/other'
}
const errorKinds = new Set(['Error', 'TypeError', 'SyntaxError', 'ReferenceError', 'RangeError', 'AbortError', 'TimeoutError', 'NetworkError'])
const boundedNumber = (v: unknown, max: number) => typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.min(Math.round(v), max) : null

export function sanitizeEvent(value: unknown, source: DiagnosticSource): DiagnosticEvent | null {
  if (!value || typeof value !== 'object') return null
  const v = value as Record<string, unknown>
  if (!(diagnosticEvents as readonly unknown[]).includes(v.event)) return null
  const event = v.event as DiagnosticEventName
  return {
    id: diagnosticId(v.id) ?? crypto.randomUUID(),
    occurredAt: typeof v.occurredAt === 'string' && Number.isFinite(Date.parse(v.occurredAt)) && Math.abs(Date.now() - Date.parse(v.occurredAt)) < 86_400_000 ? new Date(v.occurredAt).toISOString() : new Date().toISOString(),
    sequence: boundedNumber(v.sequence, 1_000_000) ?? 0,
    event, source,
    level: event.endsWith('.failed') || event.startsWith('runtime.') ? 'error' : event === 'payment.rejected' ? 'warning' : 'info',
    route: diagnosticRoute(v.route),
    requestId: diagnosticId(v.requestId), sessionId: diagnosticId(v.sessionId),
    orderId: source === 'server' ? diagnosticId(v.orderId) : null,
    status: boundedNumber(v.status, 599), durationMs: boundedNumber(v.durationMs, 3_600_000),
    errorKind: typeof v.errorKind === 'string' && errorKinds.has(v.errorKind) ? v.errorKind : null,
    // Database SQLSTATE/PostgREST codes only; free-form exception messages are not collected.
    code: typeof v.code === 'string' && /^(?:[0-9A-Z]{5}|PGRST\d{3})$/.test(v.code) ? v.code : null,
    asset: typeof v.asset === 'string' && v.asset.length <= 150 && /^[a-zA-Z0-9_-]+\.js:\d{1,7}:\d{1,7}$/.test(v.asset) ? v.asset : null,
    release: typeof v.release === 'string' && /^[a-f0-9]{7,40}$/.test(v.release) ? v.release : null,
  }
}
