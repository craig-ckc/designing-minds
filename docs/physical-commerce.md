# Physical commerce

Products share the existing Products collection and `/shop/:slug` space. Digital
products keep their download/ownership rules. Physical products have published
variant configuration and separate, private operational inventory.

Apply `2026-11-10-physical-product-foundation.sql`, then
`2026-11-10-physical-commerce.sql` to an existing database after review. Both are
included in the fresh `schema.sql`. The new commerce setting defaults to
`disabled`; applying SQL alone does not enable physical sales. Older databases
without the commerce views continue serving digital products.

## Pricing and stock

- Fixed prices or a configured rate per billable character are calculated in SQL.
  Text/select rules and billable characters are explicit product configuration.
- A variant price overrides the base price. Otherwise active product sale prices
  apply, including the rate for per-character products.
- Physical coupon policy is explicit. `digital_only` discounts eligible digital
  lines; shipping and physical lines are undiscounted. `disabled` rejects coupons
  in a basket containing physical products.
- A physical order pays one configured shipping charge and captures its delivery
  address as a historical snapshot. Courier API integration is not implemented.
- Checkout atomically reserves stock for the configured duration. Captured payment
  deducts stock once; failure/cancellation releases holds. Expired holds stop
  counting toward availability immediately. Coupons remain reserved for a pending
  order until cancellation or confirmed failure.
- An expired checkout retry renews its hold only if stock is still available.
  An already-in-flight late successful payment rechecks stock; when unavailable,
  it records `payment_review` and grants neither shipping nor downloads.
- Stock adjustments compare the expected count with the current value and cannot
  reduce stock below active holds. Ordinary product edits do not overwrite stock.
- Product type and variant ownership are immutable. Physical lines never grant
  digital files. Order personalisation and item prices are saved snapshots.

## Local sample-data preview

The seeded preview uses the actual apps with an isolated loopback PostgreSQL /
PostgREST database and a temporary Auth/Storage adapter. Fixture setup, launcher
and private local keys are under `/tmp/designing-minds-seeded-preview/`; no real
credentials or fixture customers are checked into the repository.

- Storefront: `http://127.0.0.1:5191/`
- Admin: `http://127.0.0.1:5192/`
- Restart existing preview: `python3 /tmp/designing-minds-seeded-preview/run-preview.py`

This environment has illustrative name rules, R75 sample delivery and simulated
payment success/failure. Simulation requires **all** of: a non-production process,
`LOCAL_COMMERCE_PREVIEW=true`, a loopback `SUPABASE_URL`, and enabled database
`local_preview` mode. It verifies ownership and the stored payment amount.
Production payment and courier enablement remain separate rollout decisions.

## Verification

`tests/functions/physical-commerce.test.ts` covers fresh/upgrade schema, pricing,
reservations, retries, cancellation, late payment, stock conflicts, fulfilment and
ownership. Handler, store and rendered UI tests cover the matching contracts.
Native two-connection last-unit evidence and browser walkthrough evidence are
retained with the temporary preview setup.
