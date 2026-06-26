# @designing-minds/functions

Shared serverless handlers for Designing Minds. These live in their own app so
the web and admin front-ends call the **same** logic rather than duplicating it.

## Handlers

| Route | Purpose |
| --- | --- |
| `POST /checkout` | Creates an Order + a single pending Payment atomically, then returns a signed PayFast handoff. Access Plans are one-time charges — no recurring mandate (see `docs/adr/0001`). |
| `POST /payment-webhook` | PayFast ITN callback. Verifies signature, source IP, amount, and PayFast validation before transitioning pending payments. |
| `POST /fake-payfast/complete` | Test-only payment completion endpoint. Requires `FAKE_PAYFAST_ENABLED=true`, verifies the signed-in customer owns the pending order, then marks the payment succeeded and the order paid. |
| `POST /issue-download` | Mints a short-lived signed URL for an entitled file, after checking the order belongs to the customer and is paid. Bundle/access-plan files resolve from included resources. |
| `POST /admin/upload-url` | Creates an admin-only signed upload URL and returns the provider-neutral storage key. |

## Local dev

```bash
npm run dev --workspace @designing-minds/functions
# POST http://localhost:8787/checkout
```

Set the server environment variables from `docs/production-launch-checklist.md`.
The Supabase secret key is server-only — never ship it to the browser.

To test checkout without leaving the app, set `FAKE_PAYFAST_ENABLED=true` on the
functions app. `/checkout` will still create the normal pending order/payment,
but the web app will route to `/checkout/fake-payfast` instead of PayFast.

## Deploy

Production deploys `apps/functions` as the Vercel API app. The API route
adapters live in `apps/functions/api` and call the shared handlers in `src`.
`src/server.ts` is only for local development.
