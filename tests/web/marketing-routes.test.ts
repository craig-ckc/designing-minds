import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer, type ViteDevServer } from 'vite'
import { makeSnapshot } from '../support/fixtures.ts'

let server: ViteDevServer
let gradeRedirectRoutes: typeof import('../../apps/web/src/redirects.ts').gradeRedirectRoutes
let gradeRedirectTarget: typeof import('../../apps/web/src/redirects.ts').gradeRedirectTarget
let getPublicRoutes: typeof import('../../apps/web/src/static-routes.ts').getPublicRoutes
let matchPath: typeof import('../../apps/web/src/static-routes.ts').matchPath
let llmsTxt: typeof import('../../apps/web/src/seo.ts').llmsTxt
let pageMetaFor: typeof import('../../apps/web/src/seo.ts').pageMetaFor

before(async () => {
  server = await createServer({
    configFile: false,
    root: fileURLToPath(new URL('../../apps/web', import.meta.url)),
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
    ssr: { noExternal: ['@designing-minds/cms', '@designing-minds/utils'] },
  })
  ;({ gradeRedirectRoutes, gradeRedirectTarget } = await server.ssrLoadModule('/src/redirects.ts'))
  ;({ getPublicRoutes, matchPath } = await server.ssrLoadModule('/src/static-routes.ts'))
  ;({ llmsTxt, pageMetaFor } = await server.ssrLoadModule('/src/seo.ts'))
})
after(async () => { await server?.close() })

const srcDir = fileURLToPath(new URL('../../apps/web/src/', import.meta.url))
const read = (path: string) => readFileSync(new URL(`../../apps/web/src/${path}`, import.meta.url), 'utf8')
const GRADES = ['Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7']

test('grade detail URLs redirect permanently to the shop filtered by grade, with a /shop fallback last', () => {
  const routes = gradeRedirectRoutes(GRADES)
  assert.equal(routes.length, GRADES.length + 1)
  assert.deepEqual(routes[0], { src: '^/grades/grade-3/?$', status: 301, headers: { Location: '/shop?grade=grade-3' } })
  assert.deepEqual(routes[4], { src: '^/grades/grade-7/?$', status: 301, headers: { Location: '/shop?grade=grade-7' } })
  assert.deepEqual(routes.at(-1), { src: '^/grades/[^/]+/?$', status: 301, headers: { Location: '/shop' } })

  // Each rule matches its own path (with or without a trailing slash) and never the Grades index.
  for (const route of routes.slice(0, -1)) assert.ok(new RegExp(route.src!).test(route.src!.replace(/^\^|\/\?\$$/g, '') + '/'))
  const fallback = new RegExp(routes.at(-1)!.src!)
  assert.ok(fallback.test('/grades/grade-9') && fallback.test('/grades/anything/'))
  assert.ok(!fallback.test('/grades') && !fallback.test('/grades/') && !fallback.test('/grades/grade-3/extra'))
  assert.deepEqual(gradeRedirectRoutes([]), [{ src: '^/grades/[^/]+/?$', status: 301, headers: { Location: '/shop' } }])
})

test('the client redirect target matches the server rules', () => {
  assert.equal(gradeRedirectTarget('grade-4', GRADES), '/shop?grade=grade-4')
  assert.equal(gradeRedirectTarget('Grade-4', GRADES), '/shop?grade=grade-4')
  assert.equal(gradeRedirectTarget('grade-9', GRADES), '/shop')
  assert.equal(gradeRedirectTarget('grade-4', []), '/shop')
})

test('prerender emits the grade redirects beside the slug redirects and the client routes /grades/:slug to a redirect', () => {
  const prerender = readFileSync(new URL('../../apps/web/scripts/prerender.mjs', import.meta.url), 'utf8')
  assert.ok(prerender.indexOf('server.redirectRoutes(redirects)') < prerender.indexOf('server.gradeRedirectRoutes(snapshot.valueLists.grades)'))
  assert.ok(prerender.indexOf('server.gradeRedirectRoutes') < prerender.indexOf("src: '/api/(.*)'"))
  assert.match(read('entry-server.tsx'), /export \{[^}]*gradeRedirectRoutes[^}]*\} from '\.\/redirects\.ts'/)
  assert.match(read('app.tsx'), /path="\/grades\/:gradeSlug" element=\{<GradeRedirect \/>\}/)
  assert.match(read('app.tsx'), /<Navigate to=\{gradeRedirectTarget\([^)]*\)\} replace \/>/)
})

test('grade detail pages are no longer routes, metadata or llms.txt entries', () => {
  const snapshot = makeSnapshot({ valueLists: { ...makeSnapshot().valueLists, grades: GRADES as never } })
  const routes = getPublicRoutes(snapshot)
  assert.ok(routes.every((route) => !route.path.startsWith('/grades/')))
  assert.equal(matchPath('/grades/grade-4', snapshot), null)
  assert.deepEqual(matchPath('/grades', snapshot), { path: '/grades', kind: 'static' })
  assert.doesNotMatch(llmsTxt(routes, 'https://www.designingminds.co.za'), /Resources by grade|\/grades\/grade/)
  assert.match(pageMetaFor({ path: '/grades', kind: 'static' }, snapshot, 'https://www.designingminds.co.za').description, /Curriculum and Assessment Policy Statement/)
  assert.equal(existsSync(new URL('../../apps/web/src/pages/grade-detail-page.tsx', import.meta.url)), false)
  assert.equal(existsSync(new URL('../../apps/web/src/components/sections/grade-package-section.tsx', import.meta.url)), false)
})

test('no storefront source links to a grade detail page', () => {
  const offenders = readdirSync(srcDir, { recursive: true, encoding: 'utf8' })
    .filter((file) => /\.(ts|tsx)$/.test(file) && file !== 'redirects.ts')
    .filter((file) => /['"`]\/grades\/(?!:)/.test(readFileSync(srcDir + file, 'utf8')))
  assert.deepEqual(offenders, [])
  assert.match(read('components/ui/grade-card.tsx'), /to=\{`\/shop\?grade=\$\{gradeToSlug\(grade\)\}`\}/)
})

test('the section merges leave no orphan files or imports', () => {
  for (const gone of ['trust-stats-section', 'about-cta-section', 'about-testimonials-section']) {
    assert.equal(existsSync(new URL(`../../apps/web/src/components/sections/${gone}.tsx`, import.meta.url)), false, gone)
  }
  const offenders = readdirSync(srcDir, { recursive: true, encoding: 'utf8' })
    .filter((file) => /\.(ts|tsx)$/.test(file))
    .filter((file) => /trust-stats-section|about-cta-section|about-testimonials-section|TrustStatsSection|AboutCtaSection|AboutTestimonialsSection/.test(readFileSync(srcDir + file, 'utf8')))
  assert.deepEqual(offenders, [])
  const about = read('pages/about-page.tsx')
  assert.match(about, /<StatsSection caption=/)
  assert.match(about, /<FinalCtaSection[\s\S]*actionTo="\/packages"/)
  assert.match(about, /<TestimonialsSection snapshot=\{snapshot\} loadError=\{loadError\} \/>/)
})

test('the home hero uses the painting with no gradient overlay', () => {
  const css = read('index.css')
  assert.doesNotMatch(css, /\.home-hero::before/)
  assert.doesNotMatch(css.slice(css.indexOf('.home-hero {'), css.indexOf('.home-hero__copy')), /gradient/)
  assert.match(read('components/sections/home-hero-section.tsx'), /src="\/images\/paintings\/home-hero\.avif"[^>]*width=\{1536\} height=\{864\} fetchPriority="high"/)
})

test('the announcement bar reads "New: CAPS resources for Grades 3–7 are here" without an em dash', () => {
  assert.match(read('components/layout/navbar/announcement-bar.tsx'), /New: CAPS resources for Grades 3–7 are here/)
})

test('the grades page is marketing-forward: page hero, tiles, inclusions, testimonials and a bundles CTA', () => {
  const page = read('pages/grades-page.tsx')
  assert.match(page, /<PageHero\b/)
  assert.doesNotMatch(page, /SplitHero/)
  assert.match(page, /title="Find the right practice for your child’s grade"/)
  assert.match(page, /lead=\{<><CapsAbbr \/>-aligned tests and memos for Grades 3 to 7, ready to print at home\.<\/>\}/)
  assert.match(page, /actionLabel="Browse all resources"[\s\S]*actionTo="\/shop"/)
  // The hero already links to the shop, so the finder drops its own link and keeps full tiles.
  assert.match(page, /<GradeFinderSection snapshot=\{snapshot\} showBrowseAll=\{false\} compactTiles=\{false\} \/>/)
  assert.match(page, /grades-hero-classroom-jacarandas\.avif/)
  assert.match(page, /What every grade includes/)
  assert.match(page, /<HomeTestimonialsSection/)
  assert.match(page, /title="Buy more, save more"[\s\S]*actionTo="\/packages"/)
})
