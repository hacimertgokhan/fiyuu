#!/usr/bin/env node

import { existsSync, promises as fs } from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createInterface } from "node:readline/promises";
import {
  createProjectGraph,
  generateActionFeature,
  generatePageFeature,
  loadFiyuuConfig,
  scanApp,
  syncProjectArtifacts,
  type FiyuuConfig,
} from "@fiyuu/core";
import { bundleClient, startServer } from "@fiyuu/runtime";

const execFileAsync = promisify(execFile);
const DEFAULT_PORT = 4050;
const SOURCE_FILE_PATTERN = /\.(ts|tsx|js|jsx)$/;

// ─── Colour helpers (no external dep) ────────────────────────────────────────

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  gray: "\x1b[90m",
};

function log(label: string, message: string, colour = c.green): void {
  console.log(`${colour}${c.bold}${label}${c.reset}${c.gray} →${c.reset} ${message}`);
}

function warn(message: string): void {
  console.warn(`${c.yellow}${c.bold}warn${c.reset} ${message}`);
}

function fiyuuError(message: string): void {
  console.error(`${c.red}${c.bold}error${c.reset} ${message}`);
}

// ─── Entry ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const [, , command, ...args] = process.argv;
  const rootDirectory = process.cwd();
  const appDirectory = resolveAppDirectory(rootDirectory);
  const loaded = await loadFiyuuConfig(rootDirectory, command === "start" ? "start" : "dev");
  const config = loaded.config;
  const configuredPort = config.app?.port ?? DEFAULT_PORT;

  switch (command ?? "") {
    case "dev":
      await maybePromptAiSetup(rootDirectory, config);
      await sync(rootDirectory, appDirectory);
      await startServer({
        mode: "dev",
        rootDirectory,
        appDirectory,
        config,
        port: configuredPort,
        maxPort: configuredPort + 10,
        clientOutputDirectory: path.join(rootDirectory, ".fiyuu", "dev", "client"),
        staticClientRoot: path.join(rootDirectory, ".fiyuu", "dev", "client"),
      });
      return;

    case "build":
      await build(rootDirectory, appDirectory, config);
      return;

    case "start":
      await start(rootDirectory, config);
      return;

    case "sync":
      await sync(rootDirectory, appDirectory);
      return;

    case "ai":
      if (args[0] === "setup") {
        await runAiSetup(rootDirectory, true);
        return;
      }
      ensurePrompt(args, "Prompt required for `fiyuu ai <prompt>`.");
      await runAi(rootDirectory, appDirectory, args.join(" "));
      return;

    case "doctor":
      await runDoctor(rootDirectory, appDirectory);
      return;

    case "feat":
      await handleFeatureCommand(rootDirectory, appDirectory, args);
      return;

    case "skill":
      await handleSkillCommand(rootDirectory, appDirectory, args);
      return;

    default:
      if (command === "generate") {
        const [kind, featureName] = args;
        if (kind !== "page" && kind !== "action") {
          throw new Error("`generate` expects `page` or `action`.");
        }
        ensureValue(featureName, `Feature name is required for \`generate ${kind}\`.`);
        await generate(kind, appDirectory, featureName);
        return;
      }
      printHelp();
  }
}

// ─── Commands ─────────────────────────────────────────────────────────────────

async function build(rootDirectory: string, appDirectory: string, config: FiyuuConfig): Promise<void> {
  const configuredPort = config.app?.port ?? DEFAULT_PORT;

  console.log(`\n${c.bold}${c.cyan}Fiyuu Build${c.reset}`);
  log("app", appDirectory);
  log("step 1/3", "syncing project graph");
  await sync(rootDirectory, appDirectory);

  log("step 2/3", "bundling client assets");
  const features = await scanApp(appDirectory);
  await bundleClient(features, path.join(rootDirectory, ".fiyuu", "client"));

  log("step 3/3", "writing runtime manifest");
  const manifestPath = path.join(rootDirectory, ".fiyuu", "build.json");
  const manifest = {
    rootDirectory,
    appDirectory,
    clientDirectory: path.join(rootDirectory, ".fiyuu", "client"),
    port: configuredPort,
    config,
    builtAt: new Date().toISOString(),
  };

  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  log("done", `artifacts ready — run ${c.cyan}fiyuu start${c.reset} (port ${configuredPort})`);
}

async function start(rootDirectory: string, fallbackConfig: FiyuuConfig): Promise<void> {
  const manifestPath = path.join(rootDirectory, ".fiyuu", "build.json");

  if (!existsSync(manifestPath)) {
    throw new Error("Build manifest missing. Run `fiyuu build` first.");
  }

  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8")) as {
    rootDirectory: string;
    appDirectory: string;
    clientDirectory: string;
    port: number;
    config?: FiyuuConfig;
  };

  const config = manifest.config ?? fallbackConfig;

  await startServer({
    mode: "start",
    rootDirectory: manifest.rootDirectory,
    appDirectory: manifest.appDirectory,
    config,
    port: manifest.port,
    maxPort: manifest.port + 10,
    clientOutputDirectory: manifest.clientDirectory,
    staticClientRoot: manifest.clientDirectory,
  });
}

async function sync(rootDirectory: string, appDirectory: string): Promise<void> {
  const graph = await syncProjectArtifacts(rootDirectory, appDirectory);
  const outputPath = path.join(rootDirectory, ".fiyuu", "graph.json");

  log("graph", `synced → ${outputPath}`);
  log("routes", String(graph.routes.length));
  log("features", String(graph.features.length));
  log("ai docs", "PROJECT.md, PATHS.md, STATES.md, FEATURES.md, WARNINGS.md, SKILLS.md, EXECUTION.md");

  if (graph.features.some((feature) => feature.warnings.length > 0)) {
    warn("some features are incomplete — run `fiyuu doctor`");
  }
}

async function generate(kind: "page" | "action", appDirectory: string, featureName: string): Promise<void> {
  const createdFiles =
    kind === "page"
      ? await generatePageFeature(appDirectory, featureName)
      : await generateActionFeature(appDirectory, featureName);

  console.log(`\n${c.bold}${c.cyan}Fiyuu Generate${c.reset}`);
  log("kind", kind);
  log("feature", featureName);

  for (const filePath of createdFiles) {
    log("created", filePath, c.green);
  }
}

async function runAi(rootDirectory: string, appDirectory: string, prompt: string): Promise<void> {
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

// ─── Doctor ───────────────────────────────────────────────────────────────────

async function runDoctor(rootDirectory: string, appDirectory: string): Promise<void> {
  const files = await listSourceFiles(appDirectory);
  const diagnostics: Array<{ file: string; rule: string; detail: string; severity: "error" | "warn" }> = [];

  for (const filePath of files) {
    const source = await fs.readFile(filePath, "utf8");
    const relative = path.relative(rootDirectory, filePath);

    if (/from\s+["']react["']/.test(source) || /from\s+["']react-dom["']/.test(source)) {
      diagnostics.push({ file: relative, rule: "no-react-imports", detail: "Uses React import. Fiyuu uses GEA (@geajs/core) for components.", severity: "error" });
    }

    if (/\buse(State|Effect|Memo|Reducer|Callback|Ref)\s*\(/.test(source)) {
      diagnostics.push({ file: relative, rule: "no-react-hooks", detail: "Uses React hooks. Use GEA class templates instead.", severity: "error" });
    }

    if (/className\s*=/.test(source)) {
      diagnostics.push({ file: relative, rule: "class-attribute", detail: "Uses `className`. GEA templates use `class`.", severity: "warn" });
    }

    if (/dangerouslySetInnerHTML/.test(source)) {
      diagnostics.push({ file: relative, rule: "unsafe-html", detail: "Uses `dangerouslySetInnerHTML`. Use `html` helper + `escapeHtml` instead.", severity: "error" });
    }

    if (filePath.endsWith("action.ts") && !/export\s+async\s+function\s+execute/.test(source)) {
      diagnostics.push({ file: relative, rule: "missing-execute", detail: "action.ts is missing `export async function execute()`.", severity: "error" });
    }

    if (filePath.endsWith("query.ts") && !/export\s+async\s+function\s+execute/.test(source)) {
      diagnostics.push({ file: relative, rule: "missing-execute", detail: "query.ts is missing `export async function execute()`.", severity: "error" });
    }
  }

  const notFoundPath = path.join(appDirectory, "not-found.tsx");
  const errorPath = path.join(appDirectory, "error.tsx");
  if (!existsSync(notFoundPath)) {
    diagnostics.push({ file: path.relative(rootDirectory, notFoundPath), rule: "missing-not-found", detail: "Missing app/not-found.tsx fallback page.", severity: "warn" });
  }
  if (!existsSync(errorPath)) {
    diagnostics.push({ file: path.relative(rootDirectory, errorPath), rule: "missing-error-page", detail: "Missing app/error.tsx runtime error page.", severity: "warn" });
  }

  const features = await scanApp(appDirectory);
  for (const feature of features) {
    if (!feature.files["meta.ts"]) continue;
    const metaSource = await fs.readFile(feature.files["meta.ts"], "utf8");

    if (!/seo\s*:\s*\{[\s\S]*title\s*:/m.test(metaSource)) {
      diagnostics.push({ file: path.relative(rootDirectory, feature.files["meta.ts"]), rule: "seo-title", detail: `Route ${feature.route} is missing seo.title.`, severity: "warn" });
    }
    if (!/seo\s*:\s*\{[\s\S]*description\s*:/m.test(metaSource)) {
      diagnostics.push({ file: path.relative(rootDirectory, feature.files["meta.ts"]), rule: "seo-description", detail: `Route ${feature.route} is missing seo.description.`, severity: "warn" });
    }

    // Zero-JS validation: if noJs: true in meta, warn if page.tsx has <script> tags.
    if (/noJs\s*:\s*true/.test(metaSource) && feature.files["page.tsx"]) {
      const pageSource = await fs.readFile(feature.files["page.tsx"], "utf8");
      if (/<script[\s>]/.test(pageSource)) {
        diagnostics.push({
          file: path.relative(rootDirectory, feature.files["page.tsx"]),
          rule: "zero-js-violation",
          detail: `Route ${feature.route} declares noJs: true but page.tsx contains <script> tags.`,
          severity: "error",
        });
      }
    }
  }

  console.log(`\n${c.bold}${c.cyan}Fiyuu Doctor${c.reset}`);
  log("app", appDirectory);

  if (diagnostics.length === 0) {
    log("status", `${c.green}healthy${c.reset} — no issues detected`, c.green);
    return;
  }

  const errors = diagnostics.filter((d) => d.severity === "error");
  const warnings = diagnostics.filter((d) => d.severity === "warn");
  log("status", `${errors.length} error(s), ${warnings.length} warning(s)`, errors.length > 0 ? c.red : c.yellow);

  for (const issue of diagnostics) {
    const colour = issue.severity === "error" ? c.red : c.yellow;
    console.log(`  ${colour}${issue.severity}${c.reset}  ${c.dim}[${issue.rule}]${c.reset}  ${issue.file}`);
    console.log(`         ${c.gray}${issue.detail}${c.reset}`);
  }

  console.log(`\n  ${c.dim}Fix listed files, then rerun ${c.cyan}fiyuu doctor${c.reset}`);
}

// ─── Skills ───────────────────────────────────────────────────────────────────

async function handleSkillCommand(rootDirectory: string, appDirectory: string, args: string[]): Promise<void> {
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

async function listSkillFiles(skillsDir: string): Promise<string[]> {
  const entries = await fs.readdir(skillsDir, { withFileTypes: true });
  return entries.filter((entry) => entry.isFile() && entry.name.endsWith(".ts")).map((entry) => entry.name);
}

// ─── Feature toggles ──────────────────────────────────────────────────────────

async function handleFeatureCommand(rootDirectory: string, appDirectory: string, args: string[]): Promise<void> {
  const [name, state] = args;

  if (!name || name === "list") {
    const features = await readFeatureState(rootDirectory);
    console.log(`\n${c.bold}${c.cyan}Fiyuu Features${c.reset}`);
    log("socket", features.socket ? `${c.green}on${c.reset}` : `${c.gray}off${c.reset}`);
    return;
  }

  if (name !== "socket") {
    throw new Error("Only `socket` is currently supported. Use `fiyuu feat list`.");
  }

  if (state !== "on" && state !== "off") {
    throw new Error("Use `fiyuu feat socket on` or `fiyuu feat socket off`.");
  }

  if (state === "on") {
    await enableSocketFeature(appDirectory);
  } else {
    await disableSocketFeature(appDirectory);
  }

  await updateSocketConfigFlags(path.join(rootDirectory, "fiyuu.config.ts"), state === "on");

  const nextState = await readFeatureState(rootDirectory);
  nextState.socket = state === "on";
  await writeFeatureState(rootDirectory, nextState);
  await sync(rootDirectory, appDirectory);

  log("socket", state === "on" ? `${c.green}enabled${c.reset}` : `${c.gray}disabled${c.reset}`);
}

// ─── AI Inspector setup ───────────────────────────────────────────────────────

async function maybePromptAiSetup(rootDirectory: string, config: FiyuuConfig): Promise<void> {
  if (config.ai?.enabled === false || config.ai?.inspector?.enabled === false) return;
  if (config.ai?.inspector?.autoSetupPrompt === false) return;
  if (!process.stdin.isTTY || !process.stdout.isTTY) return;

  const markerPath = path.join(rootDirectory, ".fiyuu", "ai", "setup.json");
  if (existsSync(markerPath)) return;

  const enable = await askYesNo("\nEnable local AI inspector for insights in devtools? (Y/n) ", true);
  await runAiSetup(rootDirectory, enable);
}

async function runAiSetup(rootDirectory: string, enabled: boolean): Promise<void> {
  const aiDirectory = path.join(rootDirectory, ".fiyuu", "ai");
  const binDirectory = path.join(aiDirectory, "bin");
  const runnerPath = path.join(binDirectory, "fiyuu-llm");
  await fs.mkdir(aiDirectory, { recursive: true });

  const setup = {
    enabled,
    mode: enabled ? "local-model" : "rule-only",
    model: enabled ? "js-local-llm" : "none",
    modelCommand: enabled ? "./.fiyuu/ai/bin/fiyuu-llm {prompt}" : "",
    createdAt: new Date().toISOString(),
  };

  await fs.writeFile(path.join(aiDirectory, "README.md"), aiReadme());
  await fs.writeFile(path.join(aiDirectory, "setup.json"), `${JSON.stringify(setup, null, 2)}\n`);
  await fs.writeFile(
    path.join(aiDirectory, "llm.config.json"),
    `${JSON.stringify({ modelPath: ".fiyuu/ai/models/phi3-mini", localFilesOnly: true }, null, 2)}\n`,
  );

  if (enabled) {
    await ensureLocalRunnerTemplate(binDirectory, runnerPath);
    log("ai inspector", "enabled — scaffold ready");
    log("local runner", ".fiyuu/ai/bin/fiyuu-llm");
    log("tip", "Install @xenova/transformers and add model files for real LLM mode");
  } else {
    log("ai inspector", "skipped — rule-only checks remain active");
  }
}

function aiReadme(): string {
  return `# Fiyuu Local AI Inspector

Optional local AI assets for devtools insights.

- No external API required.
- If model binaries are missing, Fiyuu falls back to deterministic rule checks.
- Configure via \`fiyuu.config.ts → ai.inspector.localModelCommand\`.

## Runner contract

Fiyuu runs: \`./.fiyuu/ai/bin/fiyuu-llm {prompt}\`

- \`{prompt}\` is a JSON string with project hints.
- Runner prints a JSON string array to stdout.

## Real LLM mode

1. \`npm install @xenova/transformers\`
2. Place model at \`.fiyuu/ai/models/phi3-mini\`
3. Restart dev server.
`;
}

async function ensureLocalRunnerTemplate(binDirectory: string, runnerPath: string): Promise<void> {
  await fs.mkdir(binDirectory, { recursive: true });
  if (!existsSync(runnerPath)) {
    await fs.writeFile(runnerPath, createLocalRunnerTemplate(), { mode: 0o755 });
  }
  await fs.chmod(runnerPath, 0o755);
}

function createLocalRunnerTemplate(): string {
  return `#!/usr/bin/env node
// Fiyuu local AI runner. Replace with a real LLM call if desired.
// Input: JSON payload via argv. Output: JSON string array to stdout.

function parsePayload() {
  const raw = process.argv.slice(2).join(" ").trim();
  if (!raw) return { project: "unknown", hints: [] };
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : { project: "unknown", hints: [] };
  } catch { return { project: "unknown", hints: [] }; }
}

function topByCategory(hints, category) {
  return hints.filter((h) => h && h.category === category).slice(0, 2);
}

function buildSuggestions(payload) {
  const hints = Array.isArray(payload.hints) ? payload.hints : [];
  const high = hints.filter((h) => h?.severity === "high").length;
  const suggestions = [];
  if (high > 0) suggestions.push("Prioritize high-severity findings before new features.");
  if (topByCategory(hints, "security").length > 0) suggestions.push("Security: remove unsafe HTML and tighten CORS rules.");
  if (topByCategory(hints, "performance").length > 0) suggestions.push("Performance: prefer SSR for content routes to reduce hydration cost.");
  if (topByCategory(hints, "architecture").length > 0) suggestions.push("Architecture: complete schema/meta contracts to keep the graph deterministic.");
  if (topByCategory(hints, "design").length > 0) suggestions.push("Design: add route-specific SEO metadata.");
  if (suggestions.length === 0) suggestions.push("No urgent issues. Keep checking after each feature merge.");
  return suggestions.slice(0, 6);
}

process.stdout.write(JSON.stringify(buildSuggestions(parsePayload())));
`;
}

// ─── Socket feature helpers ────────────────────────────────────────────────────

async function updateSocketConfigFlags(configPath: string, enabled: boolean): Promise<void> {
  if (!existsSync(configPath)) return;
  const source = await fs.readFile(configPath, "utf8");
  const v = enabled ? "true" : "false";
  const updated = source
    .replace(/(fullstack\s*:\s*\{[\s\S]*?sockets\s*:\s*)(true|false)/m, `$1${v}`)
    .replace(/(websocket\s*:\s*\{[\s\S]*?enabled\s*:\s*)(true|false)/m, `$1${v}`)
    .replace(/(realtimeCounter\s*:\s*)(true|false)/m, `$1${v}`);
  if (updated !== source) await fs.writeFile(configPath, updated);
}

async function readFeatureState(rootDirectory: string): Promise<{ socket: boolean }> {
  const filePath = path.join(rootDirectory, ".fiyuu", "features.json");
  if (!existsSync(filePath)) return { socket: false };
  try {
    const parsed = JSON.parse(await fs.readFile(filePath, "utf8")) as { socket?: boolean };
    return { socket: Boolean(parsed.socket) };
  } catch { return { socket: false }; }
}

async function writeFeatureState(rootDirectory: string, state: { socket: boolean }): Promise<void> {
  const filePath = path.join(rootDirectory, ".fiyuu", "features.json");
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(state, null, 2)}\n`);
}

async function enableSocketFeature(appDirectory: string): Promise<void> {
  await writeIfMissing(path.join(appDirectory, "..", "server", "socket.ts"), socketServerTemplate());
  await writeIfMissing(path.join(appDirectory, "live", "meta.ts"), socketMetaTemplate());
  await writeIfMissing(path.join(appDirectory, "live", "schema.ts"), socketSchemaTemplate());
  await writeIfMissing(path.join(appDirectory, "live", "query.ts"), socketQueryTemplate());
  await writeIfMissing(path.join(appDirectory, "live", "page.tsx"), socketPageTemplate());
}

async function disableSocketFeature(appDirectory: string): Promise<void> {
  const files = [
    path.join(appDirectory, "..", "server", "socket.ts"),
    path.join(appDirectory, "live", "meta.ts"),
    path.join(appDirectory, "live", "schema.ts"),
    path.join(appDirectory, "live", "query.ts"),
    path.join(appDirectory, "live", "page.tsx"),
  ];
  for (const filePath of files) {
    if (existsSync(filePath)) await fs.rm(filePath);
  }
  const liveDir = path.join(appDirectory, "live");
  if (existsSync(liveDir)) {
    const entries = await fs.readdir(liveDir);
    if (entries.length === 0) await fs.rmdir(liveDir);
  }
}

async function writeIfMissing(filePath: string, content: string): Promise<void> {
  if (existsSync(filePath)) return;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content);
}

// ─── Socket templates ─────────────────────────────────────────────────────────

function socketServerTemplate(): string {
  return `import type { WebSocket } from "ws";

export function registerSocketServer() {
  return {
    namespace: "updates",
    events: ["counter:tick", "socket:echo"],
    onConnect(socket: WebSocket) {
      socket.send(JSON.stringify({ type: "socket:connected", channel: "updates" }));
      let count = 0;
      const interval = setInterval(() => {
        count += 1;
        socket.send(JSON.stringify({ type: "counter:tick", count }));
      }, 1000);
      socket.on("close", () => clearInterval(interval));
    },
    onMessage(socket: WebSocket, message: string) {
      socket.send(JSON.stringify({ type: "socket:echo", message }));
    },
  };
}
`;
}

function socketMetaTemplate(): string {
  return `import { defineMeta } from "fiyuu/client";

export default defineMeta({
  intent: "Live socket route",
  title: "Live",
  render: "ssr",
  seo: {
    title: "Live",
    description: "Real-time socket connection page",
  },
});
`;
}

function socketSchemaTemplate(): string {
  return `import { z } from "zod";

export const input = z.object({});
export const output = z.object({ message: z.string() });
`;
}

function socketQueryTemplate(): string {
  return `import { z } from "zod";
import { defineQuery } from "fiyuu/client";

export const query = defineQuery({
  input: z.object({}),
  output: z.object({ message: z.string() }),
  description: "Socket route bootstrap",
});

export async function execute() {
  return { message: "Socket feature enabled" };
}
`;
}

function socketPageTemplate(): string {
  return `import { Component } from "@geajs/core";
import { definePage, html, escapeHtml, type PageProps } from "fiyuu/client";

type LiveData = { message: string };

export const page = definePage({ intent: "Live socket page" });

export default class LivePage extends Component<PageProps<LiveData>> {
  template({ data }: PageProps<LiveData> = this.props) {
    const script = [
      "const count=document.getElementById('fiyuu-live-count');",
      "const status=document.getElementById('fiyuu-live-status');",
      "const protocol=location.protocol==='https:'?'wss':'ws';",
      "const socket=new WebSocket(protocol+'://'+location.host+'/__fiyuu/ws');",
      "const fail=()=>{if(status)status.textContent='unavailable';};",
      "const timeout=setTimeout(fail,3500);",
      "socket.addEventListener('open',()=>{clearTimeout(timeout);if(status)status.textContent='connected';});",
      "socket.addEventListener('error',()=>{clearTimeout(timeout);fail();});",
      "socket.addEventListener('close',()=>{if(status&&status.textContent!=='unavailable')status.textContent='closed';});",
      "socket.addEventListener('message',(event)=>{try{const p=JSON.parse(event.data);if(p?.type==='counter:tick'&&count)count.textContent=String(p.count);}catch{}});",
    ].join("");

    return html\`<main class="min-h-screen px-6 py-10">
      <h1 class="text-3xl font-semibold">Live Socket</h1>
      <p class="mt-4">\${escapeHtml(data?.message ?? "Ready")}</p>
      <div class="mt-6 text-sm">Status: <span id="fiyuu-live-status">connecting</span></div>
      <div class="mt-2 text-4xl font-semibold" id="fiyuu-live-count">0</div>
    </main>
    <script type="module">\${script}</script>\`;
  }
}
`;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function resolveAppDirectory(rootDirectory: string): string {
  const rootApp = path.join(rootDirectory, "app");
  const exampleApp = path.join(rootDirectory, "examples", "basic-app", "app");
  return existsSync(rootApp) ? rootApp : exampleApp;
}

async function askYesNo(question: string, defaultValue: boolean): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const raw = (await rl.question(question)).trim().toLowerCase();
    if (!raw) return defaultValue;
    if (raw === "y" || raw === "yes") return true;
    if (raw === "n" || raw === "no") return false;
    return defaultValue;
  } finally {
    rl.close();
  }
}

function ensureValue(value: string | undefined, message: string): asserts value is string {
  if (!value) throw new Error(message);
}

function ensurePrompt(value: string[], message: string): void {
  if (value.length === 0) throw new Error(message);
}

async function listSourceFiles(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listSourceFiles(absolutePath)));
    } else if (SOURCE_FILE_PATTERN.test(entry.name)) {
      files.push(absolutePath);
    }
  }
  return files;
}

function printHelp(): void {
  console.log(`
${c.bold}${c.cyan}Fiyuu${c.reset} — AI-first fullstack framework built on GEA

${c.bold}Usage:${c.reset}  fiyuu <command> [options]

${c.bold}Dev & Deploy:${c.reset}
  ${c.cyan}dev${c.reset}                    Start development server with live reload
  ${c.cyan}build${c.reset}                  Build for production
  ${c.cyan}start${c.reset}                  Start production server (requires build)
  ${c.cyan}sync${c.reset}                   Sync project graph and AI docs

${c.bold}Scaffold:${c.reset}
  ${c.cyan}generate page <name>${c.reset}   Create a new page feature
  ${c.cyan}generate action <name>${c.reset} Create a new action feature

${c.bold}Diagnostics:${c.reset}
  ${c.cyan}doctor${c.reset}                 Check project structure and rules
  ${c.cyan}ai <prompt>${c.reset}            Print project context for AI assistants
  ${c.cyan}ai setup${c.reset}               Configure local AI inspector

${c.bold}Features:${c.reset}
  ${c.cyan}feat list${c.reset}              List feature toggles
  ${c.cyan}feat socket on|off${c.reset}     Enable / disable WebSocket

${c.bold}Skills:${c.reset}
  ${c.cyan}skill list${c.reset}             List available skills
  ${c.cyan}skill new <name>${c.reset}       Create a new skill
  ${c.cyan}skill run <name>${c.reset}       Run a skill with project context
`);
}

// ─── Run ──────────────────────────────────────────────────────────────────────

main().catch((err: unknown) => {
  fiyuuError(err instanceof Error ? err.message : "Unknown error");
  process.exitCode = 1;
});
