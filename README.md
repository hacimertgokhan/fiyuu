# Fiyuu

Fiyuu is a **Gea-first fullstack framework** focused on clarity, deterministic structure, and AI-assisted development.

It is built for teams who want a predictable codebase that both humans and AI tools can understand quickly.

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
