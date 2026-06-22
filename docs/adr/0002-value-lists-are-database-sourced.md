# Value lists are database-sourced, not admin-managed

Status: accepted

The allowed values for Grade, Term, Product Kind, Resource Format, and Year (collectively **Value Lists**) come from the database and are changed there directly. There is no admin screen, combobox, or create-on-the-fly flow for managing them, and the admin shows them as fixed select options. We chose this because Grades, Terms, and Product Kinds are effectively fixed (the school system, and the editor/site code that branches on Product Kind, don't change), while Year and Resource Format change rarely enough that a database edit is acceptable — none of them justify the surface area of an admin management UI.

This supersedes an earlier, mistaken direction that modelled these as "controlled fields" with an admin settings page and inline option creation. See CONTEXT.md ("Value List", "Field") for the corrected glossary.

## Consequences

- The CMS snapshot carries the value lists (named `valueLists`) sourced from the database/seed; the admin never writes to them.
- Adding a new Resource Format or Year is a database operation, not a product-editor action.
- A new Product Kind additionally requires code (the editor and site branch on the three known kinds), so it is not a pure data change.
