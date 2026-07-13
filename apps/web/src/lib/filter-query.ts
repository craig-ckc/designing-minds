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
