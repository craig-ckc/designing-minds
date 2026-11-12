import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { after, before, test } from 'node:test'
import { createElement, type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer, type ViteDevServer } from 'vite'
import type { CmsSnapshot } from '../../packages/cms/src/types.ts'
import { makeSnapshot } from '../support/fixtures.ts'
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

const snapshot = (): CmsSnapshot => makeSnapshot({
  valueLists: { grades: ['Grade 3', 'Grade 4'], terms: ['Term 1', 'Term 2'], years: ['2026'], subjects: ['Mathematics'], resourceFormats: ['Test / Assessment'] },
})
const renderShop = (url: string) => renderToStaticMarkup(createElement(
  CatalogContext.Provider,
  { value: { state: { snapshot: snapshot(), status: 'ready', error: null }, actions: { retry: () => {} }, meta: { now: Date.UTC(2026, 0, 1) } } },
  createElement(MemoryRouter, { initialEntries: [url] }, createElement(ShopPage)),
))

test('an active grade filter renders a removable chip and a single-grade subtitle', () => {
  const html = renderShop('/shop?grade=grade-4')
  assert.match(html, /<button[^>]*aria-label="Remove filter: Grade 4"[^>]*>Grade 4</)
  assert.match(html, /CAPS-aligned tests, memos and bundles for Grade 4\./)
})

test('every filter kind gets a chip; two grades get chips but no subtitle', () => {
  const html = renderShop('/shop?grade=grade-3&grade=grade-4&term=Term%202&subject=Mathematics&format=Test%20%2F%20Assessment')
  for (const label of ['Grade 3', 'Grade 4', 'Term 2', 'Mathematics', 'Test / Assessment']) {
    assert.ok(html.includes(`aria-label="Remove filter: ${label}"`), label)
  }
  assert.doesNotMatch(html, /CAPS-aligned tests, memos and bundles for/)
})

test('an unfiltered shop renders no chips and no subtitle', () => {
  const html = renderShop('/shop')
  assert.doesNotMatch(html, /Remove filter|Active filters|CAPS-aligned tests, memos and bundles/)
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

test('shopSubtitle exists only for exactly one grade', () => {
  assert.equal(shopSubtitle([]), undefined)
  assert.equal(shopSubtitle(['Grade 4']), 'CAPS-aligned tests, memos and bundles for Grade 4.')
  assert.equal(shopSubtitle(['Grade 3', 'Grade 4']), undefined)
})

test('chips render nothing when empty', () => {
  assert.equal(renderToStaticMarkup(createElement(chips.ActiveFilterChips, { filters: [], onRemove: () => {} })), '')
})
