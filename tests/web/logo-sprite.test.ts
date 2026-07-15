import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('shared wordmarks reference the external logo symbol instead of repeating its paths', () => {
  const component = readFileSync(new URL('../../apps/web/src/components/ui/logo.tsx', import.meta.url), 'utf8')
  const sprite = readFileSync(new URL('../../apps/web/public/logo.svg', import.meta.url), 'utf8')

  assert.match(component, /<use href="\/logo\.svg#designing-minds-logo" \/>/)
  assert.doesNotMatch(component, /<path\b/)
  assert.match(sprite, /<symbol id="designing-minds-logo" viewBox="0 0 100 42">/)
})
