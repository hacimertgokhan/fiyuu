# Fiyuu AI Demo Walkthrough

This walkthrough shows the core AI-native flow in under 5 minutes.

## Prerequisites

- A Fiyuu app with an `app/` directory
- Dependencies installed

## 1) Generate graph and AI docs

Run:

```bash
fiyuu sync
```

Expected result:

- `.fiyuu/graph.json` is generated
- `.fiyuu/PROJECT.md` is generated
- `.fiyuu/PATHS.md` is generated
- `.fiyuu/EXECUTION.md` is generated

Optional export for external tooling:

```bash
fiyuu graph export --format markdown --out docs/graph.md
```

Why it matters:

- The same deterministic structure used at runtime is exported as AI-readable context.

## 2) Ask for route-aware context

Run:

```bash
fiyuu ai "explain dependencies for /requests"
```

Expected result:

- Route list is printed
- Intent list is printed
- Skill files (if available) are printed

Why it matters:

- You can pass this output to external copilots/LLMs without manual codebase scanning.

## 3) Validate project contracts

Run:

```bash
fiyuu doctor
```

Expected checks include:

- React import usage
- missing `execute()` in `query.ts` / `action.ts`
- SEO metadata gaps
- zero-JS rule violations (`noJs: true` + `<script>`)

Why it matters:

- AI-assisted edits can be checked against deterministic framework rules.

Optional safe fixes:

```bash
fiyuu doctor --fix
```

This applies low-risk interventions such as SEO field completion and missing fallback pages.

## 4) Suggested CI baseline

Use this order in CI:

```bash
fiyuu sync && fiyuu doctor --fix && fiyuu doctor && npm run build
```

This ensures graph artifacts, structure checks, and build health stay aligned.
