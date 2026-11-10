import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const footerSource = readFileSync(new URL('../../apps/web/src/components/layout/footer.tsx', import.meta.url), 'utf8')

test('footer keeps the responsive illustration decorative beside the existing copy', () => {
  assert.match(footerSource, /<div className="h-\[clamp\(9rem,20vw,18rem\)\]"/)
  assert.match(footerSource, /src="\/images\/image-03\.png"/)
  assert.match(footerSource, /alt=""/)
  assert.match(footerSource, /className="h-full w-full object-cover"/)
})

test('footer derives the copyright year at runtime', () => {
  assert.match(footerSource, /const currentYear = new Date\(\)\.getFullYear\(\)/)
  assert.match(footerSource, /© \{currentYear\} Designing Minds/)
  assert.doesNotMatch(footerSource, /© 2026 Designing Minds/)
})

test('footer links to the full Terms of Use', () => {
  assert.match(footerSource, /<FooterLink to="\/terms">Terms of Use<\/FooterLink>/)
})
