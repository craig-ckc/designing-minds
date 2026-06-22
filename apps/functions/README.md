# @designing-minds/functions

Shared serverless handlers for Designing Minds. These live in their own app so
the web and admin front-ends call the **same** logic rather than duplicating it.

## Handlers

| Route | Purpose |
| --- | --- |
| `POST /checkout` | Create an Order + a single pending Payment, then hand off to the payment provider. Access Plans are one-time charges — no recurring mandate (see `docs/adr/0001`). |
| `POST /payment-webhook` | Provider → server callback. Updates the Payment and derives the Order status. Success unlocks downloads on Order Detail. |
| `POST /issue-download` | Mints a short-lived signed URL for a purchased file, after checking the order belongs to the customer and is paid. |

## Status

**Wall version.** Handlers validate request shape and sketch the flow with the
shared `@designing-minds/cms` types. Real persistence, provider signature
verification, and Supabase Storage signed URLs are intentionally left as TODOs.

## Local dev

```bash
npm run dev --workspace @designing-minds/functions
# POST http://localhost:8787/checkout
```

Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` before wiring real
persistence. The service-role key is server-only — never ship it to the browser.

## Deploy

Each handler maps cleanly to a Supabase Edge Function (one function per route),
or any serverless platform. `src/server.ts` is only for local development.
