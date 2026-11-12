import type { CmsSnapshot } from '@designing-minds/cms'
import { PASSWORD_RESET_PATH } from './site-url'

/* -------------------------------------------------------------------------
   Route classification + public route generation.

   Owns the single source of truth for which routes are prerendered and
   indexable, which are functional/noindex, and how CMS data expands into
   dynamic static routes. Used by the prerender build (route list, sitemap,
   robots) and by seo.ts (per-route metadata).
   ------------------------------------------------------------------------- */

export type RouteKind = 'static' | 'product'

export interface PublicRoute {
  /** Absolute path, e.g. "/", "/shop", "/shop/foo". */
  path: string
  kind: RouteKind
  /** Product slug for product routes. */
  productSlug?: string
}

/** Fixed indexable routes that always exist, independent of CMS data. */
export const STATIC_INDEXABLE_PATHS = [
  '/',
  '/shop',
  '/grades',
  '/packages',
  '/help',
  '/about',
  '/contact',
  '/privacy-policy',
  '/terms',
  '/refund-policy',
] as const

/** Functional routes that must never appear in sitemap.xml and stay noindex. */
export const FUNCTIONAL_NOINDEX_PATHS = [
  '/hero-demo',
  '/sign-up',
  '/login',
  '/forgot-password',
  PASSWORD_RESET_PATH,
  '/account',
  '/account/orders',
  '/cart',
  '/checkout',
  '/checkout/return',
  '/checkout/cancel',
  '/unsubscribe',
] as const

/**
 * Path prefixes for the client-rendered functional area (auth, cart, checkout,
 * account). These pages are not prerendered — they load their own data and
 * serve the noindex SPA Shell. The deploy config matches these prefixes (and
 * any sub-path, e.g. /account/orders/:id) to the Shell with a 200, while every
 * other unknown URL falls through to a genuine 404 instead of a soft 404.
 */
export const FUNCTIONAL_SPA_PREFIXES = [
  '/hero-demo',
  '/sign-up',
  '/login',
  '/forgot-password',
  PASSWORD_RESET_PATH,
  '/cart',
  '/account',
  '/checkout',
  '/unsubscribe',
] as const

/**
 * The full set of routes to prerender for a given snapshot: fixed static pages and one detail page per
 * published catalogue record.
 *
 * Products and bundles are separate Collections that share the /shop/<slug>
 * URL space, so both contribute `product` routes — the detail page resolves
 * which one a slug names. A bundle that isn't prerendered here would 404 in
 * the static build.
 */
export function getPublicRoutes(snapshot: CmsSnapshot): PublicRoute[] {
  const routes: PublicRoute[] = STATIC_INDEXABLE_PATHS.map((path) => ({ path, kind: 'static' as const }))

  for (const product of snapshot.products) {
    if (!product.published) continue
    routes.push({ path: `/shop/${product.slug}`, kind: 'product', productSlug: product.slug })
  }

  for (const bundle of snapshot.bundles) {
    if (!bundle.published) continue
    routes.push({ path: `/shop/${bundle.slug}`, kind: 'product', productSlug: bundle.slug })
  }

  for (const product of snapshot.physicalCatalog ?? []) {
    if (!product.published) continue
    routes.push({ path: `/shop/${product.slug}`, kind: 'product', productSlug: product.slug })
  }

  return routes
}

/**
 * Reverse of getPublicRoutes for a single URL: classify a live pathname into the
 * PublicRoute it corresponds to, or null for functional/unknown paths. Used by
 * the client head manager to resolve metadata on SPA navigation. Returns null
 * (rather than a route) for a product slug with no matching CMS entry, so
 * callers never build metadata for a page that doesn't exist.
 */
export function matchPath(pathname: string, snapshot: CmsSnapshot): PublicRoute | null {
  const path = pathname !== '/' && pathname.endsWith('/') ? pathname.replace(/\/+$/, '') : pathname

  if ((STATIC_INDEXABLE_PATHS as readonly string[]).includes(path)) {
    return { path, kind: 'static' }
  }

  const productMatch = path.match(/^\/shop\/([^/]+)$/)
  if (productMatch) {
    const slug = productMatch[1]
    const exists =
      snapshot.products.some((product) => product.slug === slug && product.published) ||
      snapshot.bundles.some((bundle) => bundle.slug === slug && bundle.published) ||
      (snapshot.physicalCatalog ?? []).some((product) => product.slug === slug && product.published)
    return exists ? { path, kind: 'product', productSlug: slug } : null
  }

  return null
}

