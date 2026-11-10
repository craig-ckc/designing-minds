# Supabase Patches

Put versioned SQL patches in this folder after a database already exists.

Naming convention:

```text
0001-short-description.sql
0002-short-description.sql
```

Rules:

- `supabase/schema.sql` remains the full current schema for a fresh project.
- `supabase/seed.sql` remains the full current seed data for a fresh project.
- Patch files are incremental changes for existing projects and should be safe to run once.
- After a patch is accepted, fold its final state back into `schema.sql` or `seed.sql` so a fresh production setup still needs only the current full files.


Diagnostics: apply `2026-09-09-diagnostics.sql`, then run `2026-09-09-diagnostics-retention.sql` as `postgres` in the Supabase SQL editor. The retention patch enables Supabase Cron if needed. Apply both before enabling `DIAGNOSTICS_ENABLED` on functions. See [operations guide](../../docs/diagnostics.md).

Publish workflow: apply `2026-10-01-publish-workflow.sql`, then deploy functions, web and admin straight away (don't publish from the old admin in between). It adds Draft/Queued/Published/Archived and the live copy the site, cart and checkout read. Add `VERCEL_API_TOKEN`, `VERCEL_WEB_PROJECT_ID` and `VERCEL_TEAM_ID` to the functions project for build-status feedback.

Payment completion: apply `2026-09-09-atomic-payment-completion.sql` before deploying the updated payment webhook. It completes payment/order updates in one transaction and makes verified duplicate notifications safe.

Promotions: apply `2026-10-02-promotions.sql` before deploying the updated apps. Configure the scheduler secrets and apply `2026-10-02-promotions-cron.sql` after deployment. See [promotions](../../docs/promotions.md).

Data API grants: `2026-11-10-data-api-grants.sql` adds explicit privileges for existing application operations without changing RLS or revoking existing grants. Fresh installations include these grants in `schema.sql`; new tables must declare their intended role privileges explicitly.

Physical products: apply `2026-11-10-physical-product-foundation.sql` **before** `2026-11-10-physical-commerce.sql`, regardless of filename sorting. The foundation adds product types, customization rules, variants and separate inventory. The commerce patch adds the public projection, stock reservations, shipping, payment completion and fulfilment contracts used by the current apps. The admin includes the physical-product editor and fulfilment controls. Existing products remain digital, and product type stays fixed after creation to preserve download entitlements.

Both patches are included in the fresh schema. The commerce setting defaults to `disabled`; applying the patches does not enable physical sales. Provider configuration and enabling payments remain separate rollout decisions. See [physical commerce](../../docs/physical-commerce.md) for pricing, stock and isolated-preview instructions.
