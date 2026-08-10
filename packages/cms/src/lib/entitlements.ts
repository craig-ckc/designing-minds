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
 * This is the single source of truth for download entitlements: the account UI
 * (which files to show) and the issue-download function (which files to
 * authorise) both call it, so they can never disagree. Keep it pure — no I/O.
 */
export const resourceUnlockedByBundle = (
  bundle: Pick<Bundle, 'includedProductSlugs'>,
  candidate: Pick<Product, 'slug'>,
): boolean => bundle.includedProductSlugs.includes(candidate.slug)
