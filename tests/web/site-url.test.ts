import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { CANONICAL_SITE_URL, canonicalUrlForPath, resolveCanonicalSiteUrl } from '../../apps/web/src/site-url.ts'

const seoSource = readFileSync(new URL('../../apps/web/src/seo.ts', import.meta.url), 'utf8')
const prerenderSource = readFileSync(new URL('../../apps/web/scripts/prerender.mjs', import.meta.url), 'utf8')

test('canonical URL resolution always uses the public storefront origin', () => {
  for (const configured of [
    undefined,
    '',
    'http://localhost:5173',
    'https://designingminds.co.za',
    'https://designingminds.vercel.app',
    'not a URL',
  ]) {
    assert.equal(resolveCanonicalSiteUrl(configured), CANONICAL_SITE_URL, configured ?? '<unset>')
  }

  assert.equal(resolveCanonicalSiteUrl(`${CANONICAL_SITE_URL}/`), CANONICAL_SITE_URL)
})

test('representative public route paths build canonicals on the storefront origin', () => {
  for (const path of ['/', '/contact', '/grades/grade-3', '/packages', '/shop/example-resource']) {
    assert.equal(canonicalUrlForPath(path, 'https://designingminds.vercel.app'), `${CANONICAL_SITE_URL}${path}`)
  }
})

test('prerender and SEO helpers normalize every generated absolute URL', () => {
  assert.match(prerenderSource, /server\.resolveCanonicalSiteUrl\(process\.env\.VITE_SITE_URL\)/)
  assert.match(seoSource, /canonicalUrlForPath\(route\.path, siteUrl\)/)
  assert.match(seoSource, /const canonicalSiteUrl = resolveCanonicalSiteUrl\(siteUrl\)/)
})
