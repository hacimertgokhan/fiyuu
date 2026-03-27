import { existsSync, promises as fs } from "node:fs";
import path from "node:path";
import { createProjectGraph, type ProjectGraph } from "./scanner.js";

export async function syncProjectArtifacts(rootDirectory: string, appDirectory: string): Promise<ProjectGraph> {
  const graph = await createProjectGraph(appDirectory);
  const outputDirectory = path.join(rootDirectory, ".fiyuu");

  await fs.mkdir(outputDirectory, { recursive: true });
  await fs.writeFile(path.join(outputDirectory, "graph.json"), `${JSON.stringify(graph, null, 2)}\n`);

  const skills = await loadSkillSummaries(rootDirectory);
  const docs = createAiDocs(graph, rootDirectory, skills);

  await Promise.all([
    fs.writeFile(path.join(outputDirectory, "PROJECT.md"), docs.project),
    fs.writeFile(path.join(outputDirectory, "PATHS.md"), docs.paths),
    fs.writeFile(path.join(outputDirectory, "STATES.md"), docs.states),
    fs.writeFile(path.join(outputDirectory, "FEATURES.md"), docs.features),
    fs.writeFile(path.join(outputDirectory, "WARNINGS.md"), docs.warnings),
    fs.writeFile(path.join(outputDirectory, "SKILLS.md"), docs.skills),
    fs.writeFile(path.join(outputDirectory, "EXECUTION.md"), docs.execution),
  ]);

  return graph;
}

interface SkillSummary {
  name: string;
  description: string;
  tags: string[];
  filePath: string;
}

async function loadSkillSummaries(rootDirectory: string): Promise<SkillSummary[]> {
  const skillsDir = path.join(rootDirectory, "skills");
  if (!existsSync(skillsDir)) return [];

  const entries = await fs.readdir(skillsDir, { withFileTypes: true });
  const skillFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".ts"));

  return Promise.all(
    skillFiles.map(async (entry) => {
      const filePath = path.join(skillsDir, entry.name);
      const source = await fs.readFile(filePath, "utf8");

      const nameMatch = source.match(/name\s*:\s*["'`]([^"'`]+)["'`]/);
      const descMatch = source.match(/description\s*:\s*["'`]([^"'`]+)["'`]/);
      const tagsMatch = source.match(/tags\s*:\s*\[([^\]]*)\]/);
      const tags = tagsMatch
        ? tagsMatch[1].match(/["'`]([^"'`]+)["'`]/g)?.map((t) => t.replace(/["'`]/g, "")) ?? []
        : [];

      return {
        name: nameMatch?.[1] ?? entry.name.replace(/\.ts$/, ""),
        description: descMatch?.[1] ?? "no description",
        tags,
        filePath: `skills/${entry.name}`,
      };
    }),
  );
}

export function createAiDocs(
  graph: ProjectGraph,
  rootDirectory: string,
  skills: SkillSummary[] = [],
): { project: string; paths: string; states: string; features: string; warnings: string; skills: string; execution: string } {
  const project = `# Fiyuu Project Context

This file is auto-generated for AI systems reading the project.
Do not edit manually — run \`fiyuu sync\` to regenerate.

## Summary

- root: ${rootDirectory}
- routes: ${graph.routes.length}
- features: ${graph.features.length}
- actions: ${graph.actions.length}
- queries: ${graph.queries.length}
- skills: ${skills.length}

## Architecture

Fiyuu is a file-based fullstack framework built on GEA (@geajs/core).
Each route is a feature directory under \`app/\` with these fixed files:
- \`meta.ts\` — intent, title, render mode, SEO (required)
- \`schema.ts\` — Zod input/output contracts (required)
- \`page.tsx\` — GEA component for UI (optional)
- \`query.ts\` — data fetching with \`execute()\` (optional)
- \`action.ts\` — server mutations with \`execute()\` (optional)
- \`layout.tsx\` — route-scoped layout wrapper (optional)
- \`middleware.ts\` — request middleware (optional)
- \`route.ts\` — raw API route (optional, for \`/api/*\`)

## Route Overview

${graph.features
  .map(
    (feature) =>
      `- route: ${feature.route}\n  intent: ${feature.intent ?? "missing"}\n  render: ${feature.render}\n  missing: ${feature.missingRequiredFiles.join(", ") || "none"}`,
  )
  .join("\n")}
`;

  const paths = `# Fiyuu Paths

Maps route folders to their fixed files.
Auto-generated — run \`fiyuu sync\` to update.

${graph.features
  .map((feature) => {
    const entries = Object.entries(feature.files)
      .filter(([, value]) => Boolean(value))
      .map(([name, value]) => `  - ${name}: ${value}`)
      .join("\n");
    return `## ${feature.route}\n- directory: ${feature.directory}\n${entries}`;
  })
  .join("\n\n")}
`;

  const states = `# Fiyuu States

Current structural state snapshot for AI review.
Auto-generated — run \`fiyuu sync\` to update.

## Render Modes

${graph.features.map((feature) => `- ${feature.route}: ${feature.render}`).join("\n")}

## Intent State

${graph.features.map((feature) => `- ${feature.route}: ${feature.intent ?? "MISSING"}`).join("\n")}

## Schema Descriptions

${graph.features.map((feature) => `- ${feature.route}: ${feature.descriptions.join(" | ") || "MISSING"}`).join("\n")}
`;

  const warnings = `# Fiyuu Warnings

Auto-generated — run \`fiyuu sync\` to update.

${
  graph.features.some((feature) => feature.warnings.length > 0)
    ? graph.features
        .filter((feature) => feature.warnings.length > 0)
        .map((feature) => `## ${feature.route}\n${feature.warnings.map((w) => `- ${w}`).join("\n")}`)
        .join("\n\n")
    : "No structural warnings detected.\n"
}`;

  const features = `# Fiyuu Features

## Runtime Capabilities

- route count: ${graph.routes.length}
- action count: ${graph.actions.length}
- query count: ${graph.queries.length}

## Per-Route Capabilities

${graph.features
  .map(
    (feature) =>
      `- ${feature.route}:\n  render=${feature.render}, page=${Boolean(feature.files["page.tsx"])}, action=${Boolean(feature.files["action.ts"])}, query=${Boolean(feature.files["query.ts"])}`,
  )
  .join("\n")}
`;

  const skillsDoc =
    skills.length === 0
      ? `# Fiyuu Skills

No skills found. Create one with \`fiyuu skill new <name>\`.

Skills are project-aware scripts in the \`skills/\` directory.
AI assistants can read and run them for automated project tasks.
`
      : `# Fiyuu Skills

Skills are project-aware scripts AI assistants can read and execute.
Run a skill: \`fiyuu skill run <name>\`

## Available Skills

${skills
  .map(
    (skill) =>
      `### ${skill.name}\n- file: ${skill.filePath}\n- description: ${skill.description}\n- tags: ${skill.tags.join(", ") || "none"}`,
  )
  .join("\n\n")}
`;

  const execution = buildExecutionDoc(graph);

  return {
    project: `${project.trim()}\n`,
    paths: `${paths.trim()}\n`,
    states: `${states.trim()}\n`,
    features: `${features.trim()}\n`,
    warnings: `${warnings.trim()}\n`,
    skills: skillsDoc,
    execution,
  };
}

function buildExecutionDoc(graph: ProjectGraph): string {
  const header = `# Fiyuu Execution Graph

Shows the server-side execution chain for every route.
Auto-generated — run \`fiyuu sync\` to update.

Each request follows this deterministic order:
  1. Middleware (if middleware.ts exists)
  2. Query     (if query.ts exists) → fetches data, optional cache
  3. Layout    (if layout.tsx exists) → wraps page content
  4. Page      (page.tsx) → renders HTML
  5. Document  → injects meta, client runtime, scripts
  6. Response  → sent to browser

`;

  const routeSections = graph.features
    .map((feature) => {
      const steps: string[] = [];
      const hasMiddleware = Boolean((feature.files as Record<string, string | undefined>)["middleware.ts"]);
      const hasQuery = Boolean(feature.files["query.ts"]);
      const hasLayout = Boolean((feature.files as Record<string, string | undefined>)["layout.tsx"]);
      const hasPage = Boolean(feature.files["page.tsx"]);

      if (hasMiddleware) steps.push(`  → middleware.ts        intercept / auth / headers`);
      if (hasQuery) steps.push(`  → query.ts::execute()  fetch data → injected as page props`);
      if (hasLayout) steps.push(`  → layout.tsx::template() wrap content`);
      if (hasPage) steps.push(`  → page.tsx::Page()     render HTML  [${feature.render.toUpperCase()}]`);
      steps.push(`  → renderDocument()     inject meta, runtime, scripts`);
      steps.push(`  → HTTP 200 text/html`);

      const flags: string[] = [];
      if (feature.render === "ssg") flags.push("cached after first render");
      if (feature.render === "csr") flags.push("body empty — client bundle renders");

      return [
        `## ${feature.route}`,
        `- render: ${feature.render}`,
        `- intent: ${feature.intent ?? "missing"}`,
        flags.length > 0 ? `- notes: ${flags.join(", ")}` : null,
        ``,
        `\`\`\``,
        `Request GET ${feature.route}`,
        ...steps,
        `\`\`\``,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");

  return `${header}${routeSections}\n`;
}
