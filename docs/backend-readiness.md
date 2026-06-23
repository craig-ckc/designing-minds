# Backend Readiness — Gap Analysis

A pre-implementation comparison of the current codebase against a production-ready
backend, and the architectural decisions taken to close the gap. Companion to
[CONTEXT.md](../CONTEXT.md) (domain glossary) and [docs/adr](./adr) (decisions).

Status legend: **EXISTS** (working) · **WALL** (skeleton/stub with TODOs) · **ABSENT** (not started).

---

## 1. Where things stand

The **front-end and domain model are solid**; nearly every **backend integration is a "wall."**

| Area | Status | Notes |
| --- | --- | --- |
| Domain model / glossary / ADRs | EXISTS | CONTEXT.md + ADRs 0001–0004; typed content model in `packages/cms`. |
| DB schema (7 tables) | EXISTS | `supabase/schema.sql`; column names match the TS types. |
| RLS (enabled, policies) | WALL | Enabled on all tables; catalogue write policy is `using(true)` (too loose) and admin reads of operational data are missing. |
| Content CRUD (catalogue) | EXISTS (local) | Admin edits products/subjects/faqs/testimonials via the `local` adapter. |
| Customer auth | WALL | Web uses a mock `localStorage` flag; admin has **no auth**. No Supabase Auth wired. |
| Checkout / cart | WALL | Cart is ephemeral `useState`; CheckoutPage just `login()`s + navigates; nothing calls `/checkout`. |
| Payments (PayFast) | WALL | Provider hardcoded as a string; no signature, no ITN validation, no env. |
| Downloads / storage | WALL | `issue-download` returns a PLACEHOLDER URL; no buckets; `ProductFile` has no key. |
| Serverless handlers | WALL | `checkout`, `payment-webhook`, `issue-download` validate shape only; persistence commented out. |

---

## 2. Decisions taken (this session)

| # | Decision | Recorded |
| --- | --- | --- |
| 1 | **Customer = Supabase Auth user, 1:1.** `customers.id` = auth uid, provisioned by a signup trigger. No login-less customer. | ADR 0003, CONTEXT.md |
| 2 | **Two roles (`customer`/`admin`) in a DB-managed `user_roles` table**, RLS-enforced. Signup auto-assigns `customer`; promotion is a direct DB edit (mirrors ADR 0002). | ADR 0003 |
| 3 | **Hybrid write model.** Catalogue: direct client writes gated by `is_admin()`. Operational records: customer reads own / admin reads all; **all writes server-side via service role**. | ADR 0003 |
| 4 | **Server handlers run as Vercel Node serverless functions**, not Supabase Edge Functions. | this doc |
| 5 | **`paid` is the canonical "downloads unlocked" state**; `fulfilled` reserved/unused at launch. | CONTEXT.md |
| 6 | **Money stored as `numeric(10,2)`** (rands.cents). In-memory arithmetic in integer cents; PayFast amount via `.toFixed(2)`; amount match within ±0.01. | this doc |
| 7 | **Full PayFast ITN validation chain** (signature, source IP, amount, server post-back) + gate on `COMPLETE` + idempotent dedupe on `pf_payment_id`. | this doc |
| 8 | **Supabase Storage now, behind a swappable `StorageProvider`** (presigned up + down + delete); entitlement in Postgres, bare keys, R2 as planned future swap. | ADR 0004 |
| 9 | **No preview files; one private bucket;** `ProductFile` gains `storageKey`. Download identity from the **verified JWT**, not a body field. | ADR 0004, CONTEXT.md |
| 10 | **Admin uploads via presigned PUT** (server authorizes + chooses key; client uploads bytes directly). | ADR 0004 |
| 11 | **Auth = email + password** with email verification + reset. Requires production SMTP. | this doc |
| 12 | **Cart = set of distinct products** (no quantities), re-purchase of owned items blocked, server-persisted with anon-localStorage merge-on-login. | CONTEXT.md |

---

## 3. Gap detail & required work

### 3.1 Auth & identity — ABSENT (real auth)
- Wire **Supabase Auth (email+password)** into the web app, replacing the mock in `apps/web/src/lib/auth.tsx`.
- Add **sign-in + role-gated route guard** to the admin app (currently open; currently uses the anon key with no session — replace with an authenticated session).
- **Signup trigger** (`handle_new_user`, SECURITY DEFINER): insert the `customers` row (id = auth uid) **and** the `user_roles` row (`role='customer'`).
- **Email verification + password reset** flows + templates. Verification **hard-gates checkout** (Supabase "Confirm email" ON) — so SMTP deliverability sits on the purchase path, not just account recovery.
- **First-admin bootstrap** runbook (manual `user_roles` insert) — document it.

### 3.2 RBAC / RLS — WALL
- Add `is_admin()` / `has_role()` **SECURITY DEFINER** helper reading `user_roles`.
- Replace catalogue write policies `to authenticated using(true)` → `is_admin()`.
- Add **admin SELECT** policies on `customers`, `orders`, `payments` (admin reads all).
- `user_roles` RLS: user may **read own** role; **no client** insert/update/delete.
- New `carts`/`cart_items` table: RLS so a customer reads/writes **only their own** cart (cart is customer-owned working state — the one client-writable exception to "operational writes are server-only").

### 3.3 Payments (PayFast) — ABSENT
- **Checkout** (`/checkout`): re-resolve every line's price + `published` from the DB (never trust the client), compute the authoritative total, create the `order` (`pending`) + one `payment` (`pending`), then build the **signed PayFast redirect** form/URL. `m_payment_id` = `payments.id`.
- **Signature**: generate server-side, **documentation field order** (not alphabetical — that's the API format), `urlencode` (`+` for spaces, uppercase hex), passphrase appended. Passphrase **never** reaches the browser.
- **ITN webhook** (`/payment-webhook`): return 200 first; then (1) verify signature, (2) source IP in PayFast ranges, (3) `amount_gross` matches the order total (±0.01), (4) POST back to `/eng/query/validate` and require `VALID`; fulfill only on `payment_status === 'COMPLETE'`. Map PayFast `COMPLETE` → internal `succeeded`; set order → `paid`. **Idempotent**: dedupe on `pf_payment_id`, no-op duplicates, always 200.
- **Refunds**: admin-triggered server action (service role) — out of launch scope but reserved.
- **Stale pending orders**: a sweep job (PayFast doesn't reliably send FAILED/PENDING for once-off). Deferrable.

### 3.4 Storage & downloads — ABSENT
- Create one **private bucket**; implement the **Supabase `StorageProvider`** (`getSignedUploadUrl`, `getSignedDownloadUrl`, `deleteObject`).
- `ProductFile` gains **`storageKey`** (bare, provider-neutral, e.g. `products/{productId}/{fileId}-{filename}`). Remove `previewFiles` from the type, schema, admin editor, and web product page.
- **`issue-download`**: identify caller via **verified JWT**; load order (service role); assert owned + `paid`; resolve `fileId` → `storageKey` → short-lived signed URL. Wire the Order Detail download button to call it (currently no handler).
- **Admin upload**: `/admin/upload-url` returns a presigned PUT for a server-chosen key (is_admin only); client uploads, then saves `storageKey`.

### 3.5 Checkout / cart flow — WALL
- Real **cart**: client-side set in localStorage (anon) + server-persisted `carts` table; **merge (union, dedupe) on login**; exclude already-owned products. Wire the navbar count.
- CheckoutPage calls `/checkout` and redirects to PayFast; add **return** and **cancel** pages (UX only — fulfillment is driven by the ITN, never the return URL).

### 3.6 Data-model gaps
- **`customers.orderIds` dropped** — order lists derive from `orders where customerId = …` (the source of truth; already indexed + RLS'd). `orders.paymentId` remains a 1:1 convenience pointer (also derivable via `payments.orderId`).
- **Value Lists**: ADR 0002 says DB-sourced, but the Supabase provider reads them from fixtures "until a value-list table exists." Need a `value_lists` table (or seed) for `supabase` mode.
- **Catalogue ingestion**: `supabase/seed.sql` seeds the catalogue from `research/extracted-content/data/products.json`; production edits then happen in Supabase through the admin app.
- Add `payments.pf_payment_id` (unique) + `payments.processedAt` for ITN idempotency.

---

## 4. Required services & infrastructure
- **Supabase** — Auth, Postgres, Storage (already the chosen backend).
- **PayFast** merchant account (+ sandbox account) — merchant id/key/passphrase.
- **Production SMTP — Resend** wired into Supabase Auth as custom SMTP (verified sending domain). Verification gates checkout, so this is purchase-critical; the built-in sender is not for production.
- **Vercel** for the web app, admin app, and Node serverless handlers (public HTTPS for the ITN; ports 80/8080/8081/443).
- **Dev tunnel** (ngrok/Expose) so PayFast can reach `notify_url` from `localhost`.
- **CORS** config between the web app origin and the serverless functions.
- (Future) **Cloudflare R2** as the egress-saving storage swap target.

## 5. Required environment variables
| Var | Where | Secret |
| --- | --- | --- |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | web + admin (client) | no |
| `VITE_API_BASE_URL` | web + admin (client) | no |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | functions (server) | **yes** (service role) |
| `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY` | functions (server) | merchant_key sensitive |
| `PAYFAST_PASSPHRASE` | functions (server) | **yes** — never client-side |
| `PAYFAST_MODE` (`sandbox`/`live`) | functions | no |
| `STORAGE_BUCKET` | functions | no |
| SMTP creds | Supabase Auth config | **yes** |
| (future R2) `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT` | functions | **yes** |

## 6. Endpoints & webhooks
- `POST /checkout` — create order+payment, return signed PayFast redirect. (auth required)
- `POST /payment-webhook` — PayFast ITN; public, no JWT; full validation chain; idempotent. (the `notify_url`)
- `POST /issue-download` — JWT-authed; ownership + `paid` check; returns short-lived signed URL.
- `POST /admin/upload-url` — is_admin; returns presigned PUT for a server-chosen key.
- Web pages: `/checkout/return`, `/checkout/cancel` (UX only).

---

## 7. Open decisions still to make
- **Refund mechanism** detail (PayFast refund API vs dashboard) when it comes into scope.

_Resolved: email verification **hard-gates checkout** (account hygiene over funnel friction)._

## 8. Risks & blind spots
- **Admin currently writes via the anon key with no session** — in `supabase` mode today this both *fails* under RLS and represents an open-door risk if ever deployed. Must become an authenticated, role-gated session.
- **Never fulfill on the PayFast return URL** — only the validated ITN. Easy mistake; the redirect ≠ proof of payment.
- **Signature algorithm divergence** — redirect/ITN use *documentation order*; the REST API uses *alphabetical*. Mixing them is the #1 PayFast bug.
- **`numeric` → JS float** — sum/compare money in integer cents in memory; rely on the ±0.01 ITN tolerance.
- **ITN idempotency** — PayFast retries until 200; without dedupe an order could be processed twice.
- **Denormalization drift** — with `customers.orderIds` dropped, the residual back-reference is `orders.paymentId`; keep it server-maintained at payment creation, or derive it via `payments.orderId`.
- **Service-role key exposure** — server-only; never in any `VITE_`-prefixed var or client bundle.
- **Email deliverability** — verification now gates *purchase* (Confirm-email ON), so slow or failed delivery directly blocks sales. SMTP must be production-grade and monitored (bounce/complaint handling), not just "good enough for resets."

---

## 9. Blind-spot mitigations (locked)

Each risk in §8 has a decided mitigation. These are specs, not yet implemented.

### M1 — Admin access: authenticated, role-gated, isolated
- Admin app deployed on a **separate subdomain** (`admin.<domain>`), made **non-indexable** (`<meta name="robots" content="noindex,nofollow">` + `X-Robots-Tag: noindex` header + `robots.txt` disallow).
- **Login-only:** no sign-up, no self-serve password reset. An unauthenticated visitor is stuck at the login screen.
- Admin accounts are **developer-provisioned**; a forgotten admin password is reset by the developer directly in Supabase (roles/accounts are DB-managed — ADR 0003).
- The admin client uses an **authenticated Supabase session** (carries the user JWT), **never the bare anon key**. A route guard checks `is_admin`; an authenticated non-admin sees a "not authorized" screen.
- **RLS is the real enforcement** — bypassing the UI still can't write without `is_admin()`.
- No IP / Cloudflare-Access network gating (explicitly out of scope).

### M2 — Fulfillment is ITN-only; return page polls
- The PayFast **`return_url` is UX-only and never grants access.** The only code path that flips an order to `paid` is the validated **ITN webhook**.
- Return page redirects to **Order Detail**, shows "Payment received — finalizing…", and **polls order status** (~2–3s interval, with a timeout) until `paid`, then reveals downloads. On timeout: "your downloads will appear here once payment confirms."
- `cancel_url` → "checkout cancelled, your cart is saved"; the order stays `pending`.

### M3 — PayFast signature: one shared util, documentation order
- A single server-side signing function serves **both** building the redirect signature **and** verifying the ITN.
- **Field order = the order fields are posted (documentation order), NOT alphabetical.** (Alphabetical `ksort` is the *REST API* format — not used here. Mixing them is the #1 PayFast bug.)
- Encoding: spaces → `+`, **uppercase** hex, trim values, **skip empty fields**; append `&passphrase=<urlencoded>` only if a passphrase is configured; then MD5.
- Add a unit test against PayFast's published sample (merchant `10000100` / sample passphrase) so any ordering/encoding regression fails loudly.

### M4 — Money: integer-cents arithmetic over decimal storage
- Stored `numeric(10,2)`. A small money util does **all arithmetic in integer cents** (`Math.round(v*100)`) and formats for display / PayFast via `(cents/100).toFixed(2)`.
- ITN amount check compares `amount_gross` to the order total with **±0.01 tolerance** (matches PayFast's reference code).
- Never sum raw floats; never compare money with `===` on floats.

### M5 — ITN idempotency
- `payments` gains `pf_payment_id` (text, **unique**) + `processedAt` (timestamptz).
- Webhook: after the validation chain, look up by `pf_payment_id`; if `processedAt` is set, **no-op and return 200**. Else process in a transaction, set `processedAt`, return 200.
- **Always return 200** (even on duplicates) so PayFast stops retrying. Correlate the order via `m_payment_id` = `payments.id`.

### M6 — Denormalization drift: removed
- `customers.orderIds` dropped; order lists derive from `orders`.
- Residual `orders.paymentId` is set in the same server transaction that creates the payment (or treated as derivable via `payments.orderId`). No hand-maintained arrays remain.

### M7 — Service-role key hygiene
- `SUPABASE_SERVICE_ROLE_KEY` and `PAYFAST_PASSPHRASE` live ONLY in the serverless functions' server env — **never** in a `VITE_`-prefixed var or any client bundle.
- Client apps use only the **anon key** + the user's session JWT.
- Add a CI guard that fails the build if a service-role key or passphrase string appears in client env/bundle output.

### M8 — Email deliverability (Resend)
- Wire **Resend** as Supabase Auth's custom SMTP; verify a dedicated **sending domain** (SPF / DKIM / DMARC) — not the shared onboarding domain.
- Because verification **gates checkout**, treat it as critical-path: monitor bounce/complaint rates and confirm inbox placement before launch.
- Customize the Supabase verification + reset templates (branding, clear CTA, correct redirect URLs).
