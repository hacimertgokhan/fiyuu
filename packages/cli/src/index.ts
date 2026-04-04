#!/usr/bin/env node

import path from "node:path";
import { loadFiyuuConfig } from "@fiyuu/core";
import { startServer } from "@fiyuu/runtime";

import { c, ensurePrompt, ensureValue, fiyuuError, resolveAppDirectory } from "./shared.js";
import { build, start } from "./commands/build.js";
import { sync } from "./commands/sync.js";
import { generate } from "./commands/generate.js";
import { runAi } from "./commands/ai.js";
import { handleGraphCommand } from "./commands/graph.js";
import { runDoctor } from "./commands/doctor.js";
import { handleSkillCommand } from "./commands/skill.js";
import { handleFeatureCommand } from "./commands/feat.js";
import { deploy } from "./commands/deploy.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_PORT = 4050;

// ─── Help ─────────────────────────────────────────────────────────────────────

function printHelp(): void {
  console.log(`
${c.bold}${c.cyan}Fiyuu${c.reset} — AI-first fullstack framework built on GEA

${c.bold}Usage:${c.reset}  fiyuu <command> [options]

${c.bold}Dev & Deploy:${c.reset}
  ${c.cyan}dev${c.reset}                    Start development server with live reload
  ${c.cyan}build${c.reset}                  Build for production
  ${c.cyan}start${c.reset}                  Start production server (requires build)
  ${c.cyan}deploy${c.reset}                 Build + upload + remote production restart over SSH
  ${c.cyan}cloud${c.reset}                  Temporarily disabled (coming soon)
  ${c.cyan}sync${c.reset}                   Sync project graph and AI docs

${c.bold}Scaffold:${c.reset}
  ${c.cyan}generate page <name>${c.reset}   Create a new page feature
  ${c.cyan}generate action <name>${c.reset} Create a new action feature

${c.bold}Diagnostics:${c.reset}
  ${c.cyan}doctor${c.reset}                 Check project structure and rules
  ${c.cyan}doctor --fix${c.reset}           Apply safe automatic fixes
  ${c.cyan}graph stats${c.reset}            Print graph route and warning counts
  ${c.cyan}graph export${c.reset}           Export graph as JSON or Markdown
  ${c.cyan}ai <prompt>${c.reset}            Print project context for AI assistants

${c.bold}Features:${c.reset}
  ${c.cyan}feat list${c.reset}              List feature toggles
  ${c.cyan}feat socket on|off${c.reset}     Enable / disable WebSocket

${c.bold}Skills:${c.reset}
  ${c.cyan}skill list${c.reset}             List available skills
  ${c.cyan}skill new <name>${c.reset}       Create a new skill
  ${c.cyan}skill run <name>${c.reset}       Run a skill with project context
`);
}

// ─── Main dispatcher ──────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const [, , command, ...args] = process.argv;
  const rootDirectory = process.cwd();
  const appDirectory = resolveAppDirectory(rootDirectory);
  const isProductionMode = command === "start" || command === "deploy";
  const loaded = await loadFiyuuConfig(rootDirectory, isProductionMode ? "start" : "dev");
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

    case "deploy":
      await deploy(rootDirectory, appDirectory, config, args);
      return;

    case "cloud":
      throw new Error("Cloud deploy is not active yet. Use `fiyuu deploy` for now.");

    case "generate": {
      const [kind, featureName] = args;
      if (kind !== "page" && kind !== "action") {
        throw new Error("`generate` expects `page` or `action`.");
      }
      ensureValue(featureName, `Feature name is required for \`generate ${kind}\`.`);
      await generate(kind, appDirectory, featureName);
      return;
    }

    case "ai":
      ensurePrompt(args, "Prompt required for `fiyuu ai <prompt>`.");
      await runAi(rootDirectory, appDirectory, args.join(" "));
      return;

    case "doctor":
      await runDoctor(rootDirectory, appDirectory, args);
      return;

    case "graph":
      await handleGraphCommand(rootDirectory, appDirectory, args);
      return;

    case "feat":
      await handleFeatureCommand(rootDirectory, appDirectory, args);
      return;

    case "skill":
      await handleSkillCommand(rootDirectory, appDirectory, args);
      return;

    default:
      printHelp();
  }
}

// ─── Run ──────────────────────────────────────────────────────────────────────

main().catch((err: unknown) => {
  fiyuuError(err instanceof Error ? err.message : "Unknown error");
  process.exitCode = 1;
});
