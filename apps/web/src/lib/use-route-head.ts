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

export function useRouteHead(snapshot: CmsSnapshot | null) {
  const { pathname } = useLocation()

  useEffect(() => {
    // Without a snapshot we can't resolve product/grade metadata; the initial
    // prerendered head stays in place until one arrives.
    if (!snapshot) return

    const route = matchPath(pathname, snapshot)
    if (!route) {
      // Functional (cart/checkout/account/auth) or unknown page: just keep a
      // sensible tab title.
      document.title = SITE_NAME
      return
    }

    const meta = pageMetaFor(route, snapshot, window.location.origin)
    document.title = meta.title
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
