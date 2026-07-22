import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import type { CmsSnapshot } from '@designing-minds/cms'
import { matchPath } from '../static-routes'
import { pageMetaFor, SITE_NAME } from '../seo'

/* -------------------------------------------------------------------------
   Client-side <head> sync.

   Each route is prerendered with correct <head> tags, so the first paint (and
   anything a crawler fetches per URL) is already right. This hook keeps the tab
   title and share tags in sync as the user navigates within the SPA, where the
   static <head> would otherwise stay frozen on the first page. It reuses
   pageMetaFor so the client and build never drift.

   robots/noindex is deliberately left alone here — functional pages manage that
   via useNoindex and the prerendered Shell.
   ------------------------------------------------------------------------- */

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function removeCanonical() {
  document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.remove()
}

function removeMeta(attr: 'name' | 'property', key: string) {
  document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)?.remove()
}

const functionalTitle = (pathname: string): string => {
  if (pathname === '/sign-up') return `Create account | ${SITE_NAME}`
  if (pathname === '/login') return `Log in | ${SITE_NAME}`
  if (pathname === '/forgot-password') return `Forgot password | ${SITE_NAME}`
  if (pathname === '/reset-password') return `Reset password | ${SITE_NAME}`
  if (pathname === '/cart') return `Cart | ${SITE_NAME}`
  if (pathname === '/checkout') return `Checkout | ${SITE_NAME}`
  if (pathname.startsWith('/checkout/')) return `Payment status | ${SITE_NAME}`
  if (pathname === '/account') return `Customer Account | ${SITE_NAME}`
  if (pathname === '/account/orders') return `Order History | ${SITE_NAME}`
  if (pathname.startsWith('/account/orders/')) return `Order Detail | ${SITE_NAME}`
  if (pathname === '/unsubscribe') return `Unsubscribe | ${SITE_NAME}`
  return `Page not found | ${SITE_NAME}`
}

export function useRouteHead(snapshot: CmsSnapshot | null) {
  const { pathname } = useLocation()

  useEffect(() => {
    const route = snapshot ? matchPath(pathname, snapshot) : null
    if (!route) {
      // Functional and unknown routes are noindex and must not inherit a
      // canonical or social tags from the last public page visited in the SPA.
      document.title = functionalTitle(pathname)
      upsertMeta('name', 'robots', 'noindex,nofollow')
      removeCanonical()
      for (const key of ['description', 'twitter:title', 'twitter:description', 'twitter:image', 'twitter:image:alt']) removeMeta('name', key)
      for (const key of ['og:title', 'og:description', 'og:url', 'og:type', 'og:image', 'og:image:alt']) removeMeta('property', key)
      return
    }

    // `route` can only be non-null when a snapshot was supplied above; keep
    // the invariant explicit for TypeScript and future refactors.
    if (!snapshot) return

    const meta = pageMetaFor(route, snapshot, window.location.origin)
    document.title = meta.title
    upsertMeta('name', 'robots', 'index,follow')
    upsertMeta('name', 'description', meta.description)
    upsertMeta('property', 'og:title', meta.title)
    upsertMeta('property', 'og:description', meta.description)
    upsertMeta('property', 'og:url', meta.canonical)
    upsertMeta('property', 'og:type', meta.ogType)
    upsertMeta('name', 'twitter:title', meta.title)
    upsertMeta('name', 'twitter:description', meta.description)
    upsertCanonical(meta.canonical)
  }, [pathname, snapshot])
}
