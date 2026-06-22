# Designing Minds Sitemap

This document records the confirmed launch sitemap for the Designing Minds public website and customer purchase flow. It is the source of truth for route structure before creating the content map.

## Route Tree

```text
/
├── /shop/
├── /grades/
│   └── /grades/grade-[3-7]/
├── /bundles/
├── /product/[product-slug]/
├── /help/
├── /contact/
├── /about/
├── /privacy-policy/
├── /terms/
├── /refund-policy/
├── /sign-up/
├── /login/
├── /account/
│   └── /account/orders/
│       └── /account/orders/[order-id]/
├── /cart/
└── /checkout/
    └── redirects after payment to /account/orders/[order-id]/
```

## Page Purposes

| Route | Purpose | Page type |
| --- | --- | --- |
| `/` | Main entry point that routes customers to shop, grades, bundles, account access, or support. | Indexable page |
| `/shop/` | Catalogue-wide browse page with search and filters for grade, subject, term, type, and year. | Indexable browse page |
| `/grades/` | Grade hub for Grade 3 to Grade 7. | Indexable browse page |
| `/grades/grade-[3-7]/` | Grade-specific browse template showing relevant resources and bundles. | Indexable browse page |
| `/bundles/` | Bundle hub for term bundles and full-year bundles. | Indexable browse page |
| `/product/[product-slug]/` | Canonical page for one downloadable resource or bundle. | Indexable product page |
| `/help/` | Practical support content for downloads, printing, accounts, CAPS alignment, licensing, and refunds. | Indexable support page |
| `/contact/` | Contact details and enquiry form. | Indexable support page |
| `/about/` | Founder story, credibility, CAPS alignment, and trust content. | Indexable company page |
| `/privacy-policy/` | Privacy and data-use policy. | Indexable legal page |
| `/terms/` | Purchase, account, delivery, and usage terms. | Indexable legal page |
| `/refund-policy/` | Refund rules for digital products and duplicate or accidental purchases. | Indexable legal page |
| `/sign-up/` | Create a Customer Account. | Functional page, noindex |
| `/login/` | Access an existing Customer Account. | Functional page, noindex |
| `/account/` | Customer Account dashboard with recent orders, account details, and support entry points. | Functional page, noindex |
| `/account/orders/` | Full order history for the signed-in customer. | Functional page, noindex |
| `/account/orders/[order-id]/` | Order receipt, purchased items, and download buttons. | Functional page, noindex |
| `/cart/` | Review selected resources before checkout. | Functional page, noindex |
| `/checkout/` | Account-required payment flow. | Functional page, noindex |

## Indexing Rules

Indexable routes:

```text
/
/shop/
/grades/
/grades/grade-[3-7]/
/bundles/
/product/[product-slug]/
/help/
/contact/
/about/
/privacy-policy/
/terms/
/refund-policy/
```

Noindex routes:

```text
/sign-up/
/login/
/account/
/account/orders/
/account/orders/[order-id]/
/cart/
/checkout/
```

## Confirmed Decisions

- Public route hierarchy and search indexing are separate concerns.
- `/account/`, `/cart/`, and `/checkout/` are top-level functional routes, but they are not search-indexed marketing pages.
- Public URLs use `/account/`, but the domain term is Customer Account.
- Checkout requires a Customer Account before payment is completed.
- Customers can browse and add resources to cart before signing in.
- There is no standalone `/downloads/` route.
- Purchased files are downloaded from `/account/orders/[order-id]/`.
- Product pages use the canonical top-level route `/product/[product-slug]/`.
- Product pages are not nested under `/shop/`, `/grades/`, or `/bundles/`.
- Shop, Grades, and Bundles are browse pages that link to Product Detail pages.
- `/bundles/` is a single focused page with internal filtering rather than grade-specific bundle routes.
- `/bundles/` shows bundles and access plans together, visually separated by offer type.
