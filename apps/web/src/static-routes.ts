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
  /** Absolute path, e.g. "/", "/shop", "/grades/grade-4", "/product/foo". */
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
  '/account',
  '/account/orders',
  '/cart',
  '/checkout',
  '/checkout/fake-payfast',
  '/checkout/return',
  '/checkout/cancel',
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
    routes.push({ path: `/product/${product.slug}`, kind: 'product', productSlug: product.slug })
  }

  return routes
}

export { gradeToSlug, slugToGrade }
