import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createProjectGraph } from "@fiyuu/core";
import { c, existsSync, fs, log, warn, ensureValue } from "../shared.js";

const execFileAsync = promisify(execFile);

export async function handleSkillCommand(rootDirectory: string, appDirectory: string, args: string[]): Promise<void> {
  const [subcommand, skillName] = args;

  if (!subcommand || subcommand === "list") {
    await listSkills(rootDirectory);
    return;
  }

  if (subcommand === "run") {
    ensureValue(skillName, "Skill name required: `fiyuu skill run <name>`.");
    await runSkill(rootDirectory, appDirectory, skillName);
    return;
  }

  if (subcommand === "new") {
    ensureValue(skillName, "Skill name required: `fiyuu skill new <name>`.");
    await createSkill(rootDirectory, skillName);
    return;
  }

  throw new Error(`Unknown skill subcommand: ${subcommand}. Use list, run, or new.`);
}

async function listSkills(rootDirectory: string): Promise<void> {
  const skillsDir = path.join(rootDirectory, "skills");

  console.log(`\n${c.bold}${c.cyan}Fiyuu Skills${c.reset}`);

  if (!existsSync(skillsDir)) {
    log("info", `No skills directory. Create one: ${c.cyan}fiyuu skill new <name>${c.reset}`);
    return;
  }

  const skills = await listSkillFiles(skillsDir);
  if (skills.length === 0) {
    log("info", "No skills found.");
    return;
  }

  for (const skill of skills) {
    const skillPath = path.join(skillsDir, skill);
    const source = await fs.readFile(skillPath, "utf8");
    const descMatch = source.match(/description\s*:\s*["'`]([^"'`]+)["'`]/);
    const description = descMatch?.[1] ?? "no description";
    console.log(`  ${c.blue}${skill.replace(/\.ts$/, "")}${c.reset}  ${c.gray}${description}${c.reset}`);
  }
}

async function runSkill(rootDirectory: string, appDirectory: string, skillName: string): Promise<void> {
  const skillsDir = path.join(rootDirectory, "skills");
  const skillPath = path.join(skillsDir, `${skillName}.ts`);

  if (!existsSync(skillPath)) {
    throw new Error(`Skill not found: skills/${skillName}.ts`);
  }

  console.log(`\n${c.bold}${c.cyan}Fiyuu Skill: ${skillName}${c.reset}`);
  log("running", skillPath);

  const graph = await createProjectGraph(appDirectory);
  const { stdout, stderr } = await execFileAsync(
    process.execPath,
    ["--import", "tsx/esm", skillPath, JSON.stringify({ graph, rootDirectory, appDirectory })],
    { cwd: rootDirectory, timeout: 30_000, env: process.env },
  );

  if (stdout) console.log(stdout);
  if (stderr) warn(stderr);
}

async function createSkill(rootDirectory: string, skillName: string): Promise<void> {
  const skillsDir = path.join(rootDirectory, "skills");
  await fs.mkdir(skillsDir, { recursive: true });

  const skillPath = path.join(skillsDir, `${skillName}.ts`);
  if (existsSync(skillPath)) {
    throw new Error(`Skill already exists: skills/${skillName}.ts`);
  }

  const template = `import type { ProjectGraph } from "@fiyuu/core";

/**
 * Skill: ${skillName}
 *
 * Skills run inside the Fiyuu project context and have access to the
 * full project graph. AI assistants can read and execute skills to
 * perform project-aware, automated tasks.
 */
export const skill = {
  name: "${skillName}",
  description: "Describe what this skill does",
  tags: ["custom"],
};

interface SkillContext {
  graph: ProjectGraph;
  rootDirectory: string;
  appDirectory: string;
}

export async function run(context: SkillContext): Promise<void> {
  const { graph } = context;
  console.log(\`Skill: ${skillName}\`);
  console.log(\`Routes: \${graph.routes.map((r) => r.path).join(", ")}\`);

  // Add your logic here
}

// CLI entry — invoked by \`fiyuu skill run ${skillName}\`
const rawContext = process.argv[2];
if (rawContext) {
  const context = JSON.parse(rawContext) as SkillContext;
  run(context).catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  });
}
`;

  await fs.writeFile(skillPath, template);
  log("created", `skills/${skillName}.ts`, c.green);
  log("next", `run ${c.cyan}fiyuu skill run ${skillName}${c.reset}`);
}

export async function listSkillFiles(skillsDir: string): Promise<string[]> {
  const entries = await fs.readdir(skillsDir, { withFileTypes: true });
  return entries.filter((entry) => entry.isFile() && entry.name.endsWith(".ts")).map((entry) => entry.name);
}
