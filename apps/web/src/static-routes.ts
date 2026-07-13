import type { CmsSnapshot } from '@designing-minds/cms'
import { gradeToSlug, slugToGrade } from './content/site'

/* -------------------------------------------------------------------------
   Route classification + public route generation.

   Owns the single source of truth for which routes are prerendered and
   indexable, which are functional/noindex, and how CMS data expands into
   dynamic static routes. Used by the prerender build (route list, sitemap,
   robots) and by seo.ts (per-route metadata).
   ------------------------------------------------------------------------- */

export type RouteKind = 'static' | 'grade' | 'product'

export interface PublicRoute {
  /** Absolute path, e.g. "/", "/shop", "/grades/grade-4", "/shop/foo". */
  path: string
  kind: RouteKind
  /** Grade label (e.g. "Grade 4") for grade routes. */
  grade?: string
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
  '/sign-up',
  '/login',
  '/forgot-password',
  '/reset-password',
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
  '/sign-up',
  '/login',
  '/forgot-password',
  '/reset-password',
  '/cart',
  '/account',
  '/checkout',
] as const

/**
 * The full set of routes to prerender for a given snapshot: fixed static pages,
 * one grade detail page per grade value list entry, and one product detail page
 * per published product.
 */
export function getPublicRoutes(snapshot: CmsSnapshot): PublicRoute[] {
  const routes: PublicRoute[] = STATIC_INDEXABLE_PATHS.map((path) => ({ path, kind: 'static' as const }))

  for (const grade of snapshot.valueLists.grades) {
    routes.push({ path: `/grades/${gradeToSlug(grade)}`, kind: 'grade', grade })
  }

  for (const product of snapshot.products) {
    if (!product.published) continue
    routes.push({ path: `/shop/${product.slug}`, kind: 'product', productSlug: product.slug })
  }

  return routes
}

/**
 * Reverse of getPublicRoutes for a single URL: classify a live pathname into the
 * PublicRoute it corresponds to, or null for functional/unknown paths. Used by
 * the client head manager to resolve metadata on SPA navigation. Returns null
 * (rather than a route) for a grade/product slug with no matching CMS entry, so
 * callers never build metadata for a page that doesn't exist.
 */
export function matchPath(pathname: string, snapshot: CmsSnapshot): PublicRoute | null {
  const path = pathname !== '/' && pathname.endsWith('/') ? pathname.replace(/\/+$/, '') : pathname

  if ((STATIC_INDEXABLE_PATHS as readonly string[]).includes(path)) {
    return { path, kind: 'static' }
  }

  const gradeMatch = path.match(/^\/grades\/([^/]+)$/)
  if (gradeMatch) {
    const grade = snapshot.valueLists.grades.find((value) => gradeToSlug(value) === gradeMatch[1])
    return grade ? { path, kind: 'grade', grade } : null
  }

  const productMatch = path.match(/^\/product\/([^/]+)$/)
  if (productMatch) {
    const slug = productMatch[1]
    const exists = snapshot.products.some((product) => product.slug === slug && product.published)
    return exists ? { path, kind: 'product', productSlug: slug } : null
  }

  return null
}

export { gradeToSlug, slugToGrade }
