/** Same slug rule as `gradeToSlug` in content/site (kept local so this module stays dependency-free): "Grade 4" -> "grade-4". */
const gradeSlug = (grade: string) => grade.toLowerCase().replace(/\s+/g, '-')

/** Map a `?grade=` value (slug `grade-4` or label `Grade 4`) to its grade label, or null when it is neither. */
export function gradeFromParam(value: string, grades: readonly string[]): string | null {
  const wanted = value.trim().toLowerCase()
  return grades.find((grade) => grade.toLowerCase() === wanted || gradeSlug(grade) === wanted) ?? null
}

/** Read the `grade` filter, accepting slugs or labels and normalising to labels (deduplicated, unknown values dropped). */
export function readGradeList(params: URLSearchParams, grades: readonly string[]): string[] {
  return [...new Set(params.getAll('grade').map((value) => gradeFromParam(value, grades)).filter((grade): grade is string => grade !== null))]
}

/** Rewrite every `grade` value as its label so a toggle compares like with like. */
export function normalizeGradeParams(params: URLSearchParams, grades: readonly string[]): URLSearchParams {
  const next = new URLSearchParams(params)
  const labels = readGradeList(params, grades)
  next.delete('grade')
  for (const label of labels) next.append('grade', label)
  return next
}

/** Read repeated query values, discarding duplicates and values unavailable to the page. */
export function readQueryList(params: URLSearchParams, key: string, options: readonly string[]): string[] {
  const allowed = new Set(options)
  return [...new Set(params.getAll(key))].filter((value) => allowed.has(value))
}

/** Return new query params with one multi-select value toggled. */
export function toggleQueryValue(params: URLSearchParams, key: string, value: string): URLSearchParams {
  const next = new URLSearchParams(params)
  const values = next.getAll(key)
  next.delete(key)

  for (const current of values) {
    if (current !== value) next.append(key, current)
  }
  if (!values.includes(value)) next.append(key, value)
  return next
}

/** Return new query params with a scalar value set, or removed when blank. */
export function setQueryValue(params: URLSearchParams, key: string, value: string): URLSearchParams {
  const next = new URLSearchParams(params)
  const normalized = value.trim()
  if (normalized) next.set(key, normalized)
  else next.delete(key)
  return next
}

/** Remove only this page's filter keys, preserving unrelated query parameters. */
export function clearQueryValues(params: URLSearchParams, keys: readonly string[]): URLSearchParams {
  const next = new URLSearchParams(params)
  for (const key of keys) next.delete(key)
  return next
}

/** Subtitle for a shop filtered to exactly one grade; no subtitle otherwise. */
export function shopSubtitle(grades: readonly string[]): string | undefined {
  return grades.length === 1 ? `CAPS-aligned tests, memos and bundles for ${grades[0]}.` : undefined
}
