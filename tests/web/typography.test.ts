import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { typographicApostrophes } from '../../packages/utils/src/typography.ts'

const read = (path: string) => readFileSync(new URL(`../../apps/web/src/${path}`, import.meta.url), 'utf8')

test('a straight apostrophe between letters becomes the typographic one', () => {
  assert.equal(typographicApostrophes("the learner's book"), 'the learner’s book')
  assert.equal(typographicApostrophes("children's and Africa's"), 'children’s and Africa’s')
  // Already-curly copy is left exactly as it was.
  assert.equal(typographicApostrophes('the learner’s book'), 'the learner’s book')
})

test('quotes that are not apostrophes are left alone', () => {
  // Quoted words, contractions of digits and code-like text are not prose apostrophes.
  assert.equal(typographicApostrophes("'quoted' word"), "'quoted' word")
  assert.equal(typographicApostrophes("class of '26"), "class of '26")
  assert.equal(typographicApostrophes("it's"), 'it’s')
  assert.equal(typographicApostrophes('no apostrophes here'), 'no apostrophes here')
})

test('CMS rich text runs plain text through the apostrophe normaliser, but never code spans', () => {
  const markdown = read('lib/markdown.tsx')

  assert.match(markdown, /import \{ typographicApostrophes \} from '@designing-minds\/utils'/)
  assert.match(markdown, /const plain = \(text: string\) => typographicApostrophes\(unescape\(text\)\)/)
  // Every plain-text push goes through `plain`, so no run can skip the pass.
  assert.doesNotMatch(markdown, /parts\.push\(unescape\(/)
  assert.equal(markdown.match(/parts\.push\(plain\(/g)?.length, 3)
  // Code spans are pushed verbatim.
  assert.match(markdown, /<code key=\{key\}>\{token\.slice\(1, -1\)\}<\/code>/)
})
