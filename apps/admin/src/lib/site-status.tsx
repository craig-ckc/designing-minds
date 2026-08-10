/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { fetchSiteBuild, type SiteBuild } from './site-build'
import { UNKNOWN_SITE, type SiteStatus } from '../cms/publish-state'

/* -------------------------------------------------------------------------
   Tracks what the live website has been built from, so every part of the
   admin agrees on which records are actually live.

   After a publish is triggered we poll the deployed site's build stamp until
   it moves past the moment we asked — the old deployment keeps serving the old
   build-info.json while the new one builds, so the stamp advancing is real
   evidence the new build is live, not an assumption that it worked.
   ------------------------------------------------------------------------- */

const POLL_MS = 20_000
/** Stop waiting after this long — a build that slow has probably failed. */
const MAX_WAIT_MS = 15 * 60_000

interface SiteStatusValue extends SiteStatus {
  /** Re-read the deployed site's build stamp now. */
  refresh: () => void
  /** Called when a rebuild has been queued, to start watching for it landing. */
  markPublishRequested: () => void
}

const SiteStatusContext = createContext<SiteStatusValue | null>(null)

export function SiteStatusProvider({ children }: { children: ReactNode }) {
  const [build, setBuild] = useState<SiteBuild | null>(null)
  const [publishRequestedAt, setPublishRequestedAt] = useState<string | null>(null)

  const refresh = useCallback(() => {
    void fetchSiteBuild().then((next) => {
      if (next) setBuild(next)
    })
  }, [])

  // Initial read, plus a re-read whenever the tab regains focus — a build may
  // well have finished while the admin was looking somewhere else.
  useEffect(() => {
    refresh()
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refresh])

  // Watch for a requested publish actually landing.
  useEffect(() => {
    if (!publishRequestedAt) return
    const requestedAt = Date.parse(publishRequestedAt)
    let cancelled = false
    let timer = 0

    const tick = async () => {
      const next = await fetchSiteBuild()
      if (cancelled) return
      if (next) setBuild(next)
      const landed = next ? Date.parse(next.contentAt) >= requestedAt : false
      // Give up quietly on timeout: records fall back to "Changes in draft",
      // which is the honest reading of a build we can't confirm.
      if (landed || Date.now() - requestedAt > MAX_WAIT_MS) {
        setPublishRequestedAt(null)
        return
      }
      timer = window.setTimeout(() => void tick(), POLL_MS)
    }

    timer = window.setTimeout(() => void tick(), POLL_MS)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [publishRequestedAt])

  const markPublishRequested = useCallback(() => setPublishRequestedAt(new Date().toISOString()), [])

  const value = useMemo<SiteStatusValue>(
    () => ({ build, publishRequestedAt, refresh, markPublishRequested }),
    [build, publishRequestedAt, refresh, markPublishRequested],
  )

  return <SiteStatusContext.Provider value={value}>{children}</SiteStatusContext.Provider>
}

export function useSiteStatus(): SiteStatusValue {
  const ctx = useContext(SiteStatusContext)
  if (!ctx) throw new Error('useSiteStatus must be used within SiteStatusProvider')
  return ctx
}

/** The plain SiteStatus slice, for the pure publish-state helpers. */
export function useSite(): SiteStatus {
  const ctx = useContext(SiteStatusContext)
  if (!ctx) return UNKNOWN_SITE
  return { build: ctx.build, publishRequestedAt: ctx.publishRequestedAt }
}
