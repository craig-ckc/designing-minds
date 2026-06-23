# Roles are database-managed and RLS-enforced, with a hybrid write model

Status: accepted

There are exactly two roles — **Customer** and **Administrator** — held in a single Supabase Auth pool. Role membership lives in one `user_roles` table keyed by `auth.users.id`. Signup automatically assigns `customer` via the same `SECURITY DEFINER` trigger that provisions the Customer row (a definer function is the only automated writer, so it can insert past RLS). The table is **database-edited only**: RLS lets a signed-in user read their own role (so the admin app can gate its UI), but no client — anon or authenticated — may insert, update, or delete it. Promoting someone to `admin` is a direct database edit.

We chose this because a single visible source-of-truth table is simpler to reason about than scattered JWT metadata, and it deliberately mirrors [ADR 0002](0002-value-lists-are-database-sourced.md): like Value Lists, roles are database-sourced, not admin-managed — there is no admin screen for granting roles. Authorization is then enforced in the database by a `SECURITY DEFINER` helper (`is_admin()` / `has_role()`) used in RLS policies, so the rules hold no matter which client connects.

Writes follow a **hybrid model**:

- **Catalogue collections** (products, subjects, faqs, testimonials) — direct client writes from the admin app, gated by `is_admin()` in RLS.
- **Operational records** (customers, orders, payments) — a Customer reads only their own rows; an Administrator reads all; and **every write happens server-side with the Supabase secret key** (checkout creates orders, the payment webhook updates them, refunds/overrides are admin-triggered server actions). No client ever writes operational rows directly.

## Considered Options

- **Admin flag in a JWT `app_metadata` claim** — Rejected: the claim can go stale until the token refreshes, and changing it is an Auth-Admin-API call rather than a transparent database edit. The team prefers one DB table as the visible source of truth.
- **Separate admin Supabase project / user pool** — Rejected: heavier to operate and diverges from the single-account-type design in CONTEXT.md.
- **Admin direct-edits of operational records via RLS** — Rejected: breaks the "Orders are system-generated purchase facts" and "customer-owned profile" invariants and risks the database diverging from PayFast's source of truth. Refunds and status changes are server actions instead.

## Consequences

- The signup trigger must insert both the Customer row and the `user_roles` row (`role = 'customer'`) for the new `auth.users.id`.
- Promoting an Administrator is a manual database operation; bootstrapping the first admin is a manual insert. Document the runbook.
- `is_admin()` / `has_role()` must be `SECURITY DEFINER` and stable, consulting `user_roles`.
- The admin app must sign in via Supabase Auth and gate its routes on the role for UX; RLS remains the real enforcement (defense in depth). The current anon-key-with-no-session admin access is replaced.
- Operational mutations require the Supabase secret key in a trusted server context (the functions layer) — never shipped to the browser.
- The catalogue write policies change from `to authenticated using (true)` to `is_admin()`.
- The admin app is **login-only** — no self-serve sign-up or password reset. Admin accounts are developer-provisioned, and a forgotten admin password is reset by the developer directly in Supabase (consistent with role membership being a manual DB operation). It is served on a separate, non-indexable subdomain using an authenticated Supabase session — never the anon key.
