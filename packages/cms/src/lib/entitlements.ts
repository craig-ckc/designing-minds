import type { Product } from '../types'

/**
 * Whether the Individual Resource `candidate` is unlocked by owning the
 * Bundle / Access Plan `plan`.
 *
 * Grade and term are fixed Fields on the plan itself: each Access Plan is one
 * grade — Essential covers one term, Premium covers all terms — and a Bundle is
 * one grade. So the grant is scoped by `plan.grade` (and, for Essential,
 * `plan.includedTerms`). Grade is never chosen at checkout (see ADR 0005), so
 * this function takes no grade argument.
 *
 * This is the single source of truth for download entitlements: the account UI
 * (which files to show) and the issue-download function (which files to
 * authorise) both call it, so they can never disagree. Keep it pure — no I/O.
 */
export const resourceUnlockedByPlan = (plan: Product, candidate: Product): boolean => {
  if (candidate.productKind !== 'Individual Resource') return false

  // Explicitly listed resources are always granted, regardless of grade/term.
  if (plan.includedProductSlugs?.includes(candidate.slug)) return true

  // Rule-based grant. A plan that only carries an explicit list (no
  // subject/term rules) grants nothing further here.
  const hasRules = Boolean(plan.includedSubjects?.length || plan.includedTerms?.length)
  if (!hasRules) return false

  // Plans and Bundles are single-grade; scope the grant to the plan's own grade.
  if (candidate.grade !== plan.grade) return false

  // Essential carries one term; Premium leaves includedTerms empty to grant every term.
  if (plan.includedTerms?.length && !plan.includedTerms.includes(candidate.term)) return false
  if (plan.includedSubjects?.length && !candidate.subjects.some((subject) => plan.includedSubjects?.includes(subject))) return false

  return true
}
