/**
 * Shared CLI helpers: colours, logging, and common utilities.
 * Imported by every command file — no external dependencies.
 */

// ── ANSI colours (no external dep) ───────────────────────────────────────────

export const c = {
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

// ── Log helpers ───────────────────────────────────────────────────────────────

export function log(label: string, message: string, colour = c.green): void {
  console.log(`${colour}${c.bold}${label}${c.reset}${c.gray} →${c.reset} ${message}`);
}

export function warn(message: string): void {
  console.warn(`${c.yellow}${c.bold}warn${c.reset} ${message}`);
}

export function fiyuuError(message: string): void {
  console.error(`${c.red}${c.bold}error${c.reset} ${message}`);
}

// ── Assertion helpers ─────────────────────────────────────────────────────────

export function ensureValue(value: string | undefined, message: string): asserts value is string {
  if (!value) throw new Error(message);
}

export function ensurePrompt(value: string[], message: string): void {
  if (value.length === 0) throw new Error(message);
}

// ── File system helpers ───────────────────────────────────────────────────────

import { existsSync, promises as fs } from "node:fs";
import path from "node:path";

const SOURCE_FILE_PATTERN = /\.(ts|tsx|js|jsx)$/;

export { existsSync, fs, path };

export async function listSourceFiles(directory: string): Promise<string[]> {
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

export function resolveAppDirectory(rootDirectory: string): string {
  const rootApp = path.join(rootDirectory, "app");
  const localApp = path.join(rootDirectory, "examples", "my-app", "app");
  const exampleApp = path.join(rootDirectory, "examples", "basic-app", "app");
  if (existsSync(rootApp)) return rootApp;
  if (existsSync(localApp)) return localApp;
  if (existsSync(exampleApp)) return exampleApp;
  throw new Error("No app directory found. Expected ./app, ./examples/my-app/app, or ./examples/basic-app/app.");
}
