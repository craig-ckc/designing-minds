# Designing Minds Monorepo

This repository turns the extracted Designing Minds content into a Vite monorepo with:

- `apps/web`: the public website for browsing pages and products.
- `apps/admin`: a lightweight admin app for editing CMS-style content.
- `packages/cms`: the shared content schema, seed generator, and storage adapters.

## Getting Started

1. Run `npm install`.
2. Run `npm run sync-content`.
3. Run `npm run dev`.

The website defaults to seed content. The admin app defaults to browser local storage so the client can test edits immediately.

## Persistence Modes

- `seed`: read-only content generated from `extracted-content/data`.
- `local`: editable content stored in the browser with `localStorage`.
- `supabase`: shared content stored in Supabase tables and storage-ready infrastructure.

Use `supabase/schema.sql` to create the starter database tables if you want both apps to share a live content source.
