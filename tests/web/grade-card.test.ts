import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const gradeCardSource = readFileSync(new URL('../../apps/web/src/components/ui/grade-card.tsx', import.meta.url), 'utf8')

test('grade cards are compact accent-colour surfaces with grade-specific SVG backgrounds', () => {
  assert.match(gradeCardSource, /const \{ band, fg \} = gradeColorway\(grade\)/)
  assert.match(gradeCardSource, /min-h-56/)
  for (const grade of [3, 4, 5, 6, 7]) {
    assert.match(gradeCardSource, new RegExp(`'Grade ${grade}': '/images/grade-background-${grade}\\.svg'`))
  }
  assert.match(gradeCardSource, /GRADE_BACKGROUNDS\[grade\] \?\? '\/images\/card-background-01\.svg'/)
  assert.doesNotMatch(gradeCardSource, /placeholder-image\.svg|<img/)
})
