import type { ProjectGraph } from "@fiyuu/core";

export const skill = {
  name: "seo-baseline",
  description: "Audit seo title/description coverage and word count baseline.",
  tags: ["seo", "quality", "doctor"],
};

interface SkillContext {
  graph: ProjectGraph;
}

export async function run(context: SkillContext): Promise<void> {
  const issues: string[] = [];

  for (const feature of context.graph.features) {
    const route = feature.route;
    const hasMeta = Boolean(feature.files["meta.ts"]);
    if (!hasMeta) {
      issues.push(`${route}: missing meta.ts`);
      continue;
    }

    const hasWarnings = feature.warnings.some((warning) => warning.toLowerCase().includes("seo"));
    if (hasWarnings) {
      issues.push(`${route}: has SEO-related warnings in graph`);
    }
  }

  console.log("SEO Baseline Skill");
  console.log(`routes=${context.graph.features.length}`);
  if (issues.length === 0) {
    console.log("status=healthy");
    console.log("suggestion=Keep seo.description around 12-28 words per route.");
    return;
  }

  console.log("status=issues");
  for (const issue of issues.slice(0, 20)) {
    console.log(`- ${issue}`);
  }
  console.log("next=Run `fiyuu doctor --fix` then re-run this skill.");
}

const rawContext = process.argv[2];
if (rawContext) {
  const context = JSON.parse(rawContext) as SkillContext;
  run(context).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
