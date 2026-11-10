// The cart badge is covered behaviourally in navbar-render.test.ts
// ("cart link shows an accessible item-count badge…"). This file keeps the
// wiring check that cannot be rendered on the server: the live cart hook.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = readFileSync(new URL('../../apps/web/src/components/layout/navbar/account-actions.tsx', import.meta.url), 'utf8')

test('navbar cart count comes from the live cart-slugs hook', () => {
  assert.match(source, /import \{ useCartSlugs \} from '..\/..\/..\/lib\/use-cart'/)
  assert.match(source, /useCartSlugs\(\)\.length/)
})
