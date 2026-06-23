# File storage is a swappable provider; entitlement lives in Postgres

Status: accepted

Purchased files live in a single **private** bucket and are accessed only through short-lived signed URLs. We start on **Supabase Storage** (same vendor as auth + Postgres, near-zero integration) but put it behind a narrow `StorageProvider` interface so the provider can be swapped — chiefly to **Cloudflare R2** later — with minimal effort:

```
interface StorageProvider {
  getSignedUploadUrl(key, ttlSeconds): Promise<string>   // admin upload (presigned PUT)
  getSignedDownloadUrl(key, ttlSeconds): Promise<string>  // customer download
  deleteObject(key): Promise<void>
}
```

Both upload and download are presigned URLs because that is the one primitive both providers implement identically. Crucially, **entitlement is enforced in Postgres, never in Storage RLS**: the server verifies the caller (via their Supabase JWT) and that they own a `paid` order containing the file, then mints a download URL. Supabase Storage RLS *could* gate by ownership, but that is exactly the concept R2 has no equivalent for — so we deliberately don't use it, keeping the access model portable. We store **bare object keys** (e.g. `products/{productId}/{fileId}-{filename}`) on each `ProductFile`, never full URLs, since keys are provider-neutral and URLs are not.

There are **no preview/sample files** at launch — every file in the bucket is entitlement-gated. The product page sells via description and imagery instead.

## Considered Options

- **Cloudflare R2 from day one** — zero egress (vs Supabase's ~$0.09/GB), best long-run cost for a download-heavy catalogue. Deferred, not rejected: it adds a vendor and the AWS SDK now, and Supabase Storage is free integration today. The abstraction keeps this as a cheap future move (one provider class + a key-for-key object copy).
- **Supabase Storage with no abstraction** (direct `createSignedUrl` in the handler) — Rejected: fastest to ship but couples the data model and download handler to Supabase, turning the eventual R2 move into a refactor rather than a swap.
- **Gate downloads with Supabase Storage RLS** — Rejected: non-portable; entitlement in our own tables works on both providers and sits next to the orders data anyway.
- **Direct client upload / server-proxied upload** — Rejected in favour of presigned PUT: direct client upload is Supabase-specific and re-introduces Storage RLS; proxying bytes through the serverless function hits request-size/timeout limits on large PDFs.

## Consequences

- `ProductFile` gains a `storageKey` (bare, provider-neutral) distinct from `label` (display) and `filename` (suggested download name).
- `previewFiles` is removed from the `Product` type, `schema.sql`, the admin editor, and the web product page.
- The download handler derives the customer from the **verified JWT**, not a request body field, then checks order ownership + `paid` status before signing.
- Admin uploads: server authorizes (`is_admin`) and chooses the key, returns a presigned PUT URL; the admin client uploads bytes directly, then saves the `storageKey` on the product.
- Signed-URL TTLs are short (minutes) — portable behaviour and tighter security (well under R2's 7-day presign cap).
- Migrating to R2 later = implement the R2 `StorageProvider`, copy objects key-for-key, swap env/credentials. No changes to auth, entitlement, routes, or the data model.
