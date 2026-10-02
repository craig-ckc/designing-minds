import { supabase } from './supabase'
import { apiUrl } from './api'

/**
 * Publishing the website, via the admin-only functions endpoints.
 *
 * POST /api/admin/rebuild-web makes every Queued record live and starts a
 * website build; POST /api/admin/publish-status reports how that build is
 * going. The Deploy Hook URL and the Vercel token stay server-side — this only
 * sends the admin's own session token.
 */
export interface PublishResult {
  state: 'queued' | 'debounced'
  message?: string
  /** Server time the build was requested — the anchor for publish-status. */
  requestedAt: string
  /** Records made live, and live copies removed, by this publish. */
  promoted: number
  removed: number
}

/** pending → queued → building → ready | error | canceled; 'unconfigured' when the server has no Vercel token. */
export type BuildState = 'unconfigured' | 'pending' | 'queued' | 'building' | 'ready' | 'error' | 'canceled'

export interface BuildStatus {
  state: BuildState
  /** Link to the build in the Vercel dashboard. */
  inspectorUrl?: string | null
}

async function post<T>(path: string, body?: unknown, fallbackError = 'Request failed.'): Promise<T> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Admin session required.')

  const response = await fetch(apiUrl(path), {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const parsed = (await response.json().catch(() => ({}))) as T & { error?: string }
  if (!response.ok) throw new Error(parsed.error ?? fallbackError)
  return parsed
}

export async function publishWebsite(): Promise<PublishResult> {
  const body = await post<Partial<PublishResult> & { state?: string }>(
    '/api/admin/rebuild-web',
    undefined,
    'Unable to publish the website.',
  )
  return {
    state: body.state === 'debounced' ? 'debounced' : 'queued',
    message: body.message,
    requestedAt: body.requestedAt ?? new Date().toISOString(),
    promoted: Number(body.promoted ?? 0),
    removed: Number(body.removed ?? 0),
  }
}

export async function fetchBuildStatus(since: string): Promise<BuildStatus> {
  return post<BuildStatus>('/api/admin/publish-status', { since }, 'Unable to read the build status.')
}
