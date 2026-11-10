/* eslint-disable react-refresh/only-export-components -- navigationEffect is a pure helper exported for tests */
import { trackEvent } from './diagnostics'
import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType, type NavigationType } from 'react-router-dom'

interface Place { pathname: string; hash: string }

/** What a navigation should do to scroll and focus. Pure, so it can be tested. */
export type NavigationEffect = 'none' | 'hash' | 'top'

/**
 * - Same pathname and hash (search-param-only updates, e.g. filters using
 *   `replace`): `none`, so the page does not jump.
 * - A hash: `hash` — scroll to that element.
 * - Back/forward (POP) without a hash: `none` — the browser restores scroll.
 * - Any other navigation: `top` — reset scroll and move focus to `<main>`.
 */
export function navigationEffect(prev: Place | null, next: Place, type: NavigationType): NavigationEffect {
  if (prev && prev.pathname === next.pathname && prev.hash === next.hash) return 'none'
  if (next.hash) return 'hash'
  return type === 'POP' ? 'none' : 'top'
}

function findHashTarget(hash: string): HTMLElement | null {
  try {
    const id = decodeURIComponent(hash.slice(1))
    return id ? document.getElementById(id) : null
  } catch {
    return null
  }
}

function reveal(target: HTMLElement) {
  target.scrollIntoView()
  // Move focus along with the scroll for targets that can take it (e.g. <main tabindex="-1">).
  if (target.hasAttribute('tabindex')) target.focus({ preventScroll: true })
}

/** Scrolls to the hash target, waiting briefly for content that renders after
 *  the route change (catalogue-gated pages). Returns a cleanup. */
function scrollToHash(hash: string, fallbackToTop: boolean): () => void {
  const target = findHashTarget(hash)
  if (target) {
    reveal(target)
    return () => {}
  }
  const observer = new MutationObserver(() => {
    const found = findHashTarget(hash)
    if (!found) return
    observer.disconnect()
    reveal(found)
  })
  observer.observe(document.body, { childList: true, subtree: true })
  const giveUp = window.setTimeout(() => {
    observer.disconnect()
    if (fallbackToTop) window.scrollTo({ top: 0, left: 0 })
  }, 3000)
  return () => { observer.disconnect(); window.clearTimeout(giveUp) }
}

/**
 * Route-change housekeeping: page-view tracking, scroll and focus.
 *
 * A forward navigation resets scroll to the top and moves focus to `#main`, so
 * keyboard and screen-reader users start at the new page rather than at the
 * link they activated. Back/forward leaves restoration to the browser.
 * `/path#id` links scroll to the element (also the in-page skip link).
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation()
  const navigationType = useNavigationType()
  const previous = useRef<Place | null>(null)

  useEffect(() => {
    trackEvent('page.view')
  }, [pathname])

  useEffect(() => {
    const next = { pathname, hash }
    const effect = navigationEffect(previous.current, next, navigationType)
    previous.current = next
    if (effect === 'hash') return scrollToHash(hash, navigationType !== 'POP')
    if (effect === 'top') {
      window.scrollTo({ top: 0, left: 0 })
      document.getElementById('main')?.focus({ preventScroll: true })
    }
    return undefined
  }, [pathname, hash, navigationType])

  return null
}
