/* -------------------------------------------------------------------------
   Pure helpers for reading/writing AdminRecords by field key, resolving
   conditional visibility, and labelling records. Kept free of React and of
   the snapshot so they stay trivially testable.
   ------------------------------------------------------------------------- */

import type { AdminCollection, AdminField, AdminRecord } from './types'

/** Read a value by a possibly-dotted key (e.g. `seo.title`). */
export function getPath(record: AdminRecord, key: string): unknown {
  if (!key.includes('.')) return record[key]
  return key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[part]
    return undefined
  }, record)
}

/** Immutably set a value by a possibly-dotted key, returning a new record. */
export function setPath(record: AdminRecord, key: string, value: unknown): AdminRecord {
  if (!key.includes('.')) return { ...record, [key]: value }
  const [head, ...rest] = key.split('.')
  const child = (record[head] as Record<string, unknown> | undefined) ?? {}
  return { ...record, [head]: setPath(child as AdminRecord, rest.join('.'), value) }
}

/** A field shows when it has no predicate or the predicate passes. */
export function fieldIsVisible(field: AdminField, record: AdminRecord): boolean {
  return field.visibleWhen ? field.visibleWhen(record) : true
}

/**
 * Facet filter matching: values within a facet are OR-ed, facets are AND-ed.
 * Record values are compared as `String(value)` ('true'/'false' for booleans).
 */
export function matchesFilters(record: AdminRecord, filters: Record<string, string[]>): boolean {
  return Object.entries(filters).every(
    ([key, values]) => values.length === 0 || values.includes(String(getPath(record, key) ?? '')),
  )
}

/** The record's primary label, from the collection's titleField. */
export function getRecordTitle(collection: AdminCollection, record: AdminRecord): string {
  const value = getPath(record, collection.titleField)
  const label = value == null || value === '' ? null : String(value)
  return label ?? `Untitled ${collection.singular.toLowerCase()}`
}

/** The record's secondary label, from the collection's subtitleField (if any). */
export function getRecordSubtitle(collection: AdminCollection, record: AdminRecord): string | undefined {
  if (!collection.subtitleField) return undefined
  const value = getPath(record, collection.subtitleField)
  return value == null || value === '' ? undefined : String(value)
}

/** Find a field definition by key. */
export function findField(collection: AdminCollection, key: string): AdminField | undefined {
  return collection.fields.find((field) => field.key === key)
}

/** Turn free text into a URL-safe slug: `Grade 5 Maths!` → `grade-5-maths`. */
export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics left by NFKD
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** slugify + suffix (-2, -3, …) until the slug is unique among the other records. */
export function uniqueSlug(text: string, slugKey: string, records: AdminRecord[], selfId: string): string {
  const base = slugify(text)
  if (!base) return ''
  const taken = new Set(
    records.filter((other) => other.id !== selfId).map((other) => String(getPath(other, slugKey) ?? '').trim()),
  )
  if (!taken.has(base)) return base
  for (let n = 2; ; n += 1) {
    const candidate = `${base}-${n}`
    if (!taken.has(candidate)) return candidate
  }
}
