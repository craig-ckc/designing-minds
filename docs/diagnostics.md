# Diagnostics and checkout troubleshooting

## Confirmed production checkout failure (9 September 2026)

Public probes confirmed that the apex storefront redirects to `https://www.designingminds.co.za`, while the live JavaScript calls `https://api.designingminds.co.za` directly. API preflight responses allow the apex origin but omit `Access-Control-Allow-Origin` for `www`. Browsers consequently block the request and show “Failed to fetch”. The storefront `/api/checkout` proxy responds with JSON successfully.

The web app now always calls its same-origin `/api/*` proxy. `VITE_API_BASE_URL` is ignored by the storefront; configure `WEB_FUNCTIONS_ORIGIN` for production and `VITE_API_PROXY_TARGET` for local development. The admin retains its separate API configuration. PayFast's webhook still goes directly to `API_PUBLIC_ORIGIN` so source-IP validation is preserved.

If an urgent configuration-only mitigation is needed before deploying the web fix, add `https://www.designingminds.co.za` to functions `ALLOWED_ORIGINS` and redeploy functions. Retain the existing admin origin. Align canonical environment URLs with the hostname actually serving the storefront.

## Enable collection

1. Apply `supabase/patch/2026-09-09-atomic-payment-completion.sql` **before deploying functions**, then apply `supabase/patch/2026-09-09-diagnostics.sql` using the Supabase SQL editor. Fresh installations include both migrations in `supabase/schema.sql`. Neither migration changes existing commerce records.
2. Apply `supabase/patch/2026-09-09-diagnostics-retention.sql` in the Supabase SQL editor as `postgres`. It enables `pg_cron` if needed before scheduling retention. Verify the named `diagnostics-retention` job is active under **Integrations → Cron**. It deletes events older than 30 days daily at 02:15 UTC. Monitor its run history; without this job, stored events are not automatically deleted. See [Supabase Cron installation](https://supabase.com/docs/guides/cron/install).
3. Set `DIAGNOSTICS_ENABLED=true` on functions and redeploy functions, web, and admin. Leave this false until the database is ready. Ensure `WEB_FUNCTIONS_ORIGIN` points to the deployed functions app.
4. Open **Admin → Diagnostics**. Errors from the last 24 hours are shown first. Submit an invalid checkout request with no items (no charge or order is created) and verify the API's `x-request-id` appears in the viewer.
5. Check **All events** for page views and successful request milestones. Deployment commit IDs are included on Vercel; browser failures include the built asset location when available.

Production database changes and deployments have not been performed by the code change. The Vercel connector available during the investigation did not include these projects, so private production runtime logs were unavailable.

## Follow an incident

Ask the customer for the complete **Reference** shown on checkout, the approximate time, and whether PayFast showed a successful payment. Search the reference as **Request**. Click a session ID to see browser activity and related API requests; click an order ID to connect checkout with payment processing. Trace links select **All events** so successful milestones are visible too. Choose 7 or 30 days for older incidents; each page has at most 100 events.

Checkout stages identify authentication, payment configuration, catalogue resolution, ownership checks, and order creation. Payment stages identify signature checking, source-IP checking, payment lookup, amount checking, provider validation, and database updates. Failed database calls include SQLSTATE/PostgREST codes where available. Request completion records status and duration. A start without completion in Vercel's structured logs can indicate a platform timeout or terminated process.

Payment completion now runs in one database transaction, including the cart-clearing trigger. Failure rolls back both payment and order updates, so a provider retry can finish safely. Duplicate notifications leave completed records unchanged. A verified retry of the same PayFast transaction can also recover a previously succeeded payment whose order remained pending; refunded/failed records, mismatched amounts, mismatched order links, and reused provider transaction IDs are rejected. The read-only production check on 9 September 2026 found zero succeeded payments linked to pending orders; no production records were changed.

An ambiguous timeout never automatically retries a purchase request. Customers are directed to check order history. Payment configuration is validated before creating the pending order. Unexpected handler exceptions produce HTTP 500 instead of the previous misleading 413; oversized bodies still produce 413.

## Collection boundaries

- Captures storefront page navigation, application/Supabase fetch outcomes, unhandled exceptions/rejections, React errors, checkout milestones, API request outcomes, and caught form/download/payment failures. This is operational telemetry, not a recording of every click or keystroke.
- Records only allowlisted routes, event names, status/timing, error categories, database error codes, asset locations, deployment revisions, random session/request IDs, and server-supplied order IDs. No bodies, form contents, credentials, cookies, names, emails, query strings, raw exception messages, or raw stacks are added to this system.
- Browser events are untrusted reports and always labeled `browser`. They cannot change order/payment state. Only the service role writes; authenticated admins can read through RLS. The public ingestion API has no read endpoint. See [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
- Browser queues are in memory, capped at 50 events/15 minutes and 120 new events per minute, with 20-event batches. Routine info events are discarded before errors when full. Session IDs survive same-tab redirects using session storage. Closing the page, prolonged disconnection, or a blocked telemetry endpoint can lose events; this is best-effort delivery, not a durable audit trail.
- Database ingestion deduplicates event IDs and enforces shared limits: 120 browser events per session/minute, 600 browser events/minute, and 10,000 total events/hour. Excess telemetry is dropped/retried within the bounded browser queue; business requests continue.
- API logs also go to structured console output for Vercel. Database persistence is awaited with a 750 ms abort budget, then errors are swallowed. If Supabase is unavailable or limits are reached, rely on Vercel logs for server evidence. Telemetry ingestion never logs itself recursively. Provider/edge failures before application execution must be investigated in hosting logs.
- Disable `DIAGNOSTICS_ENABLED` to stop database writes. Keep retention running. Browser queues expire in memory, and server console diagnostics remain available. Existing commerce records and their retention are unchanged.
