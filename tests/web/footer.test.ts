import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const footerSource = readFileSync(new URL('../../apps/web/src/components/layout/footer.tsx', import.meta.url), 'utf8')

test('footer uses the Panorama style: painting band at the top, then content, then the legal bar', () => {
  assert.match(footerSource, /<div className="footer-band h-40 lg:h-\[300px\]"/)
  assert.match(footerSource, /src="\/images\/paintings\/footer-coast-mountains\.avif"/)
  assert.match(footerSource, /alt=""/)
  assert.match(footerSource, /width=\{1920\}/)
  assert.match(footerSource, /object-cover/)
  assert.ok(footerSource.indexOf('footer-band') < footerSource.indexOf('<Wordmark'))
  assert.ok(footerSource.indexOf('<NewsletterForm') < footerSource.indexOf('All rights reserved'))
  assert.doesNotMatch(footerSource, /footer-veld-acacia|image-03\.png/)
})

test('footer grade links go to the shop filtered by grade', () => {
  assert.match(footerSource, /to=\{`\/shop\?grade=\$\{gradeToSlug\(grade\)\}`\}/)
  assert.doesNotMatch(footerSource, /\/grades\//)
})

test('footer derives the copyright year at runtime', () => {
  assert.match(footerSource, /const currentYear = new Date\(\)\.getFullYear\(\)/)
  assert.match(footerSource, /© \{currentYear\} Designing Minds/)
  assert.doesNotMatch(footerSource, /© 2026 Designing Minds/)
})

test('footer links to the full Terms of Use', () => {
  assert.match(footerSource, /<FooterLink to="\/terms">Terms of Use<\/FooterLink>/)
})
