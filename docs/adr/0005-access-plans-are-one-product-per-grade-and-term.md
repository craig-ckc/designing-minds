# Access Plans are one product per grade (and per term for Essential)

Status: accepted

Each **Access Plan** is a distinct Product with a fixed grade. **Essential** is split further per term — one product per grade-and-term (5 grades × 4 terms = 20). **Premium** is one product per grade, covering all terms (5). Grade and term are never chosen at **Checkout**; the customer selects them by choosing which plan to buy, on the Packages Browse Page (`/packages`, pre-filtered by tier from a homepage or nav entry, then narrowed by grade — and term, for Essential). This replaces the prior model of a single `essential-access` and `premium-access` product whose grade was picked at checkout, stored on the order line, and used to scope downloads.

We chose this because the single-product-plus-checkout-grade model collapsed the two tiers onto **identical entitlements**: Essential carried `includedTerms = null` (no term filter → all terms) and Premium carried all four terms (also all terms), so they differed only in price and copy, not in what they unlocked. Baking grade and term into the product makes the unlock exactly scoped — Essential → one grade + one term; Premium → one grade + all terms — removes grade-selection UI and validation from checkout, and lets each plan be an ordinary Product Detail page. Entitlement now derives grade from `product.grade`, so the threaded `grade` parameter and `includedGrades` fallback in `resourceUnlockedByPlan` are removed.

## Considered Options

- **One product per tier, grade chosen at checkout** (previous) — Rejected: the two tiers resolved to identical entitlements; checkout needed grade-selection UI plus validation; entitlement had to thread a `grade` from each order line, and a comment in `entitlements.ts` existed solely to justify that scoping.
- **One product per grade per tier, Essential covering all terms (10 products)** — Rejected: Essential would then grant every term just like Premium, re-collapsing the tiers.
- **Chosen: 25 products** — Essential as grade × term (20) and Premium as grade (5).

## Consequences

- The catalogue gains 25 plan products; grade and term are fixed Fields on each.
- `resourceUnlockedByPlan` drops its `grade` parameter and the `includedGrades` branch; it scopes by `product.grade` and `product.includedTerms`.
- Checkout no longer collects or validates grade; the order line still records the plan's fixed grade, read from `product.grade`.
- `includedGrades` is empty on every plan (now vestigial; the Product type may drop it later).
- Plans are discovered through the Packages Browse Page, not as individual homepage cards; the homepage/nav keep two tier entries that deep-link with query params.
- Supersedes the grade-scoping rationale previously documented in `entitlements.ts`. ADR 0001 (Access Plans are one-time purchases) is unaffected.
