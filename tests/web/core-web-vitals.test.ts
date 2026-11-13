import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(new URL(`../../apps/web/${path}`, import.meta.url), 'utf8')

test('Inter is self-hosted and preloaded without a remote stylesheet', () => {
  const html = read('index.html')
  const css = read('src/index.css')
  const fontUrl = '/fonts/inter-latin-variable.woff2'

  assert.doesNotMatch(html, /fonts\.googleapis\.com/)
  assert.match(html, new RegExp(`<link[\\s\\S]*rel="preload"[\\s\\S]*href="${fontUrl.replace(/[.]/g, '\\.')}([\\s\\S]*?)as="font"`))
  assert.match(css, /@font-face[\s\S]*font-family: "Inter"[\s\S]*font-weight: 100 900[\s\S]*font-display: swap/)
  assert.ok(css.includes(fontUrl))
})

test('only the above-the-fold product cover promotes its illustration', () => {
  const cover = read('src/components/ui/product-cover.tsx')
  const gallery = read('src/components/ui/product-gallery.tsx')

  assert.match(cover, /loading=\{priority \? 'eager' : 'lazy'\}/)
  assert.match(cover, /fetchPriority=\{priority \? 'high' : 'auto'\}/)
  assert.match(cover, /priority=\{priority && i === layers\.length - 1\}/)
  // The gallery owns the media slot now, so it is what decides which image is
  // the LCP candidate. The cover is promoted on BOTH branches — with and
  // without uploads it is still the first thing painted.
  const galleryCovers = gallery.match(/<ProductCover[\s\S]*?priority/g) ?? []
  assert.equal(galleryCovers.length, 2, 'both gallery branches should promote the cover')
  // Uploaded slides are off-screen until the visitor pages to them, so nothing
  // else competes with the cover for the initial fetch.
  assert.match(gallery, /loading="lazy"/)
  assert.doesNotMatch(gallery, /fetchPriority="high"/)
})
