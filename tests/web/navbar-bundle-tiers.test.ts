import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import type { Bundle } from '../../packages/cms/src/types.ts'
import { makeBundle, makeSnapshot } from '../support/fixtures.ts'
import { bundleTiers } from '../../packages/cms/src/lib/formatters.ts'

// Deliberately no default bundleScope: the rule under test is that only bundles with an actual scope form a tier.
const product = (overrides: Partial<Bundle> & Pick<Bundle, 'slug'>): Bundle => makeBundle({ bundleScope: undefined, ...overrides })

const snapshot = (bundles: Bundle[]) => makeSnapshot({ bundles })

test('navbar bundle tiers come only from published bundles with an actual bundle scope', () => {
  // "From" is the real cheapest published bundle in the tier, not a fixed
  // marketing number — a hardcoded floor overstates the entry price the moment
  // a cheaper bundle is published.
  const tiers = bundleTiers(snapshot([
    product({ slug: 'grade-3-term', bundleScope: 'Term', priceZar: 200 }),
    product({ slug: 'grade-4-term', grade: 'Grade 4', bundleScope: 'Term', priceZar: 350 }),
    product({ slug: 'grade-3-year', bundleScope: 'Full Year', priceZar: 1200 }),
    product({ slug: 'unpublished-year', bundleScope: 'Full Year', priceZar: 1, published: false }),
    product({ slug: 'unscoped-bundle', priceZar: 1 }),
  ]))

  assert.deepEqual(tiers, [
    { scope: 'Term', title: 'Term bundles', fromPriceZar: 200, gradeCount: 2, featured: false },
    { scope: 'Full Year', title: 'Full-year bundles', fromPriceZar: 1200, gradeCount: 1, featured: true },
  ])
})

test('navbar omits a bundle tier when no matching published bundle exists', () => {
  assert.deepEqual(bundleTiers(snapshot([
    product({ slug: 'term', bundleScope: 'Term', priceZar: 350 }),
  ])), [
    { scope: 'Term', title: 'Term bundles', fromPriceZar: 350, gradeCount: 1, featured: false },
  ])
})

test('homepage promotes actual catalogue cards before testimonials while tier offers retain their filtered links', () => {
  const home = readFileSync(new URL('../../apps/web/src/pages/home-page.tsx', import.meta.url), 'utf8')
  const section = readFileSync(new URL('../../apps/web/src/components/sections/bundle-pricing-section.tsx', import.meta.url), 'utf8')

  const featuredIndex = home.indexOf('<HomeFeaturedSection')
  assert.ok(featuredIndex >= 0)
  assert.ok(featuredIndex < home.indexOf('<HomeTestimonialsSection'))
  assert.match(section, /bundleTiers|BundleTier/)
  assert.match(section, /\/packages\?offer=\$\{encodeURIComponent\(offer\)\}/)
  assert.doesNotMatch(section, /Access Plan|Essential|Premium/)
})
