import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(new URL(`../../apps/web/src/${path}`, import.meta.url), 'utf8')

test('catalogues use full-width containers and one grid cell per product or bundle', () => {
  for (const page of ['shop', 'packages']) {
    const source = read(`pages/${page}-page.tsx`)
    assert.match(source, /width="full"/)
    assert.match(source, /className="catalog-grid"/)
    assert.doesNotMatch(source, /col-span-2/)
    assert.doesNotMatch(source, /<Container(?:>| className)/)
  }
  assert.match(read('index.css'), /\.catalog-grid\s*{[^}]*grid-cols-1[^}]*sm:grid-cols-2[^}]*lg:grid-cols-3[^}]*xl:grid-cols-4/)
})

test('standard page shells are wider while readable copy remains constrained', () => {
  assert.match(read('index.css'), /--container-page: 1440px/)
  assert.match(read('index.css'), /--container-prose: 680px/)
  assert.match(read('components/ui/container.tsx'), /width === 'full' \? 'max-w-none' : 'max-w-page'/)
  assert.match(read('components/ui/headings.tsx'), /className="max-w-prose"/)
})
