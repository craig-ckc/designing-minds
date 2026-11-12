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

test('about values are three plain columns with a pastel colour bar each, under a painted banner, and no icon chips', () => {
  const valuesSource = sectionSource('about-values-section')
  assert.match(valuesSource, /bar: 'bg-yellow'/)
  assert.match(valuesSource, /bar: 'bg-green'/)
  assert.match(valuesSource, /bar: 'bg-blue'/)
  assert.match(valuesSource, /src="\/images\/paintings\/values-grade-folders\.avif"/)
  assert.doesNotMatch(valuesSource, /<Icon|icon:|Placeholder/)
})

test('about introduction is concise: one primary button beside the study-corner painting, no photo, chips or badges', () => {
  const heroSource = sectionSource('about-hero-section')
  const splitSource = sectionSource('split-hero')

  assert.match(heroSource, /Affordable practice tests aligned with CAPS/)
  assert.doesNotMatch(heroSource, /At Designing Minds, we believe learning should be simple|Get in touch|figcaption|image-07/)
  assert.match(heroSource, /image="\/images\/paintings\/about-hero-study-corner\.avif"/)
  assert.equal((splitSource.match(/<Button\b/g) ?? []).length, 1)
  assert.match(splitSource, /alt=""/)
  assert.match(splitSource, /width=\{1280\}[\s\S]*height=\{960\}/)
})

test('the story pairs the sunny-desk painting with one pulled line and a short paragraph', () => {
  const storySource = sectionSource('our-story-section')

  assert.match(storySource, /lg:grid-cols-\[0\.9fr_1\.1fr\]/)
  assert.match(storySource, /aspect-\[5\/4\][^"]*rounded-lg[^"]*object-cover/)
  assert.match(storySource, /<h2 className="text-h1">Why Designing Minds exists<\/h2>/)
  assert.match(storySource, /src="\/images\/paintings\/our-story-sunny-desk\.avif"/)
  assert.match(storySource, /<blockquote[\s\S]*every parent deserves easy access to quality learning[\s\S]*<\/blockquote>/)
  assert.equal((storySource.match(/<p\b/g) ?? []).length, 1)
  assert.doesNotMatch(storySource, /image-08\.png|lg:col-start|aspect-\[4\/5\]/)
})

test('Amy\'s story is ruled rows without icon chips and keeps the real founder photos', () => {
  const storySource = sectionSource('about-story-section')

  assert.match(storySource, /src="\/images\/image-06\.png"/)
  assert.match(storySource, /src="\/images\/image-07\.png"/)
  assert.doesNotMatch(storySource, /<Icon|IconName|rounded-full/)
})

test('the connect cards use painted headers and the new copy', () => {
  const source = sectionSource('about-connect-section')

  assert.match(source, /Ask a teacher, or have a look inside/)
  assert.match(source, /connect-classroom-corner\.avif/)
  assert.match(source, /connect-printed-pages\.avif/)
  assert.match(source, /title="Ask a teacher"/)
  assert.match(source, /title="See what’s inside"/)
  assert.doesNotMatch(source, /image-0[12]\.png/)
})

test('values columns are separated by hairline vertical dividers from md up and keep their colour bars', () => {
  const source = sectionSource('about-values-section')

  assert.match(source, /md:grid-cols-3 md:gap-0/)
  assert.match(source, /md:border-l md:border-line md:px-8 md:first:border-l-0 md:first:pl-0 md:last:pr-0/)
  assert.match(source, /h-1 w-8 rounded-full \$\{value\.bar\}/)
})
