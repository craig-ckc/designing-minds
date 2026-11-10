# Designing Minds Monorepo

This repository turns the extracted Designing Minds content into a Vite monorepo with:

- `apps/web`: the public website for browsing pages and products.
- `apps/admin`: a lightweight admin app for editing CMS-style content.
- `apps/functions`: the Vercel API app for checkout, PayFast ITN, downloads, forms, and admin publishing/uploads.
- `packages/cms`: the shared content schema and Supabase repository.
- `packages/utils`: shared helpers (class names, typography, diagnostics).

## Documentation

- [CONTEXT.md](./CONTEXT.md): domain language and business rules.
- [docs/README.md](./docs/README.md): active docs index.
- [docs/site-and-content-model.md](./docs/site-and-content-model.md): routes, CMS collections, value lists, and page data rules.
- [docs/operations.md](./docs/operations.md): deployment, environment, publishing, and launch checks.
- [docs/decisions.md](./docs/decisions.md): accepted architecture/product decisions.

## Getting Started

1. Use Node 24 (`nvm use`; the pin is in `.nvmrc`, minimum 22.12) and run `npm install`.
2. Create a Supabase project and run `supabase/schema.sql`, then `supabase/seed.sql`. For an existing database, follow [the patch guide](./supabase/patch/README.md); the physical-product foundation must run before physical commerce even though those filenames sort differently.
3. Copy each app's template and fill it in (the `.local` files are gitignored; never commit real credentials, this repository is public):

   ```bash
   cp apps/web/.env.example apps/web/.env.local
   cp apps/admin/.env.example apps/admin/.env.local
   cp apps/functions/.env.example apps/functions/.env.local
   ```

   | App | Reads | Notes |
   | --- | --- | --- |
   | `apps/web` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SITE_URL`, `WEB_FUNCTIONS_ORIGIN`, `VITE_API_PROXY_TARGET` | Always calls same-origin `/api/*`; `VITE_API_BASE_URL` is ignored. Locally `/api/*` is proxied to the functions server (`:8787`). |
   | `apps/admin` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_API_BASE_URL`, `VITE_WEB_URL`, `VITE_API_PROXY_TARGET` | Leave `VITE_API_BASE_URL` blank to use the same-origin `/api` proxy; set it to the functions origin only if the admin origin does not proxy `/api/*`. |
   | `apps/functions` | `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, PayFast, email and deploy-hook variables | Server-only. See [docs/operations.md](./docs/operations.md). |

4. Run `npm run dev`. It starts web (`:5173`), admin (`:5174`) and functions (`:8787`) together.
5. Promote your first administrator in `user_roles` (see [docs/operations.md](./docs/operations.md)).

The apps read catalogue and operational data from Supabase. Anonymous carts use localStorage until sign-in, then merge into the Supabase cart tables; catalogue data has no localStorage or bundled seed fallback.

## Quality Gates

Run `npm run check` (lint, then typecheck, then test) before every commit. CI (`.github/workflows/ci.yml`, no secrets) runs the same steps on every push and pull request, then builds admin and web. The web build sets `ALLOW_EMPTY_PRERENDER=true` so it needs no Supabase; use `npm run build:ci` for that same hermetic build locally. A plain `npm run build` prerenders the real catalogue and fails closed if Supabase is unreachable.

| Command | Covers |
| --- | --- |
| `npm run lint` | ESLint for web, admin, functions, `packages/cms`, `packages/utils`. |
| `npm run typecheck` | `tsc` for every workspace plus `tests/` (`tests/tsconfig.json`). |
| `npm test` | `node --test` for `tests/web` and `tests/admin`; Vitest for `tests/functions` (in-process Postgres via PGlite, no Docker), then the React component tests. |
| `npm run test:components` | React Testing Library with jsdom for checkout, admin workflows, accessibility, and primitive contracts. Uses isolated clients and fake network responses. |

Vitest runs at most two workers per suite to keep the in-process databases and DOM tests within a predictable memory budget. Component tests use `vitest.components.config.ts`; keep Node's source-contract tests in `tests/web` and `tests/admin` separate from mounted-component tests in `tests/components`.

The admin uses 14px interface text, 16px form values and 44px action targets on narrow screens and devices with a coarse primary pointer. The `dense:` variant restores compact controls only at 768px and above with a fine pointer. Keep phone controls reachable in short viewports, and check both phone and desktop layouts when changing shared primitives.

Before release, also complete the environment and provider checks in [docs/operations.md](./docs/operations.md).

## Supabase SQL

- `supabase/schema.sql`: full current schema for a fresh project.
- `supabase/seed.sql`: full current catalogue seed generated from extracted website products.
- `supabase/patch/`: versioned SQL patches for existing projects; accepted patches should be folded back into schema or seed.
