import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const sectionSource = (name: string) =>
  readFileSync(new URL(`../../apps/web/src/components/sections/${name}.tsx`, import.meta.url), 'utf8')

const componentSource = (path: string) =>
  readFileSync(new URL(`../../apps/web/src/components/${path}.tsx`, import.meta.url), 'utf8')

test('about page carries the approved Designing Minds story', () => {
  assert.match(sectionSource('about-hero-section'), /title="Practice tests that help learners feel ready"/)
  assert.match(sectionSource('our-story-section'), /every parent deserves easy access to quality learning/)
  assert.match(sectionSource('about-story-section'), /Meet Amy, founder of Designing Minds/)
  assert.match(sectionSource('about-story-section'), /teaching in Vietnam and working with online schools in South Africa/)
  assert.match(sectionSource('about-values-section'), /Detailed memorandums make marking simple/)
})

test('about values are three plain columns under a painted banner, with no colour bars or icon chips', () => {
  const valuesSource = sectionSource('about-values-section')
  assert.match(valuesSource, /export type ValueItem = \{ title: string; body: string \}/)
  assert.match(valuesSource, /src="\/images\/paintings\/values-grade-folders\.avif"/)
  assert.match(valuesSource, /h-40 w-full rounded-lg object-cover sm:h-48 lg:h-60/)
  assert.doesNotMatch(valuesSource, /bar:|value\.bar|<Icon|icon:|Placeholder/)
})

test('about introduction is the shared page hero: one primary button, then a full-bleed study-corner painting', () => {
  const heroSource = sectionSource('about-hero-section')
  const pageHeroSource = sectionSource('page-hero')

  assert.match(heroSource, /<PageHero\b/)
  assert.match(heroSource, /Affordable practice tests aligned with <CapsAbbr \/>/)
  assert.match(heroSource, /actionLabel="Browse resources"[\s\S]*actionTo="\/shop"/)
  assert.match(heroSource, /image="\/images\/paintings\/about-hero-study-corner\.avif"/)
  assert.doesNotMatch(heroSource, /At Designing Minds, we believe learning should be simple|Get in touch|figcaption|image-07/)

  assert.equal((pageHeroSource.match(/<Button\b/g) ?? []).length, 1)
  assert.match(pageHeroSource, /<h1\b/)
  assert.match(pageHeroSource, /border-b border-line bg-surface-alt/)
  assert.match(pageHeroSource, /alt=""/)
  assert.match(pageHeroSource, /width=\{1280\}[\s\S]*height=\{960\}/)
  // Full bleed: the painting sits outside the Container and carries no radius.
  assert.match(pageHeroSource, /<\/Container>\s*<\/div>\s*<img/)
  assert.doesNotMatch(pageHeroSource.slice(pageHeroSource.indexOf('<img')), /rounded/)
})

test('the story pairs the exercise-books painting with one ruled pull quote and a short paragraph', () => {
  const storySource = sectionSource('our-story-section')

  assert.match(storySource, /lg:grid-cols-\[minmax\(0,672fr\)_minmax\(0,640fr\)\] lg:gap-16/)
  assert.match(storySource, /aspect-\[5\/4\][^"]*rounded-lg[^"]*object-cover/)
  assert.match(storySource, /<h2 className="text-h1">Why Designing Minds exists<\/h2>/)
  assert.match(storySource, /src="\/images\/paintings\/our-story-exercise-books\.avif"/)
  assert.match(storySource, /<blockquote className="[^"]*border-l-\[3px\] border-line-strong pl-5/)
  assert.match(storySource, /<blockquote[\s\S]*every parent deserves easy access to quality learning[\s\S]*<\/blockquote>/)
  assert.equal((storySource.match(/<p\b/g) ?? []).length, 1)
  assert.doesNotMatch(storySource, /our-story-sunny-desk|image-08\.png|lg:col-start|aspect-\[4\/5\]/)
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

test('values columns are separated by hairline vertical dividers from md up, beside a 380px heading column', () => {
  const source = sectionSource('about-values-section')

  assert.match(source, /lg:grid-cols-\[minmax\(0,380px\)_minmax\(0,1fr\)\] lg:gap-16/)
  assert.match(source, /md:grid-cols-3 md:gap-0/)
  assert.match(source, /md:border-l md:border-line md:px-6 md:first:border-l-0 md:first:pl-0/)
})

test('polaroid captions are sentence case and frames use the small radius token', () => {
  const source = componentSource('ui/polaroid')

  assert.doesNotMatch(source, /uppercase|rounded-\[/)
  assert.match(source, /rounded-sm/)
})
