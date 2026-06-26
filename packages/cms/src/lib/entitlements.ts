import type { Grade, Product } from '../types'

/**
 * Whether the Individual Resource `candidate` is unlocked by owning the
 * Bundle / Access Plan `plan`, scoped to a single `grade`.
 *
 * `grade` is the grade the purchase is for — the grade chosen at checkout for an
 * Access Plan, or a Bundle's own grade. Scoping by it stops a grant from
 * spilling across every grade in the catalogue (the reason order downloads were
 * surfacing unrelated resources). When absent — legacy orders placed before the
 * grade was captured — it falls back to the plan's eligible `includedGrades`,
 * and finally to the plan's own grade.
 *
 * This is the single source of truth for download entitlements: the account UI
 * (which files to show) and the issue-download function (which files to
 * authorise) both call it, so they can never disagree. Keep it pure — no I/O.
 */
export const resourceUnlockedByPlan = (plan: Product, candidate: Product, grade?: Grade | null): boolean => {
  if (candidate.productKind !== 'Individual Resource') return false

  // Explicitly listed resources are always granted, regardless of grade.
  if (plan.includedProductSlugs?.includes(candidate.slug)) return true

  // Rule-based grant. A plan that only carries an explicit list (no
  // subject/term/grade rules) grants nothing further here.
  const hasRules = Boolean(plan.includedSubjects?.length || plan.includedTerms?.length || plan.includedGrades?.length)
  if (!hasRules) return false

  // Pin the grant to one grade. Prefer the purchase's grade; else the plan's
  // eligible grades; else the plan's own grade (Bundles are single-grade and
  // typically omit includedGrades).
  const scopeGrade = grade ?? (plan.includedGrades?.length ? null : plan.grade)
  if (scopeGrade) {
    if (candidate.grade !== scopeGrade) return false
  } else if (plan.includedGrades?.length && !plan.includedGrades.includes(candidate.grade)) {
    return false
  }

  if (plan.includedTerms?.length && !plan.includedTerms.includes(candidate.term)) return false
  if (plan.includedSubjects?.length && !candidate.subjects.some((subject) => plan.includedSubjects?.includes(subject))) return false

  return true
}
