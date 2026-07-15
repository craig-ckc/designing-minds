// Custom Vite SSG step. Runs after `vite build` (client) and the SSR build of
// src/entry-server.tsx. Fetches the public CMS snapshot + system-managed
// redirects once, renders every public route to static HTML, writes sitemap +
// robots, and assembles a Vercel Build Output API directory (.vercel/output)
// so static files, permanent redirects, the /api proxy, and the SPA fallback
// all ship from one build. See docs/web-static-generation-deployment.md.

import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { buildHtml, createSnapshotAsset } from './prerender-html.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const webRoot = path.resolve(here, '..')
const distDir = path.join(webRoot, 'dist')
const serverEntry = path.join(webRoot, 'dist-server', 'entry-server.js')
const outputDir = path.join(webRoot, '.vercel', 'output')
const staticDir = path.join(outputDir, 'static')

const isVercel = process.env.VERCEL === '1' || Boolean(process.env.VERCEL)
const allowEmpty = process.env.ALLOW_EMPTY_PRERENDER === 'true'

const siteUrl = (process.env.VITE_SITE_URL || 'http://localhost:5173').replace(/\/$/, '')
const functionsOrigin = (process.env.WEB_FUNCTIONS_ORIGIN || '').replace(/\/$/, '')

const fail = (message) => {
  console.error(`\n[prerender] ${message}\n`)
  process.exit(1)
}

if (!existsSync(serverEntry)) fail(`SSR bundle not found at ${serverEntry}. Did "vite build --ssr" run?`)
if (!existsSync(path.join(distDir, 'index.html'))) fail(`Client build not found at ${distDir}/index.html.`)

const server = await import(pathToFileURL(serverEntry).href)

/* ------------------------------ Load CMS data -------------------------- */

let snapshot
let redirects = []
try {
  const data = await server.loadPublicBuildData({
    supabaseUrl: process.env.VITE_SUPABASE_URL,
    supabasePublishableKey: process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  })
  snapshot = data.snapshot
  redirects = data.redirects
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  if (allowEmpty) {
    console.warn(`[prerender] CMS fetch failed (${message}). ALLOW_EMPTY_PRERENDER=true → using an empty snapshot.`)
    snapshot = {
      generatedAt: new Date().toISOString(),
      source: 'empty',
      valueLists: { grades: [], terms: [], years: [], productKinds: [], resourceFormats: [] },
      products: [],
      subjects: [],
      faqs: [],
      testimonials: [],
      customers: [],
      orders: [],
      payments: [],
      formContact: [],
      formNewsletter: [],
      stats: { productCount: 0, subjectCount: 0, gradeCount: 0, bundleCount: 0, accessPlanCount: 0, orderCount: 0, customerCount: 0 },
    }
  } else {
    fail(`Failed to fetch the public CMS snapshot. Refusing to deploy stale/empty static pages.\n  ${message}\n  (Set ALLOW_EMPTY_PRERENDER=true for local builds without Supabase.)`)
  }
}

// Fail the build on a bad redirect data state rather than shipping a loop.
try {
  server.validateRedirects(redirects)
} catch (error) {
  fail(error instanceof Error ? error.message : String(error))
}

/* --------------------------------- Render ------------------------------ */

const template = await readFile(path.join(distDir, 'index.html'), 'utf8')

// The template must be the pristine client build. If it already carries our
// injected markers, a previous prerender polluted it — run `vite build` first.
if (template.includes('__DM_PUBLIC_SNAPSHOT__') || !template.includes('<div id="root"></div>')) {
  fail('dist/index.html is not a pristine client build (re-run `vite build` before prerendering).')
}

const routeToFile = (routePath) =>
  routePath === '/' ? path.join(distDir, 'index.html') : path.join(distDir, routePath, 'index.html')

const routes = server.getPublicRoutes(snapshot)
const snapshotAsset = createSnapshotAsset(snapshot)
await writeFile(path.join(distDir, snapshotAsset.fileName), snapshotAsset.source, 'utf8')

for (const route of routes) {
  let appHtml
  try {
    ;({ appHtml } = server.render({ url: route.path, snapshot }))
  } catch (error) {
    fail(`Failed to render ${route.path}: ${error instanceof Error ? error.message : String(error)}`)
  }
  const headTags = server.renderHead(route, snapshot, siteUrl)
  const html = buildHtml({
    template,
    headTags,
    snapshotScript: snapshotAsset.scriptTag,
    appHtml,
  })
  const file = routeToFile(route.path)
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, html, 'utf8')
}

// SPA fallback shell for functional / unknown client routes: empty root, no
// snapshot (those pages load their own data), and noindex by default.
const shellHtml = template.replace('</head>', '    <meta name="robots" content="noindex" />\n  </head>')
await writeFile(path.join(distDir, '_shell.html'), shellHtml, 'utf8')

// sitemap.xml + robots.txt + llms.txt
await writeFile(path.join(distDir, 'sitemap.xml'), server.sitemapXml(routes, siteUrl, snapshot.generatedAt), 'utf8')
await writeFile(path.join(distDir, 'robots.txt'), server.robotsTxt(server.FUNCTIONAL_NOINDEX_PATHS, siteUrl), 'utf8')
await writeFile(path.join(distDir, 'llms.txt'), server.llmsTxt(routes, siteUrl), 'utf8')

console.log(`[prerender] Rendered ${routes.length} routes, ${redirects.length} redirects → dist/`)

/* ------------------------ Vercel Build Output API ---------------------- */

if (!functionsOrigin) {
  const msg = 'WEB_FUNCTIONS_ORIGIN is not set — /api/* will not proxy to the functions app.'
  if (isVercel) fail(`${msg} Set it in the web Vercel project's environment variables.`)
  console.warn(`[prerender] ${msg} (Using a placeholder for the local build.)`)
}
const apiOrigin = functionsOrigin || 'https://REPLACE-ME-functions.vercel.app'

await rm(outputDir, { recursive: true, force: true })
await mkdir(staticDir, { recursive: true })
await cp(distDir, staticDir, { recursive: true })

// Anchored regex matching the functional SPA prefixes and any sub-path, e.g.
// /account/orders/:id or /checkout/return — but not lookalikes like /carts.
const functionalSpaSrc = `^/(?:${server.FUNCTIONAL_SPA_PREFIXES.map((p) => p.slice(1)).join('|')})(?:/.*)?$`

const config = {
  version: 3,
  routes: [
    // 1. Permanent slug redirects (before any static/file handling).
    ...server.redirectRoutes(redirects),
    // 2. Proxy the API to the functions deployment.
    { src: '/api/(.*)', dest: `${apiOrigin}/api/$1` },
    // 3. Serve generated static files (route HTML, assets, sitemap, robots).
    { handle: 'filesystem' },
    // 4. Known functional client routes (auth, cart, checkout, account) →
    //    noindex SPA shell with a 200. These aren't prerendered; they render
    //    and load their own data in the browser.
    { src: functionalSpaSrc, dest: '/_shell.html' },
    // 5. Everything else is a genuinely unknown URL → serve the shell (so the
    //    client shows the 404 page) but with a real 404 status, not a soft 404.
    { src: '/.*', dest: '/_shell.html', status: 404 },
  ],
}

await writeFile(path.join(outputDir, 'config.json'), JSON.stringify(config, null, 2), 'utf8')

console.log(`[prerender] Wrote Vercel Build Output → .vercel/output (api → ${apiOrigin})`)
