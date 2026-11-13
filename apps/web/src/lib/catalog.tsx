/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { withPricingTime, type CmsSnapshot } from '@designing-minds/cms'
import { buildClock, usePricingClock } from './pricing-clock'
import { CoverAssetsContext, type WebCatalogSnapshot } from './cover-assets'

/* -------------------------------------------------------------------------
   Catalogue provider.

   Owns the published catalogue every storefront route reads: the snapshot the
   prerender (or the browser bootstrap) hands in, the dev-only fetch used when
   there is no prerendered HTML, the load/error status, and the pricing clock.
   Account records never live here — they are loaded separately and never
   replace this snapshot.
   ------------------------------------------------------------------------- */

export type CatalogStatus = 'loading' | 'ready' | 'error'

export interface CatalogValue {
  state: {
    /** The published catalogue stamped with the current pricing clock; null until loaded. */
    snapshot: CmsSnapshot | null
    status: CatalogStatus
    error: string | null
  }
  actions: {
    /** Refetch where possible (development), otherwise reload the page. */
    retry: () => void
  }
  meta: {
    /** The clock sale prices are evaluated at (epoch ms). */
    now: number
  }
}

export const CatalogContext = createContext<CatalogValue | null>(null)

export const CATALOG_UNAVAILABLE = 'The published catalogue is unavailable. Please reload the page.'

/* ------------------------------ State machine ------------------------------ */

export interface CatalogLoadState {
  snapshot: CmsSnapshot | null
  status: CatalogStatus
  error: string | null
}

export type CatalogAction =
  | { type: 'loaded'; snapshot: CmsSnapshot }
  | { type: 'failed'; error: string }
  | { type: 'retry' }

/** A prerendered snapshot is ready at once; otherwise load if we can, else fail. */
export const createCatalogState = (initial: CmsSnapshot | null, canLoad: boolean): CatalogLoadState => {
  if (initial) return { snapshot: initial, status: 'ready', error: null }
  return canLoad ? { snapshot: null, status: 'loading', error: null } : { snapshot: null, status: 'error', error: CATALOG_UNAVAILABLE }
}

export function catalogReducer(state: CatalogLoadState, action: CatalogAction): CatalogLoadState {
  switch (action.type) {
    case 'loaded':
      return { snapshot: action.snapshot, status: 'ready', error: null }
    case 'failed':
      return { snapshot: state.snapshot, status: 'error', error: action.error }
    case 'retry':
      return state.status === 'error' ? { snapshot: state.snapshot, status: 'loading', error: null } : state
  }
}

/* --------------------------------- Provider -------------------------------- */

/**
 * Vite development has no prerendered HTML, so it fetches a sanitized public
 * preview. The branch is a compile-time constant: production bundles neither
 * the loader nor the CMS repository behind it, and never reads live content.
 */
const developmentLoader: (() => Promise<CmsSnapshot>) | undefined = import.meta.env.DEV
  ? async () => {
      const { loadPublicBuildData } = await import('../build/load-public-data')
      const { supabase } = await import('./supabase')
      const { snapshot } = await loadPublicBuildData({
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
        supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        supabaseClient: supabase ?? undefined,
      })
      return snapshot
    }
  : undefined

const reloadPage = () => window.location.reload()

export function CatalogProvider({
  initialSnapshot = null,
  load = developmentLoader,
  reload = reloadPage,
  children,
}: {
  /** The build-time public snapshot (prerender or `window.__DM_PUBLIC_SNAPSHOT__`). */
  initialSnapshot?: WebCatalogSnapshot | null
  /** Fetches a snapshot when none was supplied. Absent in production. */
  load?: () => Promise<CmsSnapshot>
  /** What `retry` does when there is nothing to refetch. */
  reload?: () => void
  children: ReactNode
}) {
  const [loaded, dispatch] = useReducer(catalogReducer, undefined, () => createCatalogState(initialSnapshot, Boolean(load)))
  const buildNow = useMemo(() => buildClock(initialSnapshot), [initialSnapshot])
  const now = usePricingClock(loaded.snapshot, buildNow)

  useEffect(() => {
    if (loaded.status !== 'loading' || !load) return
    let cancelled = false
    load().then(
      (snapshot) => { if (!cancelled) dispatch({ type: 'loaded', snapshot }) },
      (error: unknown) => { if (!cancelled) dispatch({ type: 'failed', error: error instanceof Error ? error.message : 'Unable to load content.' }) },
    )
    return () => { cancelled = true }
  }, [loaded.status, load])

  const retry = useCallback(() => {
    if (load) dispatch({ type: 'retry' })
    else reload()
  }, [load, reload])

  // Only a new raw snapshot or a moved clock re-stamps (and so re-clones) the records.
  const snapshot = useMemo(() => (loaded.snapshot ? withPricingTime(loaded.snapshot, now) : null), [loaded.snapshot, now])

  const value = useMemo<CatalogValue>(
    () => ({ state: { snapshot, status: loaded.status, error: loaded.error }, actions: { retry }, meta: { now } }),
    [snapshot, loaded.status, loaded.error, retry, now],
  )
  return (
    <CatalogContext.Provider value={value}>
      <CoverAssetsContext.Provider value={initialSnapshot?.coverAssets ?? null}>{children}</CoverAssetsContext.Provider>
    </CatalogContext.Provider>
  )
}

/* ----------------------------------- Hooks --------------------------------- */

/** The catalogue state, for chrome and sections that render their own loading/error. */
export function useCatalog(): CatalogValue {
  const ctx = useContext(CatalogContext)
  if (!ctx) throw new Error('useCatalog must be used within a CatalogProvider')
  return ctx
}

/** The loaded catalogue, for routes rendered under `CatalogGate`. */
export function useCatalogSnapshot(): CmsSnapshot {
  const { state } = useCatalog()
  if (!state.snapshot) throw new Error('useCatalogSnapshot must be used under a ready CatalogGate')
  return state.snapshot
}
