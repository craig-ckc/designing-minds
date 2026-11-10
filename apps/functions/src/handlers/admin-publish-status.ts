import { logEvent } from '../lib/diagnostics.ts'
import { badRequest, forbidden, ok, serverError, type Handler } from '../lib/http.ts'
import { requireAdmin } from '../lib/auth.ts'
import { adminAuthFailure } from '../lib/auth-errors.ts'
import { fetchDeploymentStatus } from '../lib/vercel.ts'
import { getCommerceContext, simulationEnabled } from './commerce.ts'
import { getLocalPublishReceipt } from './admin-rebuild-web.ts'

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
    return adminAuthFailure(error)
  }

  const since = Date.parse(String((req.body as { since?: unknown } | undefined)?.since ?? ''))
  if (Number.isNaN(since)) return badRequest('Expected { since: <ISO timestamp> }.')

  if (process.env.LOCAL_COMMERCE_PREVIEW === 'true') {
    try {
      if (!simulationEnabled(await getCommerceContext())) return forbidden('Local preview publishing is unavailable.')
      const publishedAt = getLocalPublishReceipt()
      return ok(publishedAt !== null && publishedAt >= since
        ? { state: 'ready', localPreview: true, publishedAt: new Date(publishedAt).toISOString(), createdAt: publishedAt, readyAt: publishedAt }
        : { state: 'pending', localPreview: true })
    } catch (error) {
      logEvent('admin.publish.failed', { errorKind: error instanceof Error ? error.name : 'Error' })
      return serverError('Unable to read the local preview publish status.')
    }
  }

  try {
    return ok(await fetchDeploymentStatus(since))
  } catch (error) {
    logEvent('admin.publish.failed', { errorKind: error instanceof Error ? error.name : 'Error' })
    return serverError('Unable to read the website build status.')
  }
}
