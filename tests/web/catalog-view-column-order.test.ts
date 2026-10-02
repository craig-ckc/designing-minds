import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

/* -------------------------------------------------------------------------
   The public catalogue functions (private.published_products / _bundles /
   _faqs / _testimonials) each declare an explicit `returns table (...)` and
   build their rows from the record's LIVE copy. Postgres matches the select
   list to that declaration by POSITION, so the two must line up entry for
   entry — a swap compiles if the types happen to agree and then serves, say,
   the price under the wrong column.

   (They used to return `setof public.products`, which tied the select list to
   the physical table order instead. The 2026-10-01 publish-workflow patch
   moved every one of them to a declared row type, which removed that trap.)
   ------------------------------------------------------------------------- */

const read = (path: string) => readFileSync(new URL(`../../supabase/${path}`, import.meta.url), 'utf8')

const LATEST_REBUILD_PATCH = 'patch/2026-10-01-publish-workflow.sql'

const FUNCTIONS = [
  { fn: 'private.published_products()', from: 'from public.products p' },
  { fn: 'private.published_bundles()', from: 'from public.bundles b' },
  { fn: 'private.published_faqs()', from: 'from public.faqs f' },
  { fn: 'private.published_testimonials()', from: 'from public.testimonials t' },
]

function functionAt(sql: string, fn: string): number {
  // Either creation form: a changed `returns table` row type needs DROP + CREATE.
  const at = Math.max(sql.indexOf(`create or replace function ${fn}`), sql.indexOf(`create function ${fn}`))
  assert.notEqual(at, -1, `expected ${fn} in this file`)
  return at
}

/** Column names of the declared `returns table (...)`, in order. */
function declaredColumns(sql: string, fn: string): string[] {
  const at = functionAt(sql, fn)
  const body = sql.slice(sql.indexOf('returns table (', at), sql.indexOf(')\nlanguage sql', at))
  return [...body.matchAll(/^\s+"?([A-Za-z_][A-Za-z0-9_]*)"?\s+[a-z]/gm)].map((m) => m[1])
}

/** Top-level entries of the function's select list. */
function selectEntries(sql: string, fn: string, from: string): string[] {
  const at = functionAt(sql, fn)
  const start = sql.indexOf('select', sql.indexOf('as $$', at)) + 'select'.length
  // Comments come out FIRST: prose contains commas and parens, and both would
  // otherwise be read as SQL structure by the splitter below.
  const body = sql.slice(start, sql.indexOf(from, at)).replace(/--[^\n]*/g, '')

  // Split on commas at paren depth 0, so a multi-line coalesce(...) counts once.
  const entries: string[] = []
  let depth = 0
  let current = ''
  for (const char of body) {
    if (char === '(') depth += 1
    if (char === ')') depth -= 1
    if (char === ',' && depth === 0) {
      entries.push(current)
      current = ''
      continue
    }
    current += char
  }
  if (current.trim()) entries.push(current)
  return entries.map((entry) => entry.split('\n').map((line) => line.trim()).filter(Boolean).join(' '))
}

/** The column an entry reads, when it names one: `l."priceZar"`, `coalesce(l."galleryImages", …)`. */
function namedColumn(entry: string): string | null {
  const direct = /^[a-z]\."?([A-Za-z_][A-Za-z0-9_]*)"?$/.exec(entry)?.[1]
  if (direct) return direct
  const wrapped = /^coalesce\(\s*[a-z]\."?([A-Za-z_][A-Za-z0-9_]*)"?\s*,/.exec(entry)?.[1]
  return wrapped ?? null
}

for (const file of ['schema.sql', LATEST_REBUILD_PATCH]) {
  for (const { fn, from } of FUNCTIONS) {
    test(`${file}: ${fn} select list lines up with its declared columns`, () => {
      const sql = read(file)
      const declared = declaredColumns(sql, fn)
      const entries = selectEntries(sql, fn, from)
      assert.equal(entries.length, declared.length, `${fn}: ${entries.length} select entries for ${declared.length} declared columns`)
      entries.forEach((entry, index) => {
        const named = namedColumn(entry)
        // Computed entries (the purchasedFiles rebuild, `true`, membership
        // arrays) carry no name to check.
        if (!named) return
        assert.equal(named, declared[index], `${fn}: entry ${index} reads ${named}, but column ${index} is ${declared[index]}`)
      })
    })
  }

  test(`${file}: the public catalogue reads only the live copy`, () => {
    const sql = read(file)
    for (const { fn, from } of FUNCTIONS) {
      const at = functionAt(sql, fn)
      const body = sql.slice(at, sql.indexOf('$$;', sql.indexOf('as $$', at)))
      assert.match(body, /jsonb_populate_record\(null::public\.[a-z_]+, [a-z]\.live\)/, `${fn} should build rows from the live copy`)
      assert.match(body, /where [a-z]\.live is not null/, `${fn} should list only records with a live copy`)
      assert.ok(body.includes(from), `${fn} should read ${from}`)
    }
  })
}

test('purchased-file storage keys never reach the public product view', () => {
  for (const file of ['schema.sql', LATEST_REBUILD_PATCH]) {
    const sql = read(file)
    const at = functionAt(sql, 'private.published_products()')
    const body = sql.slice(at, sql.indexOf('$$;', sql.indexOf('as $$', at)))
    assert.doesNotMatch(body, /storageKey/, `${file}: published_products() must rebuild purchasedFiles without storageKey`)
    assert.match(body, /'filename', file ->> 'filename'/)
  }
})
