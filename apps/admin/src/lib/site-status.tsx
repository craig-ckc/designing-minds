/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { fetchSiteBuild, type SiteBuild } from './site-build'
import { UNKNOWN_SITE, type SiteStatus } from '../cms/publish-state'

/* -------------------------------------------------------------------------
   Tracks what the live website has been built from, so every part of the
   admin agrees on which records the pages actually show.

   The stamp is re-read on mount, on window focus, and on demand — the
   PublishButton calls refresh() while it waits for a publish to land.
   ------------------------------------------------------------------------- */

interface SiteStatusValue extends SiteStatus {
  /** Re-read the deployed site's build stamp now; resolves with what it found. */
  refresh: () => Promise<SiteBuild | null>
}

const SiteStatusContext = createContext<SiteStatusValue | null>(null)

export function SiteStatusProvider({ children }: { children: ReactNode }) {
  const [build, setBuild] = useState<SiteBuild | null>(null)

  const refresh = useCallback(
    () =>
      fetchSiteBuild().then((next) => {
        // A failed read keeps the last good stamp: "unknown right now" is not
        // evidence that the site changed.
        if (next) setBuild(next)
        return next
      }),
    [],
  )

  // Initial read, plus a re-read whenever the tab regains focus — a build may
  // well have finished while the admin was looking somewhere else.
  useEffect(() => {
    void refresh()
    const onFocus = () => void refresh()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refresh])

  const value = useMemo<SiteStatusValue>(() => ({ build, refresh }), [build, refresh])

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
  return { build: ctx.build }
}
