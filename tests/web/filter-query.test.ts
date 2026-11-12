import assert from 'node:assert/strict'
import test from 'node:test'
import { clearQueryValues, gradeFromParam, normalizeGradeParams, readGradeList, readQueryList, setQueryValue, toggleQueryValue } from '../../apps/web/src/lib/filter-query.ts'

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

const GRADES = ['Grade 3', 'Grade 4', 'Grade 5']

test('grade params resolve from a slug or a label to the label', () => {
  assert.equal(gradeFromParam('grade-4', GRADES), 'Grade 4')
  assert.equal(gradeFromParam('Grade 4', GRADES), 'Grade 4')
  assert.equal(gradeFromParam('grade 4', GRADES), 'Grade 4')
  assert.equal(gradeFromParam('grade-9', GRADES), null)
  assert.equal(gradeFromParam('', GRADES), null)
  assert.deepEqual(readGradeList(new URLSearchParams('grade=grade-4&grade=Grade+4&grade=nope&grade=grade-5'), GRADES), ['Grade 4', 'Grade 5'])
})

test('normalising grade params rewrites slugs as labels so a toggle removes rather than duplicates', () => {
  const params = new URLSearchParams('grade=grade-4&campaign=winter')
  const normalised = normalizeGradeParams(params, GRADES)
  assert.deepEqual(normalised.getAll('grade'), ['Grade 4'])
  assert.equal(normalised.get('campaign'), 'winter')
  assert.deepEqual(toggleQueryValue(normalised, 'grade', 'Grade 4').getAll('grade'), [])
})
