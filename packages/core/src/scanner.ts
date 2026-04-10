import { promises as fs } from "node:fs";
import path from "node:path";

const FIXED_FILES = ["page.tsx", "page.ts", "action.ts", "query.ts", "schema.ts", "meta.ts"] as const;
const REQUIRED_FILES = ["schema.ts", "meta.ts"] as const;
const SUPPLEMENTARY_FILES = ["middleware.ts", "layout.tsx", "layout.ts", "layout.meta.ts", "route.ts", "not-found.tsx", "not-found.ts", "error.tsx", "error.ts"] as const;
const GENERATED_FILE_PATTERN = /\.(js|jsx|d\.ts|map)$/;

export interface FeatureRecord {
  route: string;
  feature: string;
  directory: string;
  files: Partial<Record<(typeof FIXED_FILES)[number], string>>;
  missingRequiredFiles: string[];
  intent: string | null;
  pageIntent: string | null;
  descriptions: string[];
  render: "ssr" | "csr" | "ssg";
  warnings: string[];
  /** Names of dynamic segments in order, e.g. ["id"] for /blog/[id] */
  params: string[];
  /** True if route has any dynamic [param] or [...slug] segments */
  isDynamic: boolean;
  /**
   * Human-readable pattern string, e.g. "/blog/:id" or "/docs/:slug*"
   * Stored for AI docs and devtools display only — not used for matching.
   */
  routePattern: string;
}

export interface ProjectGraph {
  routes: Array<{
    path: string;
    feature: string;
    hasPage: boolean;
  }>;
  actions: Array<{
    route: string;
    file: string;
  }>;
  queries: Array<{
    route: string;
    file: string;
  }>;
  schemas: Array<{
    route: string;
    file: string;
    descriptions: string[];
    render: "ssr" | "csr" | "ssg";
  }>;
  relations: Array<{
    from: string;
    to: string;
    type: "uses" | "renders" | "describes";
  }>;
  features: FeatureRecord[];
}

export async function scanApp(appDirectory: string): Promise<FeatureRecord[]> {
  const features = await walkFeatureDirectories(appDirectory);
  const records = await Promise.all(features.map((directory) => scanFeature(appDirectory, directory)));
  return records.sort((left, right) => left.route.localeCompare(right.route));
}

export async function createProjectGraph(appDirectory: string): Promise<ProjectGraph> {
  const features = await scanApp(appDirectory);

  return {
    routes: features.map((feature) => ({
      path: feature.route,
      feature: feature.feature,
      hasPage: Boolean(feature.files["page.tsx"] || feature.files["page.ts"]),
    })),
    actions: features
      .filter((feature) => feature.files["action.ts"])
      .map((feature) => ({ route: feature.route, file: feature.files["action.ts"]! })),
    queries: features
      .filter((feature) => feature.files["query.ts"])
      .map((feature) => ({ route: feature.route, file: feature.files["query.ts"]! })),
    schemas: features
      .filter((feature) => feature.files["schema.ts"])
      .map((feature) => ({
        route: feature.route,
        file: feature.files["schema.ts"]!,
        descriptions: feature.descriptions,
        render: feature.render,
      })),
    relations: features.flatMap((feature) => {
      const relations: ProjectGraph["relations"] = [];

      if (feature.files["schema.ts"]) {
        relations.push({ from: feature.route, to: feature.files["schema.ts"]!, type: "uses" });
      }

      if (feature.files["action.ts"]) {
        relations.push({ from: feature.route, to: feature.files["action.ts"]!, type: "uses" });
      }

      if (feature.files["query.ts"]) {
        relations.push({ from: feature.route, to: feature.files["query.ts"]!, type: "uses" });
      }

      const pageFile = feature.files["page.tsx"] || feature.files["page.ts"];
      if (pageFile) {
        relations.push({ from: feature.route, to: pageFile, type: "renders" });
      }

      if (feature.files["meta.ts"]) {
        relations.push({ from: feature.route, to: feature.files["meta.ts"]!, type: "describes" });
      }

      return relations;
    }),
    features,
  };
}

async function walkFeatureDirectories(root: string): Promise<string[]> {
  const directories: string[] = [];
  await visit(root, directories, root);
  return directories;
}

async function visit(currentDirectory: string, directories: string[], appDirectory: string): Promise<void> {
  const entries = await fs.readdir(currentDirectory, { withFileTypes: true });
  const fileNames = new Set(entries.filter((entry) => entry.isFile()).map((entry) => entry.name));
  const hasFeatureFiles = FIXED_FILES.some((fileName) => fileNames.has(fileName));

  if (hasFeatureFiles) {
    directories.push(currentDirectory);
  }

  await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => visit(path.join(currentDirectory, entry.name), directories, appDirectory)),
  );
}

/**
 * Parses dynamic segment syntax from a route string.
 *
 * Supported formats (mirrors Next.js conventions):
 *   [param]         — single dynamic segment      /blog/[id]
 *   [...slug]       — required catch-all           /docs/[...slug]
 *   [[...slug]]     — optional catch-all           /docs/[[...slug]]
 */
export function parseRouteSegments(route: string): {
  params: string[];
  isDynamic: boolean;
  routePattern: string;
} {
  const params: string[] = [];
  const patternParts = route
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      const optionalCatchAll = segment.match(/^\[\[\.\.\.(\w+)\]\]$/);
      if (optionalCatchAll) {
        params.push(optionalCatchAll[1]);
        return `:${optionalCatchAll[1]}?*`;
      }
      const catchAll = segment.match(/^\[\.\.\.(\w+)\]$/);
      if (catchAll) {
        params.push(catchAll[1]);
        return `:${catchAll[1]}*`;
      }
      const dynamic = segment.match(/^\[(\w+)\]$/);
      if (dynamic) {
        params.push(dynamic[1]);
        return `:${dynamic[1]}`;
      }
      return segment;
    });

  return {
    params,
    isDynamic: params.length > 0,
    routePattern: `/${patternParts.join("/")}`,
  };
}

async function scanFeature(appDirectory: string, featureDirectory: string): Promise<FeatureRecord> {
  const relativeDirectory = path.relative(appDirectory, featureDirectory);
  const feature = relativeDirectory.split(path.sep).join("/");
  const route = `/${feature}`;
  const files = Object.fromEntries(
    await Promise.all(
      FIXED_FILES.map(async (fileName) => {
        const filePath = path.join(featureDirectory, fileName);
        try {
          await fs.access(filePath);
          return [fileName, normalizePath(filePath)];
        } catch {
          return [fileName, undefined];
        }
      }),
    ),
  ) as FeatureRecord["files"];

  const metaSource = files["meta.ts"] ? await fs.readFile(path.join(featureDirectory, "meta.ts"), "utf8") : "";
  const pageFilePath = files["page.tsx"] ? "page.tsx" : files["page.ts"] ? "page.ts" : null;
  const pageSource = pageFilePath ? await fs.readFile(path.join(featureDirectory, pageFilePath), "utf8") : "";
  const schemaSource = files["schema.ts"] ? await fs.readFile(path.join(featureDirectory, "schema.ts"), "utf8") : "";
  const featureEntries = await fs.readdir(featureDirectory, { withFileTypes: true });
  const extraFiles = featureEntries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter(
      (fileName) =>
        !FIXED_FILES.includes(fileName as (typeof FIXED_FILES)[number]) &&
        !SUPPLEMENTARY_FILES.includes(fileName as (typeof SUPPLEMENTARY_FILES)[number]) &&
        !GENERATED_FILE_PATTERN.test(fileName),
    );
  const warnings = [
    ...REQUIRED_FILES.filter((fileName) => !files[fileName]).map((fileName) => `Missing required file: ${fileName}`),
    ...extraFiles.map((fileName) => `Non-standard file in feature directory: ${fileName}`),
  ];

  if (pageSource.length > 0) {
    if (/<img\b/i.test(pageSource)) {
      warnings.push("Raw <img> usage detected. Prefer optimizedImage() for lazy loading and responsive sources.");
      if (countMatches(pageSource, /<img\b(?![^>]*\balt\s*=)[^>]*>/gi) > 0) {
        warnings.push("Some <img> tags are missing alt attributes.");
      }
      if (countMatches(pageSource, /<img\b(?![^>]*\bloading\s*=)[^>]*>/gi) > 0) {
        warnings.push("Some <img> tags are missing loading attribute (use loading=\"lazy\" when appropriate).");
      }
      if (countMatches(pageSource, /<img\b(?![^>]*\b(?:width|height)\s*=)[^>]*>/gi) > 0) {
        warnings.push("Some <img> tags are missing intrinsic width/height which can cause layout shift.");
      }
    }

    if (/<video\b/i.test(pageSource)) {
      warnings.push("Raw <video> usage detected. Prefer optimizedVideo() for preload and source hints.");
      if (countMatches(pageSource, /<video\b(?![^>]*\bpreload\s*=)[^>]*>/gi) > 0) {
        warnings.push("Some <video> tags are missing preload strategy (recommended: preload=\"metadata\").");
      }
      if (countMatches(pageSource, /<video\b(?![^>]*\bposter\s*=)[^>]*>/gi) > 0) {
        warnings.push("Some <video> tags are missing poster image, which hurts perceived loading performance.");
      }
    }
  }

  const { params, isDynamic, routePattern } = parseRouteSegments(route);

  return {
    route,
    feature,
    directory: normalizePath(featureDirectory),
    files,
    missingRequiredFiles: REQUIRED_FILES.filter((fileName) => !files[fileName]),
    intent: extractStringValue(metaSource, "intent"),
    pageIntent: extractStringValue(pageSource, "intent"),
    descriptions: extractStringList(schemaSource, "description"),
    render: extractRenderMode(metaSource),
    warnings,
    params,
    isDynamic,
    routePattern,
  };
}

function extractStringValue(source: string, key: string): string | null {
  const match = source.match(new RegExp(`${key}\\s*(?::|=)\\s*["'\`]([^"'\`]+)["'\`]`));
  return match?.[1] ?? null;
}

function extractStringList(source: string, key: string): string[] {
  return Array.from(source.matchAll(new RegExp(`${key}\\s*(?::|=)\\s*["'\`]([^"'\`]+)["'\`]`, "g"))).map((match) => match[1]);
}

function normalizePath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

function countMatches(source: string, pattern: RegExp): number {
  const matches = source.match(pattern);
  return matches ? matches.length : 0;
}

function extractRenderMode(source: string): "ssr" | "csr" | "ssg" {
  const render = extractStringValue(source, "render");
  if (render === "csr") {
    return "csr";
  }
  if (render === "ssg") {
    return "ssg";
  }
  return "ssr";
}
