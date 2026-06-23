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

