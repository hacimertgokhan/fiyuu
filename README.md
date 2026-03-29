# Fiyuu

Fiyuu is an **AI-native fullstack framework** built on GEA.
It makes app structure deterministic and exports machine-readable artifacts so both developers and AI tools can work with the same reliable context.

## What problem does Fiyuu solve?

Routing and rendering are already solved by strong frameworks.
Fiyuu focuses on a different bottleneck: **AI and humans often misread intent in large, fast-changing codebases**.

Fiyuu enforces fixed route contracts (`page.tsx`, `query.ts`, `action.ts`, `schema.ts`, `meta.ts`) and generates `.fiyuu/graph.json` plus AI docs (`PROJECT.md`, `PATHS.md`, `EXECUTION.md`, and more). This reduces guesswork in generation, refactors, and review flows.

## Why Fiyuu?

- **AI-native project context** — `fiyuu sync` exports graph + AI docs from real app structure
- **Deterministic fullstack contracts** — fixed file conventions reduce hidden behavior and drift
- **GEA-first runtime** — app route code stays React-free at the framework layer
- **Built-in diagnostics** — `fiyuu doctor` validates structure and common anti-patterns
- **AI assistant bridge** — `fiyuu ai "<prompt>"` prints route-aware context for external LLM workflows

## Measurable differentiation

Fiyuu tracks performance and DX scorecards by release.

| Metric | How to measure | Current (v0.1.x) | Target (v0.2) |
| --- | --- | --- | --- |
| Cold build time | `time npm run build` | Baseline pending | >= 20% better on reference app profile |
| SSR latency (avg/p95) | `npm run benchmark:gea` | Baseline pending | >= 15% lower p95 on reference profile |
| Client JS bundle size | `npm run benchmark:gea` (bundle output) | Baseline pending | >= 20% smaller on reference profile |
| AI context readiness time | `time fiyuu sync` | Baseline pending | <= 1s for 100-route reference app |

Until public scorecards are published, treat Fiyuu as an early-stage framework.

## Performance and benchmark tooling

Fiyuu uses Node.js native HTTP server (no Express). Client assets are bundled with esbuild. SSG routes are cached in memory with optional `meta.revalidate` (ISR-style TTL). Query results support TTL caching with in-flight de-duplication. Navigation responses and HTML support ETag/304, and client navigation prefetches links on hover/focus/viewport.

For app-layer UI performance, `fiyuu/client` also provides `optimizedImage`, `optimizedVideo`, and responsive helpers (`responsiveStyle`, `mediaUp`, `fluid`, etc.) so teams can ship faster pages without adding heavy UI runtime dependencies.

Run benchmark:

```bash
npm run benchmark:gea
npm run benchmark:scorecard
```

This reports per-route latency (`avg`, `p50`, `p95`, `min`, `max`) and total client bundle size.
The scorecard command also records build/sync/doctor outputs into `docs/benchmarks/latest-scorecard.md`.

## Current scope (v2 direction)

- Primary: **AI-first routing framework** with deterministic contracts
- Shipping priority: graph tooling, diagnostics, and SSR + cache primitives
- Secondary: broader adapters, plugin ecosystem depth, CSR/SSG parity

## Competitive snapshot

Fiyuu is not positioned as a full replacement for Next.js, Nuxt, or Astro today.
It is positioned as an AI-native framework workflow where deterministic graph context is a first-class feature.

- Ecosystem breadth: behind mature frameworks (current reality)
- AI-readable architecture context: core investment area
- Public benchmark scorecards: in progress (`docs/benchmark-matrix.md`)

## Use cases

- **AI-assisted teams** using Copilot, Cursor, or local LLM pipelines
- **React-free app layer** teams that prefer explicit route contracts
- **Internal tools and dashboards** where deterministic structure matters more than maximal abstraction

## Quick Start

```bash
npm create fiyuu-app@latest my-app
cd my-app
npm install
npm run dev
```

## Useful commands

```bash
fiyuu dev
fiyuu build
fiyuu start
fiyuu sync
fiyuu doctor
fiyuu doctor --fix
fiyuu graph stats
fiyuu graph export --format markdown --out docs/graph.md
fiyuu ai "explain route dependencies for /requests"
fiyuu skill list
fiyuu skill run seo-baseline
fiyuu feat list
fiyuu feat socket on
fiyuu feat socket off
```

## Default starter

- One-page home layout
- Optional feature selection during setup (interactive multi-select)
- Optional light/dark theme toggle with localStorage persistence
- Built-in `app/not-found.tsx` and `app/error.tsx`

## Documentation

- English: `docs/en.md`
- Turkish: `docs/tr.md`
- Skills (EN): `docs/skills.md`
- Skills (TR): `docs/skills.tr.md`
- v2 Product Spec (TR): `docs/v2-product-spec.tr.md`
- Benchmark Matrix: `docs/benchmark-matrix.md`
- Benchmarks Folder: `docs/benchmarks/README.md`
- AI Demo Walkthrough: `docs/ai-demo.md`
- AI-for-Framework Guide: `docs/ai-for-framework.md`
