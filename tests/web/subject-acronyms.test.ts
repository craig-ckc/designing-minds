import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { subjectAcronymsIn } from '../../apps/web/src/lib/subject-acronyms.ts'

const read = (path: string) => readFileSync(new URL(`../../apps/web/src/${path}`, import.meta.url), 'utf8')

test('language-subject codes are expanded for the codes a product actually uses', () => {
  assert.deepEqual(subjectAcronymsIn('Grade 4 English HL Test 1 + Memo'), [
    { code: 'HL', meaning: 'Home Language' },
  ])
  assert.deepEqual(subjectAcronymsIn('Grade 4 Afrikaans FAL Term 2 Test + Memo'), [
    { code: 'FAL', meaning: 'First Additional Language' },
  ])
})

test('a bundle spanning both language types defines both codes', () => {
  assert.deepEqual(subjectAcronymsIn('Grade 3 Term 4 Bundle — English HL, Afrikaans FAL'), [
    { code: 'HL', meaning: 'Home Language' },
    { code: 'FAL', meaning: 'First Additional Language' },
  ])
})

test('a product with no language code says nothing', () => {
  assert.deepEqual(subjectAcronymsIn('Grade 5 Mathematics Term 1 Test + Memo'), [])
})

test('codes are matched as whole words, not inside ordinary copy', () => {
  // "HALF", "FALL" and "HLOKO" must not trip the HL / FAL expansions.
  assert.deepEqual(subjectAcronymsIn('HALF the marks · FALL term · HLOKO'), [])
})

test('the product page renders the expansion beside the buy box specs', () => {
  const page = read('pages/product-page.tsx')

  assert.match(page, /subjectAcronymsIn\(`\$\{product\.title\} \$\{product\.subjects\.join\(' '\)\}`\)/)
  assert.match(page, /acronyms\.length > 0/)
  assert.match(page, /\$\{code\} = \$\{meaning\}/)
})
