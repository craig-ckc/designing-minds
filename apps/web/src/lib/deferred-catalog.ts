import { useEffect, useState } from 'react'

export const CATALOG_PRERENDER_LIMIT = 48

export const catalogItemsForRender = <T>(items: readonly T[], hydrated: boolean): readonly T[] =>
  hydrated ? items : items.slice(0, CATALOG_PRERENDER_LIMIT)

/**
 * Keep static HTML bounded while making the complete catalogue available as
 * soon as React has hydrated. The first client render intentionally matches the
 * server; expansion happens on the next animation frame.
 */
export const useDeferredCatalog = <T>(items: readonly T[]): readonly T[] => {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setHydrated(true))
    return () => cancelAnimationFrame(frame)
  }, [])
  return catalogItemsForRender(items, hydrated)
}
