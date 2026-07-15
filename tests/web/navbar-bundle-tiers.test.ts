import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import type { CmsSnapshot, Product } from '../../packages/cms/src/types.ts'
import { bundleTiers } from '../../packages/cms/src/lib/formatters.ts'

const product = (overrides: Partial<Product> & Pick<Product, 'slug'>): Product => ({
  id: overrides.slug,
  title: overrides.slug,
  shortDescription: '',
  fullDescription: '',
  priceZar: 0,
  grade: 'Grade 3',
  term: 'Term 1',
  year: '2026',
  productKind: 'Bundle',
  resourceFormat: 'Test / Assessment',
  subjects: ['Mathematics'],
  marks: null,
  purchasedFiles: [],
  featured: false,
  published: true,
  sortOrder: 0,
  seo: { title: '', description: '' },
  faqs: [],
  updatedAt: '2026-01-01',
  ...overrides,
})

const snapshot = (products: Product[]) => ({ products }) as CmsSnapshot

test('navbar bundle tiers come only from published bundles with an actual bundle scope', () => {
  const tiers = bundleTiers(snapshot([
    product({ slug: 'grade-3-term', bundleScope: 'Term', priceZar: 200 }),
    product({ slug: 'grade-4-term', grade: 'Grade 4', bundleScope: 'Term', priceZar: 350 }),
    product({ slug: 'grade-3-year', bundleScope: 'Full Year', priceZar: 1200 }),
    product({ slug: 'legacy-plan', productKind: 'Access Plan', accessPeriod: 'Term', priceZar: 1 }),
    product({ slug: 'unpublished-year', bundleScope: 'Full Year', priceZar: 1, published: false }),
    product({ slug: 'unscoped-bundle', priceZar: 1 }),
  ]))

  assert.deepEqual(tiers, [
    { scope: 'Term', title: 'Term bundles', fromPriceZar: 350, gradeCount: 2, featured: false },
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

test('homepage promotes bundle cards before testimonials and links each card to its offer', () => {
  const home = readFileSync(new URL('../../apps/web/src/pages/home-page.tsx', import.meta.url), 'utf8')
  const section = readFileSync(new URL('../../apps/web/src/components/sections/bundle-pricing-section.tsx', import.meta.url), 'utf8')

  assert.ok(home.indexOf('<HomeBundlesSection') < home.indexOf('<HomeTestimonialsSection'))
  assert.match(section, /bundleTiers|BundleTier/)
  assert.match(section, /\/packages\?offer=\$\{encodeURIComponent\(offer\)\}/)
  assert.doesNotMatch(section, /Access Plan|Essential|Premium/)
})

test('navbar no longer presents access plans', () => {
  const navbar = readFileSync(new URL('../../apps/web/src/components/layout/navbar.tsx', import.meta.url), 'utf8')

  assert.doesNotMatch(navbar, /Access plans|access plans|Essential|Premium/)
  assert.match(navbar, /label="Bundles"/)
})
