# Designing Minds Page Structure

This document defines the launch page structure by page family. It works with the confirmed [sitemap](./sitemap.md) and [content map](./content-map.md).

## Principles

- Static pages are fixed website routes, not page collections.
- Pages may query Products, Subjects, FAQs, and Testimonials where useful.
- Browse pages help customers narrow the catalogue before opening a Product Detail.
- Product pages are canonical top-level routes.
- Functional pages are reachable in the app but noindex.
- Order Detail is the only place where purchased files are downloaded.

## 1. Public Entry Pages

Routes:

```text
/
/about/
/contact/
/help/
```

Indexing:

```text
Indexable
```

Purpose:

Introduce the brand, build trust, answer common questions, and route customers into the catalogue or support flow.

Core sections:

```text
Hero / page heading
Primary CTA to Shop, Grades, Bundles, or Contact
Trust proof: CAPS aligned, teacher-created, printable PDFs, instant access
Relevant FAQs where useful
Testimonials where useful
Support/contact entry points
```

Collection data:

```text
Products: featured products or latest products on Home
FAQs: Home and Help
Testimonials: Home and About
```

Primary CTAs:

```text
Home -> Shop / Grades / Bundles
About -> Shop
Contact -> submit enquiry
Help -> Contact or Account/Login where relevant
```

## 2. Browse Pages

Routes:

```text
/shop/
/grades/
/grades/grade-[3-7]/
/bundles/
```

Indexing:

```text
Indexable
```

Purpose:

Help customers find the right Product without creating separate pages for every possible filter combination.

Core sections:

```text
Page heading and short explanation
Search and/or filters
Product grid
Empty state for no results
Bundle or access-plan callout where relevant
Helpful FAQ block where relevant
```

Collection data:

```text
Products
Subjects
FAQs where context-specific
```

Filtering rules:

```text
Shop -> all published Products
Grades -> grade options from controlled field
Grade Detail -> Products filtered by Grade
Bundles -> Products where Product Kind = Bundle or Access Plan, visually separated by offer type
```

Primary CTAs:

```text
Open Product Detail
Add to cart where appropriate
Continue to Cart
```

Bundle page structure:

```text
/bundles/
├── Term bundles
├── Full-year bundles
└── Access plans
```

## 3. Product Detail Pages

Routes:

```text
/product/[product-slug]/
```

Indexing:

```text
Indexable
```

Purpose:

Explain one purchasable Product clearly enough for the customer to buy with confidence.

Core sections:

```text
Product title
Price
Grade, term, year, subjects, product kind, resource format
Preview file links where available
Description and included content
FAQ block if Product references FAQs
Related products
Add to cart CTA
```

Collection data:

```text
Products
Subjects
FAQs referenced by Product
Testimonials may be queried globally if useful
```

Product-kind behavior:

```text
Individual Resource -> show file/resource details and preview
Bundle -> show bundle scope and included Individual Resource Products
Access Plan -> show access period and included Individual Resource Products
```

Primary CTA:

```text
Add to cart
```

## 4. Legal Pages

Routes:

```text
/privacy-policy/
/terms/
/refund-policy/
```

Indexing:

```text
Indexable
```

Purpose:

Set clear expectations for privacy, purchases, account use, digital delivery, refunds, licensing, and support.

Core sections:

```text
Page heading
Effective date
Plain-language policy sections
Contact/support link
```

Collection data:

```text
None required for launch
```

Primary CTA:

```text
Contact support
```

## 5. Authentication Pages

Routes:

```text
/sign-up/
/login/
```

Indexing:

```text
Noindex
```

Purpose:

Allow customers to create or access a Customer Account directly, or as part of Checkout.

Core sections:

```text
Focused auth form
Short explanation of why an account is needed
Link between sign-up and login
Support link
```

Collection data:

```text
None required for launch
```

Primary CTAs:

```text
Create account
Log in
Return to checkout when auth was initiated from checkout
```

## 6. Customer Account Pages

Routes:

```text
/account/
/account/orders/
/account/orders/[order-id]/
```

Indexing:

```text
Noindex
```

Purpose:

Let signed-in customers review account information, see orders, and download purchased files from the relevant Order Detail.

Core sections:

```text
Account dashboard summary
Recent orders
Full order history
Order receipt
Purchased items
Download buttons on Order Detail
Support link
```

Operational data:

```text
Customers
Orders
Order Items
Payments
Products for purchased item details
```

Primary CTAs:

```text
View order
Download purchased file
Contact support
```

Important rule:

```text
There is no standalone Downloads page. Downloads belong to Order Detail.
Launch fulfillment is digital printable files only. Do not foreground shipping-style order tracking in the customer UI.
```

## 7. Commerce Flow Pages

Routes:

```text
/cart/
/checkout/
```

Indexing:

```text
Noindex
```

Purpose:

Let customers review selected Products, sign in or create an account during checkout, complete payment, and land on the relevant Order Detail.

Core sections:

```text
Cart item list
Order summary
Remove/update item controls where appropriate
Checkout authentication step
Payment step
Payment success/failure states
Post-payment redirect to Order Detail
```

Data used:

```text
Cart state
Products
Customer Account
Orders
Payments
```

Primary CTAs:

```text
Proceed to checkout
Sign up or log in
Pay now
View order
```

Flow:

```text
Product Detail -> Cart -> Checkout -> Account Order Detail
```

Launch fulfillment note:

```text
Successful payment unlocks printable file downloads on Order Detail.
Failed payment does not create a customer-facing fulfillment state.
Physical delivery and cash-on-delivery are possible future options, but are not part of the launch page structure.
```
