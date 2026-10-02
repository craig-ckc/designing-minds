import type { Bundle, Product } from '../types'

/**
 * Whether owning `bundle` unlocks the resource `candidate`.
 *
 * Membership is the whole answer. This used to also grant by rule — anything
 * in the bundle's grade matching its includedSubjects/includedTerms — which
 * meant what a buyer received was computed at read time and could drift as the
 * catalogue changed. The 2026-08-09 migration resolved every rule into real
 * membership rows, so a bundle now grants exactly what its page lists.
 *
 * The issue-download function authorises files with this, against the full
 * membership in bundle_products. The account Order Detail lists files from the
 * PUBLIC snapshot instead (bundleContents), which only carries live members —
 * so a member that is unpublished or archived after purchase is still
 * downloadable but no longer listed there. Keep this pure — no I/O.
 */
export const resourceUnlockedByBundle = (
  bundle: Pick<Bundle, 'includedProductSlugs'>,
  candidate: Pick<Product, 'slug'>,
): boolean => bundle.includedProductSlugs.includes(candidate.slug)
