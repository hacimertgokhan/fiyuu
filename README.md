# Fiyuu

Fiyuu is a **Gea-first fullstack framework** focused on clarity, deterministic structure, and AI-assisted development.

## What is Fiyuu?

Fiyuu is a fullstack TypeScript framework that replaces React with a lightweight GEA runtime. Every route is a folder with fixed files — `page.tsx`, `query.ts`, `action.ts`, `schema.ts`, `meta.ts` — so the file system itself defines behavior. The framework generates a machine-readable project graph (`.fiyuu/graph.json`) that AI tools can parse, extend, and refactor without guessing.

## Why Fiyuu?

- **No React dependency** — GEA runtime renders components server-side without React, reducing bundle size and complexity
- **AI can understand your project** — deterministic structure + project graph means AI assistants can safely generate, modify, and reason about your codebase
- **Built-in devtools** — unified console with runtime info, AI insights panel, and live server trace (dev-only)
- **`fiyuu doctor`** — checks for React imports, missing schemas, SEO gaps, and zero-JS violations
- **Skills system** — project-aware automation scripts that run with full graph context

## Performance

Fiyuu uses Node.js native HTTP server (no Express, no framework layer). Client assets are bundled with esbuild. SSG routes are cached in memory. Query results support TTL-based caching. A benchmark script is included:

```bash
npm run benchmark:gea
```

This measures per-route latency (avg, p50, p95) and bundle sizes.

## Use Cases

- **AI-assisted teams** — developers who use Copilot, Cursor, or local LLMs and want a codebase those tools can reliably operate on
- **React-free fullstack apps** — projects that need server rendering without React's runtime overhead
- **Rapid prototyping** — deterministic scaffolding with `npm create fiyuu-app` and `fiyuu generate`
- **Small-to-medium web apps** — dashboards, admin panels, content sites, internal tools

## Core Focus

- **Deterministic structure**: route folders use fixed files (`page.tsx`, `query.ts`, `action.ts`, `schema.ts`, `meta.ts`)
- **Gea-first runtime**: no React dependency in generated app routes
- **AI-ready by default**: project graph and docs are generated in `.fiyuu/`
- **Developer visibility**: unified dev console with runtime, insights, and live server trace (dev-only)
- **Render flexibility**: supports `ssr`, `csr`, and `ssg`

## Quick Start

```bash
npm create fiyuu-app@latest my-app
cd my-app
npm install
npm run dev
```

## Useful Commands

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

## Default Starter

- One-page home layout
- Optional feature selection during setup (interactive multi-select)
- Optional light/dark theme toggle with localStorage persistence
- Built-in `app/not-found.tsx` and `app/error.tsx`

## AI Inspector

Fiyuu includes a local AI inspector flow.

- Works in devtools insights panel
- Can run with a local JS LLM runner
- Falls back safely if model/runtime is unavailable

---

Fiyuu aims to keep modern fullstack apps **structured, readable, and AI-operable** without hidden magic.

Documentation:

- English: `docs/en.md`
- Turkish: `docs/tr.md`
- Skills (EN): `docs/skills.md`
- Skills (TR): `docs/skills.tr.md`
