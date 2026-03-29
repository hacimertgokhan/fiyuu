import path from "node:path";
import { syncProjectArtifacts } from "@fiyuu/core";
import { c, log, warn } from "../shared.js";

export async function sync(rootDirectory: string, appDirectory: string): Promise<void> {
  const graph = await syncProjectArtifacts(rootDirectory, appDirectory);
  const outputPath = path.join(rootDirectory, ".fiyuu", "graph.json");

  log("graph", `synced → ${outputPath}`);
  log("routes", String(graph.routes.length));
  log("features", String(graph.features.length));
  log("ai docs", "PROJECT.md, PATHS.md, STATES.md, FEATURES.md, WARNINGS.md, SKILLS.md, EXECUTION.md, INTERVENTIONS.md, DOCTOR.md");

  if (graph.features.some((feature) => feature.warnings.length > 0)) {
    warn("some features are incomplete — run `fiyuu doctor`");
  }
}
