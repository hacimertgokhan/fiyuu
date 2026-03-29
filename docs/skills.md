# Fiyuu Skills (EN)

## What is a Skill?

A skill is a project-aware TypeScript script under `skills/`.
It runs with graph context and can be used by external AI agents or developers.

## Location

Default directory:

```text
skills/
```

Example files:

- `skills/seo-baseline.ts`
- `skills/perf-route-hotspots.ts`
- `skills/contract-coverage.ts`

## Run skills

```bash
fiyuu skill list
fiyuu skill run seo-baseline
fiyuu skill run perf-route-hotspots
```

## Skill authoring guide

Keep each skill short and explicit:

- When to use it
- What output format is expected
- Which constraints/rules must be followed
- Project-specific boundaries

Example skeleton:

```ts
export const skill = {
  name: "custom-skill",
  description: "Describe what this skill does",
  tags: ["custom"],
};

export async function run(context) {
  console.log(context.graph.routes.length);
}
```

## Tips

- Prefer a small number of focused skills.
- Avoid conflicting instructions across skills.
- Update skills as architecture evolves.
