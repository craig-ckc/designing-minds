# Web Static Generation and CMS Publish Design

Date: 2026-06-29

## Purpose

The web app must behave like a fast static commerce and marketing site for public pages while preserving dynamic functionality for cart, checkout, authentication, and customer account flows. Public catalogue and content pages should be generated at build time with route-specific HTML, SEO metadata, structured data, and the CMS catalogue content needed for first paint. Admin CMS changes must be able to trigger a rebuild of the web Vercel project so those static files are regenerated from the latest CMS data.

## Current State

`apps/web` is currently a Vite React SPA. `main.tsx` mounts `BrowserRouter`, `App.tsx` fetches the CMS snapshot in the browser after auth loading settles, and `apps/web/vercel.json` rewrites every non-API path to `/index.html`. This means public routes work as deep links, but crawlers and first-load users receive the same generic shell before JavaScript loads catalogue data.

`apps/admin` writes CMS records through the shared `@designing-minds/cms` repository from the admin browser. File upload URL generation already goes through `apps/functions` because it requires privileged server-side behavior.

`apps/functions` is the shared API app. It already validates admin users with `requireAdmin()` and exposes admin-only handlers under `/api/admin/*`.

## Goals

- Generate static HTML at build time for indexable web routes.
- Remove the public-page first-load dependency on browser-side CMS fetching.
- Preserve React hydration so filters, add-to-cart buttons, and navigation remain interactive.
- Generate SEO and AEO metadata from static page definitions and CMS data.
- Keep cart, checkout, auth, and customer account routes functional and noindexed.
- Allow admin users to trigger a web rebuild after CMS content changes.
- Keep the Vercel Deploy Hook URL secret and server-side only.

## Non-Goals

- Do not migrate the web app to Astro, Next.js, or React Router framework mode for this phase.
- Do not add runtime SSR. Rendering happens during build and writes static files.
- Do not make account, order, cart, checkout, or auth data static.
- Do not expose Vercel API tokens or Deploy Hook URLs to the browser.
- Do not add CMS-managed page-builder content. Static pages remain owned by the website code.

## Recommended Architecture

Use a custom Vite SSG pipeline built on Vite's SSR build capability:

1. Build the normal client bundle.
2. Build a server render entry for prerendering.
3. Fetch a public CMS snapshot once during the web build.
4. Sanitize the snapshot to public content only.
5. Generate the list of public routes from static route definitions and CMS data.
6. Render each public route to HTML with React `StaticRouter`.
7. Inject page-specific head tags, JSON-LD, canonical URLs, and the sanitized snapshot bootstrap.
8. Write each route as a static HTML file under `dist`.
9. Keep dynamic routes served by the SPA fallback and marked `noindex`.

This is intentionally Vite-native and lower-churn than adopting a full framework now.

## Route Classification

### Static, Indexable Routes

These routes must be prerendered and included in `sitemap.xml`:

- `/`
- `/shop`
- `/grades`
- `/grades/:gradeSlug`
- `/packages`
- `/product/:slug`
- `/help`
- `/about`
- `/contact`
- `/privacy-policy`
- `/terms`
- `/refund-policy`

Dynamic static routes are generated from CMS data:

- Grade detail pages from `snapshot.valueLists.grades`
- Product detail pages from published products

If package detail pages are added later, they should be generated from published package/access-plan slugs using the same route manifest.

### Functional, Noindex Routes

These routes remain client-driven and should not be in `sitemap.xml`:

- `/sign-up`
- `/login`
- `/account`
- `/account/orders`
- `/account/orders/:orderId`
- `/cart`
- `/checkout`
- `/checkout/fake-payfast`
- `/checkout/return`
- `/checkout/cancel`

These may still be served by static fallback HTML, but their meaningful data comes from local storage, Supabase auth, Supabase tables, or functions API calls after hydration.

## CMS Snapshot Handling

The build-time snapshot must be public by construction. Even though the public Supabase client should be restricted by RLS, the static pipeline must not serialize operational records accidentally.

Create a public snapshot shape containing only:

- `generatedAt`
- `source`
- `valueLists`
- `products` limited to published public catalogue fields
- `subjects` limited to visible/public fields
- `faqs` limited to published public fields
- `testimonials` limited to published public fields
- `stats` recalculated from public content

Exclude:

- `customers`
- `orders`
- `payments`
- private storage keys
- unpublished products, FAQs, testimonials, or hidden subjects

The browser should hydrate from the embedded or linked public snapshot first. Public pages should not show "Preparing the catalogue..." when a build-time snapshot is present. Runtime CMS fetches can remain as a fallback for development, preview debugging, or failed bootstrap data.

## App Structure Changes

Introduce an application factory so browser and server entries share the same route tree:

- `src/App.tsx` accepts an optional initial public snapshot.
- `src/entry-client.tsx` hydrates the prerendered HTML and reads `window.__DM_PUBLIC_SNAPSHOT__`.
- `src/entry-server.tsx` exports a render function that accepts `{ url, snapshot, siteUrl }`.
- `src/static-routes.ts` owns route classification and public route generation.
- `src/seo.ts` maps route matches plus CMS data to metadata and JSON-LD.
- `scripts/prerender.mjs` or `src/prerender.ts` runs after `vite build` and writes route HTML.

The current `main.tsx` can be replaced by `entry-client.tsx` or kept as a thin client entry if Vite config points at it.

## SEO and AEO Requirements

Every static page should emit:

- Unique `<title>`
- Meta description
- Canonical URL
- Robots directive, defaulting to `index,follow`
- Open Graph title, description, URL, and type
- Twitter card metadata

Structured data should include:

- `Organization` on global/public pages
- `WebSite` with search action if site search is available
- `BreadcrumbList` on browse, grade, product, support, and legal pages
- `Product` on product detail pages, including price, currency, availability, category, and description
- `FAQPage` where visible FAQ content is rendered on the page

Generate:

- `dist/sitemap.xml` for indexable static routes
- `dist/robots.txt`, allowing public pages and disallowing noindex functional routes

Answer-engine optimization should be handled through concrete page copy and structured data. Help pages and product pages should answer practical questions directly in visible text instead of hiding all meaning in grids and cards.

## Vercel Routing

Generated files should be served directly. The SPA fallback should remain for functional routes and unknown React routes.

Recommended Vercel behavior:

- Keep `/api/:path*` rewriting to the functions deployment.
- Let static files in `dist` win for generated routes.
- Fallback remaining paths to `/index.html`.
- Continue rendering the React `NotFoundPage` for unmatched client routes.

If Vercel route order causes generated route files to be bypassed, replace the catch-all rewrite with a configuration that preserves static file serving before fallback.

## Admin-Initiated Web Rebuild

Yes, admin-triggered web redeploys are possible.

Use a Vercel Deploy Hook on the web app's Vercel project. Vercel Deploy Hooks are project/repository/branch-specific URLs that trigger a deployment and rerun the build when requested. They are designed for CMS-driven rebuilds.

The Deploy Hook must not be called directly from `apps/admin`, because the hook URL acts like a secret. Anyone with it can trigger deployments.

Add an admin-only functions endpoint:

```text
POST /api/admin/rebuild-web
Authorization: Bearer <admin Supabase access token>
```

Handler behavior:

1. Require `POST`.
2. Validate the caller with `requireAdmin(req.headers)`.
3. Read `VERCEL_WEB_DEPLOY_HOOK_URL` from the functions app environment.
4. Optionally debounce rebuild requests using a short in-memory or database-backed cooldown.
5. `fetch(VERCEL_WEB_DEPLOY_HOOK_URL, { method: 'POST' })`.
6. Return the Vercel hook response job id/state if available.

Admin UI behavior:

- After saving CMS content, show a "Publish website" or "Rebuild website" action.
- The save operation and rebuild operation should be separate. Saving updates CMS immediately; publishing regenerates the static web app.
- Show states: idle, triggering, deployment queued, trigger failed.
- Do not promise immediate live content. A rebuild takes as long as the web Vercel build takes.

Environment variables:

- `apps/functions`: `VERCEL_WEB_DEPLOY_HOOK_URL`
- `apps/web`: `VITE_SITE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`

## Deployment Flow

Normal code deployment:

1. Code is pushed.
2. Each Vercel project deploys independently.
3. Web build fetches CMS data and regenerates static public pages.

CMS publish deployment:

1. Admin edits products, subjects, FAQs, or testimonials.
2. Admin saves CMS records.
3. Admin clicks "Publish website".
4. Admin app calls `POST /api/admin/rebuild-web`.
5. Functions app validates admin access.
6. Functions app triggers the web Vercel Deploy Hook.
7. Web project rebuilds from the current Git commit and latest CMS data.
8. New static files go live when the deployment completes.

## Error Handling

Web build:

- If CMS snapshot fetching fails in production, fail the build rather than deploying stale or empty static pages silently.
- In local development, allow a clear error message or optional fixture fallback.
- If one route fails to render, fail the build with the route path in the error.

Runtime web:

- If bootstrap snapshot exists, use it before any network fetch.
- If bootstrap snapshot is missing on a public route, show the existing loading/error states and attempt a runtime fetch.
- Functional pages keep their existing auth/API error handling.

Rebuild endpoint:

- Missing hook URL returns server error with a safe message.
- Non-admin user returns unauthorized/forbidden.
- Vercel hook failure returns a non-2xx response to the admin UI with a clear message.
- Log detailed hook failures server-side only.

## Testing and Verification

Build checks:

- `npm run build --workspace @designing-minds/web`
- Verify generated HTML exists for `/`, `/shop`, `/grades`, each grade route, `/packages`, each product route, `/help`, `/about`, `/contact`, and legal pages.
- Verify generated HTML contains route-specific content, not only the root shell.
- Verify no private operational data appears in `dist`.
- Verify `sitemap.xml` contains only indexable routes.
- Verify `robots.txt` excludes functional routes.

Browser checks:

- Load a product page with JavaScript disabled and confirm product content is visible.
- Load `/shop` and confirm catalogue content is visible before hydration.
- Confirm filters and add-to-cart still work after hydration.
- Confirm `/cart`, `/checkout`, `/login`, and `/account` remain functional.

Admin/functions checks:

- Non-admin cannot trigger `/api/admin/rebuild-web`.
- Admin can trigger `/api/admin/rebuild-web`.
- The Deploy Hook URL is never sent to the browser.
- Failed Vercel hook calls are reported clearly in admin UI.

## Rollout Plan

1. Add public snapshot sanitization and route metadata helpers.
2. Refactor web app entry points for server rendering and client hydration.
3. Add the Vite prerender build step and generated static files.
4. Add SEO, JSON-LD, sitemap, and robots generation.
5. Update Vercel routing if needed.
6. Add functions endpoint for admin-triggered web rebuilds.
7. Add admin UI publish action.
8. Verify static output, hydration, noindex behavior, and rebuild trigger.

## Open Decisions

- Whether the admin should show a manual "Publish website" button only, or also offer "Save and publish".
- Whether rebuild request debouncing should be in-memory for the first version or persisted in Supabase.
- Whether product pages should include only published products or also preview unpublished products on preview deployments. The production default is published products only.

## Research Notes

- Vercel Deploy Hooks support CMS-driven rebuilds by accepting HTTP requests that trigger deployments and rerun the build step for a specific project/repository/branch.
- Vercel treats Deploy Hook URLs as secrets because possession of the URL is enough to trigger a deployment.
- Deploy Hooks use build cache by default, and repeated requests for the same hook/version may cancel prior deployments for the same hook.
- Deploy Hooks have per-project limits, so use one production web hook for this workflow unless a separate preview publishing flow is required.
