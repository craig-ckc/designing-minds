import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(new URL(`../../apps/web/src/${path}`, import.meta.url), 'utf8')

test('product-cover copy stays readable or is omitted on compact decorative covers', () => {
  const cover = read('components/ui/product-cover.tsx')
  const css = read('index.css')

  assert.match(cover, /product-cover-copy product-cover-brand/)
  assert.match(cover, /product-cover-copy product-cover-meta/)
  assert.match(cover, /product-cover-copy product-cover-title/)
  assert.match(css, /\.product-cover-brand \{ font-size: max\(0\.75rem, 2\.5cqw\); \}/)
  assert.match(css, /\.product-cover-meta \{ font-size: max\(0\.75rem, 4\.36cqw\); \}/)
  assert.match(css, /\.product-cover-title \{ font-size: max\(0\.75rem, 6\.89cqw\); \}/)
  assert.match(css, /@container \(max-width: 11\.25rem\)[\s\S]*\.product-cover-copy \{ display: none; \}/)
})

test('the mobile grade selector uses fixed compact tabs and spacing', () => {
  const hero = read('components/sections/home-hero-section.tsx')

  assert.match(hero, /justify-center gap-1 sm:gap-2\.5/)
  assert.match(hero, /w-10 rounded-pill px-0 py-1[\s\S]*sm:w-fit sm:px-6/)
})
