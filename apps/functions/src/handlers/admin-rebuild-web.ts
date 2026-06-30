import { badRequest, ok, serverError, unauthorized, type Handler } from '../lib/http.ts'
import { requireAdmin } from '../lib/auth.ts'

/**
 * Admin-triggered web rebuild. The Vercel Deploy Hook URL acts like a secret —
 * anyone with it can trigger deployments — so it lives only in this server-side
 * env and is never exposed to the browser. The admin app calls this endpoint;
 * this endpoint calls the hook.
 */

// Best-effort in-memory debounce. Serverless instances are ephemeral, so this
// only collapses bursts hitting the same warm instance; it is not a hard,
// cross-instance rate limit. Persisting it (e.g. in Supabase) is a later option.
let lastTriggeredAt = 0
const COOLDOWN_MS = 30_000

export const adminRebuildWeb: Handler = async (req) => {
  if (req.method !== 'POST') return badRequest('Use POST.')

  try {
    await requireAdmin(req.headers)
  } catch (error) {
    return unauthorized(error instanceof Error ? error.message : 'Administrator access is required.')
  }

  const hookUrl = process.env.VERCEL_WEB_DEPLOY_HOOK_URL
  if (!hookUrl) {
    console.error('VERCEL_WEB_DEPLOY_HOOK_URL is not set — cannot trigger a web rebuild.')
    return serverError('Website publishing is not configured.')
  }

  const now = Date.now()
  if (now - lastTriggeredAt < COOLDOWN_MS) {
    return ok({ state: 'debounced', message: 'A rebuild was just requested. Give it a moment before trying again.' })
  }

  try {
    const response = await fetch(hookUrl, { method: 'POST' })
    const text = await response.text()
    if (!response.ok) {
      console.error('Vercel deploy hook failed:', response.status, text)
      return serverError('Unable to trigger the website rebuild.')
    }

    lastTriggeredAt = now
    let job: { id?: string; state?: string } | undefined
    try {
      job = (JSON.parse(text) as { job?: { id?: string; state?: string } }).job
    } catch {
      // Hook responses are normally JSON, but don't fail if Vercel changes that.
    }
    return ok({ state: 'queued', jobId: job?.id ?? null, jobState: job?.state ?? null })
  } catch (error) {
    console.error('rebuild-web failed:', error instanceof Error ? error.message : error)
    return serverError('Unable to trigger the website rebuild.')
  }
}
