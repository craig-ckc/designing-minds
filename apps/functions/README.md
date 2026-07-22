# @designing-minds/functions

Shared serverless handlers for Designing Minds. These live in their own app so
the web and admin front-ends call the **same** logic rather than duplicating it.

## Handlers

| Route | Purpose |
| --- | --- |
| `POST /checkout` | Creates an Order + a single pending Payment atomically, then returns a signed PayFast handoff. Access Plans are one-time charges with no recurring mandate (see `docs/decisions.md`). |
| `POST /payment-webhook` | PayFast ITN callback. Verifies signature, source IP, amount, and PayFast validation before transitioning pending payments. |
| `POST /issue-download` | Mints a short-lived signed URL for an entitled file, after checking the order belongs to the customer and is paid. Bundle/access-plan files resolve from included resources. |
| `POST /admin/upload-url` | Creates an admin-only signed upload URL and returns the provider-neutral storage key. |

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

## Deploy

Production deploys `apps/functions` as the Vercel API app. The API route
adapters live in `apps/functions/api` and call the shared handlers in `src`.
`src/server.ts` is only for local development.
