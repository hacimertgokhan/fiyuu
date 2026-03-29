import type { ProjectGraph } from "@fiyuu/core";

export const skill = {
  name: "contract-coverage",
  description: "Check missing route contract files and suggest deterministic fixes.",
  tags: ["contracts", "doctor", "stability"],
};

interface SkillContext {
  graph: ProjectGraph;
}

export async function run(context: SkillContext): Promise<void> {
  const missingByRoute = context.graph.features
    .filter((feature) => feature.missingRequiredFiles.length > 0)
    .map((feature) => ({
      route: feature.route,
      missing: feature.missingRequiredFiles,
    }));

  console.log("Contract Coverage Skill");
  console.log(`routes=${context.graph.features.length}`);
  console.log(`routes-with-missing=${missingByRoute.length}`);

  if (missingByRoute.length === 0) {
    console.log("status=healthy");
    return;
  }

  for (const item of missingByRoute.slice(0, 20)) {
    console.log(`- ${item.route}: ${item.missing.join(", ")}`);
  }
  console.log("next=Run `fiyuu doctor --fix`, then regenerate route-level files if still missing.");
}

const rawContext = process.argv[2];
if (rawContext) {
  const context = JSON.parse(rawContext) as SkillContext;
  run(context).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
