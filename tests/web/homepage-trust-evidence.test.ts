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
  assert.match(testimonials, /<Section id="parent-stories"/)
  assert.match(testimonials, /lead\.customerName/)
  assert.match(testimonials, /<TestimonialCarousel testimonials=\{cards\} \/>/)
  assert.match(read('components/sections/testimonial-carousel.tsx'), /item\.customerName/)
  assert.match(testimonials, /src="\/images\/image-05\.png"/)
  assert.doesNotMatch(testimonials, /Placeholder/)
})

test('testimonial cards show a star rating alongside the named customer, without fake avatars', () => {
  const about = read('components/sections/testimonials-section.tsx')
  const carousel = read('components/sections/testimonial-carousel.tsx')
  const styles = read('index.css')

  assert.match(about, /<TestimonialCarousel testimonials=\{testimonials\} \/>/)
  assert.match(carousel, /<StarRating/)
  assert.match(carousel, /item\.customerName/)
  assert.match(carousel, /testimonial-carousel-track/)
  assert.match(carousel, /aria-hidden="true"/)
  assert.match(carousel, /testimonials\.length \* 12/)
  assert.doesNotMatch(carousel, /scrollBy|carousel controls|Show previous|Show next/)
  assert.match(carousel, /Read full story/)
  assert.match(carousel, /line-clamp-7/)
  assert.match(styles, /@keyframes testimonial-scroll/)
  assert.match(styles, /animation: testimonial-scroll linear infinite/)
  assert.match(styles, /width: 100vw/)
  assert.match(styles, /animation-play-state: paused/)
  assert.match(styles, /prefers-reduced-motion: reduce/)
  assert.match(styles, /mask-image: linear-gradient/)
  // The placeholder avatar image is gone — we do not have real customer photos.
  assert.doesNotMatch(carousel, /Placeholder/)
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
