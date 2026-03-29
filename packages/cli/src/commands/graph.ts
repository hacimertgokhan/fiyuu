import path from "node:path";
import { createProjectGraph, type ProjectGraph } from "@fiyuu/core";
import { c, fs, log } from "../shared.js";

export async function handleGraphCommand(rootDirectory: string, appDirectory: string, args: string[]): Promise<void> {
  const [subcommand, ...optionArgs] = args;

  if (!subcommand || subcommand === "stats") {
    await runGraphStats(appDirectory);
    return;
  }

  if (subcommand === "export") {
    await runGraphExport(rootDirectory, appDirectory, optionArgs);
    return;
  }

  throw new Error("Unknown graph subcommand. Use `fiyuu graph stats` or `fiyuu graph export`.");
}

async function runGraphStats(appDirectory: string): Promise<void> {
  const graph = await createProjectGraph(appDirectory);
  const warningCount = graph.features.reduce((sum, feature) => sum + feature.warnings.length, 0);
  const dynamicRouteCount = graph.features.filter((feature) => feature.isDynamic).length;

  console.log(`\n${c.bold}${c.cyan}Fiyuu Graph Stats${c.reset}`);
  log("app", appDirectory);
  log("routes", String(graph.routes.length));
  log("features", String(graph.features.length));
  log("actions", String(graph.actions.length));
  log("queries", String(graph.queries.length));
  log("dynamic routes", String(dynamicRouteCount));
  log("warnings", String(warningCount), warningCount > 0 ? c.yellow : c.green);
}

async function runGraphExport(rootDirectory: string, appDirectory: string, args: string[]): Promise<void> {
  const options = parseGraphExportOptions(args);
  const graph = await createProjectGraph(appDirectory);

  const defaultOutputPath = path.join(rootDirectory, ".fiyuu", options.format === "json" ? "graph-export.json" : "graph-export.md");
  const outputPath = path.resolve(rootDirectory, options.out ?? defaultOutputPath);
  const content = options.format === "json" ? `${JSON.stringify(graph, null, 2)}\n` : renderGraphMarkdown(graph);

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, content);

  console.log(`\n${c.bold}${c.cyan}Fiyuu Graph Export${c.reset}`);
  log("format", options.format);
  log("output", outputPath);
  log("routes", String(graph.routes.length));
  log("features", String(graph.features.length));
}

function parseGraphExportOptions(args: string[]): { format: "json" | "markdown"; out?: string } {
  let format: "json" | "markdown" = "json";
  let out: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const current = args[index];
    if (current === "--format") {
      const value = args[index + 1];
      if (value !== "json" && value !== "markdown" && value !== "md") {
        throw new Error("`--format` expects `json`, `markdown`, or `md`.");
      }
      format = value === "md" ? "markdown" : value;
      index += 1;
      continue;
    }

    if (current === "--out") {
      out = args[index + 1];
      if (!out) throw new Error("`--out` expects a file path.");
      index += 1;
      continue;
    }

    throw new Error(`Unknown option for graph export: ${current}`);
  }

  return { format, out };
}

function renderGraphMarkdown(graph: ProjectGraph): string {
  const warningCount = graph.features.reduce((sum, feature) => sum + feature.warnings.length, 0);

  const routeSections = graph.features
    .map((feature) => {
      const files = Object.entries(feature.files)
        .filter(([, value]) => Boolean(value))
        .map(([name, filePath]) => `- ${name}: ${filePath}`)
        .join("\n");
      const warnings = feature.warnings.length === 0 ? "- none" : feature.warnings.map((warning) => `- ${warning}`).join("\n");

      return [
        `## ${feature.route}`,
        `- render: ${feature.render}`,
        `- dynamic: ${feature.isDynamic ? "yes" : "no"}`,
        `- params: ${feature.params.join(", ") || "none"}`,
        `- intent: ${feature.intent ?? "missing"}`,
        "",
        "Files:",
        files || "- none",
        "",
        "Warnings:",
        warnings,
      ].join("\n");
    })
    .join("\n\n");

  return `# Fiyuu Graph Export

Generated: ${new Date().toISOString()}

## Summary

- routes: ${graph.routes.length}
- features: ${graph.features.length}
- actions: ${graph.actions.length}
- queries: ${graph.queries.length}
- warnings: ${warningCount}

${routeSections}
`;
}
