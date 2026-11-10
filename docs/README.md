# Designing Minds Docs

Active documentation is intentionally small. Keep new information in one of these files unless it is a temporary implementation plan.

| File | Purpose |
| --- | --- |
| [../README.md](../README.md) | Repo setup, local development, and quality gates (`npm run check`, CI). |
| [../CONTEXT.md](../CONTEXT.md) | Domain language and business rules. |
| [site-and-content-model.md](./site-and-content-model.md) | Launch routes, indexing, CMS collections, value lists, and page data rules. |
| [operations.md](./operations.md) | Backend status, environment setup, deployment, publish flow, and launch checklist. |
| [decisions.md](./decisions.md) | Accepted architecture and product decisions that still constrain the codebase. |
| [promotions.md](./promotions.md) | Sale prices, discount codes, and scheduled rebuilds. |
| [physical-commerce.md](./physical-commerce.md) | Physical products, stock/payment lifecycle and isolated local sample-data preview. |
| [diagnostics.md](./diagnostics.md) | Diagnostics ingestion and checkout troubleshooting. |

## Documentation Rules

- Update active docs when the implementation changes.
- Do not keep old design specs as active documentation after the feature ships.
- Do not duplicate route, content-model, or launch information across multiple files.
- Generated client PDFs and exploratory planning docs should be recreated only when needed for a specific handoff.
