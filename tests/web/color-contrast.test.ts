import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(new URL(`../../apps/web/src/${path}`, import.meta.url), 'utf8')
const css = read('index.css')

function token(name: string): string {
  const value = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6})`, 'i'))?.[1]
  assert.ok(value, `Missing hex value for --color-${name}`)
  return value
}

function luminance(hex: string): number {
  const channels = hex.match(/[0-9a-f]{2}/gi)
  assert.ok(channels)
  const [red, green, blue] = channels.map((channel) => {
    const value = Number.parseInt(channel, 16) / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

function contrast(foreground: string, background: string): number {
  const lighter = Math.max(luminance(foreground), luminance(background))
  const darker = Math.min(luminance(foreground), luminance(background))
  return (lighter + 0.05) / (darker + 0.05)
}

test('shared text and background colour pairs meet WCAG AA', () => {
  const pairs = [
    ['primary ink on canvas', token('primary-ink'), token('canvas')],
    ['primary ink on primary tint', token('primary-ink'), token('primary-tint')],
    ['white on the primary-ink badge surface', token('on-primary'), token('primary-ink')],
    ['muted on canvas', token('muted'), token('canvas')],
    ['muted on footer cream', token('muted'), '#fdf6f0'],
    ['on-yellow on yellow', token('on-yellow'), token('yellow')],
    ['on-yellow on canvas', token('on-yellow'), token('canvas')],
    ['on-magenta on magenta', token('on-magenta'), token('magenta')],
  ] as const

  for (const [label, foreground, background] of pairs) {
    const ratio = contrast(foreground, background)
    assert.ok(ratio >= 4.5, `${label} is ${ratio.toFixed(2)}:1; expected at least 4.5:1`)
  }
})

test('vivid primary accents meet the 3:1 non-text contrast minimum', () => {
  assert.equal(token('primary').toLowerCase(), '#f15699')
  assert.equal(token('on-primary').toLowerCase(), '#ffffff')
  const ratio = contrast(token('primary'), token('canvas'))
  assert.ok(ratio >= 3, `primary accent on canvas is ${ratio.toFixed(2)}:1; expected at least 3:1`)
})

test('marketing CTA bands use white on the logo pink as a deliberate sub-AA exception', () => {
  // EXCEPTION (Craig's decision, 2026-11-12): Figma's CtaSection draws the title and
  // description in white on primary. White on #f15699 measures ~3.2:1: it clears 3:1 for
  // the large title but not 4.5:1 for the 14px description, and is accepted instead of ink.
  assert.match(read('components/sections/cta-banner.tsx'), /brand: 'bg-primary text-on-primary'/)
  assert.equal(token('on-primary').toLowerCase(), '#ffffff')
  const ratio = contrast(token('on-primary'), token('primary'))
  assert.ok(ratio >= 3, `white on primary is ${ratio.toFixed(2)}:1; expected at least 3:1`)
  // Small white count badges / the solid Pill stay AA on primary-ink (>= 4.5:1, asserted above).
  assert.match(read('components/ui/pill.tsx'), /bg-primary-ink text-on-primary/)
})

test('the full-year pricing card is flat logo pink with white feature text, the same accepted exception as the CTA bands', () => {
  // EXCEPTION (follows Craig's 2026-11-12 CTA decision): Figma's Card / Bundle pricing Plan=Year is a flat
  // color/primary fill with white feature text (~3.2:1), replacing the old primary→primary-strong gradient.
  const pricing = read('components/sections/bundle-pricing-section.tsx')
  assert.match(pricing, /featured \? 'bg-primary' : 'border border-line'/)
  assert.match(pricing, /featured \? 'text-on-primary' : 'text-ink-soft'/)
  assert.ok(contrast(token('on-primary'), token('primary')) >= 3)
})

test('announcement bar and Card onPrimary are deliberate sub-AA exceptions on primary-strong', () => {
  // EXCEPTION (Craig's decision, 2026-11-11): the announcement bar was brightened and the
  // onPrimary Card is a CTA surface; white on primary-strong is accepted at >= 3:1 rather than 4.5:1.
  assert.match(read('components/layout/navbar/announcement-bar.tsx'), /block bg-primary-strong text-on-primary transition-colors hover:bg-primary-ink/)
  assert.match(read('components/ui/card.tsx'), /onPrimary: \['bg-primary-strong text-on-primary'\]/)
  const ratio = contrast(token('on-primary'), token('primary-strong'))
  assert.ok(ratio >= 3, `white on primary-strong is ${ratio.toFixed(2)}:1; expected at least 3:1`)
})

test('text on primary surfaces and product-cover labels do not reduce contrast with opacity', () => {
  const navbar = ['announcement-bar', 'bundle-tier-card', 'account-actions'].map((name) => read(`components/layout/navbar/${name}.tsx`)).join('\n')
  const bundlePricing = read('components/sections/bundle-pricing-section.tsx')
  const ctaBanner = read('components/sections/cta-banner.tsx')
  const button = read('components/ui/button.tsx')
  const productCover = read('components/ui/product-cover.tsx')

  assert.doesNotMatch([navbar, bundlePricing, ctaBanner].join('\n'), /text-on-primary\/\d+/)
  assert.doesNotMatch(button, /hover:opacity-/)
  assert.doesNotMatch(productCover, /tracking-\[0\.034cqw\] opacity-/)
})
