import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = (path: string) => readFileSync(new URL(`../../apps/web/src/${path}`, import.meta.url), 'utf8')

test('get-to-know progress continues through hover and focus', () => {
  const section = source('components/sections/get-to-know-section.tsx')
  assert.doesNotMatch(section, /paused|onMouseEnter|onMouseLeave|onFocusCapture|onBlurCapture/)
  assert.match(section, /if \(reduced \|\| items\.length < 2\) return/)
})

test('FAQ accordions allow independently toggled open items', () => {
  const accordion = source('components/ui/faq-accordion.tsx')
  assert.match(accordion, /<Accordion\.Root multiple defaultValue=\{\[\]\}/)
  assert.doesNotMatch(accordion, /multiple=\{false\}/)
})
