/**
 * Module loading, layout stacking, meta merging, query caching,
 * and GEA component rendering for the Fiyuu runtime server.
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { buildSync } from "esbuild";
import type { FeatureRecord, MetaDefinition } from "@fiyuu/core";
import type { GeaRenderable, LayoutModule, ModuleShape, RuntimeState } from "./server-types.js";
import { QUERY_CACHE_MAX_ENTRIES, QUERY_CACHE_SWEEP_INTERVAL_MS } from "./server-router.js";

// ── TypeScript compilation cache ──────────────────────────────────────────────

const tsxCacheDir = path.join(process.cwd(), ".fiyuu", "dev", "tsx-cache");
const tsxCache = new Map<string, string>();

function getCompiledPath(originalPath: string): string {
  const hash = Buffer.from(originalPath).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, 16);
  return path.join(tsxCacheDir, `${hash}.js`);
}

function compileTsxFile(tsxPath: string): string {
  const compiledPath = getCompiledPath(tsxPath);
  
  // Check cache
  const cached = tsxCache.get(tsxPath);
  if (cached && cached === compiledPath) {
    try {
      const tsxStat = statSync(tsxPath);
      const jsStat = statSync(compiledPath);
      if (jsStat.mtimeMs >= tsxStat.mtimeMs) {
        return compiledPath;
      }
    } catch {
      // Cache miss, recompile
    }
  }
  
  // Ensure cache directory exists
  mkdirSync(tsxCacheDir, { recursive: true });
  
  // Compile with esbuild
  const result = buildSync({
    entryPoints: [tsxPath],
    bundle: false,
    format: "esm",
    platform: "node",
    target: "node18",
    jsx: "automatic",
    jsxImportSource: "@geajs/core",
    outfile: compiledPath,
    sourcemap: false,
  });
  
  if (result.errors.length > 0) {
    throw new Error(`Failed to compile ${tsxPath}: ${result.errors.map(e => e.text).join(", ")}`);
  }
  
  tsxCache.set(tsxPath, compiledPath);
  return compiledPath;
}

// ── Dynamic module import ─────────────────────────────────────────────────────

export async function importModule(
  modulePath: string, 
  mode: "dev" | "start",
  serverDirectory?: string,
): Promise<unknown> {
  // In production mode, use compiled .js files from server directory
  let resolvedPath = modulePath;
  if (mode === "start" && serverDirectory) {
    // Convert .ts/.tsx to .js and map to server directory
    const relativePath = path.relative(process.cwd(), modulePath);
    if (relativePath.startsWith("app/")) {
      const jsPath = relativePath.replace(/\.tsx?$/, ".js");
      resolvedPath = path.join(serverDirectory, jsPath.replace(/^app\//, ""));
    }
  } else if (mode === "dev" && (modulePath.endsWith(".tsx") || modulePath.endsWith(".ts"))) {
    // In dev mode, compile .tsx/.ts files on the fly
    resolvedPath = compileTsxFile(modulePath);
  }
  
  const fileUrl = pathToFileURL(resolvedPath).href;
  try {
    return await import(mode === "dev" ? `${fileUrl}?t=${Date.now()}` : fileUrl);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const shortPath = modulePath.replace(process.cwd(), ".");

    let hint = "";
    if (message.includes("Cannot find package") || message.includes("ERR_MODULE_NOT_FOUND")) {
      const match = message.match(/Cannot find (?:package|module) '([^']+)'/);
      const missing = match ? match[1] : "a dependency";
      hint = `\n  → Missing package: "${missing}". Run \`npm install\` in the project root.`;
    } else if (message.includes("SyntaxError") || message.includes("Unexpected token")) {
      hint = `\n  → Syntax error in ${shortPath}. Check for typos or invalid TypeScript.`;
    } else if (message.includes("ERR_INVALID_URL")) {
      hint = `\n  → Invalid file path: ${shortPath}`;
    }

    const enhanced = new Error(
      `Failed to load module: ${shortPath}\n  ${message}${hint}`,
    );
    enhanced.stack = err instanceof Error ? err.stack : undefined;
    throw enhanced;
  }
}

// ── API route resolution ──────────────────────────────────────────────────────

export function resolveApiRouteModule(appDirectory: string, pathname: string): string | null {
  const relativePath = pathname.replace(/^\//, "");
  const normalizedRoot = path.resolve(appDirectory) + path.sep;

  const directModule = path.resolve(appDirectory, relativePath, "route.ts");
  if (!directModule.startsWith(normalizedRoot)) return null; // path traversal guard
  if (existsSync(directModule)) return directModule;

  const rootModule = path.resolve(appDirectory, relativePath + ".ts");
  if (!rootModule.startsWith(normalizedRoot)) return null; // path traversal guard
  return existsSync(rootModule) ? rootModule : null;
}

// ── Meta loading & merging ────────────────────────────────────────────────────

export async function loadMetaFile(filePath: string, mode: "dev" | "start", serverDirectory?: string): Promise<MetaDefinition> {
  if (!existsSync(filePath)) {
    return { intent: "" };
  }
  const module = (await importModule(filePath, mode, serverDirectory)) as { default?: MetaDefinition };
  return module.default ?? { intent: "" };
}

export async function loadLayoutMeta(directory: string, mode: "dev" | "start", serverDirectory?: string): Promise<MetaDefinition> {
  return loadMetaFile(path.join(directory, "layout.meta.ts"), mode, serverDirectory);
}

export function mergeMetaDefinitions(...definitions: MetaDefinition[]): MetaDefinition {
  return definitions.reduce<MetaDefinition>(
    (current, item) => ({
      ...current,
      ...item,
      seo: {
        ...current.seo,
        ...item.seo,
      },
    }),
    { intent: "" },
  );
}

// ── Layout stack loading ──────────────────────────────────────────────────────

export interface ProviderModule {
  default?: (props: { children: string; route?: string }) => string;
  Provider?: (props: { children: string; route?: string }) => string;
}

export async function loadLayoutStack(
  appDirectory: string,
  feature: FeatureRecord,
  mode: "dev" | "start",
  serverDirectory?: string,
  providers?: ProviderRecord[],
): Promise<Array<{ component: unknown; meta: MetaDefinition; isProvider?: boolean }>> {
  const parts = feature.feature ? feature.feature.split("/") : [];
  const directories = [appDirectory];
  for (let index = 0; index < parts.length; index += 1) {
    directories.push(path.join(appDirectory, ...parts.slice(0, index + 1)));
  }

  const stack: Array<{ component: unknown; meta: MetaDefinition; isProvider?: boolean }> = [];

  // First, load global providers (if any)
  if (providers && providers.length > 0) {
    for (const provider of providers.filter((p) => p.target === "global" || p.target === "layout")) {
      try {
        const module = (await importModule(provider.filePath, mode, serverDirectory)) as ProviderModule;
        const component = module.default ?? module.Provider;
        if (component) {
          stack.push({
            component,
            meta: { intent: provider.intent ?? `${provider.name} provider` },
            isProvider: true,
          });
        }
      } catch (err) {
        console.warn(`[fiyuu] Failed to load provider ${provider.name}:`, err);
      }
    }
  }

  // Then load layouts
  for (const directory of directories) {
    const layoutFileTsx = path.join(directory, "layout.tsx");
    const layoutFileTs = path.join(directory, "layout.ts");
    const layoutFile = existsSync(layoutFileTsx) ? layoutFileTsx : existsSync(layoutFileTs) ? layoutFileTs : null;
    const metaFile = path.join(directory, "layout.meta.ts");
    if (layoutFile) {
      const module = (await importModule(layoutFile, mode, serverDirectory)) as LayoutModule;
      if (module.default) {
        stack.push({ component: module.default, meta: await loadMetaFile(metaFile, mode, serverDirectory) });
      }
    }
  }

  // Finally, load page-specific providers
  if (providers && providers.length > 0) {
    for (const provider of providers.filter((p) => p.target === "page")) {
      try {
        const module = (await importModule(provider.filePath, mode, serverDirectory)) as ProviderModule;
        const component = module.default ?? module.Provider;
        if (component) {
          stack.push({
            component,
            meta: { intent: provider.intent ?? `${provider.name} provider` },
            isProvider: true,
          });
        }
      } catch (err) {
        console.warn(`[fiyuu] Failed to load provider ${provider.name}:`, err);
      }
    }
  }

  return stack;
}

import type { ProviderRecord } from "@fiyuu/core";

export async function loadFeatureMeta(feature: FeatureRecord, mode: "dev" | "start", serverDirectory?: string): Promise<MetaDefinition> {
  return feature.files["meta.ts"]
    ? loadMetaFile(feature.files["meta.ts"], mode, serverDirectory)
    : { intent: feature.intent ?? "" };
}

// ── Cached layout stack (production only) ────────────────────────────────────

export async function getCachedLayoutStack(
  state: RuntimeState,
  appDirectory: string,
  feature: FeatureRecord,
  mode: "dev" | "start",
  providers?: ProviderRecord[],
): Promise<Array<{ component: unknown; meta: MetaDefinition; isProvider?: boolean }>> {
  const cached = state.layoutStackCache.get(feature.route);
  if (cached) return cached;

  const layoutStack = await loadLayoutStack(appDirectory, feature, mode, state.serverDirectory, providers);
  state.layoutStackCache.set(feature.route, layoutStack);
  return layoutStack;
}

export async function getCachedMergedMeta(
  state: RuntimeState,
  feature: FeatureRecord,
  layoutStack: Array<{ component: unknown; meta: MetaDefinition }>,
  mode: "dev" | "start",
): Promise<MetaDefinition> {
  const cached = state.mergedMetaCache.get(feature.route);
  if (cached) return cached;

  let featureMeta = state.featureMetaCache.get(feature.route);
  if (!featureMeta) {
    featureMeta = await loadFeatureMeta(feature, mode, state.serverDirectory);
    state.featureMetaCache.set(feature.route, featureMeta);
  }

  const merged = mergeMetaDefinitions(...layoutStack.map((item) => item.meta), featureMeta);
  state.mergedMetaCache.set(feature.route, merged);
  return merged;
}

// ── Query cache ───────────────────────────────────────────────────────────────

export function pruneQueryCache(state: RuntimeState, now: number): void {
  if (
    now - state.queryCacheLastPruneAt < QUERY_CACHE_SWEEP_INTERVAL_MS &&
    state.queryCache.size < QUERY_CACHE_MAX_ENTRIES
  ) {
    return;
  }

  state.queryCacheLastPruneAt = now;
  for (const [key, entry] of state.queryCache) {
    if (entry.expiresAt <= now) {
      state.queryCache.delete(key);
    }
  }

  if (state.queryCache.size <= QUERY_CACHE_MAX_ENTRIES) return;

  const survivors = [...state.queryCache.entries()].sort(
    (left, right) => left[1].expiresAt - right[1].expiresAt,
  );
  const overflowCount = survivors.length - QUERY_CACHE_MAX_ENTRIES;
  for (let index = 0; index < overflowCount; index += 1) {
    state.queryCache.delete(survivors[index][0]);
  }
}

// ── GEA component rendering ───────────────────────────────────────────────────

const geaComponentModeCache = new WeakMap<Function, "class" | "function">();

export function renderGeaComponent(component: unknown, props: Record<string, unknown>): string {
  if (typeof component !== "function") {
    throw new Error("Route module default export must be a Gea component class or function.");
  }

  const candidate = component as {
    prototype?: { template?: (props?: Record<string, unknown>) => string };
    new (props?: Record<string, unknown>): GeaRenderable;
    (props?: Record<string, unknown>): unknown;
  };
  const componentKey = candidate as unknown as Function;

  const cachedMode = geaComponentModeCache.get(componentKey);
  const mode = cachedMode ?? (typeof candidate.prototype?.template === "function" ? "class" : "function");
  if (!cachedMode) {
    geaComponentModeCache.set(componentKey, mode);
  }

  if (mode === "class") {
    const instance = new candidate(props);
    if (typeof instance.template === "function") {
      return String(instance.template(instance.props ?? props));
    }
    return String(instance.toString());
  }

  return String(candidate(props));
}
