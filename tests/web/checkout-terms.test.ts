import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const checkoutPage = readFileSync(new URL('../../apps/web/src/pages/checkout-page.tsx', import.meta.url), 'utf8')
const termsCheckbox = readFileSync(new URL('../../apps/web/src/components/checkout/terms-checkbox.tsx', import.meta.url), 'utf8')
const checkboxPrimitive = readFileSync(new URL('../../apps/web/src/components/ui/checkbox.tsx', import.meta.url), 'utf8')

test('checkout requires explicit agreement and submits it to the API', () => {
  assert.match(termsCheckbox, /import \{ Checkbox \} from '\.\.\/ui\/checkbox'/)
  assert.match(termsCheckbox, /id="accepted-terms" name="acceptedTerms" required checked=\{checked\}/)
  assert.match(termsCheckbox, /onCheckedChange=\{\(value\) => onChange\(value === true\)\} disabled=\{disabled\}/)
  assert.match(termsCheckbox, /label=\{children\}/)
  assert.match(checkboxPrimitive, /import \{ Checkbox as BaseCheckbox \} from '@base-ui\/react\/checkbox'/)
  assert.match(checkboxPrimitive, /nativeButton[\s\S]*render=\{<button type="button" \/>\}/)
  assert.match(checkboxPrimitive, /<label htmlFor=\{id\}/)
  assert.match(checkoutPage, /<TermsCheckbox checked=\{acceptedTerms\}/)
  assert.match(checkoutPage, /I have read and agree to the/)
  assert.match(checkoutPage, /<Link[\s\S]*to="\/terms"[\s\S]*Terms of Use/)
  assert.match(checkoutPage, /acceptedTerms: true/)
  assert.match(checkoutPage, /Please agree to the Terms of Use before continuing\./)
  assert.match(checkoutPage, /disabled=\{submitting \|\| quoting \|\| \(Boolean\(customer\) && !quoteValid\) \|\| items\.length === 0 \|\| !acceptedTerms\}/)
})
