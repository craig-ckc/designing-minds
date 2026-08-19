import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
const patch = read('supabase/patch/2026-08-19-amys-catalogue-feedback.sql')

test('Full Year Test Bundles are placed on hold, not deleted', () => {
  // Only the Full Year scope is touched, and it is unpublished + unfeatured
  // (hidden from the shop and bundle tiers) while the row itself stays put.
  assert.match(patch, /update public\.bundles\s+set published = false,\s+featured = false/s)
  assert.match(patch, /"bundleScope" = 'Full Year'/)
  // No bundle is ever deleted.
  assert.doesNotMatch(patch, /delete from public\.bundles/)
})

test('Term 3 Summary Bundles (R200) are advertised for Grades 4–7', () => {
  // Four bundles, one per grade, priced R200, published and featured.
  const bundleRows = patch.match(/insert into public\.bundles[\s\S]*?on conflict \(slug\)/)?.[0] ?? ''
  assert.equal((bundleRows.match(/, 'grade-[4567]-term-3-summary-bundle',/g) ?? []).length, 4)
  assert.equal((bundleRows.match(/200\.00, 'Grade [4567]', 'Term 3'/g) ?? []).length, 4)
  assert.equal((bundleRows.match(/'Term', true, true, 32[6789]0/g) ?? []).length, 4)
  // The Term Test Bundles (R350) for Grades 4–7 are intentionally left alone.
  assert.doesNotMatch(patch, /350\.00/)
})

test('each summary bundle collects exactly its grade’s Term 3 summary singles', () => {
  const expected = {
    'grade-4-term-3-summary-bundle': [
      'grade-4-history-term-3-summary',
      'grade-4-geography-term-3-summary',
      'grade-4-nst-term-3-summary',
    ],
    'grade-5-term-3-summary-bundle': [
      'grade-5-history-term-3-summary',
      'grade-5-geography-term-3-summary',
      'grade-5-natural-science-and-technology-term-3-summary',
    ],
    'grade-6-term-3-summary-bundle': [
      'grade-6-history-term-3-summary',
      'grade-6-geography-term-3-summary',
      'grade-6-natural-science-and-technology-term-3-summary',
    ],
    'grade-7-term-3-summary-bundle': [
      'grade-7-history-term-3-summary',
      'grade-7-geography-term-3-summary',
      'grade-7-natural-science-and-technology-term-3-summary',
    ],
  }

  for (const [bundleSlug, slugs] of Object.entries(expected)) {
    for (const slug of slugs) {
      assert.ok(
        patch.includes(`where b.slug = '${bundleSlug}'`) &&
          patch.includes(`'${slug}'`),
        `expected ${bundleSlug} to include ${slug}`,
      )
    }
  }
})

test('the catalogue patch is idempotent so re-runs are safe', () => {
  // Bundle rows restore the complete advertised definition on slug conflict;
  // membership is a no-op on duplicate.
  assert.match(patch, /on conflict \(slug\) do update set/)
  assert.match(patch, /"priceZar" = excluded\."priceZar"/)
  assert.match(patch, /"bundleScope" = excluded\."bundleScope"/)
  assert.match(patch, /on conflict \("bundleId", "productId"\) do nothing/)
  assert.match(patch, /begin;/)
  assert.match(patch, /commit;/)
})
