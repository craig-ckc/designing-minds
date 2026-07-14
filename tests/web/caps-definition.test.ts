import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(new URL(`../../apps/web/src/${path}`, import.meta.url), 'utf8')

test('affected pages define CAPS and identify the South African national curriculum in readable text', () => {
  const pages = [
    read('components/sections/home-hero-section.tsx'),
    read('components/sections/about-hero-section.tsx'),
    read('pages/grades-page.tsx'),
  ]

  for (const page of pages) {
    assert.match(page, /Curriculum and Assessment Policy/)
    assert.match(page, /South Africa/)
  }
})

test('affected page metadata expands CAPS with South African context', () => {
  const seo = read('seo.ts')

  assert.match(seo, /DEFAULT_DESCRIPTION =\s*\n\s*'[^']*South Africa[^']*Curriculum and Assessment Policy Statement/)
  assert.match(seo, /'\/grades':[\s\S]*?description:[\s\S]*?South Africa[^']*Curriculum and Assessment Policy Statement/)
  assert.match(seo, /'\/about':[\s\S]*?description:[\s\S]*?South African[^']*Curriculum and Assessment Policy Statement/)
})
