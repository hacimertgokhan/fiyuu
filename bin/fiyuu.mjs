#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const tsxPackageJson = require.resolve("tsx/package.json");
const tsxCli = path.join(path.dirname(tsxPackageJson), "dist", "cli.mjs");
const sourceCli = path.resolve(directory, "../packages/cli/src/index.ts");

const child = spawn(process.execPath, [tsxCli, sourceCli, ...process.argv.slice(2)], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
