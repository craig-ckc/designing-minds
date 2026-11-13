import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const gallerySource = readFileSync(new URL('../../apps/web/src/components/ui/product-gallery.tsx', import.meta.url), 'utf8')

test('a record with no uploads renders the cover in its media frame without navigation controls', () => {
  // The empty case returns BEFORE the track exists, so there is no path on which
  // a lone cover can acquire redundant paging controls.
  const emptyBranch = gallerySource.slice(
    gallerySource.indexOf('if (images.length === 0)'),
    gallerySource.indexOf('return <GalleryTrack'),
  )
  assert.ok(emptyBranch.length > 0, 'expected an early return for the no-images case')
  assert.match(emptyBranch, /<ProductCover product=\{item\} stacked=\{stacked\} priority \/>/)
  assert.doesNotMatch(emptyBranch, /aria-label="(Previous|Next) image"/)
  assert.doesNotMatch(emptyBranch, /aria-current/)
})

test('the cover is the first slide before uploaded images', () => {
  const track = gallerySource.slice(gallerySource.indexOf('function GalleryTrack'))
  // The cover slide precedes the uploaded ones in the DOM, which is also the
  // order the prerendered HTML carries.
  assert.ok(
    track.indexOf('<ProductCover') < track.indexOf('images.map('),
    'the generated cover must be the first slide',
  )
  // Slide count is images + 1 precisely because the cover is not one of them.
  assert.match(track, /const total = images\.length \+ 1/)
})

test('the gallery is safe to prerender: no browser access during render', () => {
  // The site renders this component with no DOM (scripts/prerender.mjs), so any
  // window/document read has to sit inside an effect or an event handler.
  const renderBody = gallerySource.slice(0, gallerySource.indexOf('useEffect('))
  assert.doesNotMatch(renderBody, /\b(window|document)\./)
  assert.match(gallerySource, /useState\(0\)/)
  // Measurement happens after mount, not during the first paint.
  assert.match(gallerySource, /useEffect\(\(\) => \{[\s\S]*trackRef\.current/)
})

test('paging works without JavaScript and agrees with itself once it runs', () => {
  // A scroll-snap track means the markup is already a working, swipeable
  // gallery; the buttons only ask the browser to scroll.
  assert.match(gallerySource, /snap-x snap-mandatory overflow-x-auto/)
  assert.match(gallerySource, /snap-center/)
  assert.match(gallerySource, /track\.scrollTo\(\{ left: slide\.offsetLeft, behavior:/)
  assert.match(gallerySource, /prefers-reduced-motion: reduce/)
  // The active slide is derived from scroll position, so a swipe and a button
  // press cannot disagree about where we are.
  assert.match(gallerySource, /track\.addEventListener\('scroll', onScroll, \{ passive: true \}\)/)
})

test('the arrows tell the truth at the ends and are reachable by keyboard', () => {
  assert.match(gallerySource, /const atStart = active === 0/)
  assert.match(gallerySource, /const atEnd = active === total - 1/)
  assert.match(gallerySource, /aria-label="Previous image"[\s\S]*disabled=\{atStart\}/)
  assert.match(gallerySource, /aria-label="Next image"[\s\S]*disabled=\{atEnd\}/)
  // Snap points make native arrow-key scrolling crawl, so whole-slide paging is
  // mapped explicitly.
  assert.match(gallerySource, /event\.key === 'ArrowLeft'/)
  assert.match(gallerySource, /event\.key === 'ArrowRight'/)
  assert.match(gallerySource, /tabIndex=\{0\}/)
})

test('arrow and thumbnail controls meet the mobile tap-target minimum', () => {
  // Arrows are 40px targets; visible thumbnails are 64px by 80px targets.
  assert.match(gallerySource, /size="icon"[\s\S]*shape="circle"[\s\S]*aria-label="Previous image"/)
  assert.match(gallerySource, /h-20 w-16 flex-none/)
})

test('uploaded images carry their own alt text and reserve their box', () => {
  // alt comes from the record: it describes that picture, and an empty string is
  // the correct value for a decorative one.
  assert.match(gallerySource, /alt=\{image\.alt\}/)
  assert.match(gallerySource, /width=\{image\.width\}/)
  assert.match(gallerySource, /height=\{image\.height\}/)
  // Only the cover is above-the-fold work.
  assert.match(gallerySource, /loading="lazy"/)
  assert.match(gallerySource, /priority/)
})

test('every slide fills the same fixed stage so paging never resizes the column', () => {
  // Uploads arrive in any shape; the shared stage keeps the height stable.
  assert.match(gallerySource, /h-full w-full flex-none snap-center/)
  const css = readFileSync(new URL('../../apps/web/src/index.css', import.meta.url), 'utf8')
  assert.match(css, /\.product-gallery-stage\s*{[^}]*height: clamp\(18rem, 38vw, 34rem\)/)
  assert.match(gallerySource, /object-contain/)
})
