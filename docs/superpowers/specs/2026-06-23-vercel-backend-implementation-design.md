# Vercel Backend Implementation Design

## Scope

Implement the locked backend architecture for Designing Minds on Vercel:

- Supabase Auth with database-managed roles and RLS.
- Vercel-hosted serverless functions for checkout, PayFast ITN, downloads, and admin uploads.
- Supabase Storage behind a provider abstraction.
- Login-only, role-gated admin app.
- Supabase-only catalogue data with UUID table IDs.
- Plain SQL schema, seed, and patch files for production setup.
- A production launch checklist that can be ticked off before go-live.

## Architecture

Vercel is the deployment platform for the public web app, admin app, and serverless functions. Business logic stays in `apps/functions/src/handlers` using the existing framework-agnostic `HandlerRequest` and `HandlerResponse` interfaces. `apps/functions` is the API app; its `api/` files are thin Vercel adapters that parse requests, call the shared handlers, and write JSON responses.

Supabase remains the source of truth for Auth, Postgres, and launch storage. Browser apps use only the publishable key plus user sessions. Trusted writes for orders, payments, downloads, and upload URL issuance happen in Vercel functions with the secret key.

Web and admin call the API app via same-origin `/api/*` rewrites or `VITE_API_BASE_URL` when the API app is on another origin.

The apps do not fall back to localStorage or bundled seed content for catalogue data. `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are required, and all catalogue reads/writes go through Supabase.

## Phase Order

1. Auth foundation: `user_roles`, helper functions, signup trigger, RLS tightening, cart tables, customer/admin client auth.
2. Checkout and PayFast: authoritative pricing, order/payment creation, redirect signing, full ITN validation, idempotency.
3. Storage and downloads: `storageKey`, private bucket assumptions, `StorageProvider`, signed download endpoint.
4. Admin hardening and uploads: login-only admin shell, admin role guard, noindex deployment controls, signed upload URL endpoint.

## Data Rules

- A Customer is exactly one Supabase Auth user.
- An Administrator is an Auth user with an `admin` role and is not a Customer for commerce purposes.
- Signup provisions a `customers` row and a default `customer` role.
- Supabase table primary keys and foreign keys use UUIDs.
- Catalogue writes are direct client writes but only through `is_admin()` RLS.
- Operational writes are server-only via Vercel functions.
- `paid` unlocks downloads; `fulfilled` remains reserved.
- Money is stored as `numeric(10,2)` and calculated in integer cents in server code.
- PayFast return URLs never unlock access. Only validated ITN does.
- `supabase/schema.sql` is the complete fresh-project schema.
- `supabase/seed.sql` is the complete fresh-project catalogue seed, generated from `research/extracted-content/data/products.json`.
- `supabase/patch/` is reserved for versioned SQL patches for existing databases; accepted patches are folded back into `schema.sql` or `seed.sql`.

## Testing And Verification

Each phase should be verified with TypeScript checks and targeted runtime smoke tests. Database verification is done by applying `supabase/schema.sql` to a Supabase project, creating test Auth users, checking role-trigger behavior, and exercising RLS with publishable-key unauthenticated/authenticated clients plus a secret-key server client.

PayFast verification uses sandbox credentials and a tunnel or deployed Vercel preview URL for ITN delivery. Storage verification uses a private bucket and confirms that files are inaccessible without a signed URL issued after Postgres entitlement checks.
