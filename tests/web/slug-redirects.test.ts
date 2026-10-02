import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('database slug redirects use the canonical /shop product route', () => {
  const schema = readFileSync(new URL('../../supabase/schema.sql', import.meta.url), 'utf8')
  assert.match(schema, /old_path text := '\/shop\/' \|\| old\.slug/)
  assert.match(schema, /new_path text := '\/shop\/' \|\| new\.slug/)
  // Redirects follow the LIVE slug: a slug changed in a Draft must not redirect
  // to a page the website doesn't serve yet.
  assert.match(schema, /\('\/shop\/' \|\| \(p\.live ->> 'slug'\)\) = sr\."toPath"/)
})
