# Access Plans are one-time purchases, not recurring subscriptions

Status: accepted

"Essential" (term) and "Premium" (year) are marketed as subscriptions, but for launch an **Access Plan** is a Product purchased once for that period: a single payment, fulfilled by download on the Order Detail, with no stored payment mandate, automatic charge, or renewal state. We chose this because a true recurring-billing engine (mandates, dunning, failed-renewal handling, cancellation UI, renewal emails) is a large build that the launch catalogue does not need — when a plan lapses, the customer simply re-purchases.

## Considered Options

- **Recurring subscription** — auto-charge each term/year. Rejected for launch: requires a payment provider with recurring mandates plus subscription state and dunning, and contradicts the Digital Fulfillment model (download via Order Detail, not email/auto-delivery).
- **Manual now, auto later** — store an expiry to bolt on renewal later. Deferred: not needed yet, and the data can carry informational renewal/expiry notes without committing to the engine.

## Consequences

- Checkout issues a single charge; the Payment record models one charge per Order, not a mandate.
- The marketing word "subscription" does not imply automatic billing — see CONTEXT.md ("Access Plan", flagged ambiguities).
- Adding automatic renewal later is a deliberate future project and would supersede this ADR.
