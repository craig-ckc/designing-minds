# Site and Content Model

This is the launch source of truth for routes, page families, CMS collections, value lists, and operational records.

## Route Map

Indexable public routes:

```text
/
/shop/
/grades/
/grades/grade-[3-7]/
/packages/
/product/[product-slug]/
/help/
/contact/
/about/
/privacy-policy/
/terms/
/refund-policy/
```

Functional noindex routes:

```text
/sign-up/
/login/
/account/
/account/orders/
/account/orders/[order-id]/
/cart/
/checkout/
```

`/bundles/` is legacy and redirects to `/packages/`. Product pages are canonical top-level routes, not nested under shop, grades, or packages.

## Page Families

| Family | Routes | Purpose | Data |
| --- | --- | --- | --- |
| Entry pages | `/`, `/about/`, `/contact/`, `/help/` | Introduce the brand, build trust, answer questions, and send customers into catalogue/support flows. | Featured Products, FAQs, Testimonials where useful. |
| Browse pages | `/shop/`, `/grades/`, `/grades/grade-[3-7]/`, `/packages/` | Help customers narrow the catalogue before opening a Product Detail. | Products, Subjects, Value Lists, contextual FAQs. |
| Product detail | `/product/[product-slug]/` | Explain one purchasable Product and let the customer add it to cart. | Product, Subjects, related Products, referenced FAQs. |
| Legal pages | `/privacy-policy/`, `/terms/`, `/refund-policy/` | Set expectations for privacy, purchases, digital delivery, refunds, licensing, and support. | Static copy for launch. |
| Auth pages | `/sign-up/`, `/login/` | Create or access a Customer Account, including checkout-driven auth. | Supabase Auth session only. |
| Account pages | `/account/`, `/account/orders/`, `/account/orders/[order-id]/` | Show customer details, order history, receipts, and download actions. | User profile, Orders, Order Items, Payments, Products. |
| Commerce flow | `/cart/`, `/checkout/` | Review selected Products, require a Customer Account, create payment, and return to Order Detail. | Cart, Products, Orders, Payments. |

Downloads are only shown from Order Detail. There is no standalone downloads page.

## CMS Collections

Admin-managed collections:

```text
Products
Subjects
FAQs
Testimonials
```

### Products

Products are every sellable offer:

- `Individual Resource`: one downloadable resource.
- `Bundle`: a fixed group of individual resources.
- `Access Plan`: a fixed grade/term or grade/year offer that unlocks included resources.

Core product fields:

```text
title, slug, shortDescription, description, price, grade, term, year,
productKind, resourceFormat, subjects, marks, purchasedFiles,
featured, published, sort/order metadata, SEO metadata, faqs
```

Bundle and Access Plan products can reference included Individual Resource products. Access Plans are normal products with fixed grade and term/year fields; checkout does not ask the customer to choose a grade.

### Subjects

Subjects classify Products and support grade/catalogue browsing. Products require at least one Subject. Subjects may carry description, label, sort order, visibility, optional presentation metadata, and referenced FAQs.

### FAQs

FAQs are reusable support content with question, answer, category, sort order, and published status. Static pages, Products, and Subjects can display relevant FAQs.

### Testimonials

Testimonials are reusable trust content with display name, quote, context/result, learner grade, source date, featured flag, sort order, and published status.

## Value Lists

Value Lists are database-sourced allowed values, not admin-managed collections:

```text
Grades
Terms
Years
Product Kinds
Resource Formats
```

Grades, Terms, and Product Kinds are effectively fixed for launch. Years and Resource Formats can be extended by database edit. A new Product Kind also requires code changes because the editor and site branch on known kinds.

Launch values:

- Grades: Grade 3, Grade 4, Grade 5, Grade 6, Grade 7.
- Terms: Term 1, Term 2, Term 3, Term 4.
- Product Kinds: Individual Resource, Bundle, Access Plan.
- Resource Formats: Test / Assessment, Summary.

## Operational Records

Operational records are database-backed system records, not CMS collections:

```text
Users
User Roles
Carts
Orders
Order Items
Payments
Slug Redirects
```

`public.users` stores the account profile for every authenticated person. `user_roles` distinguishes Customers from Administrators. Orders and carts keep `customerId` because only Customers own commerce records.

Public browsing reads `catalog_products`, a sanitized published-only view. Static builds and browser clients must not expose customer, order, payment, or private storage-key data.

## Non-Collections

Do not create admin collections for Pages, Page Sections, Grades, Terms, Years, Product Kinds, Resource Formats, Bundles, Plans, Files, Users, Orders, or Payments. Bundles and Access Plans are Products. Files live on Products as private storage keys for launch.
