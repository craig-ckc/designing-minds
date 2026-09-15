import { useCallback, useState } from 'react'

export const CATALOG_INITIAL_LIMIT = 48

export const catalogItemsForRender = <T>(items: readonly T[], visibleCount: number): readonly T[] =>
  items.slice(0, Math.max(0, Math.min(visibleCount, items.length)))

/**
 * Paginate a filtered list with an explicit "Load more" control. The first
 * `initialLimit` items render immediately; clicking the button reveals the
 * next batch. The visible count resets whenever the caller's reset key changes
 * so shoppers start fresh after a search, chip toggle, term change or grade.
 *
 * Small lists (≤ `initialLimit`) naturally render their full set with no
 * button, and SSR ships exactly the same initial slice so hydration matches.
 */
export const useCatalogLoadMore = <T>(
  items: readonly T[],
  initialLimit: number = CATALOG_INITIAL_LIMIT,
  resetKey = '',
): { visible: readonly T[]; hasMore: boolean; loadMore: () => void } => {
  const pageSize = Math.max(1, initialLimit)
  const stateKey = `${pageSize}:${resetKey}`
  const [state, setState] = useState(() => ({ key: stateKey, count: pageSize }))
  const visibleCount = state.key === stateKey ? state.count : pageSize
  const visible = catalogItemsForRender(items, visibleCount)
  const hasMore = visible.length < items.length
  const loadMore = useCallback(() =>
    setState((current) => {
      const count = current.key === stateKey ? current.count : pageSize
      return { key: stateKey, count: Math.min(count + pageSize, items.length) }
    }), [items.length, pageSize, stateKey])

  return { visible, hasMore, loadMore }
}
