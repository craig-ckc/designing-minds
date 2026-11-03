import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(new URL(`../../apps/web/src/${path}`, import.meta.url), 'utf8')

test('shared icon-only navigation controls have accessible names', () => {
  const navbar = read('components/layout/navbar.tsx')
  const wordmark = read('components/ui/wordmark.tsx')

  assert.match(navbar, /aria-label="Log in to your account"/)
  // The single mobile toggle names both states via a dynamic aria-label, so accept
  // either the static ("…") or expression ('…') attribute form.
  assert.match(navbar, /aria-label=(?:"|\{[^}]*')Open navigation menu/)
  assert.match(navbar, /['"]Close navigation menu['"]/)
  assert.match(wordmark, /aria-label="Designing Minds home"/)
})

test('image-only product links and decorative images expose the right semantics', () => {
  const productCard = read('components/ui/product-card.tsx')
  const productCover = read('components/ui/product-cover.tsx')
  const hero = read('components/ui/resource-stack.tsx')
  const placeholder = read('components/ui/placeholder.tsx')
  const polaroid = read('components/ui/polaroid.tsx')
  const aboutConnect = read('components/sections/about-connect-section.tsx')

  assert.match(productCard, /aria-label=\{`View \$\{product\.title\}`\}/)
  assert.match(hero, /aria-label=\{product \? `View \$\{product\.title\}`/)
  // Product artwork is announced once using the complete title supplied by CMS data.
  assert.match(productCover, /role="img" aria-label=\{product\.title\}/)
  assert.match(productCover, /alt=\{`\$\{illustrationLabel\(illustration\)\} illustration`\}/)
  // Real images cannot be passed to the shared components without descriptive alt text.
  assert.match(placeholder, /\{ src: string; alt: string \}/)
  assert.match(polaroid, /\{ src: string; alt: string \}/)
  assert.match(placeholder, /<img src=\{src\} alt=\{alt\}/)
  assert.match(polaroid, /<img src=\{src\} alt=\{alt\}/)
  assert.match(aboutConnect, /image: string, imageAlt: string/)
  assert.match(aboutConnect, /<img src=\{image\} alt=\{imageAlt\}/)
  // Shared placeholder artwork is decorative and does not render an empty-alt image.
  assert.match(placeholder, /backgroundImage: "url\('\/placeholder-image\.svg'\)"/)
  assert.match(polaroid, /backgroundImage: "url\('\/placeholder-image\.svg'\)"/)
  assert.doesNotMatch(placeholder, /<img[^>]+placeholder-image\.svg/)
  assert.doesNotMatch(polaroid, /<img[^>]+placeholder-image\.svg/)
})

test('SVG textures used as backgrounds are hidden from assistive technology', () => {
  const sources = [
    read('components/layout/navbar.tsx'),
    read('components/sections/bundle-pricing-section.tsx'),
    read('components/sections/cta-banner.tsx'),
    read('index.css'),
  ].join('\n')

  assert.match(sources, /card-background-01\.svg/)
  assert.match(sources, /backgroundImage: "url\('\/images\/card-background-02\.svg'\)"/)
  assert.doesNotMatch(sources, /<img[^>]+card-background/)
  assert.equal(
    sources.match(/style=\{\{ backgroundImage: "url\('\/images\/card-background-0[12]\.svg'\)" \}\}\s+aria-hidden/g)?.length,
    2,
  )
  assert.match(sources, /className="cta-panel__texture" aria-hidden="true"/)
})

test('catalogue pages establish sequential heading levels', () => {
  const grades = read('pages/grades-page.tsx')
  const product = read('pages/product-page.tsx')

  assert.match(grades, /<h2 className="sr-only">Browse resources by grade<\/h2>/)
  assert.match(product, /<h1 className="text-2xl[^"]*">\{product\.title\}<\/h1>/)
  assert.match(product, /<DetailDisclosure title="About this/)
  assert.match(read('components/ui/detail-disclosure.tsx'), /<h2[^>]*>\{title\}<\/h2>/)
  assert.doesNotMatch(product, /<h3/)
})

test('homepage removes redundant pricing and new-resource badges', () => {
  const hero = read('components/sections/home-hero-section.tsx')

  assert.doesNotMatch(hero, /Individual resources start|New · Resources/)
})

test('homepage grade selector exposes each grade label only once', () => {
  const hero = read('components/sections/home-hero-section.tsx')

  assert.match(hero, /aria-label="Choose a grade"/)
  assert.match(hero, /aria-pressed=\{item === grade\}/)
  assert.match(hero, />\s*\{item\}\s*<\/button>/)
})
