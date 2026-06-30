# Web Static Generation & CMS Publish — Deployment

Implements `docs/superpowers/specs/2026-06-29-web-static-generation-and-cms-publish-design.md`.
This is the operator checklist for shipping it to production.

## What changed

- `apps/web` now prerenders public routes to static HTML at build time with a
  custom Vite SSG step (`scripts/prerender.mjs`), keeping React hydration for
  interactivity. Public pages no longer wait on a browser-side CMS fetch.
- Each page embeds a sanitized **public** snapshot (`__DM_PUBLIC_SNAPSHOT__`) —
  published catalogue content only, never customers/orders/payments.
- Product slug changes record a permanent redirect automatically (DB trigger).
- The build emits a **Vercel Build Output** (`apps/web/.vercel/output`) carrying
  the static files, permanent slug redirects, the `/api/*` proxy, and the SPA
  fallback — so dynamic redirects ship at the platform level.
- Admins can trigger a web rebuild from the admin top bar
  (`POST /api/admin/rebuild-web` → Vercel Deploy Hook).

## 1. Apply the SQL

Run the patch on the existing project (Supabase SQL editor or `psql`):

```
supabase/patch/2026-06-30-slug-redirects.sql
```

It is also folded into `supabase/schema.sql` for fresh projects. It adds the
`slug_redirects` table, the `products` slug-change trigger, the
`active_slug_redirects` view (published targets only), and RLS.

The web build tolerates the view being absent (ships zero redirects with a
warning), so deploy order is not fragile — but apply the patch so redirects work.

## 2. Environment variables

**Web Vercel project** (`apps/web`):

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Public Supabase URL (runtime + build snapshot fetch) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable/anon key (runtime + build) |
| `VITE_SITE_URL` | Canonical origin, e.g. `https://www.designingminds.co.za` |
| `WEB_FUNCTIONS_ORIGIN` | Functions deployment origin for the `/api/*` proxy. **Build fails without it on Vercel.** |

**Functions Vercel project** (`apps/functions`):

| Variable | Purpose |
| --- | --- |
| `VERCEL_WEB_DEPLOY_HOOK_URL` | Deploy Hook for the WEB project (secret) |

## 3. Vercel project settings (web)

- Root directory: `apps/web`.
- Build command: `npm run build` (runs `tsc -b` → client build → SSR build →
  prerender). The prerender writes `apps/web/.vercel/output`; Vercel detects the
  Build Output API automatically and uses it, ignoring `vercel.json` and the
  default `dist` output. `vercel.json` remains as a fallback for builds that
  skip prerendering.

## 4. Deploy Hook (for admin publishing)

1. Web Vercel project → Settings → Git → **Deploy Hooks** → create one for the
   production branch.
2. Paste its URL into the **functions** project env as `VERCEL_WEB_DEPLOY_HOOK_URL`.
3. The URL is a secret (possession triggers deploys) and is never sent to the
   browser — only `apps/functions` reads it.

## 5. Publish flow

1. Admin edits and **saves** CMS records (immediate; updates the database).
2. If a product slug changed, the DB trigger records the old URL → new URL.
3. Admin clicks **Publish website** → `POST /api/admin/rebuild-web`.
4. Functions validates admin access and calls the Deploy Hook.
5. The web project rebuilds from the current commit + latest CMS data;
   static HTML and redirects regenerate and go live when the build completes.

## 6. Verify after deploy

- `view-source:` a product page shows real content, title, canonical, and
  `Product` JSON-LD before any JS runs.
- `/sitemap.xml` lists indexable routes only; `/robots.txt` disallows functional
  routes; old slugs are absent from the sitemap and 301/308 to the new URL.
- `/cart`, `/checkout`, `/login`, `/account` still work (SPA fallback shell).
- A non-admin cannot call `/api/admin/rebuild-web`; the Deploy Hook URL never
  reaches the browser.

## Local build

```
npm run build --workspace @designing-minds/web
```

Needs Supabase reachable (it fetches the public snapshot). For an offline build,
set `ALLOW_EMPTY_PRERENDER=true` to render static routes against an empty
snapshot.
