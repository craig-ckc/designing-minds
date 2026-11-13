import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(new URL(`../../apps/web/src/${path}`, import.meta.url), 'utf8')

test('the home hero defines CAPS and identifies the South African national curriculum in readable text', () => {
  const home = read('components/sections/home-hero-section.tsx')

  assert.match(home, /Aligned with CAPS, South Africa’s\s+Curriculum and Assessment Policy Statement\./)
  assert.doesNotMatch(home, /<CapsAbbr/)
})

test('about and grades heroes expand CAPS through the shared abbreviation', () => {
  const abbr = read('components/ui/caps-abbr.tsx')

  // One expansion, carried in the title so assistive tech and hover both expose it.
  assert.match(
    abbr,
    /<abbr title="Curriculum and Assessment Policy Statement, South Africa’s national curriculum"[^>]*>\s*CAPS\s*<\/abbr>/,
  )

  for (const path of ['components/sections/about-hero-section.tsx', 'pages/grades-page.tsx']) {
    const source = read(path)
    assert.match(source, /import \{ CapsAbbr \} from '[./]+(components\/)?ui\/caps-abbr'/, path)
    // The lead uses the abbreviation rather than a bare, undefined "CAPS".
    assert.match(source, /lead=\{[\s\S]*?<CapsAbbr \/>[\s\S]*?\}/, path)
  }
})

test('affected page metadata expands CAPS with South African context', () => {
  const seo = read('seo.ts')

  assert.match(seo, /DEFAULT_DESCRIPTION =\s*\n\s*'[^']*South Africa[^']*Curriculum and Assessment Policy Statement/)
  assert.match(seo, /'\/grades':[\s\S]*?description:[\s\S]*?South Africa[^']*Curriculum and Assessment Policy Statement/)
  assert.match(seo, /'\/about':[\s\S]*?description:[\s\S]*?South African[^']*Curriculum and Assessment Policy Statement/)
})
