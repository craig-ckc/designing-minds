# Preview Environment (client testing, fake payment)

A preview deployment where a client can run the full checkout flow without real
PayFast. Everything points at **sandbox** services; payment is simulated.

Three Vercel projects (web, admin, functions). The web app reaches the functions
app through a **same-origin rewrite**, so there is no CORS and no
`VITE_API_BASE_URL` to manage.

## How the rewrite works

[`apps/web/vercel.json`](../apps/web/vercel.json) rewrites `/api/*` to the
functions deployment, keeping the `/api` prefix:

```json
{ "source": "/api/:path*", "destination": "https://<functions-deployment>/api/:path*" }
```

- The browser only ever calls the web origin (`/api/checkout`), so it is
  same-origin — no preflight, no CORS, no `ALLOWED_ORIGINS` needed.
- Keep `VITE_API_BASE_URL` **unset** on the web project. If it is set, the app
  builds absolute URLs straight to the functions origin and bypasses the
  rewrite (re-introducing CORS).
- Note the `/api` prefix is **kept** here. (Local dev strips it via the Vite
  proxy because `apps/functions/src/server.ts` registers bare routes like
  `/checkout`; on Vercel the `api/` directory deploys to `/api/checkout`.)

**Set the destination to the functions _branch_ preview URL**
(`<project>-git-<branch>-<team>.vercel.app`), not a per-commit URL — per-commit
hashes change on every push and break the rewrite. `vercel.json` is committed
and not environment-scoped, so this destination is shared by all builds of the
web project.

## Environment variables (set scope = **Preview**, values = **sandbox**)

### Functions project (`apps/functions`)

| Variable | Value |
| --- | --- |
| `SUPABASE_URL` | sandbox project URL |
| `SUPABASE_SECRET_KEY` | sandbox service-role / secret key (server-only) |
| `FAKE_PAYFAST_ENABLED` | `true` — skips PayFast, routes to `/checkout/fake-payfast` |
| `STORAGE_BUCKET` | sandbox private bucket name (needed for the Download button) |
| `SITE_URL` | web preview URL (optional while fake is on) |

Not needed while `FAKE_PAYFAST_ENABLED=true`: `PAYFAST_MERCHANT_ID`,
`PAYFAST_MERCHANT_KEY`, `PAYFAST_PASSPHRASE`, `PAYFAST_MODE`,
`PAYFAST_ALLOWED_IPS`. `ALLOWED_ORIGINS` is not needed with the rewrite (it is
required only for the direct cross-origin setup). `PORT` is local-dev only.

### Web project (`apps/web`)

| Variable | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | sandbox project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | sandbox publishable / anon key |

Do **not** set `VITE_API_BASE_URL` (the rewrite handles `/api`).
`VITE_*` are baked at **build time**, so they must be correct before the preview
builds.

## Smoke test the client runs

1. Sign up / log in.
2. Add a resource to the cart (Access Plans: pick a grade at checkout).
3. **Pay with PayFast** → lands on the fake PayFast page.
4. **Simulate successful payment** → order flips to **paid** on Order Detail.
5. **Download** a file (requires `STORAGE_BUCKET` + uploaded files).

## Going live later

Real PayFast is a functions-only change: set `FAKE_PAYFAST_ENABLED=false` and the
`PAYFAST_*` vars on the functions project's Production scope; web and Supabase are
untouched. See [`production-launch-checklist.md`](./production-launch-checklist.md).
