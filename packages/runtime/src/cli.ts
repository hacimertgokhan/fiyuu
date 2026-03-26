#!/usr/bin/env node

import path from "node:path";
import { existsSync } from "node:fs";
import { scanApp } from "@fiyuu/core";
import { bundleClient } from "./bundler.js";

async function main(): Promise<void> {
  const [, , command, rootDirectory] = process.argv;

  if (command !== "bundle" || !rootDirectory) {
    throw new Error("Usage: runtime bundle <rootDirectory>");
  }

  const appDirectory = resolveAppDirectory(rootDirectory);
  const features = await scanApp(appDirectory);
  const outputDirectory = path.join(rootDirectory, ".fiyuu", "client");
  await bundleClient(features, outputDirectory);
  console.log(`Bundled client assets to ${outputDirectory}`);
}

function resolveAppDirectory(rootDirectory: string): string {
  const rootAppDirectory = path.join(rootDirectory, "app");
  const exampleAppDirectory = path.join(rootDirectory, "examples", "basic-app", "app");

  return existsSync(rootAppDirectory) ? rootAppDirectory : exampleAppDirectory;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Unknown bundle error");
  process.exitCode = 1;
});
