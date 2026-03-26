#!/usr/bin/env node

import { existsSync, promises as fs } from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createProjectGraph, generateActionFeature, generatePageFeature, loadFiyuuConfig, scanApp, syncProjectArtifacts, type FiyuuConfig } from "@fiyuu/core";
import { bundleClient, startServer } from "@fiyuu/runtime";

const execFileAsync = promisify(execFile);
const DEFAULT_PORT = 4050;

async function main(): Promise<void> {
  const [, , command, ...args] = process.argv;
  const rootDirectory = process.cwd();
  const appDirectory = resolveAppDirectory(rootDirectory);
  const loaded = await loadFiyuuConfig(rootDirectory, command === "start" ? "start" : "dev");
  const config = loaded.config;
  const configuredPort = config.app?.port ?? DEFAULT_PORT;

  switch (command ?? "") {
    case "dev":
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
      ensurePrompt(args, "Prompt is required for `ai`.");
      await runAi(rootDirectory, appDirectory, args.join(" "));
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

async function build(rootDirectory: string, appDirectory: string, config: FiyuuConfig): Promise<void> {
  const configuredPort = config.app?.port ?? DEFAULT_PORT;
  console.log("\nFiyuu Build");
  console.log(`- App: ${appDirectory}`);
  console.log("- Step 1/3: syncing project graph");
  await sync(rootDirectory, appDirectory);
  console.log("- Step 2/3: bundling client assets");
  await runTypeScriptBuild(rootDirectory);
  console.log("- Step 3/3: writing runtime manifest");

  const manifestPath = path.join(rootDirectory, ".fiyuu", "build.json");
  const manifest = {
    rootDirectory,
    appDirectory,
    clientDirectory: path.join(rootDirectory, ".fiyuu", "client"),
    port: configuredPort,
    config,
  };

  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`- Done: build artifacts are ready`);
  console.log(`- Next: run \`fiyuu start\` (prefers port ${configuredPort})`);
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

  console.log(`- Graph: synced to ${outputPath}`);
  console.log(`- Routes: ${graph.routes.length}`);
  console.log(`- Features: ${graph.features.length}`);
  console.log(`- AI Docs: PROJECT.md, PATHS.md, STATES.md, FEATURES.md, WARNINGS.md`);
  if (graph.features.some((feature) => feature.warnings.length > 0)) {
    console.warn("- Warning: some features are incomplete");
  }
}

async function generate(kind: "page" | "action", appDirectory: string, featureName: string): Promise<void> {
  const createdFiles = kind === "page" ? await generatePageFeature(appDirectory, featureName) : await generateActionFeature(appDirectory, featureName);
  console.log(`\nFiyuu Generate`);
  console.log(`- Kind: ${kind}`);
  console.log(`- Feature: ${featureName}`);
  console.log(`- Files:`);
  for (const filePath of createdFiles) {
    console.log(`- ${filePath}`);
  }
}

async function runAi(rootDirectory: string, appDirectory: string, prompt: string): Promise<void> {
  const graph = await createProjectGraph(appDirectory);
  const graphPath = path.join(rootDirectory, ".fiyuu", "graph.json");

  console.log(`Prompt: ${prompt}`);
  console.log(`Graph: ${graphPath}`);
  console.log(`Routes: ${graph.routes.map((route) => route.path).join(", ") || "none"}`);
  console.log("Intents:");

  for (const feature of graph.features) {
    console.log(`- ${feature.route}: ${feature.intent ?? "No intent defined"}`);
  }
}

function resolveAppDirectory(rootDirectory: string): string {
  const rootAppDirectory = path.join(rootDirectory, "app");
  const exampleAppDirectory = path.join(rootDirectory, "examples", "basic-app", "app");

  return existsSync(rootAppDirectory) ? rootAppDirectory : exampleAppDirectory;
}

async function runTypeScriptBuild(rootDirectory: string): Promise<void> {
  const frameworkRoot = path.resolve(import.meta.dirname, "../../..");
  const tscCli = path.join(frameworkRoot, "node_modules", "typescript", "bin", "tsc");
  const features = await scanApp(resolveAppDirectory(rootDirectory));

  await bundleClient(features, path.join(rootDirectory, ".fiyuu", "client"));
  await execFileAsync(process.execPath, [tscCli, "-p", "tsconfig.json"], { cwd: rootDirectory });
}

function ensureValue(value: string | undefined, message: string): asserts value is string {
  if (!value) {
    throw new Error(message);
  }
}

function ensurePrompt(value: string[], message: string): void {
  if (value.length === 0) {
    throw new Error(message);
  }
}

function printHelp(): void {
  console.log(`Fiyuu CLI

Commands:
  dev
  build
  start
  sync
  ai <prompt>
  generate page <name>
  generate action <name>`);
}


main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(message);
  process.exitCode = 1;
});
