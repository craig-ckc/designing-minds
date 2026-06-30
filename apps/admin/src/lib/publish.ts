import { supabase } from './supabase'
import { apiUrl } from './api'

/**
 * Trigger a web rebuild via the admin-only functions endpoint. Saving CMS
 * records and publishing the website are separate: saving updates the CMS
 * immediately; publishing regenerates the static web app from the latest data.
 * The Deploy Hook URL stays server-side — this only sends the admin's token.
 */
export interface PublishResult {
  state: 'queued' | 'debounced'
  message?: string
  jobId?: string | null
}

export async function publishWebsite(): Promise<PublishResult> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Admin session required.')

  const response = await fetch(apiUrl('/api/admin/rebuild-web'), {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
  })
  const body = (await response.json().catch(() => ({}))) as {
    state?: string
    message?: string
    jobId?: string | null
    error?: string
  }
  if (!response.ok) throw new Error(body.error ?? 'Unable to trigger the website rebuild.')

  return {
    state: body.state === 'debounced' ? 'debounced' : 'queued',
    message: body.message,
    jobId: body.jobId ?? null,
  }
}
