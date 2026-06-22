# Designing Minds Content Map

This document records the agreed content model for the launch site. It separates admin-manageable collections from controlled fields, operational records, and static pages.

## Content Model Principles

- A collection is admin-manageable content that can be created, edited, or removed independently.
- A controlled field is a constrained set of selectable values used on collection items.
- A reference field links one collection item to one or more items in another collection.
- Operational records may live in the database, but they are not CMS collections.
- Static pages are fixed routes owned by the website; they can display collection content without becoming collections.

## Collections

```text
Products
Subjects
FAQs
Testimonials
```

### Products

The primary catalogue collection. Products include every purchasable offer.

Product kinds are represented through the Product Kind controlled field:

```text
Individual Resource
Bundle
Access Plan
```

Products should support:

```text
title
slug
short description
full description
price
grade
term
year
product kind
resource format
subjects
marks
preview files
purchased files
featured status
published status
sort/order metadata
SEO metadata
faqs
```

Bundle products may also include:

```text
bundle scope: Term / Full Year
included products
included subjects
included terms
```

Included products for bundles are limited to Products where Product Kind is Individual Resource.

Access Plan products may also include:

```text
access period: Term / Year
included grades
included subjects
included terms
included products
delivery rules
renewal or expiry notes
```

Included products for access plans are limited to Products where Product Kind is Individual Resource.

### Subjects

The collection of learning subjects used to classify products.

Subjects should support:

```text
name
slug
description
short label
sort order
visibility
faqs
optional icon or colour metadata
SEO metadata if subject pages are added later
```

Products reference Subjects through a required multi-select relationship. Each product must have at least one subject, and can have more than one.
Subjects can reference FAQs through an optional multi-reference field.

### FAQs

A global reusable collection of questions and answers.

FAQs should support:

```text
question
answer
category
sort order
published status
```

Expected usage:

```text
Static pages can query FAQs directly by category or display rules.
Products can reference FAQs when product-specific questions are needed.
Subjects can reference FAQs when subject-specific questions are needed.
```

### Testimonials

A global reusable collection of customer quotes and outcomes.

Testimonials should support:

```text
customer display name
quote
context or result summary
learner grade
source date
featured status
sort order
published status
```

Expected usage:

```text
Testimonials are standalone reusable trust content.
Static pages can query and display testimonials directly.
```

## Controlled Fields

```text
Grades
Terms
Years
Product Kinds
Resource Formats
```

### Grades

Controlled values:

```text
Grade 3
Grade 4
Grade 5
Grade 6
Grade 7
```

Grades are stable launch values, not a collection.

### Terms

Controlled values:

```text
Term 1
Term 2
Term 3
Term 4
```

### Years

Managed selectable values used to classify products by curriculum or release year.

### Product Kinds

Controlled values for how a product is sold.

Launch values:

```text
Individual Resource
Bundle
Access Plan
```

### Resource Formats

Controlled values for what kind of learning material a product contains.

Launch values:

```text
Test / Assessment
Summary
```

Additional values can be added later if the catalogue expands to worksheets, memos, packs, or other resource formats.

## Operational Records

Operational records are database-backed system records, not CMS collections.

```text
Customers
Orders
Order Items
Payments
```

### Customers

Customer-owned account records. Admin users should not freely edit customer-owned profile information.

### Orders

System-generated purchase records. Admin users may manage limited operational fields, but should not edit core purchase facts such as purchased items, totals, or payment evidence.

### Order Items

The purchased products attached to an order.

### Payments

Payment status and provider references connected to checkout and orders.

## Static Pages

Static pages are fixed website routes. They are not collections.

```text
Home
Shop
Grades
Grade Detail
Bundles
Product Detail
Help
Contact
About
Privacy Policy
Terms
Refund Policy
Sign Up
Login
Account
Order History
Order Detail
Cart
Checkout
```

Static pages may display collection content:

```text
Home -> featured Products, FAQs, Testimonials
Shop -> Products
Grades -> Products filtered by Grade
Bundles -> Products filtered by Product Kind
Help -> FAQs
About -> Testimonials
Product Detail -> Products, Subjects, FAQs, Testimonials
Order Detail -> Orders and Order Items
```

## Explicit Non-Collections

The following are intentionally not collections for launch:

```text
Pages
Page Sections
Grades
Terms
Years
Product Kinds
Resource Formats
Bundles
Plans
Files
Customers
Orders
```

Bundles and access plans are Products. Customers and orders are operational records.
Files are stored on Products for launch rather than managed as a separate collection. Bundle and access plan products can reference included Products so file access can resolve from the included product records.
