import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const checkoutPage = readFileSync(new URL('../../apps/web/src/pages/checkout-page.tsx', import.meta.url), 'utf8')

test('checkout requires explicit agreement and submits it to the API', () => {
  assert.match(checkoutPage, /import \{ Checkbox \} from '@base-ui\/react\/checkbox'/)
  assert.match(checkoutPage, /name="acceptedTerms"[\s\S]*required/)
  assert.match(checkoutPage, /nativeButton[\s\S]*render=\{<button type="button" \/>\}/)
  assert.match(checkoutPage, /<label htmlFor="accepted-terms"/)
  assert.match(checkoutPage, /I have read and agree to the/)
  assert.match(checkoutPage, /<Link[\s\S]*to="\/terms"[\s\S]*Terms of Use/)
  assert.match(checkoutPage, /acceptedTerms: true/)
  assert.match(checkoutPage, /Please agree to the Terms of Use before continuing\./)
  assert.match(checkoutPage, /disabled=\{submitting \|\| items\.length === 0 \|\| !acceptedTerms\}/)
})
