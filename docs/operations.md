# Operations

This combines backend readiness, preview setup, static publishing, and launch checks for the Supabase + Vercel implementation.

## Current Status

| Area | Status | Notes |
| --- | --- | --- |
| Supabase schema | Ready | `supabase/schema.sql` is the fresh-project schema; existing projects use `supabase/patch/` before patches are folded back. |
| Public catalogue reads | Ready | Storefront reads `catalog_products`, never raw `products`. |
| Admin CMS | Ready | Supabase Auth + `user_roles`; admin writes are gated by RLS. |
| Customer auth | Ready | Supabase email/password Auth, plus password reset in web + admin. |
| Form submissions | Ready | Contact + newsletter POST to `/api/forms`; functions write `form_<name>` tables and send a Resend notification. Apply `supabase/patch/2026-07-02-form-submissions.sql`. |
| Transactional email | Config-gated | Resend send is implemented; set `RESEND_API_KEY`/`RESEND_FROM`/`FORM_NOTIFICATIONS_TO` on functions to go live. Absent config skips sending (submissions still persist). |
| Mailchimp audience sync | Config-gated | Opt-in submitters are upserted (add or update, status `subscribed`) into a Mailchimp audience: newsletter signups always, contact enquiries only when the marketing-consent checkbox is ticked. On a successful sync we send our own branded confirmation email (via Resend) with a signed one-click unsubscribe link (`/unsubscribe` → sets the contact to `unsubscribed`). Set `MAILCHIMP_API_KEY`/`MAILCHIMP_AUDIENCE_ID` on functions to go live; the unsubscribe link also needs `SITE_URL`. Absent config skips the sync (submissions still persist). |
| Cart | Ready | Anonymous cart is local until sign-in; signed-in cart persists in Supabase. |
| Checkout | Ready | Server re-resolves products/prices, blocks repurchases, and creates order/payment atomically. |
| PayFast ITN | Ready | Signature, IP, amount, validation response, and idempotency are checked server-side. |
| Downloads | Ready | Server verifies JWT ownership and paid/fulfilled status, then mints a short-lived signed URL. |
| Admin uploads | Ready | Admin-only function returns server-chosen private storage key plus signed upload URL. |
| Static public web | Ready | `apps/web` prerenders indexable public routes and hydrates React for interactivity. |
| CMS publish | Ready | Admin can trigger a web rebuild through a server-side Vercel Deploy Hook. |
| Refund initiation | Deferred | Payment/refund state exists; operational refund handling is manual/admin for launch. |
| Stale pending sweep | Deferred | Add scheduled cleanup after launch if needed. |

“Ready” in this table means the implementation is present and verified in the codebase. Production is not launch-ready until the environment, DNS, provider, and end-to-end checks below are complete.

## Security Boundaries

- Browser clients use only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Serverless functions are the only runtime with `SUPABASE_SECRET_KEY`, `PAYFAST_MERCHANT_KEY`, `PAYFAST_PASSPHRASE`, `STORAGE_BUCKET`, and deploy-hook secrets.
- Public browsing uses `catalog_products`; raw `products.purchasedFiles.storageKey` values are private operational metadata.
- Payment return pages never unlock downloads. Only validated PayFast ITN can mark payment complete.
- Public static snapshots must contain published catalogue/content only, never users, orders, payments, or private keys.

## Preview Environment

Use separate Vercel projects for web, admin, and functions. For client testing, point everything at sandbox services and set `PAYFAST_MODE=sandbox` on functions. This runs the real redirect + ITN flow against `sandbox.payfast.co.za`, matching production. Leave the PayFast credentials blank to use PayFast's default sandbox account, or set your own from the sandbox portal.

Preferred preview routing: web rewrites `/api/*` to the functions branch preview URL, keeping the `/api` prefix:

```json
{ "source": "/api/:path*", "destination": "https://<functions-branch-preview>/api/:path*" }
```

Keep `VITE_API_BASE_URL` unset on the web project when using the same-origin rewrite.

Preview functions env:

| Variable | Value |
| --- | --- |
| `SUPABASE_URL` | Sandbox Supabase URL |
| `SUPABASE_SECRET_KEY` | Sandbox service-role/secret key |
| `PAYFAST_MODE` | `sandbox` |
| `STORAGE_BUCKET` | Sandbox private bucket |
| `SITE_URL` | Web preview URL |

Preview web/admin env:

| Variable | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | Sandbox Supabase URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Sandbox publishable/anon key |

Preview smoke test: sign up, add a product, pay through the PayFast sandbox, land on paid Order Detail, and download a file.

## Production Environment

Web:

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Public Supabase URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable/anon key |
| `VITE_API_BASE_URL` | Functions origin when not using same-origin rewrites |

Admin:

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Public Supabase URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable/anon key |
| `VITE_WEB_URL` | Deployed storefront origin, used by Preview links and by the live/unpublished check. Must be the origin actually serving the built site (it is polled for `/build-info.json`); pointing it at a hostname still served by something else makes every record's publish state read as unknown. |
| `VITE_API_BASE_URL` | Functions origin when not using same-origin rewrites |

Web static generation:

| Variable | Purpose |
| --- | --- |
| `VITE_SITE_URL` | Canonical origin |
| `WEB_FUNCTIONS_ORIGIN` | Functions origin for Vercel Build Output `/api/*` proxy |

Functions:

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | Supabase URL |
| `SUPABASE_SECRET_KEY` | Server-only Supabase key |
| `SITE_URL` | Public storefront origin used for payment and unsubscribe URLs |
| `PAYFAST_MERCHANT_ID` | PayFast production credential |
| `PAYFAST_MERCHANT_KEY` | PayFast production credential |
| `PAYFAST_PASSPHRASE` | PayFast production secret |
| `PAYFAST_MODE` | Production mode (`live`) |
| `PAYFAST_ALLOWED_IPS` | Optional ITN source-IP override; leave blank to resolve PayFast's ITN hosts via DNS |
| `STORAGE_BUCKET` | Private product-file bucket |
| `PUBLIC_MEDIA_BUCKET` | Public bucket for catalogue preview-gallery images (`public_media`). Gallery uploads fail without it; purchased files are unaffected |
| `ALLOWED_ORIGINS` | Comma-separated origins allowed to call the API cross-origin. The admin is the only such caller — the web project proxies `/api/*` server-side, so it needs no entry. Every hostname the admin is opened from must be listed, including the project's `*.vercel.app` alias; a missing one surfaces in the browser as an opaque "Failed to fetch" on the preflight, not as a server error |
| `VERCEL_WEB_DEPLOY_HOOK_URL` | Secret Deploy Hook for the web project |
| `RESEND_API_KEY` | Resend API key (blank disables sending) |
| `RESEND_FROM` | Verified sender, e.g. `Designing Minds <noreply@designingminds.co.za>` |
| `FORM_NOTIFICATIONS_TO` | Inbox that receives contact + newsletter submissions |
| `MAILCHIMP_API_KEY` | Mailchimp API key; `-usX` suffix picks the datacenter (blank disables sync) |
| `MAILCHIMP_AUDIENCE_ID` | Mailchimp audience/list ID to sync submitters into |

Use one canonical storefront origin everywhere. Attach it to the web project, redirect the alternate `www`/apex hostname to it, and use the same origin for `VITE_SITE_URL`, functions `SITE_URL`, admin `VITE_WEB_URL`, PayFast return/cancel/notify URLs, and Supabase Auth redirect allowlists. Environment changes only affect a new deployment; redeploy each affected project after changing them.

## Static Publish Flow

1. Admin saves CMS records to Supabase.
2. Product slug changes record old URL to new URL in `slug_redirects`.
3. Admin clicks publish.
4. Functions validates admin access and calls `VERCEL_WEB_DEPLOY_HOOK_URL`.
5. Web rebuild fetches the public CMS snapshot, prerenders indexable routes, emits sitemap/robots/redirects, and deploys.

Local web build:

```sh
npm run build --workspace @designing-minds/web
```

Set `ALLOW_EMPTY_PRERENDER=true` only when an offline build should tolerate an empty snapshot.

## Launch Checklist

Supabase:

- [ ] Production Supabase project is separate from local/sandbox projects.
- [ ] `supabase/schema.sql` and `supabase/seed.sql` have been applied.
- [ ] Incremental patches in `supabase/patch/` are applied (incl. `2026-07-02-form-submissions.sql` for the contact/newsletter tables).
- [ ] `2026-07-22-shop-product-redirects.sql` is applied so future slug changes preserve canonical `/shop/*` URLs.
- [ ] RLS is enabled on catalogue and operational tables.
- [ ] `public.users` rows are created for new Auth users.
- [ ] `user_roles` creates customer role on signup and cannot be changed by browser clients.
- [ ] First administrator is manually promoted in `user_roles`.
- [ ] Customers can read only their own commerce records; admins can read operational records.
- [ ] Non-admin users cannot write catalogue records; admins can.

Auth and admin:

- [ ] Email/password Auth is enabled.
- [ ] Password reset email sending is configured.
- [ ] Supabase Auth redirect URLs allow the web `/reset-password` route and the admin app origin (reset links land there).
- [ ] Admin app has no public signup route.
- [ ] Unauthenticated visitors see only login.
- [ ] Authenticated non-admin users see not-authorized.
- [ ] Admin deployment is noindexed and not linked from the public website.

Vercel:

- [ ] Web, admin, and functions projects are deployed to production origins.
- [ ] The launch domain is attached to the web project and DNS no longer serves the previous site.
- [ ] Exactly one `www`/apex hostname is canonical and the other permanently redirects to it.
- [ ] Production env vars are set on the correct project and scope.
- [ ] No secret key or PayFast passphrase appears in a `VITE_` variable.
- [ ] Preview env vars point only to sandbox services.
- [ ] `/api/*` routing works from web/admin to functions.
- [ ] Unknown public routes return HTTP 404; functional routes return HTTP 200 with `noindex,nofollow`.

PayFast:

- [ ] Production merchant ID/key/passphrase are configured on functions.
- [ ] `notify_url`, `return_url`, and `cancel_url` point to production routes.
- [ ] Sandbox payment flow has been tested before live mode.
- [ ] ITN signature, source IP, post-back validation, duplicate ITN handling, and failed-payment behavior are verified.

Storage and downloads:

- [ ] Private bucket exists and matches `STORAGE_BUCKET`.
- [ ] Product files store bare `storageKey` values, not public URLs.
- [ ] Admin upload creates a signed upload URL and saves the storage key.
- [ ] Pending orders cannot download; paid orders can.
- [ ] Customers cannot download another customer's files.

Catalogue and static web:

- [ ] Production products have accurate prices and `published` status.
- [ ] Product files have labels, filenames, and storage keys.
- [ ] Value Lists match launch catalogue needs.
- [ ] `view-source:` on public pages shows real prerendered content, canonical tags, and JSON-LD where relevant.
- [ ] Titles, descriptions, canonicals, Open Graph URLs/images, and Twitter cards use the launch origin.
- [ ] SVG/PNG favicons, Apple touch icon, web manifest icons, and the 1200×630 OG image return HTTP 200.
- [ ] `/sitemap.xml` lists indexable routes only.
- [ ] `/robots.txt` disallows functional routes.
- [ ] Old product slugs redirect and are absent from the sitemap.

Smoke tests:

- [ ] Home, Shop, Packages, Grade detail, and Product detail pages load.
- [ ] Customer can sign up, sign in, add one product, and start checkout.
- [ ] Already-owned products cannot be repurchased.
- [ ] PayFast returns to Order Detail and the order becomes paid after ITN.
- [ ] Paid Order Detail shows working download actions.
- [ ] Admin can sign in, edit/save a product, upload a file, and publish the web build.
- [ ] Contact and newsletter submissions persist; configured notification/audience integrations receive them.
- [ ] Password-reset links land on the correct web/admin production origins.

Code quality:

- [ ] `npm run lint`, `npm test`, and `npm run build` pass from the repository root.
- [ ] `npm audit --omit=dev` reports no known production dependency vulnerabilities.
- [ ] `npm outdated` has no unexpected in-range updates; major upgrades are reviewed separately.

Monitoring:

- [ ] Vercel and Supabase logs are accessible.
- [ ] PayFast ITN failures are visible in logs.
- [ ] Email bounce/complaint monitoring is enabled if custom SMTP is used.
- [ ] Rollback target deployment and database restore plan are known.
- [ ] Support path is ready for payment/download issues.
