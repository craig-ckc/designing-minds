# Product Catalog Structure

Categories, product types, attributes, filters, and users

Prepared for client review - 29 June 2026

This document explains how the catalogue is structured so the client can review whether products are grouped, described, filtered, and sold correctly.

## Catalogue Principle

Every sellable item is treated as a product. The product can be a single downloadable resource, a package of resources, or an access plan.

This keeps the catalogue flexible while allowing customers to browse by different needs: grade, term, subject, resource format, or offer type.

## Product Types

- Individual Resource: a single downloadable test, assessment, summary, or similar resource.
- Package: a grouped once-off purchase, such as a term package or full-year package. The prototype currently uses the technical label Bundle in some places.
- Access Plan: a premium once-off purchase that unlocks resources for a selected grade and period. The current model supports term or year access periods and does not renew automatically.

## Main Product Attributes

- Title and short description.
- Full product description.
- Price.
- Grade.
- Term.
- Year.
- Product type: Individual Resource, Package, or Access Plan.
- Resource format, currently Test / Assessment or Summary.
- Subjects.
- Marks, where relevant.
- Preview files, where available.
- Purchased files.
- Included products for packages and access plans.
- Published and featured status.
- SEO title and description.

## Categories and Value Lists

- Grades: Grade 3, Grade 4, Grade 5, Grade 6, and Grade 7.
- Terms: Term 1, Term 2, Term 3, and Term 4.
- Years: the curriculum or release year attached to the product.
- Subjects: managed as catalogue content so products can belong to one or more subjects.
- Resource formats: currently Test / Assessment and Summary, with room to add more later.
- Product types: Individual Resource, Package, and Access Plan.

## Filters and Customer Access Points

- Shop filters by search, grade, term, subject, format, and type.
- Grade pages filter the catalogue to one grade and allow term narrowing.
- Packages separates term packages, full-year packages, and access plans.
- Product pages show related resources to keep customers moving through the catalogue.
- The navigation highlights access plans as premium offers.

## Customer and Order Records

- Customers: account records used for login, checkout, order history, and downloads.
- Orders: purchase records created during checkout.
- Order items: the products purchased inside an order.
- Payments: payment-provider status and references connected to each order.
- Downloads: files are accessed through order detail pages after payment is confirmed.

## Current Interpretation of Packages vs Access Plans

A package appears to be a fixed group of resources sold as a discounted once-off purchase. For example, a term package or full-year package for a grade.

An access plan appears to be a premium once-off purchase that unlocks resources for a selected grade and access period. It is chosen by grade during checkout and is not currently modelled as a recurring subscription.

This difference should be confirmed because it affects naming, pricing, product descriptions, checkout wording, and customer expectations.

## Questions for Client

- Should the final customer-facing term be Package rather than Bundle?
- What exactly is included in a full-year package?
- What exactly is included in a yearly access plan?
- Should access plans include future resources added during the access period, or only the resources available at purchase time?
- Should customers be able to buy access plans for more than one grade in one order?
- Are subjects and resource formats complete for launch?
- Do any products require variants, such as language, memo included/not included, or paper 1/paper 2?
