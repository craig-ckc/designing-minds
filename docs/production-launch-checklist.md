# Production Launch Checklist

Use this as the final go-live checklist for Designing Minds. Tick each item only after verifying it in the relevant production system.

## Supabase Project

- [ ] Production Supabase project exists and is separate from local/sandbox projects.
- [ ] `supabase/schema.sql` has been applied successfully.
- [ ] `supabase/seed.sql` has been applied successfully.
- [ ] Seeded products come from `research/extracted-content/data/products.json`.
- [ ] Table primary keys are UUIDs.
- [ ] RLS is enabled on all catalogue and operational tables.
- [ ] `user_roles` exists and cannot be inserted, updated, or deleted by browser clients.
- [ ] `is_admin()` returns `false` for customers and `true` for promoted administrators.
- [ ] New Auth signup creates a matching `customers` row.
- [ ] New Auth signup creates a `customer` role in `user_roles`.
- [ ] First administrator has been manually promoted in `user_roles`.
- [ ] Customer can read only their own customer/order/payment rows.
- [ ] Administrator can read customer/order/payment rows.
- [ ] Non-admin authenticated user cannot write catalogue records.
- [ ] Administrator can write catalogue records through RLS.

## Supabase Auth And Email

- [ ] Email/password Auth is enabled.
- [ ] Confirm-email is enabled.
- [ ] Resend custom SMTP is configured in Supabase Auth.
- [ ] Sending domain has verified SPF.
- [ ] Sending domain has verified DKIM.
- [ ] Sending domain has a DMARC policy.
- [ ] Verification email template has production branding and correct redirect URL.
- [ ] Password reset template has production branding and correct redirect URL.
- [ ] Test customer receives verification email in an inbox.
- [ ] Unverified customer cannot complete checkout.
- [ ] Verified customer can complete checkout.

## Vercel Projects

- [ ] Public web app is deployed to the production domain.
- [ ] Admin app is deployed to `admin.<domain>`.
- [ ] `apps/functions` is deployed as the Vercel API app.
- [ ] Web/admin deploys either proxy `/api/*` to the functions app or set `VITE_API_BASE_URL`.
- [ ] Production Vercel environment variables are set for the web app.
- [ ] Production Vercel environment variables are set for the admin app.
- [ ] Production Vercel environment variables are set for functions.
- [ ] `VITE_SUPABASE_URL` is set for web and admin.
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` is set for web and admin.
- [ ] `VITE_API_BASE_URL` is set for web and admin if the API app is on a different origin.
- [ ] `ALLOWED_ORIGINS` on the functions app is set and includes the public web and admin origins.
- [ ] Preview environment variables point to sandbox services only.
- [ ] `SUPABASE_SECRET_KEY` is configured only for serverless functions.
- [ ] `PAYFAST_PASSPHRASE` is configured only for serverless functions.
- [ ] No Supabase secret key or PayFast passphrase appears in any `VITE_` variable.

## Admin Isolation

- [ ] Admin app has no public signup route.
- [ ] Admin app has no self-serve password reset route.
- [ ] Unauthenticated visitors only see the login screen.
- [ ] Authenticated non-admin users see a not-authorized screen.
- [ ] Admin pages include `<meta name="robots" content="noindex,nofollow">`.
- [ ] Admin deployment sends `X-Robots-Tag: noindex`.
- [ ] Admin `robots.txt` disallows crawling.
- [ ] Admin domain is not linked from the public website.

## PayFast

- [ ] Production PayFast merchant ID is configured in Vercel.
- [ ] Production PayFast merchant key is configured in Vercel.
- [ ] Production PayFast passphrase is configured in Vercel functions only.
- [ ] Sandbox PayFast credentials are used outside production.
- [ ] `notify_url` points to the deployed `/api/payment-webhook` endpoint.
- [ ] `return_url` points to the production checkout return page.
- [ ] `cancel_url` points to the production checkout cancel page.
- [ ] Signed redirect payload works in PayFast sandbox.
- [ ] ITN signature validation passes for sandbox payments.
- [ ] ITN source IP validation passes in production configuration.
- [ ] ITN server post-back validation returns `VALID`.
- [ ] Duplicate ITNs do not duplicate fulfillment.
- [ ] Failed or pending PayFast statuses do not unlock downloads.
- [ ] Only `COMPLETE` PayFast status marks an order `paid`.

## Storage And Downloads

- [ ] Private Supabase Storage bucket exists.
- [ ] `STORAGE_BUCKET` matches the production bucket name.
- [ ] Product files store bare `storageKey` values, not public URLs.
- [ ] Storage objects are not publicly readable.
- [ ] Admin upload flow creates a signed upload URL.
- [ ] Uploaded files land under the server-chosen key.
- [ ] Customer download flow creates a short-lived signed URL.
- [ ] Pending orders cannot download files.
- [ ] Paid orders can download purchased files.
- [ ] Customer cannot download files from another customer's order.

## Catalogue And Content

- [ ] Production products have accurate prices.
- [ ] Production products intended for sale are `published`.
- [ ] Unpublished products cannot be checked out.
- [ ] Product files have labels, filenames, and `storageKey` values.
- [ ] Value Lists match the launch catalogue needs.
- [ ] No app is running against localStorage or bundled seed catalogue content for catalogue data.
- [ ] Signed-in cart add/remove/clear actions persist to Supabase.
- [ ] Any database change after launch has a versioned file in `supabase/patch/`.
- [ ] Any accepted patch has been folded back into `supabase/schema.sql` or `supabase/seed.sql`.

## Smoke Tests

- [ ] Public home page loads.
- [ ] Shop page loads.
- [ ] Product detail page loads.
- [ ] Customer can sign up.
- [ ] Customer can verify email.
- [ ] Customer can sign in.
- [ ] Customer can add one product to cart.
- [ ] Customer cannot add an already-owned product to cart.
- [ ] Customer can start checkout.
- [ ] Customer is redirected to PayFast.
- [ ] PayFast sandbox payment returns to Order Detail.
- [ ] Order Detail polls until the order is `paid`.
- [ ] Paid Order Detail shows download actions.
- [ ] Download action returns a working signed URL.
- [ ] Admin can sign in.
- [ ] Admin can edit and save a product.
- [ ] Admin can upload a product file.
- [ ] Admin can view customers, orders, and payments.

## Monitoring And Rollback

- [ ] Vercel function logs are accessible to the maintainer.
- [ ] Supabase logs are accessible to the maintainer.
- [ ] PayFast ITN failures are visible in logs.
- [ ] Resend bounce and complaint monitoring is enabled.
- [ ] A rollback target deployment is available in Vercel.
- [ ] Database migration rollback or restore plan is documented.
- [ ] Support contact path is ready for payment/download issues.
