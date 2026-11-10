import { useEffect, useRef, useState } from 'react'
import type { CmsSnapshot } from '@designing-minds/cms'

/* -------------------------------------------------------------------------
   Pricing clock.

   Sale prices depend on the time they are rendered at. Prerendered HTML and the
   first hydrated render use the build clock (so markup matches); afterwards the
   clock moves forward. It is only ever re-stamped when a sale boundary actually
   lies between the applied clock and the real one, so a snapshot with no
   scheduled sales (or an idle tab regaining focus) never churns the catalogue
   object graph or invalidates the memoised views built from it.
   ------------------------------------------------------------------------- */

/** setTimeout cannot exceed a signed 32-bit delay; longer waits fire early and re-arm. */
const MAX_TIMER_MS = 2_147_483_647
/** Land just after the boundary so the new price is the one displayed. */
const BOUNDARY_SLACK_MS = 25

/** Every sale start/end instant in the catalogue, as epoch milliseconds. */
export function pricingBoundaries(snapshot: CmsSnapshot): number[] {
  return [...snapshot.products, ...snapshot.bundles, ...(snapshot.physicalCatalog ?? [])]
    .flatMap((record) => [record.saleStartsAt, record.saleEndsAt])
    .filter((date): date is string => Boolean(date))
    .map((date) => Date.parse(date))
    .filter(Number.isFinite)
}

/** Whether moving the applied clock from `applied` to `now` changes any sale price. */
export const crossedBoundary = (boundaries: readonly number[], applied: number, now: number): boolean =>
  boundaries.some((boundary) => boundary > applied && boundary <= now)

/** Milliseconds until the next boundary after `now`, or null when none remain. */
export function msUntilNextBoundary(boundaries: readonly number[], now: number): number | null {
  const upcoming = boundaries.filter((boundary) => boundary > now)
  return upcoming.length === 0 ? null : Math.min(Math.min(...upcoming) - now + BOUNDARY_SLACK_MS, MAX_TIMER_MS)
}

/** The build clock for a snapshot, falling back to the real clock when unparseable. */
export const buildClock = (snapshot: CmsSnapshot | null): number => {
  const parsed = snapshot ? Date.parse(snapshot.generatedAt) : Number.NaN
  return Number.isFinite(parsed) ? parsed : Date.now()
}

/**
 * The clock to price `snapshot` at. Starts at `initialNow`, then advances after
 * mount at each sale boundary and when a sleeping tab becomes visible again.
 */
export function usePricingClock(snapshot: CmsSnapshot | null, initialNow: number): number {
  const [now, setNow] = useState(initialNow)
  const applied = useRef(initialNow)

  useEffect(() => {
    if (!snapshot) return
    const boundaries = pricingBoundaries(snapshot)
    if (boundaries.length === 0) return

    let timer: number | undefined
    const refresh = () => {
      window.clearTimeout(timer)
      const current = Date.now()
      if (crossedBoundary(boundaries, applied.current, current)) {
        applied.current = current
        setNow(current)
      }
      const wait = msUntilNextBoundary(boundaries, current)
      if (wait !== null) timer = window.setTimeout(refresh, wait)
    }
    const resume = () => { if (document.visibilityState === 'visible') refresh() }

    refresh()
    document.addEventListener('visibilitychange', resume)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', resume)
    }
  }, [snapshot])

  return now
}
