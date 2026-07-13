import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const sectionSource = (name: string) =>
  readFileSync(new URL(`../../apps/web/src/components/sections/${name}.tsx`, import.meta.url), 'utf8')

test('about page carries the approved Designing Minds story', () => {
  assert.match(sectionSource('about-hero-section'), /Shaping confident learners, one test at a time/)
  assert.match(sectionSource('our-story-section'), /every parent deserves easy access to quality learning/)
  assert.match(sectionSource('about-story-section'), /Meet Amy — founder of Designing Minds/)
  assert.match(sectionSource('about-story-section'), /teaching in Vietnam and working with online schools in South Africa/)
  assert.match(sectionSource('about-values-section'), /Detailed memorandums make marking simple/)
})

test('about values use content-specific icons instead of placeholders', () => {
  const valuesSource = sectionSource('about-values-section')
  assert.match(valuesSource, /icon: 'check'/)
  assert.match(valuesSource, /icon: 'smile'/)
  assert.match(valuesSource, /icon: 'trend'/)
  assert.doesNotMatch(valuesSource, /icon: 'shield'|icon: 'download'|icon: 'printer'|icon: 'spark'/)
  assert.match(valuesSource, /<Icon name=\{value\.icon\} size=\{28\} \/>/)
  assert.doesNotMatch(valuesSource, /Placeholder/)
})
