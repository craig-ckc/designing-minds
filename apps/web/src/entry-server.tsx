/* eslint-disable react-refresh/only-export-components */
import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import App from './app.tsx'
import { AuthProvider } from './lib/auth.tsx'
import { CatalogProvider } from './lib/catalog.tsx'
import type { WebCatalogSnapshot } from './lib/cover-assets'

/* -------------------------------------------------------------------------
   Server render entry for the prerender build.

   Renders a single public route to HTML with the same App + providers the
   browser uses, seeded with the public snapshot so the markup matches what the
   client hydrates. Re-exports the build helpers (data load, route list, SEO,
   redirects) so the plain-JS prerender script can import them all from this one
   compiled bundle without executing TypeScript itself.
   ------------------------------------------------------------------------- */

export function render({ url, snapshot }: { url: string; snapshot: WebCatalogSnapshot }): { appHtml: string } {
  const appHtml = renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <CatalogProvider initialSnapshot={snapshot}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </CatalogProvider>
      </StaticRouter>
    </StrictMode>,
  )
  return { appHtml }
}

export { loadPublicBuildData } from './build/load-public-data.ts'
export { renderCoverJobs } from './build/render-cover-jobs.tsx'
export { COVER_IMAGE_WIDTH, COVER_IMAGE_HEIGHT, COVER_THUMBNAIL_WIDTH } from './lib/cover-assets.ts'
export { getPublicRoutes, FUNCTIONAL_NOINDEX_PATHS, FUNCTIONAL_SPA_PREFIXES } from './static-routes.ts'
export { renderHead, sitemapXml, robotsTxt, llmsTxt } from './seo.ts'
export { CANONICAL_SITE_URL, resolveCanonicalSiteUrl } from './site-url.ts'
export { gradeRedirectRoutes, redirectRoutes, validateRedirects } from './redirects.ts'
