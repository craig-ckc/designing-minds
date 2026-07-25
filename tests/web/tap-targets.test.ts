import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(new URL(`../../apps/web/src/${path}`, import.meta.url), 'utf8')

test('shared small links meet the mobile tap-target minimum', () => {
  const breadcrumb = read('components/ui/breadcrumb.tsx')
  const productCard = read('components/ui/product-card.tsx')
  const hero = read('components/sections/home-hero-section.tsx')

  assert.match(breadcrumb, /className="inline-flex min-h-6 items-center py-0\.5 hover:text-ink"/)
  assert.match(productCard, /className="inline-flex min-h-6 items-center py-0\.5"/)
  assert.match(hero, /className="group mt-5 inline-flex min-h-8 items-center/)
})

test('form controls expose only touch-sized interactive targets', () => {
  const contact = read('pages/contact-page.tsx')
  const select = read('components/ui/select.tsx')

  assert.match(contact, /className="h-6 w-6 flex-none accent-primary"/)
  assert.match(select, /input\.inert = true/)
  assert.match(select, /input\.style\.pointerEvents = 'none'/)
  assert.match(select, /inputRef=\{disableHiddenInputHitTarget\}/)
})
