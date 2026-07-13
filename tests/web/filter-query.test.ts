import assert from 'node:assert/strict'
import test from 'node:test'
import { clearQueryValues, readQueryList, setQueryValue, toggleQueryValue } from '../../apps/web/src/lib/filter-query.ts'

test('reads repeated valid values and ignores duplicates and unavailable options', () => {
  const params = new URLSearchParams('subject=Mathematics&subject=Unknown&subject=Mathematics&subject=History')
  assert.deepEqual(readQueryList(params, 'subject', ['Mathematics', 'History']), ['Mathematics', 'History'])
})

test('toggles one repeated value without losing other parameters', () => {
  const params = new URLSearchParams('subject=Mathematics&subject=History&campaign=winter')
  const removed = toggleQueryValue(params, 'subject', 'Mathematics')
  assert.deepEqual(removed.getAll('subject'), ['History'])
  assert.equal(removed.get('campaign'), 'winter')

  const added = toggleQueryValue(removed, 'subject', 'Geography')
  assert.deepEqual(added.getAll('subject'), ['History', 'Geography'])
})

test('sets and removes a scalar query value', () => {
  const params = new URLSearchParams('campaign=winter')
  assert.equal(setQueryValue(params, 'q', ' maths ').get('q'), 'maths')
  assert.equal(setQueryValue(new URLSearchParams('q=maths'), 'q', ' ').has('q'), false)
})

test('reset removes page filters but preserves unrelated parameters', () => {
  const params = new URLSearchParams('q=maths&grade=Grade+4&campaign=winter')
  const reset = clearQueryValues(params, ['q', 'grade'])
  assert.equal(reset.toString(), 'campaign=winter')
})
