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
| Cart | Ready | Anonymous cart is local until sign-in; signed-in cart persists in Supabase. |
| Checkout | Ready | Server re-resolves products/prices, blocks repurchases, and creates order/payment atomically. |
| PayFast ITN | Ready | Signature, IP, amount, validation response, and idempotency are checked server-side. |
| Downloads | Ready | Server verifies JWT ownership and paid/fulfilled status, then mints a short-lived signed URL. |
| Admin uploads | Ready | Admin-only function returns server-chosen private storage key plus signed upload URL. |
| Static public web | Ready | `apps/web` prerenders indexable public routes and hydrates React for interactivity. |
| CMS publish | Ready | Admin can trigger a web rebuild through a server-side Vercel Deploy Hook. |
| Refund initiation | Deferred | Payment/refund state exists; operational refund handling is manual/admin for launch. |
| Stale pending sweep | Deferred | Add scheduled cleanup after launch if needed. |

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

Web/admin:

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Public Supabase URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable/anon key |
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
| `PAYFAST_MERCHANT_ID` | PayFast production credential |
| `PAYFAST_MERCHANT_KEY` | PayFast production credential |
| `PAYFAST_PASSPHRASE` | PayFast production secret |
| `PAYFAST_MODE` | Production mode (`live`) |
| `PAYFAST_ALLOWED_IPS` | Optional ITN source-IP override; leave blank to resolve PayFast's ITN hosts via DNS |
| `STORAGE_BUCKET` | Private product-file bucket |
| `ALLOWED_ORIGINS` | Web/admin origins if direct cross-origin calls are used |
| `VERCEL_WEB_DEPLOY_HOOK_URL` | Secret Deploy Hook for the web project |
| `RESEND_API_KEY` | Resend API key (blank disables sending) |
| `RESEND_FROM` | Verified sender, e.g. `Designing Minds <noreply@designingminds.co.za>` |
| `FORM_NOTIFICATIONS_TO` | Inbox that receives contact + newsletter submissions |

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
- [ ] Production env vars are set on the correct project and scope.
- [ ] No secret key or PayFast passphrase appears in a `VITE_` variable.
- [ ] Preview env vars point only to sandbox services.
- [ ] `/api/*` routing works from web/admin to functions.

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

Monitoring:

- [ ] Vercel and Supabase logs are accessible.
- [ ] PayFast ITN failures are visible in logs.
- [ ] Email bounce/complaint monitoring is enabled if custom SMTP is used.
- [ ] Rollback target deployment and database restore plan are known.
- [ ] Support path is ready for payment/download issues.
