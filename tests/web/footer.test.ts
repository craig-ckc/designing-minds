import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const footerSource = readFileSync(new URL('../../apps/web/src/components/layout/footer.tsx', import.meta.url), 'utf8')

test('footer uses the supplied illustration as responsive, meaningful content', () => {
  assert.match(footerSource, /<div className="h-\[clamp\(9rem,20vw,18rem\)\]"/)
  assert.match(footerSource, /src="\/images\/image-03\.png"/)
  assert.match(footerSource, /alt="A parent helping a child with schoolwork at a desk"/)
  assert.match(footerSource, /className="w-full h-full object-cover"/)
})

test('footer derives the copyright year at runtime', () => {
  assert.match(footerSource, /const currentYear = new Date\(\)\.getFullYear\(\)/)
  assert.match(footerSource, /© \{currentYear\} Designing Minds/)
  assert.doesNotMatch(footerSource, /© 2026 Designing Minds/)
})
