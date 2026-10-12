import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { after, before, test } from 'node:test'
import { createElement, type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer, type ViteDevServer } from 'vite'
import type { CmsSnapshot, Product } from '../../packages/cms/src/types.ts'
import type * as HeroHelpers from '../../apps/web/src/lib/hero-demo.ts'

let server: ViteDevServer
let HeroDemoPage: ComponentType<{ snapshot: CmsSnapshot | null }>
let helpers: typeof HeroHelpers
let routes: typeof import('../../apps/web/src/static-routes.ts')

before(async () => {
  server = await createServer({ configFile: false, root: fileURLToPath(new URL('../../apps/web', import.meta.url)),
    server: { middlewareMode: true }, appType: 'custom', ssr: { noExternal: ['@designing-minds/cms', '@designing-minds/utils'] } })
  ;({ default: HeroDemoPage } = await server.ssrLoadModule('/src/pages/hero-demo-page.tsx'))
  helpers = await server.ssrLoadModule('/src/lib/hero-demo.ts')
  routes = await server.ssrLoadModule('/src/static-routes.ts')
})
after(async () => { await server?.close() })

const render = (query = '', snapshot: CmsSnapshot | null = null) => renderToStaticMarkup(
  createElement(MemoryRouter, { initialEntries: [`/hero-demo${query}`] }, createElement(HeroDemoPage, { snapshot })),
)
const resource = (id: string, overrides: Partial<Product> = {}) => ({
  id, slug: id, title: `Grade 4 ${id}`, grade: 'Grade 4', term: 'Term 1', subjects: [id], published: true, sortOrder: 0, ...overrides,
}) as Product

test('eight distinct hero directions render with grade choices, purchase links and consistent family proof', () => {
  assert.equal(helpers.HERO_STUDIES.length, 8)
  assert.equal(new Set(helpers.HERO_STUDIES.map((study) => study.id)).size, 8)
  for (const [index, study] of helpers.HERO_STUDIES.entries()) {
    const html = render(`?option=${index + 1}&grade=Grade%204`)
    assert.match(html, new RegExp(`hero-study--${study.id}`))
    assert.ok(html.includes(study.headline))
    assert.match(html, /4\.9 stars from 750\+ families/)
    assert.match(html, /href="\/shop\?grade=Grade%204"/)
    assert.match(html, /href="\/packages"/)
    assert.match(html, /aria-label="Choose a grade"/)
    assert.doesNotMatch(html, /Individual resources start|discounted once-off|New · Resources/)
    assert.equal((html.match(/<h1/g) ?? []).length, 1)
  }
})

test('invalid option parameters select the first study, while all valid indices are supported', () => {
  for (const value of [null, '', '0', '-1', '9', '1.5', 'hello']) assert.equal(helpers.heroStudyIndex(value), 0)
  for (let option = 1; option <= 8; option++) assert.equal(helpers.heroStudyIndex(String(option)), option - 1)
  assert.match(render('?option=invalid&grade=Grade%2012'), /Explore Grade 3/)
})

test('resource examples use only published resources in the selected grade and prefer subject variety', () => {
  const snapshot = { products: [resource('maths-one', { subjects: ['Mathematics'] }), resource('maths-two', { subjects: ['Mathematics'] }), resource('english', { subjects: ['English'], term: 'Term 2' }), resource('hidden', { published: false }), resource('other-grade', { grade: 'Grade 5' })] } as CmsSnapshot
  const before = snapshot.products.map((product) => product.id)
  const examples = helpers.heroExamples(snapshot, 'Grade 4')
  assert.deepEqual(examples.map((item) => item.slug), ['maths-one', 'english', 'maths-two'])
  assert.deepEqual(snapshot.products.map((product) => product.id), before)
  assert.ok(examples.every((item) => item.cover.grade === 'Grade 4'))
})

test('an unloaded or empty catalogue provides grade-specific examples without invented product links', () => {
  for (const snapshot of [null, { products: [] } as unknown as CmsSnapshot]) {
    const examples = helpers.heroExamples(snapshot, 'Grade 7')
    assert.equal(examples.length, 5)
    assert.ok(examples.every((item) => item.cover.grade === 'Grade 7' && !item.slug))
  }
  const html = render('?grade=Grade%207')
  assert.match(html, /Explore Grade 7/)
  assert.doesNotMatch(html, /href="\/shop\/[^?"]/)
})

test('the design page is excluded from public routes and served through the noindex SPA route', () => {
  assert.ok(routes.FUNCTIONAL_NOINDEX_PATHS.includes('/hero-demo'))
  assert.ok(routes.FUNCTIONAL_SPA_PREFIXES.includes('/hero-demo'))
  assert.ok(!(routes.STATIC_INDEXABLE_PATHS as readonly string[]).includes('/hero-demo'))
})
