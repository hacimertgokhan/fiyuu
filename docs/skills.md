# Fiyuu Skills (EN)

## What is a Skill?

A skill is a focused instruction document used by Fiyuu AI flows.
It helps AI produce more consistent, project-specific output.

## Location

Default directory:

```text
skills/
```

Example files:

- `skills/product-strategist.md`
- `skills/support-triage.md`
- `skills/seo-optimizer.md`

## Skill selection in project setup

During `create-fiyuu-app`, skills are selected interactively (arrow keys + space + enter).

## Config in fiyuu.config.ts

```ts
export default {
  ai: {
    enabled: true,
    skillsDirectory: "./skills",
    defaultSkills: ["product-strategist", "seo-optimizer"],
  },
} as const;
```

## Skill authoring guide

Keep each skill short and explicit:

- When to use it
- What output format is expected
- Which constraints/rules must be followed
- Project-specific boundaries

Example skeleton:

```md
# SEO Optimizer

## Usage
- Improve route metadata

## Rules
- require seo.title
- suggest seo.description

## Output
- short actionable bullets
```

## Tips

- Prefer a small number of focused skills.
- Avoid conflicting instructions across skills.
- Update skills as architecture evolves.
