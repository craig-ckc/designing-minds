import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const read = (path: string) => readFileSync(new URL(`../../apps/web/src/${path}`, import.meta.url), 'utf8')

test('homepage trust stats show Amy’s curated brand figures', () => {
  const section = read('components/sections/trust-stats-section.tsx')
  const content = read('content/site.ts')

  // Curated marketing figures (Amy's feedback), not derived from the live catalogue.
  assert.match(content, /const CUSTOMERS = '750\+'/)
  assert.match(section, /value: SOCIAL_PROOF\.customers, label: 'Customers'/)
  assert.match(section, /value: '360', label: 'Resources'/)
  assert.match(section, /value: '11', label: 'Subjects covered'/)
  assert.match(section, /value: '5', label: 'Grades currently supported'/)

  // The old snapshot-derived / hardcoded claims are gone.
  assert.doesNotMatch(section, /snapshot\.stats/)
  assert.doesNotMatch(section, /Families helped/)
})

test('every social-proof claim is built from the one declared customer count', () => {
  const content = read('content/site.ts')
  const hero = read('components/sections/home-hero-section.tsx')

  // The hero claim is composed from the same count the stats band shows, so the
  // two cannot drift into quoting different numbers the way they once did.
  assert.match(content, /const RATING = 4\.9/)
  assert.match(content, /ratingClaim: `\$\{RATING\} stars from \$\{CUSTOMERS\} families`/)
  assert.match(hero, /\{SOCIAL_PROOF\.ratingClaim\}/)
  assert.match(hero, /value=\{SOCIAL_PROOF\.rating\}/)

  // Neither the figure nor the rating is restated as a literal at a call site.
  assert.doesNotMatch(hero, /stars from \d/)
  assert.doesNotMatch(hero, /value=\{4\.9\}/)
})

test('750+ is the only customer figure in the storefront — no page quotes a rival number', () => {
  const srcDir = fileURLToPath(new URL('../../apps/web/src/', import.meta.url))
  const offenders = readdirSync(srcDir, { recursive: true, encoding: 'utf8' })
    .filter((file) => /\.(ts|tsx|json)$/.test(file))
    .filter((file) => /\b\d+\+ (families|customers|parents)\b/i.test(readFileSync(srcDir + file, 'utf8')))

  // "500+ families" in the hero and "750+ Customers" in the stats band once
  // contradicted each other across the home and about pages. Social proof reads
  // its count from SOCIAL_PROOF now, so no literal should reappear.
  assert.deepEqual(offenders, [], 'social-proof counts must come from SOCIAL_PROOF.customers')
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
