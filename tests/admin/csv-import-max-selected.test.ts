import assert from 'node:assert/strict'
import test from 'node:test'
import { buildImportPlan } from '../../apps/admin/src/cms/csv-io.ts'
import { collectionRegistry } from '../../apps/admin/src/cms/registry.ts'
import type { AdminRecord, FieldContext } from '../../apps/admin/src/cms/types.ts'

/* ------------------------------------------------------------------ */
/*  Fixtures — a minimal field context for the products collection    */
/* ------------------------------------------------------------------ */

const subjects = ['math', 'english', 'science', 'history']
const valueLists = {
  grades: ['Grade 4'],
  terms: ['Term 1'],
  years: ['2026'],
  resourceFormats: ['PDF'],
  subjects,
} as const

const ctx: FieldContext = {
  // The real ValueLists shape is wider; only the slices the import touches matter here.
  valueLists: valueLists as unknown as FieldContext['valueLists'],
  optionsForSelect: () => [],
  optionsForReference: (field) => {
    if ('valueList' in field && field.valueList === 'subjects') {
      return subjects.map((value) => ({ label: value, value }))
    }
    if ('collection' in field && field.collection === 'faqs') {
      return ['f1', 'f2', 'f3'].map((value) => ({ label: value, value }))
    }
    return []
  },
}

const products = collectionRegistry.find((c) => c.id === 'products')!

const blank = (): AdminRecord =>
  ({
    id: '',
    title: 'New product',
    slug: '',
    subjects: [],
    faqs: [],
  }) as unknown as AdminRecord

function importCsv(text: string) {
  return buildImportPlan({
    text,
    collection: products,
    records: [],
    ctx,
    createBlank: blank,
  })
}

/* ------------------------------------------------------------------ */
/*  CSV import — maxSelected enforcement                              */
/* ------------------------------------------------------------------ */

test('CSV import keeps a single subject for products (maxSelected 1)', () => {
  const plan = importCsv('subjects\nmath')
  assert.equal(plan.rows.length, 1)
  assert.deepEqual(plan.rows[0].record.subjects, ['math'])
})

test('CSV import rejects multiple subjects instead of silently discarding one', () => {
  const plan = importCsv('subjects\nmath; english')
  assert.equal(plan.rows.length, 1)
  assert.equal(plan.validCount, 0)
  assert.deepEqual(plan.rows[0].record.subjects, [])
  assert.ok(plan.rows[0].errors.includes('Subject: select at most 1 value'))
})

test('CSV import keeps every value for unlimited multiReference fields (faqs)', () => {
  const plan = importCsv('faqs\nf1; f2; f3')
  assert.equal(plan.rows.length, 1)
  assert.equal(plan.rows[0].record.faqs.length, 3)
  assert.deepEqual(plan.rows[0].record.faqs, ['f1', 'f2', 'f3'])
})

test('only the product subject field carries a selection limit', () => {
  const unlimited = products.fields.find((f) => f.key === 'faqs')!
  assert.equal((unlimited as { maxSelected?: number }).maxSelected, undefined)
})
