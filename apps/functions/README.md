# @designing-minds/functions

Shared serverless handlers for Designing Minds. These live in their own app so
the web and admin front-ends call the **same** logic rather than duplicating it.

## Handlers

| Production route | Local route | Purpose |
| --- | --- | --- |
| `POST /api/checkout` | `POST /checkout` | Creates an Order + a single pending Payment atomically, then returns a signed PayFast handoff. Every purchase is a one-time charge with no recurring mandate (see `docs/decisions.md`). |
| `POST /api/payment-webhook` | `POST /payment-webhook` | PayFast ITN callback. Verifies signature, source IP, amount, and PayFast validation before transitioning pending payments. |
| `POST /api/issue-download` | `POST /issue-download` | Mints a short-lived signed URL for an entitled file, after checking the order belongs to the customer and is paid. Bundle files resolve from the bundle's included resources. |
| `POST /api/checkout-quote` | `POST /checkout-quote` | Returns the priced basket (sales, discount code) without creating an Order or handoff, so the cart can show the exact total before payment. |
| `POST /api/diagnostics` | `POST /diagnostics` | Public, write-only browser telemetry. Events are sanitised and allowlisted; clients cannot claim server provenance. See `docs/diagnostics.md`. |
| `GET /api/cron/promotions` | `GET /cron/promotions` | Called by the Supabase `pg_cron` job with `Authorization: Bearer $CRON_SECRET`; triggers a web rebuild when a sale starts or ends. See `docs/promotions.md`. |
| `POST /api/forms` | `POST /forms` | Validates and stores contact/newsletter submissions, then performs best-effort email and audience sync. |
| `POST /api/unsubscribe` | `POST /unsubscribe` | Verifies a signed unsubscribe token and marks the Mailchimp contact unsubscribed. |
| `POST /api/admin/upload-url` | `POST /admin/upload-url` | Creates an admin-only signed upload URL and returns the provider-neutral storage key. |
| `POST /api/admin/rebuild-web` | `POST /admin/rebuild-web` | Verifies admin access, makes Queued records live (`publish_site_content()`), then triggers the configured web Deploy Hook. |
| `POST /api/admin/publish-status` | `POST /admin/publish-status` | `{ since }` → the web build's state (pending/queued/building/ready/error/canceled) from the Vercel API; `unconfigured` without `VERCEL_API_TOKEN`. |

## Checks

`npm run lint` and `npm run typecheck` (`tsc --noEmit`) run from this folder or the repo root; `npm test` runs `tests/functions` with vitest. `npm run build` is the same typecheck: the deployable bundle is produced by `scripts/vercel-bundle-api.mjs` as the Vercel `buildCommand`, which rewrites `api/*.ts` in place, so do not run it locally.

## Local dev

```bash
npm run dev --workspace @designing-minds/functions
# POST http://localhost:8787/checkout
```

Set the server environment variables from `docs/operations.md`.
The Supabase secret key is server-only — never ship it to the browser.

To test checkout, set `PAYFAST_MODE=sandbox` (the default). `/checkout` returns a
handoff to `sandbox.payfast.co.za`; leave the PayFast merchant ID, merchant key,
and passphrase blank to use the public passphrase-enabled sandbox account.
The checkout request body must include `acceptedTerms: true` alongside the
`items` array; the API rejects payment handoffs without that explicit agreement.

The ITN (`notify_url`) is built from `API_PUBLIC_ORIGIN` — the functions
project's own public origin — falling back to `SITE_URL`. On Vercel set it to
`https://api.designingminds.co.za`; if the ITN arrives through the web
project's `/api/*` proxy instead, the webhook sees the proxy's IP and rejects it.

## Deploy

Production deploys `apps/functions` as the Vercel API app. The API route
adapters live in `apps/functions/api` and call the shared handlers in `src`.
`src/server.ts` is only for local development.
