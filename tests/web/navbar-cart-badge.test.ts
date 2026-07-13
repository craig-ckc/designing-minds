import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const navbarSource = readFileSync(new URL('../../apps/web/src/components/layout/navbar.tsx', import.meta.url), 'utf8')

test('navbar cart shows a live, accessible item-count badge', () => {
  assert.match(navbarSource, /const cartCount = useCartSlugs\(\)\.length/)
  assert.match(navbarSource, /aria-label=\{cartLabel\}/)
  assert.match(navbarSource, /cartCount > 0 \? \(/)
  assert.match(navbarSource, /cartCount > 99 \? '99\+' : cartCount/)
  assert.match(navbarSource, /<span className="hidden sm:inline">Cart<\/span>/)
  assert.doesNotMatch(navbarSource, /<span className="hidden sm:inline">Cart \(\{cartCount\}\)<\/span>/)
})
