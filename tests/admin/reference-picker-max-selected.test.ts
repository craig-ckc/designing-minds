import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  availableOptions,
  enforceMaxSelected,
} from '../../apps/admin/src/components/primitives/reference-picker-utils.ts'
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

/* ------------------------------------------------------------------ */
/*  The control a capped reference actually renders                   */
/* ------------------------------------------------------------------ */

const readAdmin = (path: string) =>
  readFileSync(new URL(`../../apps/admin/src/${path}`, import.meta.url), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

test('a reference capped at one renders a dropdown, not the chip picker', () => {
  // `maxSelected: 1` and a type-ahead-plus-chips control contradict each other:
  // the control invites you to add more than the field permits. Products'
  // Subject is the case in point — one subject, but it looked like many.
  const control = readAdmin('components/editor/FieldControl.tsx')
  assert.match(control, /reference\.maxSelected === 1/, 'the capped case should branch before the picker')
  const capped = control.slice(control.indexOf('reference.maxSelected === 1'))
  const untilPicker = capped.slice(0, capped.indexOf('<ReferencePicker'))
  assert.match(untilPicker, /<Select/, 'the capped branch should render a Select')
})

test('the dropdown still writes the array shape the column expects', () => {
  // Product.subjects is `string[]` and required to hold at least one, so a
  // single-choice control must write `['Maths']` / `[]` — never `'Maths'` or
  // `['']`, either of which would pass the required check while being wrong.
  const control = readAdmin('components/editor/FieldControl.tsx')
  const capped = control.slice(control.indexOf('reference.maxSelected === 1'))
  assert.match(capped, /\[next\]/, 'a chosen value should be wrapped in an array')
  assert.match(capped, /\?\s*\[\]\s*:/, 'clearing should write an empty array')
})

test('uncapped references keep the type-ahead picker', () => {
  // Bundle contents and FAQs genuinely take many, and a dropdown cannot express
  // that — the branch above must not swallow them.
  const control = readAdmin('components/editor/FieldControl.tsx')
  assert.match(control, /<ReferencePicker/)
  assert.match(control, /maxSelected=\{reference\.maxSelected\}/)
})

/* ------------------------------------------------------------------ */
/*  availableOptions — what the type-ahead is allowed to suggest      */
/* ------------------------------------------------------------------ */

const opt = (value: string) => ({ label: value.toUpperCase(), value })

test('an option already picked is not suggested again', () => {
  // Leaving it in reads as a second, different record: from the dropdown alone
  // you cannot tell whether the row is the one you added or another like it.
  const options = [opt('a'), opt('b'), opt('c')]
  assert.deepEqual(
    availableOptions(options, ['b']).map((o) => o.value),
    ['a', 'c'],
  )
})

test('the remaining options keep their original order', () => {
  const options = [opt('a'), opt('b'), opt('c'), opt('d')]
  assert.deepEqual(
    availableOptions(options, ['c', 'a']).map((o) => o.value),
    ['b', 'd'],
  )
})

test('nothing selected returns the very same array, not a copy', () => {
  // The common case for a fresh record; there is nothing to filter, so it
  // should not allocate a new list on every keystroke.
  const options = [opt('a'), opt('b')]
  assert.equal(availableOptions(options, []), options)
})

test('selecting everything leaves nothing to suggest', () => {
  const options = [opt('a'), opt('b')]
  assert.deepEqual(availableOptions(options, ['a', 'b']), [])
})

test('a selected id that matches no option removes nothing', () => {
  // A stale reference — a member whose record was deleted — must not silently
  // eat an unrelated suggestion.
  const options = [opt('a'), opt('b')]
  assert.deepEqual(
    availableOptions(options, ['ghost']).map((o) => o.value),
    ['a', 'b'],
  )
})

test('the picker feeds the combobox the filtered list, and says why it is empty', () => {
  const picker = readAdmin('components/primitives/ReferencePicker.tsx')
  assert.match(picker, /items=\{available\}/, 'the combobox should only ever offer what is available')
  // "No matches" is the wrong answer when the real reason is that every option
  // is already in — that would read as a broken search.
  assert.match(picker, /Everything is already added\./)
  // The check indicator and selected weight can no longer occur: nothing in the
  // list is ever a current selection.
  assert.doesNotMatch(picker, /ItemIndicator/)
  assert.doesNotMatch(picker, /data-\[selected\]/)
})
