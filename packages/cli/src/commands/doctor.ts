import path from "node:path";
import { scanApp } from "@fiyuu/core";
import { c, existsSync, fs, listSourceFiles, log } from "../shared.js";

interface DoctorIssue {
  file: string;
  rule: string;
  detail: string;
  severity: "error" | "warn";
  fixed?: boolean;
}

export async function runDoctor(rootDirectory: string, appDirectory: string, args: string[] = []): Promise<void> {
  const fix = args.includes("--fix");
  const files = await listSourceFiles(appDirectory);
  const diagnostics: DoctorIssue[] = [];

  for (const filePath of files) {
    const source = await fs.readFile(filePath, "utf8");
    const relative = path.relative(rootDirectory, filePath);

    if (/from\s+["']react["']/.test(source) || /from\s+["']react-dom["']/.test(source)) {
      diagnostics.push({ file: relative, rule: "no-react-imports", detail: "Uses React import. Fiyuu uses GEA (@geajs/core) for components.", severity: "error" });
    }

    if (/\buse(State|Effect|Memo|Reducer|Callback|Ref)\s*\(/.test(source)) {
      diagnostics.push({ file: relative, rule: "no-react-hooks", detail: "Uses React hooks. Use GEA class templates instead.", severity: "error" });
    }

    if (/className\s*=/.test(source)) {
      const nextSource = source.replaceAll("className=", "class=");
      if (fix && nextSource !== source) {
        await fs.writeFile(filePath, nextSource);
        diagnostics.push({ file: relative, rule: "class-attribute", detail: "Replaced `className` with `class` for GEA templates.", severity: "warn", fixed: true });
      } else {
        diagnostics.push({ file: relative, rule: "class-attribute", detail: "Uses `className`. GEA templates use `class`.", severity: "warn" });
      }
    }

    if (/dangerouslySetInnerHTML/.test(source)) {
      diagnostics.push({ file: relative, rule: "unsafe-html", detail: "Uses `dangerouslySetInnerHTML`. Use `html` helper + `escapeHtml` instead.", severity: "error" });
    }

    if (filePath.endsWith("page.tsx")) {
      if (/<img\b/i.test(source)) {
        diagnostics.push({
          file: relative,
          rule: "media-image-helper",
          detail: "Raw <img> detected. Prefer `optimizedImage()` from fiyuu/client for lazy + responsive defaults.",
          severity: "warn",
        });
      }
      if (/<img\b(?![^>]*\balt\s*=)[^>]*>/i.test(source)) {
        diagnostics.push({
          file: relative,
          rule: "media-image-alt",
          detail: "At least one <img> is missing alt attribute.",
          severity: "warn",
        });
      }
      if (/<video\b/i.test(source)) {
        diagnostics.push({
          file: relative,
          rule: "media-video-helper",
          detail: "Raw <video> detected. Prefer `optimizedVideo()` for preload/poster/source hints.",
          severity: "warn",
        });
      }
      if (/<video\b(?![^>]*\bpreload\s*=)[^>]*>/i.test(source)) {
        diagnostics.push({
          file: relative,
          rule: "media-video-preload",
          detail: "At least one <video> is missing preload attribute (recommended: metadata).",
          severity: "warn",
        });
      }
    }

    if (filePath.endsWith("action.ts") && !/export\s+async\s+function\s+execute/.test(source)) {
      if (fix) {
        await fs.writeFile(filePath, `${source.trimEnd()}\n\nexport async function execute(input: Record<string, unknown>) {\n  return { success: true, input };\n}\n`);
        diagnostics.push({ file: relative, rule: "missing-execute", detail: "Added `export async function execute()` to action.ts.", severity: "error", fixed: true });
      } else {
        diagnostics.push({ file: relative, rule: "missing-execute", detail: "action.ts is missing `export async function execute()`.", severity: "error" });
      }
    }

    if (filePath.endsWith("query.ts") && !/export\s+async\s+function\s+execute/.test(source)) {
      if (fix) {
        await fs.writeFile(filePath, `${source.trimEnd()}\n\nexport async function execute() {\n  return {};\n}\n`);
        diagnostics.push({ file: relative, rule: "missing-execute", detail: "Added `export async function execute()` to query.ts.", severity: "error", fixed: true });
      } else {
        diagnostics.push({ file: relative, rule: "missing-execute", detail: "query.ts is missing `export async function execute()`.", severity: "error" });
      }
    }
  }

  const notFoundPath = path.join(appDirectory, "not-found.tsx");
  const errorPath = path.join(appDirectory, "error.tsx");

  if (!existsSync(notFoundPath)) {
    if (fix) {
      await fs.writeFile(notFoundPath, notFoundTemplate());
      diagnostics.push({ file: path.relative(rootDirectory, notFoundPath), rule: "missing-not-found", detail: "Created app/not-found.tsx fallback page.", severity: "warn", fixed: true });
    } else {
      diagnostics.push({ file: path.relative(rootDirectory, notFoundPath), rule: "missing-not-found", detail: "Missing app/not-found.tsx fallback page.", severity: "warn" });
    }
  }

  if (!existsSync(errorPath)) {
    if (fix) {
      await fs.writeFile(errorPath, errorPageTemplate());
      diagnostics.push({ file: path.relative(rootDirectory, errorPath), rule: "missing-error-page", detail: "Created app/error.tsx runtime error page.", severity: "warn", fixed: true });
    } else {
      diagnostics.push({ file: path.relative(rootDirectory, errorPath), rule: "missing-error-page", detail: "Missing app/error.tsx runtime error page.", severity: "warn" });
    }
  }

  const features = await scanApp(appDirectory);
  for (const feature of features) {
    if (!feature.files["meta.ts"]) continue;
    const metaSource = await fs.readFile(feature.files["meta.ts"], "utf8");

    const hasSeoTitle = /seo\s*:\s*\{[\s\S]*title\s*:/m.test(metaSource);
    const hasSeoDescription = /seo\s*:\s*\{[\s\S]*description\s*:/m.test(metaSource);

    if (!hasSeoTitle || !hasSeoDescription) {
      if (fix) {
        const patched = ensureSeoFields(metaSource, feature.route);
        if (patched !== metaSource) {
          await fs.writeFile(feature.files["meta.ts"], patched);
          diagnostics.push({
            file: path.relative(rootDirectory, feature.files["meta.ts"]),
            rule: "seo-fields",
            detail: `Added missing SEO fields for route ${feature.route}.`,
            severity: "warn",
            fixed: true,
          });
        }
      } else {
        if (!hasSeoTitle) diagnostics.push({ file: path.relative(rootDirectory, feature.files["meta.ts"]), rule: "seo-title", detail: `Route ${feature.route} is missing seo.title.`, severity: "warn" });
        if (!hasSeoDescription) diagnostics.push({ file: path.relative(rootDirectory, feature.files["meta.ts"]), rule: "seo-description", detail: `Route ${feature.route} is missing seo.description.`, severity: "warn" });
      }
    }

    const seoDescriptionMatch = metaSource.match(/description\s*:\s*["'`]([^"'`]+)["'`]/m);
    if (seoDescriptionMatch?.[1]) {
      const wordCount = seoDescriptionMatch[1].trim().split(/\s+/).filter(Boolean).length;
      if (wordCount < 12 || wordCount > 28) {
        diagnostics.push({
          file: path.relative(rootDirectory, feature.files["meta.ts"]),
          rule: "seo-description-word-count",
          detail: `Route ${feature.route} SEO description has ${wordCount} words; recommended range is 12-28 words.`,
          severity: "warn",
        });
      }
    }

    if (/noJs\s*:\s*true/.test(metaSource) && feature.files["page.tsx"]) {
      const pageSource = await fs.readFile(feature.files["page.tsx"], "utf8");
      if (/<script[\s>]/.test(pageSource)) {
        diagnostics.push({
          file: path.relative(rootDirectory, feature.files["page.tsx"]),
          rule: "zero-js-violation",
          detail: `Route ${feature.route} declares noJs: true but page.tsx contains <script> tags.`,
          severity: "error",
        });
      }
    }
  }

  // ── Output ─────────────────────────────────────────────────────────────────

  console.log(`\n${c.bold}${c.cyan}Fiyuu Doctor${c.reset}`);
  log("app", appDirectory);

  if (diagnostics.length === 0) {
    log("status", `${c.green}healthy${c.reset} — no issues detected`, c.green);
    return;
  }

  const errors = diagnostics.filter((d) => d.severity === "error");
  const warnings = diagnostics.filter((d) => d.severity === "warn");
  const fixedCount = diagnostics.filter((d) => d.fixed).length;
  log("status", `${errors.length} error(s), ${warnings.length} warning(s)`, errors.length > 0 ? c.red : c.yellow);
  if (fix) log("fix", `${fixedCount} issue(s) auto-fixed`, fixedCount > 0 ? c.green : c.gray);

  for (const issue of diagnostics) {
    const colour = issue.severity === "error" ? c.red : c.yellow;
    const fixedTag = issue.fixed ? ` ${c.green}(fixed)${c.reset}` : "";
    console.log(`  ${colour}${issue.severity}${c.reset}  ${c.dim}[${issue.rule}]${c.reset}  ${issue.file}${fixedTag}`);
    console.log(`         ${c.gray}${issue.detail}${c.reset}`);
  }

  if (!fix) {
    console.log(`\n  ${c.dim}Fix listed files, then rerun ${c.cyan}fiyuu doctor${c.reset}`);
    console.log(`  ${c.dim}Or run ${c.cyan}fiyuu doctor --fix${c.reset} for safe automatic fixes.`);
  }
}

// ── SEO fix helper ─────────────────────────────────────────────────────────────

function ensureSeoFields(metaSource: string, route: string): string {
  const routeName = route === "/" ? "Home" : route.split("/").filter(Boolean).join(" ");
  const normalizedRoute = routeName.charAt(0).toUpperCase() + routeName.slice(1);
  const fallbackTitle = `${normalizedRoute} | Fiyuu`;
  const fallbackDescription = `${normalizedRoute} sayfasi icin performans odakli, hizli ve net deneyim sunan Fiyuu route aciklamasi.`;

  const seoBlock = metaSource.match(/seo\s*:\s*\{([\s\S]*?)\}/m);
  if (seoBlock) {
    let blockBody = seoBlock[1];
    if (!/title\s*:/m.test(blockBody)) blockBody = `\n    title: "${fallbackTitle}",${blockBody}`;
    if (!/description\s*:/m.test(blockBody)) blockBody = `${blockBody}\n    description: "${fallbackDescription}",`;
    return metaSource.replace(seoBlock[0], `seo: {${blockBody}\n  }`);
  }

  const insertion = `  seo: {\n    title: "${fallbackTitle}",\n    description: "${fallbackDescription}",\n  },\n`;
  return metaSource.replace(/\}\s*\);\s*$/, `${insertion});\n`);
}

// ── Page templates ────────────────────────────────────────────────────────────

function notFoundTemplate(): string {
  return `import { Component } from "@geajs/core";
import { escapeHtml, html } from "fiyuu/client";

type NotFoundData = { title?: string; route?: string; method?: string };

export default class NotFoundPage extends Component<{ data?: NotFoundData }> {
  template({ data }: { data?: NotFoundData } = this.props) {
    return html\`
      <main class="min-h-screen w-full px-5 py-8 text-[#30402a]">
        <section class="w-full rounded-2xl border border-[#7a8f6b]/20 bg-[#f8f4ec] p-6">
          <p class="text-xs uppercase tracking-[0.22em] text-[#627356]">404</p>
          <h1 class="mt-3 text-3xl font-semibold text-[#24311f]">
            \${escapeHtml(data?.title ?? "Page not found")}
          </h1>
          <p class="mt-3 text-sm text-[#5a6753]">The requested route is not available in this Fiyuu app.</p>
          <p class="mt-4 text-sm text-[#5a6753]">Route: \${escapeHtml(data?.route ?? "/")}</p>
          <p class="mt-1 text-sm text-[#5a6753]">Method: \${escapeHtml(data?.method ?? "GET")}</p>
        </section>
      </main>
    \`;
  }
}
`;
}

function errorPageTemplate(): string {
  return `import { Component } from "@geajs/core";
import { escapeHtml, html } from "fiyuu/client";

type ErrorData = { message?: string; route?: string; method?: string; stack?: string };

export default class ErrorPage extends Component<{ data?: ErrorData }> {
  template({ data }: { data?: ErrorData } = this.props) {
    const stack = data?.stack ? html\`<pre class="mt-4 overflow-auto rounded-xl border border-[#8f5f5f]/20 bg-[#2a1717] p-3 text-xs text-[#ffe9e9]">\${escapeHtml(data.stack)}</pre>\` : "";
    return html\`
      <main class="min-h-screen w-full px-5 py-8 text-[#3d2b2b]">
        <section class="w-full rounded-2xl border border-[#8f5f5f]/24 bg-[#f7ece7] p-6">
          <p class="text-xs uppercase tracking-[0.22em] text-[#8f5f5f]">500</p>
          <h1 class="mt-3 text-3xl font-semibold text-[#3a2020]">Application error</h1>
          <p class="mt-3 text-sm text-[#684545]">\${escapeHtml(data?.message ?? "Unknown error")}</p>
          <p class="mt-4 text-sm text-[#684545]">Route: \${escapeHtml(data?.route ?? "/")}</p>
          <p class="mt-1 text-sm text-[#684545]">Method: \${escapeHtml(data?.method ?? "GET")}</p>
          \${stack}
        </section>
      </main>
    \`;
  }
}
`;
}
