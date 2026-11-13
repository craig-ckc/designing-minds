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
  assert.match(accordion, /<Accordion\.Root multiple defaultValue=\{defaultValue\}/)
  assert.doesNotMatch(accordion, /multiple=\{false\}/)
})

test('FAQ accordions start collapsed unless a caller opts into opening the first question', () => {
  const accordion = source('components/ui/faq-accordion.tsx')
  assert.match(accordion, /defaultOpenFirst = false/)
  assert.match(accordion, /const defaultValue = defaultOpenFirst \? \[faqs\[0\]\.id\] : \[\]/)

  // Only the Help page opts in, and only for its first topic group; the home and
  // product FAQs keep the collapsed default.
  const help = source('pages/help-page.tsx')
  assert.match(help, /<FaqAccordion faqs=\{faqs\} defaultOpenFirst=\{index === 0\} \/>/)
  for (const path of ['components/sections/home-faq-section.tsx', 'pages/product-page.tsx']) {
    assert.doesNotMatch(source(path), /defaultOpenFirst/, path)
  }
})
