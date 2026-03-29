import path from "node:path";
import { createProjectGraph } from "@fiyuu/core";
import { c, existsSync, log } from "../shared.js";
import { listSkillFiles } from "./skill.js";

export async function runAi(rootDirectory: string, appDirectory: string, prompt: string): Promise<void> {
  const graph = await createProjectGraph(appDirectory);
  const graphPath = path.join(rootDirectory, ".fiyuu", "graph.json");
  const skillsDir = path.join(rootDirectory, "skills");
  const skills = existsSync(skillsDir) ? await listSkillFiles(skillsDir) : [];

  console.log(`\n${c.bold}${c.cyan}Fiyuu AI Context${c.reset}`);
  log("prompt", prompt);
  log("graph", graphPath);
  log("routes", graph.routes.map((route) => route.path).join(", ") || "none");

  console.log(`\n${c.dim}Intents:${c.reset}`);
  for (const feature of graph.features) {
    const intent = feature.intent ?? "no intent defined";
    console.log(`  ${c.cyan}${feature.route}${c.reset}  ${c.gray}${intent}${c.reset}`);
  }

  if (skills.length > 0) {
    console.log(`\n${c.dim}Skills:${c.reset}`);
    for (const skill of skills) {
      console.log(`  ${c.blue}${skill}${c.reset}`);
    }
  }
}
