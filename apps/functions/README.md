# @designing-minds/functions

Shared serverless handlers for Designing Minds. These live in their own app so
the web and admin front-ends call the **same** logic rather than duplicating it.

## Handlers

| Route | Purpose |
| --- | --- |
| `POST /checkout` | Create an Order + a single pending Payment, then hand off to the payment provider. Access Plans are one-time charges — no recurring mandate (see `docs/adr/0001`). |
| `POST /payment-webhook` | Provider → server callback. Updates the Payment and derives the Order status. Success unlocks downloads on Order Detail. |
| `POST /issue-download` | Mints a short-lived signed URL for a purchased file, after checking the order belongs to the customer and is paid. |
| `POST /admin/upload-url` | Creates an admin-only signed upload URL and returns the provider-neutral storage key. |

## Local dev

```bash
npm run dev --workspace @designing-minds/functions
# POST http://localhost:8787/checkout
```

Set the server environment variables from `docs/production-launch-checklist.md`.
The Supabase secret key is server-only — never ship it to the browser.

## Deploy

Production deploys `apps/functions` as the Vercel API app. The API route
adapters live in `apps/functions/api` and call the shared handlers in `src`.
`src/server.ts` is only for local development.
