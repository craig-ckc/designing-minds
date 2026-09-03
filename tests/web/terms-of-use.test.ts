import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(new URL(`../../apps/web/src/${path}`, import.meta.url), 'utf8')
const legalPage = read('pages/legal-page.tsx')
const seo = read('seo.ts')

test('the Terms of Use page contains Amy’s supplied licence terms', () => {
  assert.match(legalPage, /title: 'Terms of Use'/)
  assert.match(legalPage, /Last updated: September 2026\./)
  assert.match(legalPage, /1\. Copyright/)
  assert.match(legalPage, /2\. What You May Do/)
  assert.match(legalPage, /3\. What You May NOT Do/)
  assert.match(legalPage, /4\. Schools and Multiple Classrooms/)
  assert.match(legalPage, /5\. Digital Products/)
  assert.match(legalPage, /6\. Refunds/)
  assert.match(legalPage, /7\. Unauthorised Sharing/)
  assert.match(legalPage, /8\. Agreement to These Terms/)
  assert.match(legalPage, /Share or forward the PDF files or download links/)
  assert.match(legalPage, /© Designing Minds\. All rights reserved\./)
})

test('search metadata names the policy consistently', () => {
  assert.match(seo, /title: 'Terms of Use \| Designing Minds'/)
  assert.match(seo, /'\/terms': 'Terms of Use'/)
})
