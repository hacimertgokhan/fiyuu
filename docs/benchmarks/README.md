# Benchmarks Folder

This folder stores raw benchmark outputs and release scorecards.

## Goal

Keep every performance claim in Fiyuu reproducible.

## Required for each release

Add one release report file (example: `v0.1.x-baseline.md`) and include:

- machine specs (CPU, RAM, OS)
- runtime versions (`node -v`, package manager version)
- exact commands
- raw outputs
- summarized table (avg/p95 or total size)

## Minimal command set

```bash
time npm run build
npm run benchmark:gea
time npx fiyuu sync
npx fiyuu doctor
```

Or run all of them in one command:

```bash
npm run benchmark:scorecard
```

If local `fiyuu` binary is available globally, you can run `fiyuu sync` and `fiyuu doctor` directly.

## Naming convention

- `v<release>-baseline.md`
- `v<release>-comparison.md`

Examples:

- `v0.1.x-baseline.md`
- `v0.2.0-comparison.md`
