/* -------------------------------------------------------------------------
   CSV export/import for the admin workspace, driven by the Collection
   Registry. Export writes one column per field (keyed by field.key, so a file
   round-trips through import). Import builds a validated plan — create/update
   per row with row-level errors — that the Import dialog previews before any
   write happens.
   ------------------------------------------------------------------------- */

import type { AdminCollection, AdminField, AdminRecord, FieldContext, FieldOption } from './types'
import { fieldIsVisible, getPath, setPath } from './record'
import { parseCsv, toCsv } from '../lib/csv'

/* -------------------------------- Export ------------------------------- */

/** fileList fields hold storage objects that cannot round-trip through CSV. */
const exportableFields = (collection: AdminCollection): AdminField[] =>
  collection.fields.filter((field) => field.type !== 'fileList')

function formatCell(value: unknown): string {
  if (value == null) return ''
  if (Array.isArray(value)) return value.map((item) => String(item)).join('; ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export function buildCsv(collection: AdminCollection, records: AdminRecord[]): string {
  const fields = exportableFields(collection)
  const header = ['id', ...fields.map((field) => field.key)]
  const rows = records.map((record) => [record.id, ...fields.map((field) => formatCell(getPath(record, field.key)))])
  return toCsv([header, ...rows])
}

/* -------------------------------- Import ------------------------------- */

export type ImportRow = {
  /** 1-based line number in the file, for error messages. */
  line: number
  action: 'create' | 'update'
  record: AdminRecord
  title: string
  errors: string[]
}

export type ImportPlan = {
  rows: ImportRow[]
  /** File-level notes (e.g. ignored columns). */
  warnings: string[]
  validCount: number
}

function matchOption(options: FieldOption[], text: string): FieldOption | undefined {
  return (
    options.find((option) => option.value === text) ??
    options.find((option) => option.label.toLowerCase() === text.toLowerCase())
  )
}

const allowed = (options: FieldOption[]) => options.map((option) => option.value).join(', ')

type ParseResult = { ok: true; value: unknown } | { ok: false; error: string }

function parseCell(field: AdminField, raw: string, ctx: FieldContext): ParseResult {
  const text = raw.trim()
  switch (field.type) {
    case 'text':
    case 'textarea':
    case 'richText':
      return { ok: true, value: raw }
    case 'slug':
      return { ok: true, value: text.toLowerCase() }
    case 'date':
    case 'datetime':
      return { ok: true, value: text }
    case 'number': {
      const num = Number(text)
      return Number.isNaN(num) ? { ok: false, error: `"${text}" is not a number` } : { ok: true, value: num }
    }
    case 'boolean': {
      if (/^(true|yes|1)$/i.test(text)) return { ok: true, value: true }
      if (/^(false|no|0)$/i.test(text)) return { ok: true, value: false }
      return { ok: false, error: `"${text}" is not true/false` }
    }
    case 'select': {
      const options = ctx.optionsForSelect(field)
      const match = matchOption(options, text)
      return match
        ? { ok: true, value: match.value }
        : { ok: false, error: `"${text}" is not one of: ${allowed(options)}` }
    }
    case 'reference': {
      const options = ctx.optionsForReference(field)
      const match = matchOption(options, text)
      return match
        ? { ok: true, value: match.value }
        : { ok: false, error: `"${text}" is not one of: ${allowed(options)}` }
    }
    case 'multiReference': {
      const options = ctx.optionsForReference(field)
      const values: string[] = []
      for (const part of text.split(';').map((item) => item.trim()).filter(Boolean)) {
        const match = matchOption(options, part)
        if (!match) return { ok: false, error: `"${part}" is not one of: ${allowed(options)}` }
        values.push(match.value)
      }
      return { ok: true, value: values }
    }
    default:
      return { ok: false, error: `${field.type} fields cannot be imported` }
  }
}

export function buildImportPlan(options: {
  text: string
  collection: AdminCollection
  /** Existing records, for id matching and slug uniqueness. */
  records: AdminRecord[]
  ctx: FieldContext
  /** Fresh blank record per created row (adapter's createBlank). */
  createBlank: () => AdminRecord
}): ImportPlan {
  const { text, collection, records, ctx, createBlank } = options
  const table = parseCsv(text.replace(/^\uFEFF/, ''))
  if (table.length === 0) return { rows: [], warnings: ['The file is empty.'], validCount: 0 }

  const header = table[0].map((cell) => cell.trim())
  const importable = exportableFields(collection).filter((field) => field.type !== 'readonly')
  const fieldByKey = new Map(importable.map((field) => [field.key, field]))

  const warnings: string[] = []
  const idIndex = header.indexOf('id')
  const columns = header
    .map((key, index) => ({ key, index, field: fieldByKey.get(key) }))
    .filter((column) => {
      if (column.key === 'id' || column.field) return true
      warnings.push(`Ignored unknown column "${column.key}".`)
      return false
    })
    .filter((column) => column.field) as { key: string; index: number; field: AdminField }[]

  if (columns.length === 0) {
    return { rows: [], warnings: [...warnings, 'No recognised field columns found in the header row.'], validCount: 0 }
  }

  const slugField = collection.fields.find((field) => field.type === 'slug')
  const seenSlugs = new Map<string, number>() // slug -> first line that used it

  const rows: ImportRow[] = table.slice(1).map((cells, rowIndex) => {
    const line = rowIndex + 2
    const errors: string[] = []
    const id = idIndex >= 0 ? (cells[idIndex] ?? '').trim() : ''
    const existing = id ? records.find((record) => record.id === id) : undefined
    if (id && !existing) errors.push(`No existing record has id "${id}" — leave the id blank to create a new record.`)

    let record: AdminRecord = existing ? { ...existing } : createBlank()

    for (const column of columns) {
      const raw = cells[column.index] ?? ''
      if (raw.trim() === '') continue // blank cell = keep existing / default value
      const parsed = parseCell(column.field, raw, ctx)
      if (parsed.ok) record = setPath(record, column.field.key, parsed.value)
      else errors.push(`${column.field.label.replace(/\s*\(.*\)$/, '')}: ${parsed.error}`)
    }

    for (const field of collection.fields) {
      if (!field.required || !fieldIsVisible(field, record)) continue
      const value = getPath(record, field.key)
      const empty = value == null || value === '' || (Array.isArray(value) && value.length === 0)
      if (empty) errors.push(`${field.label.replace(/\s*\(.*\)$/, '')} is required.`)
    }

    if (slugField) {
      const slug = String(getPath(record, slugField.key) ?? '').trim()
      if (slug) {
        const clash = records.some(
          (other) => other.id !== record.id && String(getPath(other, slugField.key) ?? '').trim() === slug,
        )
        if (clash) errors.push(`Slug "${slug}" is already used by another ${collection.singular.toLowerCase()}.`)
        const firstLine = seenSlugs.get(slug)
        if (firstLine != null) errors.push(`Slug "${slug}" is duplicated in the file (also on line ${firstLine}).`)
        else seenSlugs.set(slug, line)
      }
    }

    const titleValue = getPath(record, collection.titleField)
    return {
      line,
      action: existing ? 'update' : 'create',
      record,
      title: titleValue == null || titleValue === '' ? `(line ${line})` : String(titleValue),
      errors,
    }
  })

  return { rows, warnings, validCount: rows.filter((row) => row.errors.length === 0).length }
}
