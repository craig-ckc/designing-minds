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

Payment completion: apply `2026-09-09-atomic-payment-completion.sql` before deploying the updated payment webhook. It completes payment/order updates in one transaction and makes verified duplicate notifications safe.
