import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import test from 'node:test'

const source = (path: string) => readFileSync(new URL(`../../apps/web/src/${path}`, import.meta.url), 'utf8')

test('home sections use catalogue content without bundled grade or testimonial substitutes', () => {
  assert.doesNotMatch(source('components/sections/home-hero-section.tsx'), /fallbackGrades/)
  assert.doesNotMatch(source('components/sections/grade-finder-section.tsx'), /fallbackGrades/)
  assert.doesNotMatch(source('components/sections/home-testimonials-section.tsx'), /fallbackTestimonials/)
  assert.doesNotMatch(source('pages/home-page.tsx'), /fallbackGrades/)
})

test('content keeps only shared data in a flat directory', () => {
  const entries = readdirSync(new URL('../../apps/web/src/content', import.meta.url), { withFileTypes: true })
  assert.deepEqual(entries.map((entry) => entry.name).sort(), ['contact.json', 'grade-blurbs.json', 'site.ts'])
  assert.equal(entries.some((entry) => entry.isDirectory()), false)
})

test('empty testimonial data does not manufacture testimonial content', () => {
  const testimonials = source('components/sections/home-testimonials-section.tsx')
  assert.match(testimonials, /if \(items\.length === 0\) return null/)
})
