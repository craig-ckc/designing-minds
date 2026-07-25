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
    ['muted on canvas', token('muted'), token('canvas')],
    ['muted on footer cream', token('muted'), '#fdf6f0'],
    ['amber on butter', token('amber'), token('butter')],
    ['amber on paper', token('amber'), token('paper')],
    ['magenta on blossom', token('magenta'), token('blossom')],
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

test('text on primary surfaces and product-cover labels do not reduce contrast with opacity', () => {
  const navbar = read('components/layout/navbar.tsx')
  const bundlePricing = read('components/sections/bundle-pricing-section.tsx')
  const ctaBanner = read('components/sections/cta-banner.tsx')
  const button = read('components/ui/button.tsx')
  const productCover = read('components/ui/product-cover.tsx')

  assert.doesNotMatch([navbar, bundlePricing, ctaBanner].join('\n'), /text-on-primary\/\d+/)
  assert.doesNotMatch(button, /hover:opacity-/)
  assert.doesNotMatch(productCover, /tracking-\[0\.034cqw\] opacity-/)
})
