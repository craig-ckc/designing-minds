import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(new URL(`../../apps/web/src/${path}`, import.meta.url), 'utf8')

test('homepage trust copy links to named customer stories without unsupported counts or ratings', () => {
  const hero = read('components/sections/home-hero-section.tsx')
  const home = read('pages/home-page.tsx')
  const testimonials = read('components/sections/home-testimonials-section.tsx')

  assert.match(hero, /Customer feedback from South African parents and tutors/)
  assert.match(hero, /href="#parent-stories"/)
  assert.match(hero, /snapshot\?\.testimonials\.some\(\(testimonial\) => testimonial\.published\)/)
  assert.match(testimonials, /<Section id="parent-stories">/)
  assert.match(testimonials, /lead\.customerName/)
  assert.match(testimonials, /t\.customerName/)
  assert.doesNotMatch(`${hero}${home}${testimonials}`, /500\+|Loved by|StarRating|★★★★★/)
})

test('testimonial cards do not present a rating absent from the CMS model', () => {
  assert.doesNotMatch(read('components/sections/testimonials-section.tsx'), /StarRating|★★★★★/)
  assert.doesNotMatch(read('pages/about-page.tsx'), /500\+/)
})

test('homepage structured data publishes the available testimonials as reviews without an aggregate rating', () => {
  const seo = read('seo.ts')

  assert.match(seo, /'@type': 'Review'/)
  assert.match(seo, /author: \{ '@type': 'Person', name: testimonial\.customerName \}/)
  assert.match(seo, /reviewBody: testimonial\.quote/)
  assert.match(seo, /datePublished: testimonial\.sourceDate/)
  assert.match(seo, /review: testimonials\.map\(testimonialReview\)/)
  assert.doesNotMatch(seo, /AggregateRating|aggregateRating|ratingValue|reviewCount/)
})
