import assert from 'node:assert/strict'
import test from 'node:test'
import { enforceMaxSelected } from '../../apps/admin/src/components/primitives/reference-picker-utils.ts'
import { collectionRegistry } from '../../apps/admin/src/cms/registry.ts'

/* ------------------------------------------------------------------ */
/*  enforceMaxSelected — pure trimming logic                          */
/* ------------------------------------------------------------------ */

test('returns the same array when under the limit', () => {
  const items = ['a', 'b']
  assert.deepEqual(enforceMaxSelected(items, 3), ['a', 'b'])
})

test('returns the same array when exactly at the limit', () => {
  const items = ['a', 'b']
  assert.deepEqual(enforceMaxSelected(items, 2), ['a', 'b'])
})

test('keeps only the most recent picks when over the limit', () => {
  const items = ['a', 'b', 'c']
  assert.deepEqual(enforceMaxSelected(items, 2), ['b', 'c'])
})

test('with maxSelected 1, selecting a second item replaces the first', () => {
  assert.deepEqual(enforceMaxSelected(['a', 'b'], 1), ['b'])
})

test('with maxSelected 1, a single item passes through', () => {
  assert.deepEqual(enforceMaxSelected(['x'], 1), ['x'])
})

test('with maxSelected 1, an empty array passes through', () => {
  assert.deepEqual(enforceMaxSelected([], 1), [])
})

test('trims to the last N items preserving order', () => {
  const items = ['math', 'english', 'science', 'history']
  assert.deepEqual(enforceMaxSelected(items, 2), ['science', 'history'])
})

/* ------------------------------------------------------------------ */
/*  Registry — products.subjects field configuration                  */
/* ------------------------------------------------------------------ */

test('products.subjects is a multiReference with maxSelected 1', () => {
  const products = collectionRegistry.find((c) => c.id === 'products')
  assert.ok(products, 'products collection exists')

  const subjects = products.fields.find((f) => f.key === 'subjects')
  assert.ok(subjects, 'subjects field exists')
  assert.equal(subjects.type, 'multiReference')
  assert.equal((subjects as any).maxSelected, 1)
})

test('products.subjects label reflects single-select', () => {
  const products = collectionRegistry.find((c) => c.id === 'products')
  const subjects = products!.fields.find((f) => f.key === 'subjects')!
  assert.equal(subjects.label, 'Subject')
})

test('other multiReference fields do not have maxSelected', () => {
  const products = collectionRegistry.find((c) => c.id === 'products')
  const faqs = products!.fields.find((f) => f.key === 'faqs')!
  assert.equal(faqs.type, 'multiReference')
  assert.equal((faqs as any).maxSelected, undefined)

  const bundles = collectionRegistry.find((c) => c.id === 'bundles')
  const included = bundles!.fields.find((f) => f.key === 'includedProductIds')!
  assert.equal(included.type, 'multiReference')
  assert.equal((included as any).maxSelected, undefined)
})
