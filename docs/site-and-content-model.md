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
/shop/[product-slug]/
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
/forgot-password/
/reset-password/
/account/
/account/orders/
/account/orders/[order-id]/
/cart/
/checkout/
/checkout/return/
/checkout/cancel/
/unsubscribe/
```

`/hero-demo/` is a functional, noindex design-study page (not in the sitemap). `/bundles/` is legacy and redirects to `/packages/`. Product pages use the canonical `/shop/[product-slug]/` route regardless of whether the visitor discovered them through Shop, Grades, or Packages.

## Page Families

| Family | Routes | Purpose | Data |
| --- | --- | --- | --- |
| Entry pages | `/`, `/about/`, `/contact/`, `/help/` | Introduce the brand, build trust, answer questions, and send customers into catalogue/support flows. | Featured Products, FAQs, Testimonials where useful. |
| Browse pages | `/shop/`, `/grades/`, `/grades/grade-[3-7]/`, `/packages/` | Help customers narrow the catalogue before opening a Product Detail. | Products, Subjects, Value Lists, contextual FAQs. |
| Product detail | `/shop/[product-slug]/` | Explain one purchasable Product and let the customer add it to cart. | Product, Subjects, related Products, referenced FAQs. |
| Legal pages | `/privacy-policy/`, `/terms/`, `/refund-policy/` | Set expectations for privacy, purchases, digital delivery, refunds, licensing, and support. | Static copy for launch. |
| Auth pages | `/sign-up/`, `/login/`, `/forgot-password/`, `/reset-password/` | Create, access, or recover a Customer Account, including checkout-driven auth. | Supabase Auth session only. |
| Account pages | `/account/`, `/account/orders/`, `/account/orders/[order-id]/` | Show customer details, order history, receipts, and download actions. | User profile, Orders, Order Items, Payments, Products. |
| Commerce flow | `/cart/`, `/checkout/`, `/checkout/return/`, `/checkout/cancel/` | Review selected Products, require a Customer Account, create payment, and return to Order Detail. | Cart, Products, Orders, Payments. |

Downloads are only shown from Order Detail. There is no standalone downloads page.

## CMS Collections

Admin-managed collections:

```text
Products
Bundles
FAQs
Testimonials
```

The admin also lists Discount codes (see [promotions.md](./promotions.md)) and read-only operational records (Orders, Customers, Payments, form submissions).

### Products

Products are individual downloadable resources. Bundles are a separate collection (below). Access Plans and the product-kind column were retired on 2026-08-09 (see [decisions.md](./decisions.md)).

Core product fields:

```text
title, slug, shortDescription, description, price, grade, term, year,
resourceFormat, subjects, marks, purchasedFiles,
featured, published, sort/order metadata, SEO metadata, faqs
```

### Bundles

A Bundle lists its included Products explicitly (`includedProductIds` / `includedProductSlugs`) and has its own price, grade, term, year, and `bundleScope` (`Term` or `Full Year`). Subjects, terms, file count, and saving versus buying singly are derived from the members, never stored. Checkout does not ask the customer to choose a grade.

### FAQs

FAQs are reusable support content with question, answer, category, sort order, and published status. Static pages and Products can display relevant FAQs.

### Testimonials

Testimonials are reusable trust content with display name, quote, context/result, learner grade, source date, featured flag, sort order, and published status.

## Value Lists

Value Lists are database-sourced allowed values, not admin-managed collections:

```text
Grades
Terms
Years
Resource Formats
Subjects
```

Grades and Terms are effectively fixed for launch. Years, Resource Formats, and Subjects can be extended by database edit.

Subjects classify Products and support catalogue browsing. Products require at least one Subject; a product stores its subject **display names** directly in `subjects` (there is no Subjects table to join). Edit the list of subjects in `value_lists.subjects`, like grades and terms.

Launch values:

- Grades: Grade 3, Grade 4, Grade 5, Grade 6, Grade 7.
- Terms: Any Term, Term 1, Term 2, Term 3, Term 4.
- Resource Formats: Test / Assessment, Summary.
- Subjects: Afrikaans First Additional Language, Economic Management Sciences (EMS), English First Additional Language, English Home Language, Geography, History, Life Orientation, Life Skills, Life Skills (PSW), Mathematics, Natural Science, Natural Science and Technology, Technology.

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
Form Submissions (form_contact, form_newsletter)
```

Contact and newsletter forms POST to the functions app (`/api/forms`), which writes `form_<name>` tables with the secret key and sends a Resend notification — the browser never writes them directly. Like Orders/Payments/Customers, submissions appear in the admin app as read-only views (a "Submissions" group), never as editable CMS collections. Each table keeps stable identity/metadata as columns and the variable submitted fields in a `data` jsonb bag.

`public.users` stores the account profile for every authenticated person. `user_roles` distinguishes Customers from Administrators. Orders and carts keep `customerId` because only Customers own commerce records.

Public browsing reads `catalog_products`, a sanitized published-only view. Static builds and browser clients must not expose customer, order, payment, or private storage-key data.

## Non-Collections

Do not create admin collections for Pages, Page Sections, Grades, Terms, Years, Resource Formats, Plans, Files, Users, Orders, or Payments as editable content collections. Files live on Products as private storage keys for launch.
