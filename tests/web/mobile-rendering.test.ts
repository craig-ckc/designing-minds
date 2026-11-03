import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(new URL(`../../apps/web/src/${path}`, import.meta.url), 'utf8')

test('product-cover copy scales via container queries and stays visible at all card sizes', () => {
  const cover = read('components/ui/product-cover.tsx')
  const css = read('index.css')

  assert.match(cover, /product-cover-copy product-cover-brand/)
  assert.match(cover, /product-cover-copy product-cover-meta/)
  assert.match(cover, /product-cover-copy product-cover-title/)
  assert.match(css, /\.product-cover-brand \{ font-size: 2\.5cqw; \}/)
  assert.match(css, /\.product-cover-meta \{ font-size: 4\.36cqw; \}/)
  assert.match(css, /\.product-cover-title \{ font-size: 6\.89cqw; \}/)
  assert.match(cover, /\[container-type:inline-size\]/)
  assert.doesNotMatch(css, /\.product-cover-\w+\s*{[^}]*font-size:\s*(?:max|min|clamp|calc)\(/)
  assert.match(cover, /showCopy=\{i === layers\.length - 1\}/)
  assert.match(cover, /product-cover-brand[^\n]*leading-\[1\.1\]/)
  assert.doesNotMatch(css, /\.product-cover-copy \{ display: none; \}/)
})

test('the mobile grade selector uses shared compact wrapping chips', () => {
  const hero = read('components/sections/home-hero-section.tsx')
  assert.match(hero, /flex flex-wrap justify-center gap-1\.5/)
  assert.match(hero, /className="filter-chip"/)
  assert.match(read('index.css'), /\.filter-chip\s*{[^}]*min-h-8/)
})
