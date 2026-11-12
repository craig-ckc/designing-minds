import assert from 'node:assert/strict'
import test from 'node:test'
import { formatDisplayDate } from '../../apps/web/src/lib/format-date.ts'

test('formats ISO dates as day, short month and year', () => {
  assert.equal(formatDisplayDate('2026-11-04'), '4 Nov 2026')
  assert.equal(formatDisplayDate('2026-01-31'), '31 Jan 2026')
  assert.equal(formatDisplayDate('2026-12-09'), '9 Dec 2026')
})

test('date-times keep their own calendar date, with no timezone shift', () => {
  assert.equal(formatDisplayDate('2026-11-04T23:59:59.999Z'), '4 Nov 2026')
  assert.equal(formatDisplayDate('2026-11-05T00:00:00+00:00'), '5 Nov 2026')
  assert.equal(formatDisplayDate('2026-11-04T23:30:00-05:00'), '4 Nov 2026')
})

test('non-ISO or impossible month input is returned unchanged', () => {
  assert.equal(formatDisplayDate(''), '')
  assert.equal(formatDisplayDate('yesterday'), 'yesterday')
  assert.equal(formatDisplayDate('2026-13-01'), '2026-13-01')
})
