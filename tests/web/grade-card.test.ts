import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const gradeCardSource = readFileSync(new URL('../../apps/web/src/components/ui/grade-card.tsx', import.meta.url), 'utf8')

test('grade cards pair accent-colour artwork with a separate description and browse action', () => {
  assert.match(gradeCardSource, /const \{ band, fg \} = gradeColorway\(grade\)/)
  assert.match(gradeCardSource, /aspect-\[4\/3\]/)
  assert.match(gradeCardSource, /catalog-card-body/)
  assert.match(gradeCardSource, /catalog-card-description/)
  assert.match(gradeCardSource, /Browse/)
  for (const grade of [3, 4, 5, 6, 7]) {
    assert.match(gradeCardSource, new RegExp(`'Grade ${grade}': '/images/grade-background-${grade}\\.svg'`))
  }
  assert.match(gradeCardSource, /GRADE_BACKGROUNDS\[grade\] \?\? '\/images\/card-background-01\.svg'/)
  assert.doesNotMatch(gradeCardSource, /placeholder-image\.svg|<img/)
})
