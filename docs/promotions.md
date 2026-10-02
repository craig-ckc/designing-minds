# Promotions

Products and bundles keep their regular `priceZar` and may have a lower `salePriceZar`, `saleStartsAt`, and `saleEndsAt`. Sale changes follow the existing Draft → Queued → Publish workflow. Once published, sale times apply automatically: start is inclusive, end is exclusive. Admin schedule inputs use South African time (UTC+2).

Manage codes in **Promotions → Discount codes**. Codes ignore letter case, support percentage or fixed-rand discounts, and can have optional start/expiry times. Saving a code takes effect immediately. “Allow on sale items” is off by default; when off, the discount only applies to regular-price items. Fixed discounts are capped at the eligible subtotal. An order must retain a positive payment amount.

Each code can be used once per customer account. Starting payment reserves the code. Retrying the same basket resumes the same order at its accepted price. A different basket cannot use that reservation until PayFast confirms failure/cancellation. Returning through the browser's Cancel page alone does not release it, because payment may still complete. Confirmed success and refunds retain the usage history. Disable codes instead of deleting them.

Checkout quotes, order totals and reservations are calculated in PostgreSQL. Client prices/customer identities are not trusted. A changed total requires review before payment. Orders retain the code and discount amount for receipts.

## Scheduled rebuilds

Supabase Cron checks published sale start/end boundaries every minute. It calls the authenticated functions endpoint only when a rebuild is due or awaiting confirmation. The job rebuilds the live catalogue and never publishes Draft/Queued changes. Coupon validity is checked on every quote/checkout; codes are private and do not need a static rebuild.

The scheduler coalesces simultaneous boundaries and uses a database lease across workers. Failed hook requests retry on a later tick. Accepted builds are checked against the deployed `build-info.json` content timestamp. Failed/stalled builds remain due; an unconfirmed lease expires after ten minutes, allowing another rebuild request. Processing is at least once, so an ambiguous network failure can produce an extra build.

Price enforcement happens at the date/time itself, independently of cron. Static HTML follows on the next minute check **plus build time**. Browser prices update at boundaries without a manual publish, including visitors hydrating an older static page.

## Activation

1. Apply `supabase/patch/2026-10-02-promotions.sql` to an existing database, or use the current `supabase/schema.sql` for a fresh database.
2. Add a random `CRON_SECRET` to the **functions** environment. Keep the existing `SITE_URL` and `VERCEL_WEB_DEPLOY_HOOK_URL` configured. Deploy functions, admin, and web.
3. In Supabase Vault, create secrets named `promotions_cron_url` (the functions production URL ending in `/api/cron/promotions`) and `promotions_cron_secret` (the same value as `CRON_SECRET`). Keep these out of client env files and source control.
4. Run `supabase/patch/2026-10-02-promotions-cron.sql` as `postgres`. It enables `pg_cron`/`pg_net` and creates the named `promotion-rebuilds` job. Re-running replaces that named schedule.
5. Check Supabase Cron job runs and functions logs. The HTTP endpoint returns `idle`, `queued`, `waiting`, or `ready`. Verify the deployed `/build-info.json` after a scheduled boundary.

The scheduler setup is separate from the core schema because Cron, networking, and Vault are Supabase extensions. Local PostgreSQL tests prove the pricing/lease functions and use substitutes for those extensions; production network delivery requires the activation steps above.

If scheduler setup reports `2BP01: dependent privileges exist` inside Supabase's extension installation hook, use the latest cron patch: it checks installed extensions before attempting installation. Supabase's hooks can run even for `CREATE EXTENSION IF NOT EXISTS`. If it still fails, check `select extname from pg_catalog.pg_extension where extname in ('pg_cron','pg_net');` and enable missing extensions through the Dashboard. If enabling also fails, Supabase support needs to repair the managed permissions. Do not disable an existing Cron extension as a workaround: [that deletes all its jobs](https://supabase.com/docs/guides/cron/install).
