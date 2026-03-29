import type { ProjectGraph } from "@fiyuu/core";

export const skill = {
  name: "perf-route-hotspots",
  description: "List performance hotspots from route structure and render mode mix.",
  tags: ["performance", "routing", "architecture"],
};

interface SkillContext {
  graph: ProjectGraph;
}

export async function run(context: SkillContext): Promise<void> {
  const csrRoutes = context.graph.features.filter((feature) => feature.render === "csr");
  const dynamicRoutes = context.graph.features.filter((feature) => feature.isDynamic);
  const heavyWarnings = context.graph.features.flatMap((feature) =>
    feature.warnings.map((warning) => `${feature.route}: ${warning}`),
  );

  console.log("Performance Route Hotspots");
  console.log(`total-routes=${context.graph.features.length}`);
  console.log(`csr-routes=${csrRoutes.length}`);
  console.log(`dynamic-routes=${dynamicRoutes.length}`);

  if (csrRoutes.length > 0) {
    console.log("csr-list=");
    for (const feature of csrRoutes.slice(0, 15)) {
      console.log(`- ${feature.route}`);
    }
    console.log("suggestion=Prefer SSR for content-heavy routes where possible.");
  }

  if (heavyWarnings.length > 0) {
    console.log("warnings=");
    for (const warning of heavyWarnings.slice(0, 20)) {
      console.log(`- ${warning}`);
    }
  }
}

const rawContext = process.argv[2];
if (rawContext) {
  const context = JSON.parse(rawContext) as SkillContext;
  run(context).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
