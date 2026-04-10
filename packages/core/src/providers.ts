/**
 * Provider management for Fiyuu applications.
 *
 * Providers are used to wrap layouts and pages with context.
 * They enable dependency injection, theme management, auth state, etc.
 */

import path from "node:path";
import { existsSync } from "node:fs";
import { promises as fs } from "node:fs";

export interface ProviderRecord {
  /** Provider name (derived from file name) */
  name: string;
  /** Full file path to the provider module */
  filePath: string;
  /** Relative path from providers directory */
  relativePath: string;
  /** Export name (default or named) */
  exportName: string;
  /** Provider intent/description */
  intent: string | null;
  /** Provider priority (lower = earlier in chain) */
  priority: number;
  /** Whether this provider wraps layouts or pages */
  target: "global" | "layout" | "page";
}

export interface ProviderGraph {
  /** All registered providers in priority order */
  providers: ProviderRecord[];
  /** Providers grouped by target */
  byTarget: {
    global: ProviderRecord[];
    layout: ProviderRecord[];
    page: ProviderRecord[];
  };
}

const PROVIDER_FILES = ["provider.ts", "provider.tsx"] as const;

/**
 * Scan the providers directory and return all provider records.
 */
export async function scanProviders(providersDirectory: string): Promise<ProviderRecord[]> {
  if (!existsSync(providersDirectory)) {
    return [];
  }

  const records: ProviderRecord[] = [];
  await scanProviderDirectory(providersDirectory, providersDirectory, records);

  // Sort by priority, then by name for stable ordering
  return records.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return a.name.localeCompare(b.name);
  });
}

async function scanProviderDirectory(
  rootDirectory: string,
  currentDirectory: string,
  records: ProviderRecord[],
): Promise<void> {
  const entries = await fs.readdir(currentDirectory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(currentDirectory, entry.name);

    if (entry.isDirectory()) {
      // Recurse into subdirectories
      await scanProviderDirectory(rootDirectory, fullPath, records);
    } else if (entry.isFile()) {
      // Check if it's a provider file
      const isProviderFile = PROVIDER_FILES.some((pattern) => entry.name.endsWith(pattern));
      if (isProviderFile) {
        const record = await parseProviderFile(rootDirectory, fullPath);
        if (record) {
          records.push(record);
        }
      }
    }
  }
}

async function parseProviderFile(
  rootDirectory: string,
  filePath: string,
): Promise<ProviderRecord | null> {
  const relativePath = path.relative(rootDirectory, filePath);
  const name = path.basename(filePath).replace(/\.(ts|tsx)$/, "");
  const dirName = path.basename(path.dirname(filePath));

  // If file is named "provider.ts" in a directory, use directory name as provider name
  const providerName = name === "provider" ? dirName : name.replace(/\.provider$/, "");

  try {
    const content = await fs.readFile(filePath, "utf8");

    // Extract metadata from JSDoc comments
    const intent = extractJSDocTag(content, "@intent") ?? extractJSDocTag(content, "@description");
    const target = parseTarget(extractJSDocTag(content, "@target"));
    const priority = parseInt(extractJSDocTag(content, "@priority") ?? "0", 10) || 0;

    return {
      name: providerName,
      filePath: normalizePath(filePath),
      relativePath: normalizePath(relativePath),
      exportName: content.includes("export default") ? "default" : providerName,
      intent,
      priority,
      target,
    };
  } catch {
    // If we can't read the file, return a basic record
    return {
      name: providerName,
      filePath: normalizePath(filePath),
      relativePath: normalizePath(relativePath),
      exportName: "default",
      intent: null,
      priority: 0,
      target: "global",
    };
  }
}

function extractJSDocTag(content: string, tag: string): string | null {
  const regex = new RegExp(`\\*\\s*${tag.replace("@", "@")}\\s+(.+?)(?=\\n|$)`);
  const match = content.match(regex);
  return match?.[1]?.trim() ?? null;
}

function parseTarget(value: string | null): "global" | "layout" | "page" {
  if (value === "layout") return "layout";
  if (value === "page") return "page";
  return "global";
}

function normalizePath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

/**
 * Build a provider graph from scanned providers.
 */
export function buildProviderGraph(providers: ProviderRecord[]): ProviderGraph {
  return {
    providers,
    byTarget: {
      global: providers.filter((p) => p.target === "global"),
      layout: providers.filter((p) => p.target === "layout"),
      page: providers.filter((p) => p.target === "page"),
    },
  };
}

/**
 * Resolve the provider chain for a given route.
 * Returns providers in the order they should wrap (outermost first).
 */
export function resolveProviderChain(
  graph: ProviderGraph,
  route: string,
  renderTarget: "layout" | "page" = "page",
): ProviderRecord[] {
  const chain: ProviderRecord[] = [];

  // Always include global providers first
  chain.push(...graph.byTarget.global);

  // Add layout-targeted providers
  chain.push(...graph.byTarget.layout);

  // Add page-targeted providers if rendering a page
  if (renderTarget === "page") {
    chain.push(...graph.byTarget.page);
  }

  // Re-sort by priority to ensure correct nesting order
  return chain.sort((a, b) => a.priority - b.priority);
}

/**
 * Type definition helpers for creating providers.
 */
export interface ProviderProps {
  children: string;
  route?: string;
  params?: Record<string, string>;
}

export type ProviderComponent = (props: ProviderProps) => string;

/**
 * Helper to create a provider definition.
 */
export function defineProvider(component: ProviderComponent, options?: { intent?: string }): ProviderComponent {
  return component;
}
