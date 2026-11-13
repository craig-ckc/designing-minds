import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const css = readFileSync(new URL('../../apps/web/src/index.css', import.meta.url), 'utf8')

test('max-w-prose resolves to the 680px design token, not Tailwind’s built-in 65ch', () => {
  assert.match(css, /--container-prose: 680px;/)
  // Tailwind emits `max-width: 65ch` after the theme value; a later rule in the utilities layer must win.
  const override = css.lastIndexOf('.max-w-prose { max-width: var(--container-prose); }')
  assert.ok(override > css.indexOf('@theme'), 'max-w-prose override must come after the theme')
  assert.match(css.slice(css.lastIndexOf('@layer utilities')), /\.max-w-prose \{ max-width: var\(--container-prose\); \}/)
})

test('auth card follows the Figma 24px rhythm and the retired split hero leaves no CSS behind', () => {
  assert.match(css, /\.auth-card \{[^}]*gap: 24px;/)
  assert.match(css, /\.auth-footer \{[^}]*padding-top: 24px;/)
  assert.doesNotMatch(css, /split-hero/)
})

test('CTA panels with artwork are at least 306px tall at md+ (Figma CtaPanel: 32 + 242 artwork slot + 32)', () => {
  assert.match(css, /\.cta-panel:has\(\.cta-panel__artwork\) \{[^}]*min-height: 306px;/)
})
