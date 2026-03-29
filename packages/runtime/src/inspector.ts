import { promises as fs, existsSync } from "node:fs";
import path from "node:path";
import type { FeatureRecord, FiyuuConfig } from "@fiyuu/core";

type InsightCategory = "security" | "performance" | "design" | "architecture";
type InsightSeverity = "low" | "medium" | "high";

export interface InsightItem {
  id: string;
  category: InsightCategory;
  severity: InsightSeverity;
  title: string;
  summary: string;
  recommendation: string;
  route?: string;
  file?: string;
  fixable: boolean;
}

export interface InsightsReport {
  generatedAt: string;
  summary: {
    total: number;
    high: number;
    medium: number;
    low: number;
  };
  items: InsightItem[];
  assistant: {
    mode: "rule-only";
    status: "ready";
    details: string;
    suggestions: string[];
  };
}

interface BuildInsightsOptions {
  rootDirectory: string;
  appDirectory: string;
  features: FeatureRecord[];
  config?: FiyuuConfig;
}

export async function buildInsightsReport(options: BuildInsightsOptions): Promise<InsightsReport> {
  const items = await collectInsightItems(options);
  const assistant = await buildAssistantOutput(options, items);

  const summary = {
    total: items.length,
    high: items.filter((item) => item.severity === "high").length,
    medium: items.filter((item) => item.severity === "medium").length,
    low: items.filter((item) => item.severity === "low").length,
  };

  return {
    generatedAt: new Date().toISOString(),
    summary,
    items,
    assistant,
  };
}

async function collectInsightItems(options: BuildInsightsOptions): Promise<InsightItem[]> {
  const items: InsightItem[] = [];

  for (const feature of options.features) {
    items.push(...toFeatureStructureInsights(feature));

    const fileEntries = Object.entries(feature.files).filter((entry): entry is [string, string] => Boolean(entry[1]));
    for (const [, filePath] of fileEntries) {
      const source = await readFileSafe(filePath);
      if (!source) {
        continue;
      }

      if (/dangerouslySetInnerHTML/.test(source)) {
        items.push({
          id: `security-dangerous-html-${filePath}`,
          category: "security",
          severity: "high",
          title: "Potential XSS surface detected",
          summary: "`dangerouslySetInnerHTML` is used in a route module.",
          recommendation: "Prefer escaped rendering or sanitize content before passing HTML strings.",
          route: feature.route,
          file: filePath,
          fixable: true,
        });
      }

      if (/\beval\s*\(|new\s+Function\s*\(/.test(source)) {
        items.push({
          id: `security-dynamic-eval-${filePath}`,
          category: "security",
          severity: "high",
          title: "Dynamic code execution detected",
          summary: "`eval` or `new Function` appears in application logic.",
          recommendation: "Replace dynamic execution with explicit, typed control flow.",
          route: feature.route,
          file: filePath,
          fixable: true,
        });
      }

      const lineCount = source.split(/\r?\n/).length;
      if (lineCount > 450) {
        items.push({
          id: `performance-large-module-${filePath}`,
          category: "performance",
          severity: "medium",
          title: "Large route module",
          summary: `Module has ${lineCount} lines and may increase parse and hydration cost.`,
          recommendation: "Split heavy route logic into smaller server/client helpers.",
          route: feature.route,
          file: filePath,
          fixable: true,
        });
      }
    }

    if (feature.files["meta.ts"]) {
      const metaSource = await readFileSafe(feature.files["meta.ts"]);
      if (metaSource) {
        const seoTitle = extractSeoField(metaSource, "title");
        const seoDescription = extractSeoField(metaSource, "description");

        if (!seoTitle) {
          items.push({
            id: `design-missing-seo-title-${feature.route}`,
            category: "design",
            severity: "low",
            title: "SEO title missing in meta",
            summary: "`meta.ts` exists but does not define `seo.title`.",
            recommendation: "Add route-specific `seo.title` to improve previews and search snippets.",
            route: feature.route,
            file: feature.files["meta.ts"],
            fixable: true,
          });
        } else if (seoTitle.length > 62) {
          items.push({
            id: `design-seo-title-length-${feature.route}`,
            category: "design",
            severity: "low",
            title: "SEO title is longer than recommended",
            summary: `Current title length is ${seoTitle.length} characters.`,
            recommendation: "Keep seo titles around 45-60 characters to avoid truncation in SERP previews.",
            route: feature.route,
            file: feature.files["meta.ts"],
            fixable: true,
          });
        }

        if (!seoDescription) {
          items.push({
            id: `design-missing-seo-description-${feature.route}`,
            category: "design",
            severity: "medium",
            title: "SEO description missing in meta",
            summary: "`meta.ts` does not define `seo.description`.",
            recommendation: "Add a concise description (90-160 chars) for better search and social previews.",
            route: feature.route,
            file: feature.files["meta.ts"],
            fixable: true,
          });
        } else if (seoDescription.length < 80 || seoDescription.length > 170) {
          items.push({
            id: `design-seo-description-length-${feature.route}`,
            category: "design",
            severity: "low",
            title: "SEO description length can be improved",
            summary: `Current description length is ${seoDescription.length} characters.`,
            recommendation: "Keep seo descriptions in the 90-160 character range for reliable previews.",
            route: feature.route,
            file: feature.files["meta.ts"],
            fixable: true,
          });
        }
      }
    }
  }

  items.push(...(await collectGlobalSecurityInsights(options.appDirectory)));
  items.push(...collectGlobalRenderInsights(options.features));
  return dedupeInsights(items);
}

function toFeatureStructureInsights(feature: FeatureRecord): InsightItem[] {
  const items: InsightItem[] = [];

  for (const missing of feature.missingRequiredFiles) {
    items.push({
      id: `architecture-missing-${feature.route}-${missing}`,
      category: "architecture",
      severity: missing === "schema.ts" ? "high" : "medium",
      title: `Required file missing: ${missing}`,
      summary: `Feature ${feature.route} is missing ${missing}.`,
      recommendation: "Complete the feature contract so tooling and AI context stay deterministic.",
      route: feature.route,
      file: path.join(feature.directory, missing),
      fixable: true,
    });
  }

  return items;
}

async function collectGlobalSecurityInsights(appDirectory: string): Promise<InsightItem[]> {
  const items: InsightItem[] = [];
  const middlewarePath = path.join(appDirectory, "middleware.ts");
  if (existsSync(middlewarePath)) {
    const middlewareSource = await readFileSafe(middlewarePath);
    if (middlewareSource && /access-control-allow-origin["']?\s*[:,=]\s*["']\*/i.test(middlewareSource)) {
      items.push({
        id: "security-open-cors-middleware",
        category: "security",
        severity: "high",
        title: "Wildcard CORS header in middleware",
        summary: "Middleware appears to allow all origins globally.",
        recommendation: "Restrict allowed origins by environment and keep credentials disabled for public origins.",
        file: middlewarePath,
        fixable: true,
      });
    }
  }

  return items;
}

function collectGlobalRenderInsights(features: FeatureRecord[]): InsightItem[] {
  const csrCount = features.filter((feature) => feature.render === "csr").length;
  if (features.length < 4) {
    return [];
  }

  const ratio = csrCount / features.length;
  if (ratio < 0.6) {
    return [];
  }

  return [
    {
      id: "performance-csr-heavy",
      category: "performance",
      severity: ratio > 0.8 ? "high" : "medium",
      title: "Project is CSR-heavy",
      summary: `${csrCount}/${features.length} routes render in CSR mode.`,
      recommendation: "Move content-driven pages to SSR where possible to reduce blank-first-paint risk.",
      fixable: true,
    },
  ];
}

async function buildAssistantOutput(options: BuildInsightsOptions, items: InsightItem[]): Promise<InsightsReport["assistant"]> {
  void options;
  return {
    mode: "rule-only",
    status: "ready",
    details: "Using deterministic project checks (no integrated model).",
    suggestions: createRuleBasedSuggestions(items),
  };
}

function createRuleBasedSuggestions(items: InsightItem[]): string[] {
  if (items.length === 0) {
    return [
      "Run `fiyuu doctor --fix` after scaffolding new routes to keep contracts deterministic.",
      "Keep SEO descriptions in 12-28 words and route-specific titles for stable search snippets.",
      "Add focused tests around auth, middleware, and API routes before release builds.",
    ];
  }

  const topItems = items
    .slice()
    .sort((left, right) => severityScore(right.severity) - severityScore(left.severity))
    .slice(0, 4);
  return [
    ...topItems.map((item) => `${capitalize(item.category)}: ${item.recommendation}`),
    "Use `fiyuu doctor --fix` for safe auto-fixes (SEO fields, missing execute(), fallback pages, className->class).",
  ].slice(0, 6);
}

function dedupeInsights(items: InsightItem[]): InsightItem[] {
  const seen = new Set<string>();
  const output: InsightItem[] = [];
  for (const item of items) {
    if (seen.has(item.id)) {
      continue;
    }
    seen.add(item.id);
    output.push(item);
  }
  return output;
}

async function readFileSafe(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

function severityScore(severity: InsightSeverity): number {
  if (severity === "high") {
    return 3;
  }
  if (severity === "medium") {
    return 2;
  }
  return 1;
}

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function extractSeoField(source: string, field: "title" | "description"): string | null {
  const seoBlock = source.match(/seo\s*:\s*\{([\s\S]*?)\}/m);
  if (!seoBlock) {
    return null;
  }

  const fieldRegex = new RegExp(`${field}\\s*:\\s*(["'\`])([\\s\\S]*?)\\1`, "m");
  const match = seoBlock[1].match(fieldRegex);
  if (!match) {
    return null;
  }

  return match[2].trim() || null;
}
