# Backend Readiness

Current backend status for the Supabase + Vercel implementation. Companion to
[CONTEXT.md](../CONTEXT.md), [docs/adr](./adr), and the production launch
checklist.

Status legend: **READY** (implemented), **NEEDS CONFIG** (code exists, deploy
settings or external services required), **DEFERRED** (intentionally out of
launch scope).

## Current Status

| Area | Status | Notes |
| --- | --- | --- |
| Supabase schema | READY | `supabase/schema.sql` defines Auth-linked customers, roles, catalogue tables, orders, payments, carts, and RLS. Existing projects should apply `supabase/patch/2026-06-23-secure-catalog-and-checkout.sql`. |
| Public catalogue reads | READY | The storefront reads `catalog_products`, a sanitized published-only view that omits private storage keys. Raw `products` rows are admin-only. |
| Admin CMS | READY | Admin uses Supabase Auth, checks `user_roles`, and writes catalogue rows through admin-only RLS policies. |
| Customer auth | READY | Web uses Supabase email/password auth and gates checkout on verified email. |
| Cart | READY | Anonymous cart state is local-only until login; signed-in sessions merge into Supabase `carts`/`cart_items` and persist add/remove/clear changes. |
| Checkout | READY | `/checkout` verifies the JWT, re-resolves published products and prices server-side, blocks repurchases, and creates the order + payment atomically via `create_pending_order`. |
| PayFast ITN | READY | `/payment-webhook` verifies signature, source IP, amount, PayFast validation response, and only transitions pending/unprocessed payments. |
| Downloads | READY | `/issue-download` verifies JWT ownership and paid/fulfilled status, then mints a short-lived signed URL. Bundles and access plans resolve included resource files. |
| Admin uploads | READY | `/admin/upload-url` requires admin role and returns a server-chosen private storage key plus signed upload URL. |
| Refunds | DEFERRED | Payment/refund state is modelled, but refund initiation remains an admin/manual operational process. |
| Stale pending order sweep | DEFERRED | PayFast may not always send terminal failure ITNs; a scheduled cleanup can be added after launch. |

## Security Boundaries

- Browser clients use only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Serverless functions are the only runtime that receives `SUPABASE_SECRET_KEY`, `PAYFAST_MERCHANT_KEY`, and `PAYFAST_PASSPHRASE`.
- Public product browsing uses `catalog_products`; do not point storefront code back at `products`.
- Raw `products.purchasedFiles.storageKey` values are private operational metadata and must not be returned by public catalogue APIs.
- Fulfillment is driven only by the validated PayFast ITN, never by `/checkout/return`.

## Launch Configuration

Required before production launch:

- Configure Supabase Auth SMTP and email-confirmation templates.
- Bootstrap at least one admin with a direct `user_roles` update.
- Create the private Supabase Storage bucket named by `STORAGE_BUCKET`.
- Configure Vercel function env vars from `apps/functions/.env.example`.
- Set `ALLOWED_ORIGINS` to the deployed web/admin origins.
- Set `PAYFAST_ALLOWED_IPS` for live mode.
- Apply `supabase/schema.sql` for fresh projects or the latest files in `supabase/patch/` for existing projects.
