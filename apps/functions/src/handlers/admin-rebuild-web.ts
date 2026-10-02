import { logEvent } from '../lib/diagnostics.ts'
import { badRequest, ok, serverError, unauthorized, type Handler } from '../lib/http.ts'
import { requireAdmin } from '../lib/auth.ts'
import { createServiceClient } from '../lib/supabase.ts'

/**
 * Admin "Publish": make every Queued record live, then rebuild the website.
 *
 * Two steps, deliberately in this order:
 *   1. public.publish_site_content() promotes Queued records to their live
 *      copy and removes Archived ones, in one transaction. From this moment the
 *      cart and checkout serve the new content.
 *   2. The Vercel Deploy Hook rebuilds the static pages, which read the same
 *      live copies.
 * Reversed, the build could read the CMS before the promotion landed and ship
 * the old content. If step 2 fails the content is live but the pages are not
 * rebuilt yet — the admin sees that ("publishedAt" is newer than the site's
 * build stamp) and offers Publish again, which re-runs the hook.
 *
 * The Deploy Hook URL acts like a secret — anyone with it can trigger
 * deployments — so it lives only in this server-side env.
 */

// Best-effort in-memory debounce. Serverless instances are ephemeral, so this
// only collapses bursts hitting the same warm instance; it is not a hard,
// cross-instance rate limit.
let lastTriggeredAt = 0
const COOLDOWN_MS = 30_000

/** Test seam: the cooldown is module state. */
export function resetRebuildCooldown() {
  lastTriggeredAt = 0
}

export const adminRebuildWeb: Handler = async (req) => {
  if (req.method !== 'POST') return badRequest('Use POST.')

  try {
    await requireAdmin(req.headers)
  } catch (error) {
    return unauthorized(error instanceof Error ? error.message : 'Administrator access is required.')
  }

  const hookUrl = process.env.VERCEL_WEB_DEPLOY_HOOK_URL
  if (!hookUrl) {
    logEvent('admin.publish.failed')
    return serverError('Website publishing is not configured.')
  }

  const now = Date.now()
  // Nothing is promoted inside the cooldown either: promoting without a build
  // would put content in checkout that the pages don't show yet.
  if (now - lastTriggeredAt < COOLDOWN_MS) {
    return ok({ state: 'debounced', message: 'A publish was just started. Give it a moment before trying again.' })
  }

  let promoted = 0
  let removed = 0
  try {
    const { data, error } = await createServiceClient().rpc('publish_site_content')
    if (error) throw new Error(error.message)
    const result = (data ?? {}) as { promoted?: number; removed?: number }
    promoted = Number(result.promoted ?? 0)
    removed = Number(result.removed ?? 0)
  } catch (error) {
    logEvent('admin.publish.failed', { errorKind: error instanceof Error ? error.name : 'Error' })
    return serverError('Unable to publish the queued content.')
  }

  // Taken AFTER the promotion: any deployment created from here on reads it.
  const requestedAt = new Date().toISOString()
  try {
    const response = await fetch(hookUrl, { method: 'POST' })
    const text = await response.text()
    if (!response.ok) {
      logEvent('admin.publish.failed', { status: response.status })
      return serverError('Content is live in the shop, but the website rebuild could not be started. Publish again to retry.')
    }

    lastTriggeredAt = now
    let job: { id?: string; state?: string } | undefined
    try {
      job = (JSON.parse(text) as { job?: { id?: string; state?: string } }).job
    } catch {
      // Hook responses are normally JSON, but don't fail if Vercel changes that.
    }
    return ok({ state: 'queued', requestedAt, promoted, removed, jobId: job?.id ?? null })
  } catch (error) {
    logEvent('admin.publish.failed', { errorKind: error instanceof Error ? error.name : 'Error', code: error && typeof error === 'object' && 'code' in error ? error.code : undefined })
    return serverError('Content is live in the shop, but the website rebuild could not be started. Publish again to retry.')
  }
}
