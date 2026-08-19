import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

/* -------------------------------------------------------------------------
   private.published_products() is declared `returns setof public.products`,
   which Postgres matches by column INDEX, not by name. Its select list must
   therefore line up with the table position for position, and ALTER TABLE can
   only ever APPEND — so a column that reads naturally in the middle of the
   table sits at a different index on a migrated database than on a fresh one.

   Getting this wrong does not fail quietly: the patch is rejected outright with
   "return type mismatch ... returns jsonb instead of boolean". These tests pin
   the invariant in the repo instead of in the SQL editor.
   ------------------------------------------------------------------------- */

const read = (path: string) => readFileSync(new URL(`../../supabase/${path}`, import.meta.url), 'utf8')

/** Column names of a `create table` block, in declared order. */
function tableColumns(sql: string, table: string): string[] {
  const start = sql.indexOf(`create table if not exists ${table} (`)
  assert.notEqual(start, -1, `expected a create table for ${table}`)
  const body = sql.slice(sql.indexOf('(', start) + 1, sql.indexOf('\n);', start))
  return body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('--'))
    .map((line) => /^"?([A-Za-z_][A-Za-z0-9_]*)"?\s/.exec(line)?.[1])
    .filter((name): name is string => Boolean(name))
}

/** Top-level entries of the select list in a `published_*` function body. */
function selectEntries(sql: string, fn: string, from: string): string[] {
  // Either creation form: the patch must DROP and re-CREATE published_bundles(),
  // because CREATE OR REPLACE cannot change a `returns table` row type (42P13).
  const at = Math.max(sql.indexOf(`create or replace function ${fn}`), sql.indexOf(`create function ${fn}`))
  assert.notEqual(at, -1, `expected ${fn} in this file`)
  const raw = sql.slice(sql.indexOf('  select\n', at) + '  select\n'.length, sql.indexOf(from, at))
  // Comments come out FIRST: prose contains commas and parens, and both would
  // otherwise be read as SQL structure by the splitter below.
  const body = raw.replace(/--[^\n]*/g, '')

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

for (const file of ['schema.sql', 'patch/2026-08-19-catalogue-preview-gallery.sql']) {
  test(`${file}: published_products() lines up with public.products position for position`, () => {
    const schema = read('schema.sql')
    const sql = read(file)
    const columns = tableColumns(schema, 'public.products')
    const entries = selectEntries(sql, 'private.published_products()', 'from public.products p')

    assert.equal(
      entries.length,
      columns.length,
      `select list has ${entries.length} entries but public.products has ${columns.length} columns`,
    )

    // Every entry that names its column must name the one at its own index.
    entries.forEach((entry, index) => {
      const named = /^p\."?([A-Za-z_][A-Za-z0-9_]*)"?$/.exec(entry)?.[1]
      if (!named) return // a computed entry (the purchasedFiles rebuild) has no name
      assert.equal(named, columns[index], `select entry ${index} is ${named}, but column ${index} is ${columns[index]}`)
    })
  })
}

test('galleryImages is the last column, because ALTER TABLE can only append', () => {
  // A fresh database (schema.sql) and a migrated one (the patch's ALTER) must
  // end up with the SAME column order, or one of them gets a function compiled
  // against the wrong indexes.
  const columns = tableColumns(read('schema.sql'), 'public.products')
  assert.equal(columns.at(-1), 'galleryImages', 'galleryImages must be declared last in public.products')

  const patch = read('patch/2026-08-19-catalogue-preview-gallery.sql')
  assert.match(patch, /alter table public\.products\s*\n\s*add column if not exists "galleryImages"/)

  for (const file of ['schema.sql', 'patch/2026-08-19-catalogue-preview-gallery.sql']) {
    const entries = selectEntries(read(file), 'private.published_products()', 'from public.products p')
    assert.equal(entries.at(-1), 'p."galleryImages"', `${file}: galleryImages must be last in the select list`)
  }
})

test('published_bundles() is matched by name, so its order only has to match itself', () => {
  // This one declares an explicit `returns table (...)`, so the risk is
  // different: the return table and the select list must agree with each other,
  // but neither depends on the physical column order of public.bundles.
  for (const file of ['schema.sql', 'patch/2026-08-19-catalogue-preview-gallery.sql']) {
    const sql = read(file)
    const at = Math.max(
      sql.indexOf('create or replace function private.published_bundles()'),
      sql.indexOf('create function private.published_bundles()'),
    )
    const returnTable = sql.slice(sql.indexOf('returns table (', at), sql.indexOf(')\nlanguage sql', at))
    const declared = [...returnTable.matchAll(/^\s+"?([A-Za-z_][A-Za-z0-9_]*)"?\s+[a-z]/gm)].map((m) => m[1])
    const entries = selectEntries(sql, 'private.published_bundles()', 'from public.bundles b')

    assert.equal(declared.length, entries.length, `${file}: bundle return table and select list differ in length`)
    assert.ok(declared.includes('galleryImages'), `${file}: bundles should return galleryImages`)
    assert.equal(
      declared.indexOf('galleryImages'),
      entries.findIndex((entry) => entry.includes('"galleryImages"')),
      `${file}: galleryImages sits at different indexes in the bundle return table and select list`,
    )
  }
})
