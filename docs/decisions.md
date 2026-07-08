# Decisions

Accepted decisions that still constrain product, data, and infrastructure work.

## Access Plans Are One-Time Purchases

Status: accepted.

Essential and Premium are marketed as access offers, but launch Access Plans are Products purchased once for a fixed period. There is no stored payment mandate, automatic renewal, cancellation UI, dunning, or recurring charge.

Consequences:

- Checkout creates one charge per Order.
- Download access is fulfilled through Order Detail.
- Automatic renewal is a future project, not a launch assumption.

## Access Plans Are Fixed Products

Status: accepted.

Each Access Plan is a distinct Product with fixed grade and period. Essential is one product per grade and term. Premium is one product per grade covering the year. Customers choose the plan by selecting the Product; checkout does not collect grade or term.

Consequences:

- The catalogue contains 20 Essential plan products and 5 Premium plan products.
- Entitlements derive from the purchased Product fields.
- Homepage/nav plan links deep-link into `/packages` with filters; Product Detail remains the purchase page.

## Value Lists Are Database-Sourced

Status: accepted.

Grades, Terms, Years, Product Kinds, and Resource Formats are database-sourced allowed values. They are not admin-managed collections and cannot be created inline in the editor.

Consequences:

- Admin reads value lists from the CMS snapshot.
- Adding a Year or Resource Format is a database edit.
- Adding a Product Kind requires database and code changes.

## Roles Are Database-Managed And RLS-Enforced

Status: accepted.

Customers and Administrators share one Supabase Auth pool. Role membership lives in `user_roles`. Browser clients may read their own role, but cannot insert, update, or delete roles. First admin promotion is a manual database operation.

Consequences:

- `is_admin()` / `has_role()` enforce RLS.
- Catalogue writes happen directly from the admin app but only through admin RLS policies.
- Operational writes happen only in trusted functions with the Supabase secret key.
- Admin app is login-only with no public signup.

## Account Profiles Use `public.users`

Status: accepted.

`public.users` stores profile data for every authenticated person. `user_roles` determines whether that person is a Customer or Administrator. Orders and carts keep `customerId` because only Customers own commerce records.

Consequences:

- Do not recreate `public.customers`.
- Code may expose operational customer lists, but the underlying table is `users`.
- Keep `orders.customerId` and `carts.customerId` unless the commerce model changes.

## Storage Is Swappable; Entitlement Lives In Postgres

Status: accepted.

Product files live in one private bucket and are accessed through short-lived signed URLs. Supabase Storage is the launch provider, behind a narrow provider interface so Cloudflare R2 or another object store can replace it later.

Consequences:

- Store bare object keys on Product files, not public URLs.
- The server verifies JWT, order ownership, and paid status before minting a download URL.
- Admin uploads use server-authorized signed upload URLs.
- Do not rely on Storage RLS for commerce entitlement.

## Static Public Pages, Dynamic Functional Flows

Status: accepted.

Public indexable routes are prerendered at web build time from the public CMS snapshot. Cart, checkout, auth, and account routes remain dynamic noindex React routes.

Consequences:

- Public pages should render meaningful HTML before browser-side CMS fetching.
- Static snapshots must exclude operational records and private storage keys.
- Product slug changes create permanent redirects.
- Admin publish triggers a web rebuild through a server-side Vercel Deploy Hook.

## Form Submissions Go Through The Functions API

Status: accepted.

Public form submissions (contact, newsletter) are operational writes, so they follow the same trust boundary as orders/payments: the browser POSTs to the functions app (`POST /api/forms`), which validates and writes with the Supabase secret key. The browser never inserts into the form tables directly — there is no anon-insert RLS policy; RLS is default-deny and admins read.

One table per form, named `form_<name>` (`form_contact`, `form_newsletter`). Stable identity/metadata (email, name, `sourceUrl`, `userAgent`, `createdAt`) are real columns; the variable submitted fields live in a `data` jsonb bag. Adding a new field to a form needs no migration; adding a new form is a deliberate new table + one `FORMS` config entry in the handler.

Consequences:

- The contact/newsletter forms do NOT open the visitor's mail client, and are not wired to Mailchimp.
- Submissions surface in the admin app as read-only "Submissions" collections; the jsonb `data` renders as key/value rows.
- On submit the functions app sends a best-effort Resend notification to the Designing Minds inbox; a Resend failure never fails the (already-persisted) submission.

## Transactional Email Via Resend; Marketing Via Mailchimp

Status: accepted.

Resend is the transactional/notification email provider: form-submission notifications now, and purchase/order emails as they are added. Supabase Auth handles account emails (signup confirmation, password reset) via its own SMTP. Mailchimp is reserved strictly for marketing campaigns and is not part of any form-submission or transactional flow.

Consequences:

- Functions carry `RESEND_API_KEY`, `RESEND_FROM`, `FORM_NOTIFICATIONS_TO`. Absent config disables sending (submissions still persist); it is never in a `VITE_` variable.
- Password reset is a real flow in both the web and admin apps (`resetPasswordForEmail` + `updateUser`); Supabase must have `/reset-password` (web) and the admin origin allow-listed as redirect URLs.
- Marketing list sync to Mailchimp, if added later, is a separate integration off the newsletter table — not a change to the submission path.
