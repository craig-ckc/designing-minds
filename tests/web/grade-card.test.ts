import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const gradeCardSource = readFileSync(new URL('../../apps/web/src/components/ui/grade-card.tsx', import.meta.url), 'utf8')

test('grade cards are compact flat accent-colour surfaces with no decorative background', () => {
  assert.match(gradeCardSource, /const \{ band, fg \} = gradeColorway\(grade\)/)
  assert.match(gradeCardSource, /min-h-56/)
  assert.doesNotMatch(gradeCardSource, /grade-background|card-background|backgroundImage|placeholder-image\.svg|<img/)
})
