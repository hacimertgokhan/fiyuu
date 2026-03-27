# Fiyuu Docs (EN)

## What is Fiyuu?

Fiyuu is a **Gea-first fullstack framework** with a deterministic folder structure.
It is designed to be easy to read for both developers and AI tools.

## Main Idea

- Keep route logic in one place (`page`, `query`, `action`, `schema`, `meta`)
- Make behavior explicit (no hidden magic)
- Provide built-in dev visibility (Dev Console, Insights, server trace)
- Support multiple render modes (`ssr`, `csr`, `ssg`)

## Create a Project

```bash
npm create fiyuu-app@latest my-app
cd my-app
npm install
npm run dev
```

During setup, you can choose features and skills with interactive selection.

## Project Structure

Typical app layout:

```text
app/
  layout.tsx
  layout.meta.ts
  page.tsx
  query.ts
  schema.ts
  meta.ts
  not-found.tsx
  error.tsx
  api/
    .../route.ts
```

Feature route example (`/requests`):

```text
app/requests/
  page.tsx
  query.ts
  schema.ts
  meta.ts
  action.ts (optional)
```

## Key Commands

```bash
fiyuu dev
fiyuu build
fiyuu start
fiyuu sync
fiyuu doctor
fiyuu feat list
fiyuu feat socket on
fiyuu feat socket off
fiyuu ai setup
```

## Render Modes

Set mode in route `meta.ts`:

- `ssr`: server render per request
- `csr`: client render
- `ssg`: static-like cached render in start mode

## Dev Console (Development only)

In dev mode, Fiyuu shows a unified console panel with:

- Runtime info
- AI insights
- Live server trace (toggleable)

Not active in production.

## AI Inspector

Run:

```bash
fiyuu ai setup
```

This prepares local AI files in `.fiyuu/ai/`.
You can run local model mode or fallback mode.

## Theming

If theme feature is enabled, starter includes light/dark toggle with localStorage persistence.

## Config Overview

Main config file: `fiyuu.config.ts`

Common sections:

- `app`
- `ai` (including `ai.inspector`)
- `fullstack`
- `websocket`
- `middleware`
- `developerTools`
- `featureFlags`

## Troubleshooting

- Run `fiyuu doctor` for structure and compatibility checks.
- Run `fiyuu sync` after adding routes/features.
- If local package updates are not reflected: reinstall dependencies.
