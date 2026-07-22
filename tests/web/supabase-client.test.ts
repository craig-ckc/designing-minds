import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('browser repositories reuse the app auth client', () => {
  for (const sourcePath of ['apps/web/src/repository.ts', 'apps/admin/src/repository.ts']) {
    const source = readFileSync(new URL(`../../${sourcePath}`, import.meta.url), 'utf8')
    assert.match(source, /supabaseClient: supabase/)
  }
})
