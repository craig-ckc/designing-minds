import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const footerSource = readFileSync(new URL('../../apps/web/src/components/layout/footer.tsx', import.meta.url), 'utf8')

test('footer uses the supplied illustration as a responsive decorative background', () => {
  assert.match(footerSource, /backgroundImage: "url\('\/images\/image-03\.png'\)"/)
  assert.match(footerSource, /backgroundSize: 'max\(100%, 64rem\) auto'/)
  assert.match(footerSource, /bg-bottom bg-no-repeat/)
  assert.match(footerSource, /aria-hidden className="h-\[clamp\(9rem,20vw,18rem\)\]"/)
})

test('footer derives the copyright year at runtime', () => {
  assert.match(footerSource, /const currentYear = new Date\(\)\.getFullYear\(\)/)
  assert.match(footerSource, /© \{currentYear\} Designing Minds/)
  assert.doesNotMatch(footerSource, /© 2026 Designing Minds/)
})
