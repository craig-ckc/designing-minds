# Physical commerce

Products share the existing Products collection and `/shop/:slug` space. Digital
products keep their download/ownership rules. Physical products have published
variant configuration and separate, private operational inventory.

Apply, in this order, after review: `2026-11-10-physical-product-foundation.sql`,
`2026-11-10-physical-commerce.sql`, `2026-11-12-order-line-identity.sql`,
`2026-11-12-physical-options.sql`. All are included in the fresh `schema.sql`.
The commerce setting defaults to `disabled`; applying SQL alone does not enable
physical sales. Older databases without the commerce views continue serving
digital products.

## Options and personalisation

- **Product options** (`variantOptions`) are what you stock separately — Colour,
  Size — with optional `#rrggbb` swatches. Each variant picks one declared value
  per option; the admin's "Create all combinations" adds the missing variants.
  The database rejects undeclared values and two active variants with the same
  combination. A product with no options sells as one variant.
- **Personalisation questions** (`customizationRules`) are what the shopper tells
  you. Text questions can be forced to capitals (letter tiles). List questions
  take plain choices or `{ value, label?, swatch?, priceDeltaZar? }`; a chosen
  `priceDeltaZar` is added once per item. `appliesWhen` asks a question only for
  some option values (the teacher's name on the Large bag only), and `help`
  holds instructions shoppers see under the question. A question may not reuse
  an option's key, and the per-letter question always applies.
- **Stock policy** per variant: `tracked` (counted and reserved) or
  `made_to_order` (always available, never reserved). `leadTimeDays` tells
  shoppers how long making takes.
- **Live preview** (`previewTemplate: 'letter-tiles'`) draws the per-letter text
  on keyring tiles in the chosen swatch colour.

## Pricing and stock

- `private.physical_unit_price` is the one price calculation: the variant price
  (or the sale-aware product price), × billable letters for per-letter products
  (matched case-insensitively), plus chosen choice surcharges. The storefront
  mirrors it for display only (`physicalUnitPriceZar`).
- Physical coupon policy: `all_products` (default) discounts eligible digital and
  physical lines together; `digital_only` discounts digital lines only;
  `disabled` rejects coupons in a basket with physical products. Shipping is never
  discounted, and sale-priced lines follow the code's "allow sale items" setting.
- A physical order pays one configured shipping charge and captures its delivery
  address as a historical snapshot. Courier API integration is not implemented.
- Checkout atomically reserves stock-counted variants for the configured
  duration. Captured payment deducts stock once; failure/cancellation releases
  holds. Expired holds stop counting toward availability immediately. Coupons
  remain reserved for a pending order until cancellation or confirmed failure.
- An expired checkout retry renews its hold only if stock is still available.
  A late successful payment rechecks stock; when unavailable, the order becomes
  `payment_review`: nothing ships, but digital lines in the same order unlock
  (they were paid for). An administrator resolves it in the order screen —
  **fulfil** once restocked (stock is deducted then), or **record refund** after
  refunding in PayFast: the whole order (`refunded`, digital lines lock) or, for
  a mixed order, the physical items only (stays `paid`, fulfilment `cancelled`,
  digital lines stay available). Partial refund amounts are not recorded.
- Stock adjustments compare the expected count with the current value and cannot
  reduce stock below active holds. Ordinary product edits do not overwrite stock.
- Physical product pages refresh availability from `catalog_physical_products`
  when opened and when the browser tab becomes visible again. The view exposes
  only availability, never stock counts. Checkout still validates inventory.
- Product type and variant ownership are immutable. Physical lines never grant
  digital files. Order lines snapshot prices, option values, personalisation and
  their labels (`fieldLabels`).

## Admin editing

The product editor follows Shopify/Webflow for options (quick-add Colour / Size /
Style, values typed as chips, variants kept in step automatically, compact rows
with "Apply to all") and Etsy for personalisation (question, instructions,
character limit, letters only, capitals, "Charge per letter", "Ask only for some
versions"). Turning on "Charge per letter" sets the product's per-letter pricing.

## Order line identity

New order lines record `productId` / `bundleId`. Downloads, the account file
list (`POST /api/order-files`) and the "already owned" check resolve older
slug-only lines through `slug_redirects`, so renaming a product never cuts off
its buyers. A slug that still redirects to another record cannot be reused.

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
ownership against the final patch state. `physical-options.test.ts` covers
declared options, choice pricing, conditional questions, made-to-order, coupons on
physical lines and stock-review resolution; `order-line-identity.test.ts` and
`issue-download.test.ts` cover slug-safe entitlements. Handler, store and
rendered UI tests cover the matching contracts.
