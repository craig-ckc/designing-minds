import { logEvent } from '../lib/diagnostics.ts'
import { badRequest, ok, serverError, unauthorized, type Handler } from '../lib/http.ts'
import { requireAdmin } from '../lib/auth.ts'
import { fetchDeploymentStatus } from '../lib/vercel.ts'

/**
 * Where the website build started by a publish has got to:
 * pending → queued → building → ready | error | canceled.
 *
 * POST (the functions CORS policy only admits POST) with
 * `{ since: <ISO requestedAt from /admin/rebuild-web> }`. Polled by the admin
 * while a publish is in flight.
 */
export const adminPublishStatus: Handler = async (req) => {
  if (req.method !== 'POST') return badRequest('Use POST.')

  try {
    await requireAdmin(req.headers)
  } catch (error) {
    return unauthorized(error instanceof Error ? error.message : 'Administrator access is required.')
  }

  const since = Date.parse(String((req.body as { since?: unknown } | undefined)?.since ?? ''))
  if (Number.isNaN(since)) return badRequest('Expected { since: <ISO timestamp> }.')

  try {
    return ok(await fetchDeploymentStatus(since))
  } catch (error) {
    logEvent('admin.publish.failed', { errorKind: error instanceof Error ? error.name : 'Error' })
    return serverError('Unable to read the website build status.')
  }
}
