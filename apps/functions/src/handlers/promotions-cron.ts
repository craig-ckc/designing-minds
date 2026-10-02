import { timingSafeEqual } from 'node:crypto'
import { logEvent } from '../lib/diagnostics.ts'
import { badRequest, ok, unauthorized, type Handler } from '../lib/http.ts'
import { siteUrl } from '../lib/origins.ts'
import { createServiceClient } from '../lib/supabase.ts'
const unavailable = () => ({ status: 503, body: { error: 'Unable to rebuild scheduled promotion pages. The next scheduled check will retry.' } })
interface RebuildLease { token: string; through: string; state: 'claimed' | 'waiting' }

/** Rebuild LIVE catalogue pages only. This never calls publish_site_content. */
export const promotionsCron: Handler = async (req) => {
  if (req.method !== 'GET') return badRequest('Use GET.')
  const secret = process.env.CRON_SECRET
  if (!secret) return unavailable()
  const expected = Buffer.from(`Bearer ${secret}`)
  const supplied = Buffer.from(req.headers.authorization ?? req.headers.Authorization ?? '')
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return unauthorized('Invalid scheduler credentials.')
  const hook = process.env.VERCEL_WEB_DEPLOY_HOOK_URL
  if (!hook) return unavailable()
  let supabase: ReturnType<typeof createServiceClient> | undefined
  let token: string | undefined
  let waiting = false
  try {
    const baseUrl = siteUrl()
    supabase = createServiceClient()
    const { data, error } = await supabase.rpc('claim_promotion_rebuild')
    if (error) throw error
    const lease = data as RebuildLease | null
    if (!lease) return ok({ state: 'idle' })
    token = lease.token
    waiting = lease.state === 'waiting'
    if (waiting) {
      // A hook's HTTP 200 only means accepted. A deployed build stamp proves
      // the HTML actually includes the boundary; otherwise retain the lease.
      const response = await fetch(`${baseUrl}/build-info.json?promotion=${Date.now()}`, { cache: 'no-store', signal: AbortSignal.timeout(5000) })
      if (!response.ok) return ok({ state: 'waiting' })
      const info = await response.json() as { contentAt?: string }
      if (!info.contentAt || !(Date.parse(info.contentAt) >= Date.parse(lease.through))) return ok({ state: 'waiting' })
      const { data: finished, error: finishError } = await supabase.rpc('finish_promotion_rebuild', { p_token: token, p_success: true })
      if (finishError || finished !== true) throw finishError ?? new Error('Rebuild lease expired.')
      return ok({ state: 'ready' })
    }
    const response = await fetch(hook, { method: 'POST', signal: AbortSignal.timeout(20_000) })
    if (!response.ok) throw new Error(`Deploy hook failed (${response.status}).`)
    const { data: marked, error: markError } = await supabase.rpc('mark_promotion_rebuild_requested', { p_token: token })
    if (markError || marked !== true) throw markError ?? new Error('Rebuild lease expired.')
    return ok({ state: 'queued' })
  } catch (error) {
    // Temporary polling failures retain the lease. Failed hook requests retry
    // next minute; a lost/crashed invocation recovers when its lease expires.
    if (token && supabase && !waiting) {
      try { await supabase.rpc('finish_promotion_rebuild', { p_token: token, p_success: false }) } catch { /* lease expiry recovers this */ }
    }
    logEvent('admin.publish.failed', { errorKind: error instanceof Error ? error.name : 'Error' })
    return unavailable()
  }
}
