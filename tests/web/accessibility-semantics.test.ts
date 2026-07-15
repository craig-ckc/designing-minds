import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(new URL(`../../apps/web/src/${path}`, import.meta.url), 'utf8')

test('shared icon-only navigation controls have accessible names', () => {
  const navbar = read('components/layout/navbar.tsx')
  const wordmark = read('components/ui/wordmark.tsx')

  assert.match(navbar, /aria-label="Log in to your account"/)
  // The single mobile toggle names both states via a dynamic aria-label, so accept
  // either the static ("…") or expression ('…') attribute form.
  assert.match(navbar, /aria-label=(?:"|\{[^}]*')Open navigation menu/)
  assert.match(navbar, /['"]Close navigation menu['"]/)
  assert.match(wordmark, /aria-label="Designing Minds home"/)
})

test('image-only product links and decorative images expose the right semantics', () => {
  const productCard = read('components/ui/product-card.tsx')
  const hero = read('components/sections/home-hero-section.tsx')
  const placeholder = read('components/ui/placeholder.tsx')

  assert.match(productCard, /aria-label=\{`View \$\{product\.title\}`\}/)
  assert.match(hero, /aria-label=\{`View \$\{p\.title\}`\}/)
  assert.match(placeholder, /aria-hidden=\{alt \? undefined : true\}/)
})

test('catalogue pages establish sequential heading levels', () => {
  const grades = read('pages/grades-page.tsx')
  const product = read('pages/product-page.tsx')

  assert.match(grades, /<h2 className="sr-only">Browse resources by grade<\/h2>/)
  assert.match(product, /<h1 className="sr-only">\{product\.title\}<\/h1>/)
  assert.match(product, /<h2 className="mb-4">About this/)
  assert.doesNotMatch(product, /<h3/)
})

test('homepage states the pricing model in readable text', () => {
  const hero = read('components/sections/home-hero-section.tsx')

  assert.match(hero, /Individual resources start at R50, with discounted once-off bundles available\./)
})

test('homepage grade selector exposes each grade label only once', () => {
  const hero = read('components/sections/home-hero-section.tsx')

  assert.match(hero, /aria-label=\{g\}/)
  assert.match(hero, /<span className="hidden sm:inline">Grade <\/span>\s*\{num\}/)
  assert.doesNotMatch(hero, /<span className="hidden sm:inline">\{g\}<\/span>/)
})
