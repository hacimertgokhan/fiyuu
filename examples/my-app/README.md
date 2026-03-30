# Fiyuu Website (`my-app`)

This project is the official website for the Fiyuu framework.
It includes the landing page, documentation pages, changelog, and basic auth/dashboard demo routes.

## Run locally

```bash
npm install
npm run dev
```

The app runs on `http://localhost:4050` by default.

## Main routes

- `/` — product landing page
- `/docs` — documentation index with search and category filters
- `/docs/:slug` — single documentation page
- `/changelog` — release notes
- `/auth` and `/dashboard` — auth and example dashboard flows

## Documentation content source

Docs and changelog content is read from F1 JSON data in:

- `.fiyuu/data/f1.json` (runtime data)
- `lib/db.ts` (seed data used when the DB file does not exist)

When adding new docs, keep category values aligned with the existing route UI:

- `getting-started`
- `core-concepts`
- `reference`

## Notes for contributors

- Keep route contracts consistent (`schema.ts`, `query.ts`, `action.ts`, `page.tsx`, `meta.ts`) where relevant.
- Prefer updating docs through route queries and seed data together to keep fresh setups consistent.
- Validate changes with `npm run build` before release.
