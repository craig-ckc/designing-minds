import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(new URL(`../../apps/web/src/${path}`, import.meta.url), 'utf8')

test('homepage star-rating trust claim links down to the named parent stories', () => {
  const hero = read('components/sections/home-hero-section.tsx')
  const testimonials = read('components/sections/home-testimonials-section.tsx')

  // The hero rating is a link down to the named parent stories, not a bare claim.
  assert.match(hero, /<StarRating/)
  assert.match(hero, /href="#parent-stories"/)
  // The rating is only rendered when real, named stories exist to link to.
  assert.match(hero, /snapshot\?\.testimonials\.some\(\(testimonial\) => testimonial\.published\)/)
  // The named stories exist on the section the claim points to.
  assert.match(testimonials, /<Section id="parent-stories">/)
  assert.match(testimonials, /lead\.customerName/)
  assert.match(testimonials, /t\.customerName/)
})

test('testimonial cards show a star rating alongside the named customer, without fake avatars', () => {
  const about = read('components/sections/testimonials-section.tsx')

  assert.match(about, /<StarRating/)
  assert.match(about, /item\.customerName/)
  // The placeholder avatar image is gone — we do not have real customer photos.
  assert.doesNotMatch(about, /Placeholder/)
  assert.doesNotMatch(read('pages/about-page.tsx'), /500\+/)
})

test('homepage structured data publishes the real testimonials as reviews without an invented aggregate rating', () => {
  const seo = read('seo.ts')

  assert.match(seo, /'@type': 'Review'/)
  assert.match(seo, /author: \{ '@type': 'Person', name: testimonial\.customerName \}/)
  assert.match(seo, /reviewBody: testimonial\.quote/)
  assert.match(seo, /datePublished: testimonial\.sourceDate/)
  assert.match(seo, /review: testimonials\.map\(testimonialReview\)/)
  // No aggregate rating in schema — the customers left written stories, not star scores,
  // so a ratingValue/reviewCount would be fabricated.
  assert.doesNotMatch(seo, /AggregateRating|aggregateRating|ratingValue|reviewCount/)
})
