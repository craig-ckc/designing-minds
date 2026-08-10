/* -------------------------------------------------------------------------
   What the live website was built from.

   Saving a record and publishing the website are separate steps: a save writes
   to Supabase immediately, but the public site is static and only picks the
   change up on the next build. To show that difference honestly the admin asks
   the deployed site itself — apps/web writes `build-info.json` during
   prerender (see apps/web/scripts/prerender.mjs).

   `contentAt` is the moment that build read the CMS, so a record whose
   updatedAt is newer than contentAt is genuinely not live yet. Nothing is
   inferred from our own deploy trigger: if the build failed, contentAt simply
   never moves and the admin keeps saying the change is unpublished.
   ------------------------------------------------------------------------- */

export interface SiteBuild {
  /** When the deployed build read the CMS. The cut-off for "is this live?". */
  contentAt: string
  /** When that build finished rendering. Shown as "last published". */
  builtAt: string
}

const WEB_URL = (import.meta.env.VITE_WEB_URL ?? 'http://localhost:5173').replace(/\/$/, '')

/**
 * Fetch the deployed site's build stamp. Returns null when it can't be read —
 * the site is mid-deploy, offline, or predates build-info.json. Callers treat
 * null as "unknown", never as "nothing is published".
 */
export async function fetchSiteBuild(): Promise<SiteBuild | null> {
  try {
    // Cache-busted: a stale copy would report unpublished changes as live.
    const response = await fetch(`${WEB_URL}/build-info.json?t=${Date.now()}`, { cache: 'no-store' })
    if (!response.ok) return null
    const body = (await response.json()) as Partial<SiteBuild>
    if (!body.contentAt) return null
    return { contentAt: body.contentAt, builtAt: body.builtAt ?? body.contentAt }
  } catch {
    return null
  }
}
