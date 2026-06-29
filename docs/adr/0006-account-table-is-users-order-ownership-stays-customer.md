# The account table is `users`; order ownership stays `customerId`

Status: accepted

Rename `public.customers` to `public.users`. It stores the account profile (name, email) for **every** authenticated person — keyed by `auth.users.id`, regardless of role — and `user_roles` is the sole place that distinguishes **Customer** from **Administrator**. The `orders.customerId` and `carts.customerId` columns keep their names (the foreign key is simply retargeted to `users(id)`), because only the Customer role owns orders and carts; an Administrator never does.

We chose this because the `handle_new_user` trigger provisions a profile row for every auth user, including admins, yet CONTEXT.md states *"an Administrator is not itself a Customer."* Naming that table `customers` contradicted the glossary. Renaming it to `users` makes the implementation honor the existing model — everyone is exactly one authenticated account (a `users` row), distinguished only by `user_roles`. The order/cart foreign keys deliberately stay `customerId` so the column name keeps encoding the invariant "orders belong to Customers, not admins"; the asymmetry with `user_roles.userId` is intentional and meaningful, not an inconsistency to iron out.

## Considered Options

- **Keep `customers`, exclude admins from it** — Rejected: an admin's name/email profile would then have nowhere to live except Auth metadata, diverging further from the single-account-type design.
- **Rename to `profiles` or `accounts`** — Viable; `profiles` is the standard Supabase convention and avoids the `auth.users` / `public.users` name clash. Rejected in favour of `users` for verbal alignment with `user_roles`, accepting the human-ambiguity cost of two `users` tables.
- **Also rename the FKs to `userId` for uniformity** — Rejected: loses the "orders belong to Customers" signal and balloons the blast radius (RLS policies, `create_pending_order` parameters, `cart.ts`, admin order pages).

## Consequences

- `public.users` replaces `public.customers` in the schema DDL, all RLS policies, the `handle_new_user` trigger, and `from('customers')` calls in the functions and web code.
- `orders` and `carts` keep `customerId` (FK → `users(id)`); `create_pending_order` parameters and the cart code are untouched.
- `public.users` sits next to `auth.users`; reviewers and SQL authors must keep the two distinct.
- ADR 0003 still holds; where it says "the Customer row" provisioned at signup, read "the `users` row." This ADR amends that wording without changing the roles model.
