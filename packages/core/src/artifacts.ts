import { promises as fs } from "node:fs";
import path from "node:path";
import { createProjectGraph, type ProjectGraph } from "./scanner.js";

export async function syncProjectArtifacts(rootDirectory: string, appDirectory: string): Promise<ProjectGraph> {
  const graph = await createProjectGraph(appDirectory);
  const outputDirectory = path.join(rootDirectory, ".fiyuu");

  await fs.mkdir(outputDirectory, { recursive: true });
  await fs.writeFile(path.join(outputDirectory, "graph.json"), `${JSON.stringify(graph, null, 2)}\n`);

  const docs = createAiDocs(graph, rootDirectory);
  await Promise.all([
    fs.writeFile(path.join(outputDirectory, "PROJECT.md"), docs.project),
    fs.writeFile(path.join(outputDirectory, "PATHS.md"), docs.paths),
    fs.writeFile(path.join(outputDirectory, "STATES.md"), docs.states),
    fs.writeFile(path.join(outputDirectory, "FEATURES.md"), docs.features),
    fs.writeFile(path.join(outputDirectory, "WARNINGS.md"), docs.warnings),
  ]);

  return graph;
}

export function createAiDocs(graph: ProjectGraph, rootDirectory: string): { project: string; paths: string; states: string; features: string; warnings: string } {
  const project = `# Fiyuu Project Context

This file is generated for AI systems reading the project.

## Summary

- root: ${rootDirectory}
- routes: ${graph.routes.length}
- features: ${graph.features.length}
- actions: ${graph.actions.length}
- queries: ${graph.queries.length}

## Route Overview

${graph.features
    .map(
      (feature) =>
        `- route: ${feature.route}\n  - feature: ${feature.feature || "root"}\n  - intent: ${feature.intent ?? "missing"}\n  - render: ${feature.render}\n  - requiredMissing: ${feature.missingRequiredFiles.join(", ") || "none"}`,
    )
    .join("\n")}
`;

  const paths = `# Fiyuu Paths

This file maps route folders and fixed files.

${graph.features
    .map((feature) => {
      const entries = Object.entries(feature.files)
        .filter(([, value]) => Boolean(value))
        .map(([name, value]) => `- ${name}: ${value}`)
        .join("\n");
      return `## ${feature.route}\n- directory: ${feature.directory}\n${entries}`;
    })
    .join("\n\n")}
`;

  const states = `# Fiyuu States

This file captures current structural state for AI review.

## Render Modes

${graph.features.map((feature) => `- ${feature.route}: ${feature.render}`).join("\n")}

## Intent State

${graph.features.map((feature) => `- ${feature.route}: ${feature.intent ?? "missing"}`).join("\n")}

## Schema Descriptions

${graph.features.map((feature) => `- ${feature.route}: ${feature.descriptions.join(" | ") || "missing"}`).join("\n")}
`;

  const warnings = `# Fiyuu Warnings

${graph.features.some((feature) => feature.warnings.length > 0) ? graph.features.map((feature) => `## ${feature.route}\n${feature.warnings.map((warning) => `- ${warning}`).join("\n") || "- none"}`).join("\n\n") : "No structural warnings detected.\n"}`;

  const features = `# Fiyuu Features

## Runtime

- route count: ${graph.routes.length}
- action count: ${graph.actions.length}
- query count: ${graph.queries.length}

## Route Capabilities

${graph.features.map((feature) => `- ${feature.route}: render=${feature.render}, page=${Boolean(feature.files["page.tsx"])}, action=${Boolean(feature.files["action.ts"])}, query=${Boolean(feature.files["query.ts"])}`).join("\n")}
`;

  return {
    project: `${project.trim()}\n`,
    paths: `${paths.trim()}\n`,
    states: `${states.trim()}\n`,
    features: `${features.trim()}\n`,
    warnings: `${warnings.trim()}\n`,
  };
}
