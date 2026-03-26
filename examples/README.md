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

The setup now asks starter questions for:

- socket scaffolding
- F1 database scaffolding
- auth-ready middleware
- request security helpers
- AI skills and config
- optional `/about` route generation

Based on those answers, the scaffold also adds matching example code:

- sockets -> `/live` websocket counter example
- F1 database -> `/requests` shared data example
- auth-ready middleware -> `/auth` auth starter example
- about route -> `/about` explanatory page

The generated starter now includes a single `/` home route with:

- an olive green landing page
- a focused hero layout
- AI/fullstack starter files
- CSR rendering by default
- Tailwind utility classes for styling

The generated project also includes:

- `fiyuu.config.ts` for framework and AI setup
- `skills/` for reusable AI-oriented project skills
- `app/action.ts` and `app/query.ts` so the starter begins with fullstack structure
- `.fiyuu/SECRET` for server-only secret material
- `.fiyuu/PROJECT.md`, `.fiyuu/PATHS.md`, `.fiyuu/STATES.md`, and `.fiyuu/FEATURES.md` for AI-readable project context
- `app/middleware.ts` for request middleware chaining
- `lib/analytics.ts` and `lib/feature-flags.ts` for startup defaults
- `app/layout.tsx` and `app/layout.meta.ts` for app-level layout and metadata
- `app/api/**/route.ts` for backend API handlers
- built-in virtualization helpers for large client lists
- F1 data persists to `.fiyuu/data/f1.json` with a lightweight table API

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
