/**
 * .fiu dosyalarını bulur, parse eder ve TypeScript'e transpile eder.
 *
 * Her .fiu dosyası için yanında bir .fiu.ts dosyası oluşturulur.
 * Bu dosya normal build pipeline'a dahil edilir.
 *
 * Kullanım:
 *   await compileFiuFiles(appDirectory)        // tek seferlik
 *   await watchFiuFiles(appDirectory, onChange) // watch mode
 */

import { promises as fs, existsSync, watch } from "node:fs";
import * as path from "node:path";
import { parseFiuFile } from "./fiu-parser.js";
import { transpileFiuFile } from "./fiu-transpiler.js";
import { log, warn, c } from "./shared.js";

async function findFiuFiles(directory: string): Promise<string[]> {
  const results: string[] = [];

  async function walk(dir: string): Promise<void> {
    let entries: import("node:fs").Dirent[];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
        await walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".fiu")) {
        results.push(fullPath);
      }
    }
  }

  await walk(directory);
  return results;
}

async function compileSingleFile(fiuPath: string): Promise<string> {
  const source = await fs.readFile(fiuPath, "utf-8");
  const ast = parseFiuFile(source);
  const output = transpileFiuFile(ast, fiuPath);
  const outPath = fiuPath + ".ts";
  await fs.writeFile(outPath, output, "utf-8");
  return outPath;
}

export async function compileFiuFiles(appDirectory: string): Promise<number> {
  const files = await findFiuFiles(appDirectory);

  if (files.length === 0) return 0;

  let compiled = 0;
  const errors: Array<{ file: string; error: unknown }> = [];

  await Promise.all(
    files.map(async (file) => {
      try {
        const outPath = await compileSingleFile(file);
        const rel = path.relative(appDirectory, file);
        log(".fiu", `${rel} → ${path.basename(outPath)}`);
        compiled++;
      } catch (err) {
        errors.push({ file, error: err });
      }
    }),
  );

  for (const { file, error } of errors) {
    const rel = path.relative(appDirectory, file);
    warn(`[fiu] ${rel}: ${error instanceof Error ? error.message : String(error)}`);
  }

  return compiled;
}

type WatchCallback = (changedFile: string, outPath: string) => void;

export function watchFiuFiles(appDirectory: string, onChange?: WatchCallback): () => void {
  const watchers: ReturnType<typeof watch>[] = [];

  async function onFileChange(fiuPath: string): Promise<void> {
    try {
      const outPath = await compileSingleFile(fiuPath);
      const rel = path.relative(appDirectory, fiuPath);
      log(".fiu", `${c.cyan}recompiled${c.reset} ${rel}`);
      onChange?.(fiuPath, outPath);
    } catch (err) {
      const rel = path.relative(appDirectory, fiuPath);
      warn(`[fiu] ${rel}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async function setupWatcher(): Promise<void> {
    const files = await findFiuFiles(appDirectory);

    for (const file of files) {
      if (!existsSync(file)) continue;
      const watcher = watch(file, () => void onFileChange(file));
      watchers.push(watcher);
    }

    // Yeni .fiu dosyaları için dizini izle
    const dirWatcher = watch(appDirectory, { recursive: true }, (_event, filename) => {
      if (!filename?.endsWith(".fiu")) return;
      const fullPath = path.join(appDirectory, filename);
      if (existsSync(fullPath)) void onFileChange(fullPath);
    });
    watchers.push(dirWatcher);
  }

  void setupWatcher();

  return () => {
    for (const w of watchers) w.close();
  };
}

/**
 * Compiled .fiu.ts dosyalarını temizler.
 * Build öncesi temiz bir slate için kullanılabilir.
 */
export async function cleanFiuOutputs(appDirectory: string): Promise<void> {
  const files = await findFiuFiles(appDirectory);
  await Promise.all(
    files.map(async (file) => {
      const outPath = file + ".ts";
      try {
        await fs.unlink(outPath);
      } catch {
        // Yoksa sorun değil
      }
    }),
  );
}
