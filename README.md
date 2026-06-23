# Designing Minds Monorepo

This repository turns the extracted Designing Minds content into a Vite monorepo with:

- `apps/web`: the public website for browsing pages and products.
- `apps/admin`: a lightweight admin app for editing CMS-style content.
- `apps/functions`: the Vercel API app for checkout, PayFast ITN, downloads, and admin uploads.
- `packages/cms`: the shared content schema and Supabase repository.

## Getting Started

1. Run `npm install`.
2. Create a Supabase project.
3. Run `supabase/schema.sql`, then `supabase/seed.sql`.
4. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_API_BASE_URL` for the web and admin apps.
5. Run `npm run dev`.

The apps read catalogue and operational data from Supabase. Anonymous carts use localStorage until sign-in, then merge into the Supabase cart tables; catalogue data has no localStorage or bundled seed fallback.

`VITE_API_BASE_URL` should be the deployed `apps/functions` origin, for example `https://designing-minds-functions.vercel.app`. Leave it blank only when the current app origin rewrites `/api/*` to the functions app.

## Supabase SQL

- `supabase/schema.sql`: full current schema for a fresh project.
- `supabase/seed.sql`: full current catalogue seed generated from extracted website products.
- `supabase/patch/`: versioned SQL patches for existing projects; accepted patches should be folded back into schema or seed.
