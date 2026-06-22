import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/**
 * Resets scroll to the top on forward navigation (PUSH). On POP (browser
 * back/forward) the scroll position is left for the browser to restore, and
 * search-param-only updates (filters use `replace`) don't change the pathname
 * so they don't trigger a jump.
 */
export function ScrollToTop() {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    if (navigationType !== 'POP') {
      window.scrollTo({ top: 0, left: 0 })
    }
  }, [pathname, navigationType])

  return null
}
