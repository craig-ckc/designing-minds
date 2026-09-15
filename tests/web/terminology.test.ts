import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(new URL(`../../apps/web/src/${path}`, import.meta.url), 'utf8')

test('the storefront calls bundles "bundles" — never "plans" or "packages" in visitor-facing copy', () => {
  // Access plans were retired; the word lingered in navigation and CTA copy and
  // read as a second, undefined product. The URL /packages is a route, not copy,
  // and stays for links already in the wild.
  assert.match(read('components/layout/footer.tsx'), /<FooterLink to="\/packages">Bundles<\/FooterLink>/)
  assert.match(read('components/sections/final-cta-section.tsx'), /See all bundles/)
  assert.match(read('pages/account/order-detail-page.tsx'), /Files for bundles resolve from their included resources\./)

  for (const path of [
    'components/layout/footer.tsx',
    'components/sections/final-cta-section.tsx',
    'pages/account/order-detail-page.tsx',
    'pages/grades-page.tsx',
    'pages/contact-page.tsx',
  ]) {
    const source = read(path).replace(/\/\/.*|\/\*[\s\S]*?\*\/|\{\/\*[\s\S]*?\*\/\}/g, '')
    assert.doesNotMatch(source, /\b(and|&|&amp;) plans\b/i, `${path} still says "plans"`)
  }
})

test('search metadata and the site map use the same single term', () => {
  const seo = read('seo.ts')
  assert.doesNotMatch(seo, /Bundles & Plans|Essential or Premium/)
  assert.match(seo, /'\/packages': 'Bundles'/)
})
