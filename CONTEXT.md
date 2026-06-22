# Designing Minds

Designing Minds sells downloadable CAPS-aligned learning resources to customers through a simple public catalogue and customer account area.

## Language

**Customer Account**:
The signed-in area where a customer manages orders and accesses purchased downloads.
_Avoid_: User account, profile

**Order History**:
The complete list of orders associated with a Customer Account.
_Avoid_: Downloads page

**Order Detail**:
The page for one order that shows the receipt, purchased items, and download actions.
_Avoid_: Download detail, receipt-only page

**Checkout**:
The purchase step where a customer signs in or creates a Customer Account before completing payment.
_Avoid_: Guest checkout

**Cart**:
The pre-checkout review of selected resources and total price.
_Avoid_: Basket

**Product Detail**:
The canonical page for one downloadable resource or bundle.
_Avoid_: Shop product child page

**Browse Page**:
A page that helps customers narrow the catalogue before opening a Product Detail.
_Avoid_: Product parent page

**Collection**:
A group of admin-manageable content records that can be created, edited, or removed independently.
_Avoid_: Database table, static page, system record

**Product Collection**:
The main catalogue collection containing downloadable resources and bundles.
_Avoid_: Catalogue item collection

**Bundle**:
A purchasable product that groups multiple resources into one offer.
_Avoid_: Bundle collection

**Access Plan**:
A purchasable product that grants access to a defined set of resources over a term or year.
_Avoid_: Plan collection

**Product Kind**:
A controlled field that describes how a product is sold.
_Avoid_: Resource format

**Resource Format**:
A controlled field that describes what kind of learning material a product contains.
_Avoid_: Product kind

**FAQ Collection**:
The global collection of reusable questions and answers that can appear on multiple pages.
_Avoid_: Page-specific FAQ collection

**Testimonial Collection**:
The global collection of reusable customer quotes and outcomes.
_Avoid_: Page-specific testimonial collection

**Subject Collection**:
The collection of learning subjects used to classify and describe products.
_Avoid_: Subject option field

**Controlled Field**:
A constrained field with managed options that can be selected on a collection item but does not create independently managed content records.
_Avoid_: Collection, reference field

**Reference Field**:
A field that links one collection item to one or more items in another Collection.
_Avoid_: Controlled field

**Static Page**:
A fixed route whose page structure is owned by the website, even if individual sections pull from collections.
_Avoid_: Page collection

**Page Family**:
A group of routes that share the same structural purpose and content rules.
_Avoid_: One-off page specification

**Customer**:
A person who owns their own account information and places orders.
_Avoid_: Admin-managed customer

**Order**:
A system-generated purchase record connected to a Customer Account.
_Avoid_: Admin-created order

**Digital Fulfillment**:
The delivery of purchased printable files through the relevant Order Detail after payment succeeds.
_Avoid_: Shipping fulfillment

**Authentication Page**:
A top-level page used to create or access a Customer Account.
_Avoid_: Hidden checkout-only login

**Indexable Page**:
A page intended to appear in public search results.
_Avoid_: Search-visible functional page

**Functional Page**:
A page used to complete a customer task but not intended to appear in public search results.
_Avoid_: Marketing page

## Relationships

- A **Customer Account** can have zero or more **Orders**.
- A **Customer Account** includes one **Order History**.
- An **Order History** contains zero or more **Order Details**.
- An **Order Detail** is the only place where a customer downloads purchased files.
- **Digital Fulfillment** is the launch fulfillment model.
- A **Cart** can contain one or more selected resources.
- A **Cart** leads to **Checkout**.
- **Checkout** requires a **Customer Account** before payment is completed.
- An **Authentication Page** can be reached directly or from **Checkout**.
- **Authentication Pages**, **Cart**, **Checkout**, **Customer Account**, **Order History**, and **Order Details** are **Functional Pages**.
- A **Product Detail** is a top-level route because products can be reached from Shop, Grades, and Bundles.
- **Shop**, **Grades**, and **Bundles** are **Browse Pages**.
- A **Browse Page** can link to many **Product Details**, but it does not own their routes.
- The **Product Collection** is the primary catalogue **Collection**.
- A **Bundle** is an item in the **Product Collection**.
- A **Bundle** can reference included Products while still being sold as its own Product.
- An **Access Plan** is an item in the **Product Collection**.
- **Product Kind** and **Resource Format** are separate controlled fields.
- The **FAQ Collection** is global and can be reused across static pages, browse pages, product pages, and checkout support.
- The **Testimonial Collection** is global and can be reused across static pages, browse pages, and product pages.
- Static pages can query reusable collection content directly without page-to-content reference fields.
- Products and Subjects may reference FAQs when specific questions should appear in those contexts.
- Testimonials are standalone reusable content and do not need product, subject, or page reference fields for launch.
- **Static Pages** are not **Collections**.
- **Static Pages** remain fixed website routes; they may display content from **Collections** without becoming collections themselves.
- **Static Pages** can be documented by **Page Family** when several routes share the same structure.
- **Customers** and **Orders** may be stored in the database, but they are not **Collections**.
- **Controlled Fields** are for stable labels and filter values; **Reference Fields** are for relationships between **Collections**.
- Products reference one or more items from the **Subject Collection** through a required multi-select relationship.

## Example dialogue

> **Dev:** "Should downloads live in a separate customer area?"
> **Domain expert:** "No — customers should download purchased files from the relevant order in their Customer Account."

## Flagged ambiguities

- "Account" is acceptable in public URLs and navigation because the site has only one account type, but the domain term is **Customer Account**.
- "Downloads" should not be a standalone customer area; downloads belong to an **Order Detail**.
- Customers can browse and add resources to the cart without a **Customer Account**, but they cannot complete **Checkout** without one.
- A top-level route can be a **Functional Page** without being an **Indexable Page**.
- Physical delivery and cash-on-delivery are possible future concepts, but they are out of scope for launch.
