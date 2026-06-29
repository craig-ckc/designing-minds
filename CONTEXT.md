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

**Package**:
An umbrella term for any Product that grants more than one resource — a Bundle or an Access Plan — as opposed to a single Individual Resource. The Packages Browse Page (route `/packages`) presents both Bundles and Access Plans.
_Avoid_: using "Package" to mean only a Bundle

**Bundle**:
A purchasable product that groups multiple resources into one offer.
_Avoid_: Bundle collection, Package (a Bundle is one kind of Package, not the only kind)

**Access Plan**:
A purchasable product that grants access to a defined set of resources for one fixed grade over a fixed period. An **Essential Access** plan covers one grade for one term; a **Premium Access** plan covers one grade for the full year (all terms). The grade and term are fixed properties of the plan itself — the customer chooses them by choosing which plan to buy, not as a checkout option. Purchased once for its period; it does not auto-renew or auto-charge at launch.
_Avoid_: Plan collection, Subscription, "choose grade at checkout"

**Product Kind**:
A Product field that describes how a product is sold; its value is drawn from the Product Kinds Value List.
_Avoid_: Resource format

**Resource Format**:
A Product field that describes what kind of learning material a product contains; its value is drawn from the Resource Formats Value List.
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

**Field**:
A defined attribute of a record, such as a Product's title, slug, short description, price, grade, or term. Fields are part of the record's shape; they are not independently managed content records.
_Avoid_: Controlled field

**Value List**:
A database-sourced set of allowed values that certain Fields draw from — Grades, Terms, Product Kinds, Resource Formats, and Years. Value Lists are edited directly in the database (not through the admin app) and appear as fixed select options on records.
_Avoid_: Controlled field, option collection

**Reference Field**:
A Field that links one collection item to one or more items in another Collection.
_Avoid_: Value list

**Static Page**:
A fixed route whose page structure is owned by the website, even if individual sections pull from collections.
_Avoid_: Page collection

**Page Family**:
A group of routes that share the same structural purpose and content rules.
_Avoid_: One-off page specification

**Customer**:
A person who owns their own account information and places orders. A Customer is exactly one authenticated account; there is no login-less, shared, or admin-created Customer.
_Avoid_: Admin-managed customer

**Administrator**:
A person with privileged access to manage catalogue Collections and to view all operational data (Customers, Orders, Payments). An Administrator authenticates like a Customer but is distinguished by an administrator role, and is not itself a Customer.
_Avoid_: Super user, staff account, the generic "user"

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
- A **Cart** holds each resource at most once; there are no quantities, because each resource is purchased once and then downloaded.
- A resource a **Customer** already owns (in a paid **Order**) cannot be added to the **Cart** or purchased again.
- A **Cart** leads to **Checkout**.
- **Checkout** requires a **Customer Account** before payment is completed.
- An **Authentication Page** can be reached directly or from **Checkout**.
- **Authentication Pages**, **Cart**, **Checkout**, **Customer Account**, **Order History**, and **Order Details** are **Functional Pages**.
- A **Product Detail** is a top-level route because products can be reached from Shop, Grades, and Bundles.
- **Shop**, **Grades**, and **Packages** are **Browse Pages**.
- A **Bundle** and an **Access Plan** are both **Packages**; an **Individual Resource** is not.
- The **Packages** Browse Page (route `/packages`) lists **Bundles** and **Access Plans**; tier/grade/term filters narrow the Access Plans, pre-filled from query parameters when the customer arrives from a homepage or nav plan entry.
- A **Browse Page** can link to many **Product Details**, but it does not own their routes.
- The **Product Collection** is the primary catalogue **Collection**.
- A **Bundle** is an item in the **Product Collection**.
- A **Bundle** can reference included Products while still being sold as its own Product.
- An **Access Plan** is an item in the **Product Collection**.
- **Product Kind** and **Resource Format** are separate Product **Fields**, each drawing its value from its own **Value List**.
- The **FAQ Collection** is global and can be reused across static pages, browse pages, product pages, and checkout support.
- The **Testimonial Collection** is global and can be reused across static pages, browse pages, and product pages.
- Static pages can query reusable collection content directly without page-to-content reference fields.
- Products and Subjects may reference FAQs when specific questions should appear in those contexts.
- Testimonials are standalone reusable content and do not need product, subject, or page reference fields for launch.
- **Static Pages** are not **Collections**.
- **Static Pages** remain fixed website routes; they may display content from **Collections** without becoming collections themselves.
- **Static Pages** can be documented by **Page Family** when several routes share the same structure.
- **Customers** and **Orders** may be stored in the database, but they are not **Collections**.
- An **Administrator** manages catalogue **Collections** and can view all **Customers**, **Orders**, and **Payments**; an Administrator is not a **Customer** and does not place **Orders**.
- Every **Customer** and every **Administrator** is exactly one authenticated account.
- **Value Lists** supply the allowed values for fields like Grade, Term, Product Kind, Resource Format, and Year; **Reference Fields** are for relationships between **Collections**.
- **Value Lists** are stored in the database and changed there directly; they are not managed through an admin screen, and Grades, Terms, and Product Kinds are effectively fixed for launch.
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
- **Digital Fulfillment** is automatic and immediate once a payment is confirmed; there is no separate manual fulfillment step at launch. A distinct "fulfilled" state is reserved for possible future non-instant (e.g. physical) fulfillment, but at launch a confirmed payment is what unlocks downloads.
- "Essential" and "Premium" are marketed as term and yearly **Access Plans**, but they are one-time purchases for that period, not recurring subscriptions. Automatic renewal and automatic charging are possible future concepts, out of scope for launch.
- Each **Access Plan** is a distinct product per grade. Essential is further split per term (one product per grade-and-term); Premium is one product per grade covering all terms. There is no single "Essential" or "Premium" product that spans grades, and grade is never selected during **Checkout**.
