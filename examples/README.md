# Examples

This directory contains runnable Fiyuu example projects and starter references.

## Create A New Project

Use the app creator to scaffold a new project:

```bash
npx create-fiyuu-app@latest my-app
cd my-app
npm install
npm run dev
```

The setup keeps the generated app focused on a single, full-screen home page.
It only asks whether to include:

- request security helpers
- AI skills and config

The generated starter includes a single `/` home route with:

- a full-screen one-page layout
- compact spacing and no shadows
- AI/fullstack starter files
- CSR rendering by default
- Gea-first UI layer with compile-time JSX

The generated project also includes:

- `fiyuu.config.ts` for framework and AI setup
- `skills/` for reusable AI-oriented project skills
- `app/action.ts` and `app/query.ts` so the starter begins with fullstack structure
- `.fiyuu/SECRET` for server-only secret material
- `.fiyuu/PROJECT.md`, `.fiyuu/PATHS.md`, `.fiyuu/STATES.md`, and `.fiyuu/FEATURES.md` for AI-readable project context
- `lib/analytics.ts` and `lib/feature-flags.ts` for startup defaults
- `app/layout.tsx` and `app/layout.meta.ts` for app-level layout and metadata
- `app/api/**/route.ts` for backend API handlers

For local development inside this repository, you can also create an app that links to the local framework package:

```bash
node packages/create-fiyuu-app/bin/create-fiyuu-app.mjs my-app --local
```

## Example Projects

### `basic-app`

The starter example used by the framework during development.

Routes:

- `/users` -> SSR example
- `/reports` -> CSR example

This example remains useful for framework development because it shows both render modes.

Run it from the repository root:

```bash
npm install
npm exec fiyuu -- dev
```

Then open `http://localhost:4050/users` or `http://localhost:4050/reports`.

## Notes

- Port `4050` is the default Fiyuu port.
- Live reload is active in `dev` mode.
- Render mode is selected per feature in `meta.ts` with `render: "ssr"` or `render: "csr"`.
