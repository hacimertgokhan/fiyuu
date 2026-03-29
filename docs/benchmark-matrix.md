# Fiyuu Benchmark Matrix

This document defines how Fiyuu measures progress with reproducible benchmarks.

## 1) Principles

- Always compare on the same reference app profile.
- Always report machine specs and runtime versions.
- Always publish raw output and summarized scorecard.
- Never claim wins without reproducible command logs.

## 2) Test Profiles

Use these profiles for every release:

- `P1-small`: 10 routes, 2 actions, 2 queries
- `P2-medium`: 50 routes, 10 actions, 10 queries
- `P3-large`: 100 routes, 20 actions, 20 queries

Each profile should contain similar content complexity to avoid skewed rendering costs.

## 3) Metrics and Commands

| Metric | Command | Output | Notes |
| --- | --- | --- | --- |
| Cold build time | `time npm run build` | wall-clock time | Run 5 times, report avg/p95 |
| SSR latency | `npm run benchmark:gea` | `avg`, `p50`, `p95`, `min`, `max` per route | Warmup on, measure on fixed rounds |
| Client bundle size | `npm run benchmark:gea` | total bundle KB | Keep compression setting fixed |
| AI context readiness | `time fiyuu sync` | wall-clock time | Includes graph + AI docs generation |
| Doctor pass rate | `fiyuu doctor` | error/warn count | Report zero-error target |

Automation helper:

```bash
npm run benchmark:scorecard
```

This runs build, benchmark, sync, and doctor checks, then writes a report to `docs/benchmarks/latest-scorecard.md`.

## 4) Recording Template

Fill this table per release and profile:

| Release | Profile | Build avg (s) | SSR p95 (ms) | Bundle total (KB) | Sync time (s) | Doctor errors |
| --- | --- | --- | --- | --- | --- | --- |
| v0.1.x | P1-small | TBD | TBD | TBD | TBD | TBD |
| v0.1.x | P2-medium | TBD | TBD | TBD | TBD | TBD |
| v0.1.x | P3-large | TBD | TBD | TBD | TBD | TBD |

## 5) Competitive Matrix (Optional but recommended)

Compare Fiyuu with baseline setups in Next.js, Nuxt, and Astro using equivalent routes and data behavior.

| Framework | Profile | Build avg (s) | SSR p95 (ms) | Bundle total (KB) | Notes |
| --- | --- | --- | --- | --- | --- |
| Fiyuu | P2-medium | TBD | TBD | TBD | reference |
| Next.js | P2-medium | TBD | TBD | TBD | baseline |
| Nuxt | P2-medium | TBD | TBD | TBD | baseline |
| Astro | P2-medium | TBD | TBD | TBD | baseline |

## 6) Release Gate (Suggested)

Before announcing performance claims:

- All `TBD` values replaced with measured numbers.
- Raw benchmark logs committed in `docs/benchmarks/`.
- Measurements repeated on at least two clean runs.
- README claims updated only from recorded numbers.
