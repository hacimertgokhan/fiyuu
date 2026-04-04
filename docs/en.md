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
fiyuu doctor --fix
fiyuu graph stats
fiyuu graph export --format markdown --out docs/graph.md
fiyuu feat list
fiyuu feat socket on
fiyuu feat socket off
fiyuu skill list
fiyuu skill run seo-baseline
```

## Render Modes

Set mode in route `meta.ts`:

- `ssr`: server render per request
- `csr`: client render
- `ssg`: static-like cached render in start mode

## Media and Responsive Helpers

`fiyuu/client` now includes lightweight helpers for performance-focused UI blocks:

- `optimizedImage(...)` for lazy loading, decoding hints, fetch priority, and optional `<picture>` sources
- `optimizedVideo(...)` for preload defaults, source lists, and better playback attributes
- `responsiveStyle(...)`, `mediaUp(...)`, `mediaDown(...)`, `mediaBetween(...)`, `fluid(...)`, `responsiveSizes(...)`

These helpers are string-based and keep the runtime small while still giving Next.js-like ergonomics.

## Dev Console (Development only)

In dev mode, Fiyuu shows a unified console panel with:

- Runtime info
- AI insights
- Live server trace (toggleable)

Not active in production.

## AI-for-Framework Model

Fiyuu does not run an integrated LLM inside runtime.

- AI-facing docs are generated into `.fiyuu/` by `fiyuu sync`
- deterministic suggestions are shown in Insights
- automatic safe interventions are available via `fiyuu doctor --fix`

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
- `deploy` (SSH + PM2 settings for `fiyuu deploy`)
- `cloud` (control-plane endpoint/default project for `fiyuu cloud`)

## Troubleshooting

- Run `fiyuu doctor` for structure and compatibility checks.
- Run `fiyuu doctor --fix` for safe deterministic fixes.
- Run `fiyuu sync` after adding routes/features.
- If local package updates are not reflected: reinstall dependencies.

`fiyuu doctor` also warns about raw `<img>` and `<video>` usage in `page.tsx` and suggests optimized helpers.

## Strategy and Benchmarks

- Product direction (TR): `docs/v2-product-spec.tr.md`
- Benchmark methodology: `docs/benchmark-matrix.md`
- Benchmark logs and release scorecards: `docs/benchmarks/README.md`
- AI workflow walkthrough: `docs/ai-demo.md`
- AI-for-framework guide: `docs/ai-for-framework.md`
- Skill reference: `docs/skills.md`
