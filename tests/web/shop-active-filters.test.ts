import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { after, before, test } from 'node:test'
import { createElement, type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer, type ViteDevServer } from 'vite'
import type { CmsSnapshot } from '../../packages/cms/src/types.ts'
import { makeProduct, makeSnapshot } from '../support/fixtures.ts'
import { normalizeGradeParams, shopSubtitle, toggleQueryValue } from '../../apps/web/src/lib/filter-query.ts'

let server: ViteDevServer
let ShopPage: ComponentType
let CatalogContext: typeof import('../../apps/web/src/lib/catalog.tsx').CatalogContext
let chips: typeof import('../../apps/web/src/components/ui/active-filter-chips.tsx')

before(async () => {
  server = await createServer({
    configFile: false,
    root: fileURLToPath(new URL('../../apps/web', import.meta.url)),
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
    ssr: { noExternal: ['@designing-minds/cms', '@designing-minds/utils'] },
  })
  ;({ ShopPage } = await server.ssrLoadModule('/src/pages/shop-page.tsx'))
  ;({ CatalogContext } = await server.ssrLoadModule('/src/lib/catalog.tsx'))
  chips = await server.ssrLoadModule('/src/components/ui/active-filter-chips.tsx') as typeof chips
})
after(async () => { await server?.close() })

const snapshot = (overrides: Partial<CmsSnapshot> = {}): CmsSnapshot => makeSnapshot({
  valueLists: { grades: ['Grade 3', 'Grade 4'], terms: ['Term 1', 'Term 2'], years: ['2026'], subjects: ['Mathematics'], resourceFormats: ['Test / Assessment'] },
  ...overrides,
})
const renderShop = (url: string, data: CmsSnapshot = snapshot()) => renderToStaticMarkup(createElement(
  CatalogContext.Provider,
  { value: { state: { snapshot: data, status: 'ready', error: null }, actions: { retry: () => {} }, meta: { now: Date.UTC(2026, 0, 1) } } },
  createElement(MemoryRouter, { initialEntries: [url] }, createElement(ShopPage)),
))
const BROWSE_LEAD = /Browse \d+ CAPS-aligned resources? across grades, terms, subjects and formats, or start with a bundle\./

test('an active grade filter renders a removable chip and a single-grade subtitle', () => {
  const html = renderShop('/shop?grade=grade-4')
  assert.match(html, /<button[^>]*aria-label="Remove filter: Grade 4"[^>]*>\s*<span[^>]*>Grade 4<span aria-hidden="true">×<\/span><\/span><\/button>/)
  assert.match(html, /CAPS-aligned tests, memos and bundles for Grade 4\./)
})

test('an active filter chip uses the primary md pill look', () => {
  const html = renderToStaticMarkup(createElement(chips.ActiveFilterChips, { filters: [{ key: 'grade', value: 'Grade 4', label: 'Grade 4' }], onRemove: () => {} }))
  const pill = html.match(/<button[^>]*>\s*<span class="([^"]+)"/)?.[1] ?? ''
  for (const cls of ['rounded-full', 'bg-primary-tint', 'text-primary-ink', 'px-4', 'py-2', 'text-label', 'font-medium']) assert.ok(pill.split(' ').includes(cls), cls)
  assert.doesNotMatch(pill, /\bborder\b|filter-chip/)
})

test('a resources-only shop leads with its published resource count; one grade keeps the grade lead', () => {
  const data = snapshot({ products: [makeProduct({ slug: 'a', grade: 'Grade 3' }), makeProduct({ slug: 'b', grade: 'Grade 4' }), makeProduct({ slug: 'c', grade: 'Grade 4' })] })
  assert.match(renderShop('/shop', data), /<p class="mt-3 lead">Browse 3 CAPS-aligned resources across grades, terms, subjects and formats, or start with a bundle\.<\/p>/)
  // The count is the catalogue, not the filtered results.
  assert.match(renderShop('/shop?grade=grade-3&grade=grade-4&q=zzz', data), /Browse 3 CAPS-aligned resources/)
  const single = renderShop('/shop?grade=grade-4', data)
  assert.match(single, /CAPS-aligned tests, memos and bundles for Grade 4\./)
  assert.doesNotMatch(single, BROWSE_LEAD)
})

test('the mixed digital and physical shop has no count lead', () => {
  const physical = { id: 'p1', slug: 'keyring', title: 'Keyring', shortDescription: '', fullDescription: '' } as unknown as NonNullable<CmsSnapshot['physicalCatalog']>[number]
  const data = snapshot({ products: [makeProduct({ slug: 'a' })], physicalCatalog: [physical] })
  // ?type=digital keeps the stub listing out of the grid; the header still reflects the mixed catalogue.
  const html = renderShop('/shop?type=digital', data)
  assert.match(html, /<h1[^>]*>All products<\/h1>/)
  assert.doesNotMatch(html, BROWSE_LEAD)
})

test('every filter kind gets a chip; two grades get chips but no subtitle', () => {
  const html = renderShop('/shop?grade=grade-3&grade=grade-4&term=Term%202&subject=Mathematics&format=Test%20%2F%20Assessment')
  for (const label of ['Grade 3', 'Grade 4', 'Term 2', 'Mathematics', 'Test / Assessment']) {
    assert.ok(html.includes(`aria-label="Remove filter: ${label}"`), label)
  }
  assert.doesNotMatch(html, /CAPS-aligned tests, memos and bundles for/)
})

test('an unfiltered shop with no published resources renders no chips and no lead', () => {
  const html = renderShop('/shop')
  assert.doesNotMatch(html, /Remove filter|Active filters|CAPS-aligned tests, memos and bundles/)
  assert.doesNotMatch(html, BROWSE_LEAD)
})

test('unknown filter values render no chip', () => {
  assert.doesNotMatch(renderShop('/shop?grade=grade-99&term=Term%209'), /Remove filter/)
})

test('removing a chip clears only that value', () => {
  const grades = ['Grade 3', 'Grade 4']
  const single = toggleQueryValue(normalizeGradeParams(new URLSearchParams('grade=grade-4&q=maths'), grades), 'grade', 'Grade 4')
  assert.equal(single.toString(), 'q=maths')
  const both = toggleQueryValue(normalizeGradeParams(new URLSearchParams('grade=grade-3&grade=grade-4'), grades), 'grade', 'Grade 3')
  assert.deepEqual(both.getAll('grade'), ['Grade 4'])
})

test('shopSubtitle: one grade gets the grade lead; otherwise only a resource count produces a lead', () => {
  assert.equal(shopSubtitle([]), undefined)
  assert.equal(shopSubtitle(['Grade 4']), 'CAPS-aligned tests, memos and bundles for Grade 4.')
  assert.equal(shopSubtitle(['Grade 3', 'Grade 4']), undefined)
  assert.equal(shopSubtitle(['Grade 4'], 336), 'CAPS-aligned tests, memos and bundles for Grade 4.')
  assert.equal(shopSubtitle([], 336), 'Browse 336 CAPS-aligned resources across grades, terms, subjects and formats, or start with a bundle.')
  assert.equal(shopSubtitle(['Grade 3', 'Grade 4'], 336), 'Browse 336 CAPS-aligned resources across grades, terms, subjects and formats, or start with a bundle.')
  assert.equal(shopSubtitle([], 1), 'Browse 1 CAPS-aligned resource across grades, terms, subjects and formats, or start with a bundle.')
  assert.equal(shopSubtitle([], 0), undefined)
})

test('chips render nothing when empty', () => {
  assert.equal(renderToStaticMarkup(createElement(chips.ActiveFilterChips, { filters: [], onRemove: () => {} })), '')
})
