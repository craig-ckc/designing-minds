import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('database slug redirects use the canonical /shop product route', () => {
  const schema = readFileSync(new URL('../../supabase/schema.sql', import.meta.url), 'utf8')
  assert.match(schema, /old_path text := '\/shop\/' \|\| old\.slug/)
  assert.match(schema, /new_path text := '\/shop\/' \|\| new\.slug/)
  assert.match(schema, /\('\/shop\/' \|\| p\.slug\) = sr\."toPath"/)
})
