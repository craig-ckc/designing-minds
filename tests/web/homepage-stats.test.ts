import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(new URL(`../../apps/web/src/${path}`, import.meta.url), 'utf8')

test('homepage trust stats show Amy’s curated brand figures', () => {
  const section = read('components/sections/trust-stats-section.tsx')

  // Curated marketing figures (Amy's feedback), not derived from the live catalogue.
  assert.match(section, /value: '750\+', label: 'Customers'/)
  assert.match(section, /value: '360', label: 'Resources'/)
  assert.match(section, /value: '11', label: 'Subjects covered'/)
  assert.match(section, /value: '5', label: 'Grades currently supported'/)

  // The old snapshot-derived / hardcoded claims are gone.
  assert.doesNotMatch(section, /snapshot\.stats/)
  assert.doesNotMatch(section, /Families helped/)
  assert.doesNotMatch(section, /500\+/)
})

test('trust-stats section no longer needs a snapshot prop', () => {
  const section = read('components/sections/trust-stats-section.tsx')
  const home = read('pages/home-page.tsx')
  const about = read('pages/about-page.tsx')

  assert.doesNotMatch(section, /snapshot: CmsSnapshot/)
  // Call sites pass only the optional caption, not the catalogue snapshot.
  assert.match(home, /<TrustStatsSection \/>/)
  assert.match(about, /<TrustStatsSection caption="The difference we’ve made so far" \/>/)
})
