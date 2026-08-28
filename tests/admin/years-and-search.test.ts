import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { currentYear, yearOptions } from '../../apps/admin/src/cms/years.ts'
import { matchesSearch } from '../../apps/admin/src/cms/record.ts'
import { collectionRegistry } from '../../apps/admin/src/cms/registry.ts'
import type { AdminRecord } from '../../apps/admin/src/cms/types.ts'

/** Source with comments stripped — these files quote the code they replaced. */
const readCode = (path: string) =>
  readFileSync(new URL(`../../apps/admin/src/${path}`, import.meta.url), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

const collection = (id: string) => {
  const found = collectionRegistry.find((entry) => entry.id === id)
  assert.ok(found, `expected a "${id}" collection`)
  return found
}

/* Mid-year so no timezone can push it across a year boundary. */
const at = (year: number) => new Date(`${year}-06-15T12:00:00Z`)

/* -------------------------------------------------------------------------
   Years — the list was ['2024','2025','2026'] literal in the schema, and a
   new record defaulted to years[0], which is the OLDEST of them.
   ------------------------------------------------------------------------- */

test('a new record starts on the current year, not the oldest year on file', () => {
  assert.equal(currentYear(at(2026)), '2026')
  assert.equal(currentYear(at(2031)), '2031')

  // The bug this replaced: `year: vl.years[0] ?? '2026'` filed every new
  // product and bundle under 2024, the first entry in the stored list.
  const adapter = readCode('cms/adapter.ts')
  assert.doesNotMatch(adapter, /vl\.years\[0\]/, 'createBlank must not default to the first stored year')
  assert.equal(
    (adapter.match(/year: currentYear\(\)/g) ?? []).length,
    2,
    'both products and bundles should default to the current year',
  )
})

test('the year window reaches two years back and one ahead', () => {
  // One year ahead because next year's material gets prepared before the year
  // turns; two back because last year's is still being corrected and filed.
  assert.deepEqual(yearOptions([], at(2026)), ['2027', '2026', '2025', '2024'])
})

test('the window moves with the clock, so no migration is needed to reach a new year', () => {
  const options = yearOptions([], at(2031))
  assert.ok(options.includes('2031'), 'the current year must always be selectable')
  assert.ok(options.includes('2032'), 'next year must always be selectable')
  assert.deepEqual(options, ['2032', '2031', '2030', '2029'])
})

test('years newest first — the likely choice is not at the bottom of the list', () => {
  const options = yearOptions(['2024', '2025', '2026'], at(2026))
  assert.deepEqual([...options].sort((a, b) => Number(b) - Number(a)), options)
})

test('stored years outside the window survive, so an old record keeps a valid option', () => {
  // Without this a product filed under 2019 would hold a value the Select has
  // no entry for — it would render blank and be rewritten on the next save.
  const options = yearOptions(['2019', '2024'], at(2026))
  assert.ok(options.includes('2019'), '2019 is some record’s current value')
  assert.deepEqual(options, ['2027', '2026', '2025', '2024', '2019'])
})

test('stored years inside the window are not duplicated', () => {
  const options = yearOptions(['2026', '2026', '2025'], at(2026))
  assert.deepEqual(options, ['2027', '2026', '2025', '2024'])
})

test('an unexpected stored value is kept rather than dropped', () => {
  // Dropping it would take away the option a record is currently using, which
  // is the exact failure this function exists to avoid.
  const options = yearOptions(['2024/2025'], at(2026))
  assert.ok(options.includes('2024/2025'))
  assert.equal(options.at(-1), '2024/2025', 'non-years sort last, but they stay')
})

test('the year field is a select over the years list on both catalogue collections', () => {
  for (const id of ['products', 'bundles']) {
    const year = collection(id).fields.find((f) => f.key === 'year')
    assert.ok(year, `${id} should carry a year field`)
    assert.equal(year.type, 'select')
    assert.equal((year as { valueList?: string }).valueList, 'years')
  }
  // And the options come from the clock rather than straight from the snapshot.
  assert.match(readCode('cms/adapter.ts'), /field\.valueList === 'years'/)
})

/* -------------------------------------------------------------------------
   Search — scoped to the record's name and nothing else.

   It previously matched across slug, grade, term, year, format and subjects,
   which made results hard to predict: typing "test" surfaced everything whose
   *format* was a test. Structured narrowing is the filter popover's job; the
   text box answers "what is it called".
   ------------------------------------------------------------------------- */

test('every collection searches exactly its own title field', () => {
  // The invariant that keeps the text box and the row's primary label agreeing
  // about what a record is called. It also catches a copy-paste: formContact's
  // title is `email`, not `name`, and two collections had identical lists.
  for (const entry of collectionRegistry) {
    assert.deepEqual(
      entry.searchFields,
      [entry.titleField],
      `${entry.id} should search only its titleField (${entry.titleField})`,
    )
  }
})

const product = {
  id: 'p1',
  title: 'Grade 6 Mathematics Term 1 Test + Memo',
  slug: 'grade-6-mathematics-term-1-test-memo',
  grade: 'Grade 6',
  term: 'Term 1',
  year: '2026',
  resourceFormat: 'Test / Assessment',
  subjects: ['Mathematics'],
} as unknown as AdminRecord

const find = (query: string) => matchesSearch(product, collection('products').searchFields, query)

test('several words from the name match, in any order', () => {
  // Still tokenised, just against one field: the words are all in the title,
  // and a single-substring test would fail on both of these.
  assert.equal(find('test grade 6'), true)
  assert.equal(find('memo mathematics'), true)
})

test('every token must be in the name, so the search still narrows', () => {
  assert.equal(find('grade 7'), false)
  assert.equal(find('mathematics history'), false)
})

test('nothing outside the name is searched', () => {
  assert.equal(find('2026'), false, 'year is a filter, not text')
  assert.equal(find('assessment'), false, 'resourceFormat is not searched')
  assert.equal(find('grade-6-mathematics'), false, 'the slug is not searched')
})

test('a subject only matches when it appears in the name itself', () => {
  // "Mathematics" is in this title, so it matches — but via the title, not the
  // subjects array. A product whose subject is absent from its name will not.
  assert.equal(find('mathematics'), true)
  const renamed = { ...product, title: 'Grade 6 Term 1 Test + Memo' } as unknown as AdminRecord
  assert.equal(matchesSearch(renamed, collection('products').searchFields, 'mathematics'), false)
})

test('an empty or whitespace query matches everything', () => {
  assert.equal(find(''), true)
  assert.equal(find('   '), true)
})

test('search is not fuzzy, and does not pretend to be', () => {
  // "maths" will not find "Mathematics". Left deliberately: that wants a
  // synonym list, and inventing one silently is worse than not having it.
  assert.equal(find('maths'), false)
})

test('the workspace filters through matchesSearch, not its own substring test', () => {
  const workspace = readCode('screens/AdminWorkspace.tsx')
  assert.match(workspace, /matchesSearch\(record, collection\.searchFields, search\)/)
  assert.doesNotMatch(workspace, /searchFields\.some/, 'the per-field substring test should be gone')
})
