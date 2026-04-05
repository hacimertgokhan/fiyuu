#!/usr/bin/env node

import { existsSync, realpathSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline/promises";
import { emitKeypressEvents } from "node:readline";
import { stdin as input, stdout as output } from "node:process";

const useColor = output.isTTY;
const ui = {
  reset: color(0),
  olive: color(38, 5, 65),
  moss: color(38, 5, 71),
  cream: color(38, 5, 230),
  muted: color(38, 5, 245),
  success: color(38, 5, 78),
  border: color(38, 5, 101),
  bold: color(1),
};

const [, , projectName, ...flags] = process.argv;

if (!projectName) {
  console.error("Usage: create-fiyuu-app <project-name> [--local] [--yes]");
  process.exit(1);
}

const useLocal = flags.includes("--local");
const useDefaults = flags.includes("--yes");
const currentDirectory = process.cwd();
const targetDirectory = path.resolve(currentDirectory, projectName);
const packageName = toPackageName(projectName);

if (existsSync(targetDirectory)) {
  console.error(`Target directory already exists: ${targetDirectory}`);
  process.exit(1);
}

const frameworkRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const dependencyStrategy = resolveDependencyStrategy(frameworkRoot, useLocal);
const answers = await collectAnswers(useDefaults);

await mkdir(targetDirectory, { recursive: true });
await createProject(targetDirectory, packageName, dependencyStrategy, answers);

renderSuccess(packageName, targetDirectory, answers);

async function collectAnswers(useDefaultsFlag) {
  const defaults = {
    sockets: false,
    database: false,
    encryption: true,
    skills: true,
    selectedSkills: ["product-strategist", "seo-optimizer"],
    theming: true,
    authHints: false,
  };

  if (useDefaultsFlag) {
    return defaults;
  }

  const rl = readline.createInterface({ input, output });

  try {
    renderSetupIntro();
    console.log(`${ui.bold}${ui.moss}Features (space separated)${ui.reset}`);
    console.log(`${ui.muted}Type one or more keys, then Enter. Example: f1 socket${ui.reset}`);

    const result = {
      sockets: defaults.sockets,
      database: defaults.database,
      authHints: defaults.authHints,
      encryption: defaults.encryption,
      skills: defaults.skills,
      selectedSkills: [...defaults.selectedSkills],
      theming: defaults.theming,
    };

    const selectedFeatures = await askInteractiveSelect("Enable optional features", [
      { key: "f1", label: "F1 database" },
      { key: "socket", label: "Socket route" },
      { key: "auth", label: "Auth starter" },
      { key: "encryption", label: "Request encryption" },
      { key: "theme", label: "Integrated theme toggle" },
    ], [
      ...(defaults.encryption ? ["encryption"] : []),
      ...(defaults.theming ? ["theme"] : []),
    ]);

    result.database = selectedFeatures.has("f1");
    result.sockets = selectedFeatures.has("socket");
    result.authHints = selectedFeatures.has("auth");
    result.encryption = selectedFeatures.has("encryption");
    result.theming = selectedFeatures.has("theme");

    console.log("");
    console.log(`${ui.bold}${ui.moss}AI Skills (space separated)${ui.reset}`);
    const selectedSkills = await askInteractiveSelect("Choose starter skills", [
      { key: "product-strategist", label: "Product strategist" },
      { key: "support-triage", label: "Support triage" },
      { key: "seo-optimizer", label: "SEO optimizer" },
    ], defaults.selectedSkills);
    result.selectedSkills = [...selectedSkills];
    result.skills = result.selectedSkills.length > 0;

    renderAnswerSummary(result);
    return result;
  } finally {
    rl.close();
  }
}

async function askMultiSelect(rl, question, options, defaultKeys = []) {
  const optionsText = options
    .map((option) => `${ui.cream}${option.key}${ui.reset}=${ui.muted}${option.label}${ui.reset}`)
    .join(` ${ui.border}|${ui.reset} `);
  const defaultText = defaultKeys.length > 0 ? defaultKeys.join(" ") : "none";
  const prompt = `${ui.border}•${ui.reset} ${ui.cream}${question}${ui.reset}\n  ${optionsText}\n  ${ui.muted}default: ${defaultText}${ui.reset}\n  > `;
  const answer = (await rl.question(prompt)).trim().toLowerCase();
  const tokens = answer.length === 0 ? [...defaultKeys] : answer.split(/\s+/g).filter(Boolean);
  const valid = new Set(options.map((option) => option.key));
  const selected = new Set(tokens.filter((token) => valid.has(token)));
  return selected;
}

async function askInteractiveSelect(question, options, defaultKeys = []) {
  if (!input.isTTY || !output.isTTY) {
    const fakeRl = readline.createInterface({ input, output });
    try {
      return await askMultiSelect(fakeRl, question, options, defaultKeys);
    } finally {
      fakeRl.close();
    }
  }

  emitKeypressEvents(input);
  if (typeof input.setRawMode === "function") {
    input.setRawMode(true);
  }

  let index = 0;
  const selected = new Set(defaultKeys);

  return await new Promise((resolve) => {
    function render() {
      output.write("\x1Bc");
      console.log("");
      console.log(`${ui.bold}${ui.olive}Fiyuu Setup${ui.reset}`);
      console.log(`${ui.border}${"─".repeat(44)}${ui.reset}`);
      console.log(`${ui.bold}${ui.moss}${question}${ui.reset}`);
      console.log(`${ui.muted}Use ↑/↓ to move, space to toggle, enter to confirm.${ui.reset}`);
      console.log("");
      options.forEach((option, optionIndex) => {
        const pointer = optionIndex === index ? `${ui.moss}›${ui.reset}` : " ";
        const mark = selected.has(option.key) ? `${ui.success}[x]${ui.reset}` : `${ui.muted}[ ]${ui.reset}`;
        console.log(`${pointer} ${mark} ${ui.cream}${option.key}${ui.reset} ${ui.muted}- ${option.label}${ui.reset}`);
      });
      console.log("");
    }

    function cleanup() {
      input.off("keypress", onKeypress);
      if (typeof input.setRawMode === "function") {
        input.setRawMode(false);
      }
      console.log("");
    }

    function onKeypress(_str, key) {
      if (key?.name === "up") {
        index = (index - 1 + options.length) % options.length;
        render();
        return;
      }
      if (key?.name === "down") {
        index = (index + 1) % options.length;
        render();
        return;
      }
      if (key?.name === "space") {
        const current = options[index];
        if (current) {
          if (selected.has(current.key)) {
            selected.delete(current.key);
          } else {
            selected.add(current.key);
          }
          render();
        }
        return;
      }
      if (key?.name === "return") {
        cleanup();
        resolve(new Set(selected));
        return;
      }
      if (key?.ctrl && key?.name === "c") {
        cleanup();
        process.exit(1);
      }
    }

    render();
    input.on("keypress", onKeypress);
  });
}

function renderSetupIntro() {
  console.log("");
  console.log(`${ui.bold}${ui.olive}Fiyuu Setup${ui.reset}`);
  console.log(`${ui.border}${"─".repeat(44)}${ui.reset}`);
  console.log(`${ui.muted}Shape your AI-first fullstack starter in a few steps.${ui.reset}`);
  console.log("");
}

function renderAnswerSummary(answers) {
  const entries = [
    ["One-page home", true],
    ["Extra routes", false],
    ["F1 Database", answers.database],
    ["Sockets", answers.sockets],
    ["Auth", answers.authHints],
    ["Request Security", answers.encryption],
    ["Theme", answers.theming],
    ["AI Skills", answers.skills],
  ];

  console.log("");
  console.log(`${ui.bold}${ui.olive}Starter Profile${ui.reset}`);
  for (const [label, enabled] of entries) {
    console.log(`${ui.border}•${ui.reset} ${ui.cream}${label}${ui.reset} ${enabled ? `${ui.success}enabled${ui.reset}` : `${ui.muted}disabled${ui.reset}`}`);
  }
  console.log(`${ui.border}•${ui.reset} ${ui.cream}Skill set${ui.reset} ${ui.muted}${answers.selectedSkills.join(", ") || "none"}${ui.reset}`);
  console.log("");
}

function renderSuccess(packageName, targetDirectory, answers) {
  console.log(`${ui.bold}${ui.success}Created ${packageName}${ui.reset} ${ui.muted}at${ui.reset} ${ui.cream}${targetDirectory}${ui.reset}`);
  console.log("");
  console.log(`${ui.bold}${ui.olive}Next steps${ui.reset}`);
  console.log(`${ui.border}1.${ui.reset} ${ui.cream}cd ${targetDirectory}${ui.reset}`);
  console.log(`${ui.border}2.${ui.reset} ${ui.cream}npm install${ui.reset}`);
  console.log(`${ui.border}3.${ui.reset} ${ui.cream}npm run dev${ui.reset}`);
  console.log("");
  console.log(`${ui.bold}${ui.olive}Selected${ui.reset}`);
  console.log(`${ui.border}•${ui.reset} ${ui.muted}One-page home:${ui.reset} ${ui.success}on${ui.reset}`);
  console.log(`${ui.border}•${ui.reset} ${ui.muted}Extra routes:${ui.reset} ${ui.muted}off${ui.reset}`);
  console.log(`${ui.border}•${ui.reset} ${ui.muted}F1:${ui.reset} ${answers.database ? `${ui.success}on${ui.reset}` : `${ui.muted}off${ui.reset}`}`);
  console.log(`${ui.border}•${ui.reset} ${ui.muted}Socket:${ui.reset} ${answers.sockets ? `${ui.success}on${ui.reset}` : `${ui.muted}off${ui.reset}`}`);
  console.log(`${ui.border}•${ui.reset} ${ui.muted}Theme:${ui.reset} ${answers.theming ? `${ui.success}on${ui.reset}` : `${ui.muted}off${ui.reset}`}`);
  console.log(`${ui.border}•${ui.reset} ${ui.muted}AI:${ui.reset} ${answers.skills ? `${ui.success}on${ui.reset}` : `${ui.muted}off${ui.reset}`}`);
}

function color(...codes) {
  return useColor ? `\u001b[${codes.join(";")}m` : "";
}

function resolveDependencyStrategy(frameworkRoot, useLocalFlag) {
  if (useLocalFlag) {
    return {
      usesLocalFramework: true,
      frameworkDependency: `file:${realpathSync(frameworkRoot).split(path.sep).join("/")}`,
      clientImportModule: "fiyuu/client",
    };
  }

  return {
    usesLocalFramework: false,
    frameworkDependency: null,
    clientImportModule: "@fiyuu/core/client",
  };
}

async function createProject(targetDirectory, packageName, dependencyStrategy, answers) {
  const files = new Map([
    ["package.json", createPackageJson(packageName, dependencyStrategy)],
    ["tsconfig.json", createTsConfig()],
    [".gitignore", "node_modules/\n.fiyuu/\ndist/\n"],
    ["README.md", createReadme(packageName, answers)],
    ["fiyuu.config.ts", createFiyuuConfig(answers)],
    ["app/layout.tsx", createRootLayout()],
    ["app/layout.meta.ts", createRootLayoutMeta()],
    ["app/not-found.tsx", createNotFoundPage()],
    ["app/error.tsx", createErrorPage()],
    ["app/api/health/route.ts", createHealthApiRoute()],
    ["app/meta.ts", createHomeMeta(answers)],
    ["app/query.ts", createHomeQuery(answers)],
    ["app/schema.ts", createHomeSchema(answers)],
    ["app/page.tsx", createHomePage(answers)],
    [".fiyuu/README.md", createDotFiyuuReadme()],
    [".fiyuu/PROJECT.md", createDotFiyuuProject(answers)],
    [".fiyuu/PATHS.md", createDotFiyuuPaths(answers)],
    [".fiyuu/STATES.md", createDotFiyuuStates(answers)],
    [".fiyuu/FEATURES.md", createDotFiyuuFeatures(answers)],
    [".fiyuu/env", createDotFiyuuEnv()],
    [".fiyuu/SECRET", "replace-this-with-a-server-only-secret\n"],
  ]);

  if (answers.selectedSkills.includes("product-strategist")) {
    files.set("skills/product-strategist.md", createProductStrategistSkill());
  }
  if (answers.selectedSkills.includes("support-triage")) {
    files.set("skills/support-triage.md", createSupportTriageSkill());
  }
  if (answers.selectedSkills.includes("seo-optimizer")) {
    files.set("skills/seo-optimizer.md", createSeoOptimizerSkill());
  }

  if (answers.database) {
    files.set("server/f1/schema.f1", createF1Schema());
    files.set("server/f1/index.ts", createF1Index());
    files.set("app/requests/meta.ts", createRequestsMeta(answers));
    files.set("app/requests/query.ts", createRequestsQuery());
    files.set("app/requests/schema.ts", createRequestsSchema());
    files.set("app/requests/page.tsx", createRequestsPage());
  }

  if (answers.authHints) {
    files.set("app/auth/meta.ts", createAuthMeta());
    files.set("app/auth/query.ts", createAuthQuery(answers));
    files.set("app/auth/schema.ts", createAuthSchema());
    files.set("app/auth/action.ts", createAuthAction(answers));
    files.set("app/auth/page.tsx", createAuthPage());
    files.set("app/api/auth/session/route.ts", createAuthSessionApiRoute(answers));
  }

  if (answers.sockets) {
    files.set("server/socket.ts", createSocketServer());
    files.set("app/live/meta.ts", createLiveMeta(answers));
    files.set("app/live/query.ts", createLiveQuery());
    files.set("app/live/schema.ts", createLiveSchema());
    files.set("app/live/page.tsx", createLivePage());
  }

  if (answers.encryption) {
    files.set("server/crypto.ts", createServerCrypto());
    files.set("lib/client-crypto.ts", createClientCrypto());
  }

  for (const [relativePath, rawContent] of files) {
    const absolutePath = path.join(targetDirectory, relativePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    const content = rawContent.replaceAll('"fiyuu/client"', `"${dependencyStrategy.clientImportModule}"`);
    await writeFile(absolutePath, content);
  }
}

function createPackageJson(projectName, dependencyStrategy) {
  const { usesLocalFramework, frameworkDependency } = dependencyStrategy;
  const includeSockets = false;

  return `${JSON.stringify(
    {
      name: projectName,
      version: "0.1.0",
      private: true,
      type: "module",
      scripts: {
        dev: "npx fiyuu dev",
        build: "npx fiyuu build",
        start: "npx fiyuu start",
      },
      dependencies: {
        fiyuu: usesLocalFramework ? frameworkDependency : "^0.2.0",
        "@geajs/core": "^1.1.3",
        ...(includeSockets ? { ws: "^8.18.1" } : {}),
        zod: "^3.24.2",
      },
      devDependencies: {
        "@types/node": "^22.13.10",
        ...(includeSockets ? { "@types/ws": "^8.5.14" } : {}),
      },
    },
    null,
    2,
  )}\n`;
}

function toPackageName(projectName) {
  const rawName = path.basename(projectName);
  return rawName.toLowerCase().replace(/[^a-z0-9-_]/g, "-");
}

function createTsConfig() {
  return `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "jsx": "preserve",
    "jsxImportSource": "@geajs/core",
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "."
  },
  "include": ["app/**/*.ts", "app/**/*.tsx", "server/**/*.ts", "lib/**/*.ts", "fiyuu.config.ts"]
}\n`;
}

function createReadme(projectName, answers) {
  const optionalLines = [];

  if (answers.sockets) optionalLines.push("- /live -> websocket-powered live counter example");
  if (answers.database) optionalLines.push("- /requests -> F1-backed global request list example");
  if (answers.authHints) optionalLines.push("- /auth -> F1-backed auth starter example");
  optionalLines.push("- /api/health -> app router backend endpoint");
  if (answers.database) optionalLines.push("- server/f1 -> lightweight F1 data layer scaffold");
  if (answers.database) optionalLines.push("- .fiyuu/data/f1.json -> persistent lightweight database file");
  if (answers.sockets) optionalLines.push("- server/socket.ts -> realtime server scaffold");
  if (answers.encryption) optionalLines.push("- server/crypto.ts and lib/client-crypto.ts -> request protection helpers");
  if (answers.skills) optionalLines.push("- skills/ -> AI prompts for product and support workflows");
  if (answers.theming) optionalLines.push("- built-in light/dark theme toggle with localStorage persistence");

  return `# ${projectName}

Generated with create-fiyuu-app.

## Commands

- npm run dev
- npm run build
- npm run start
- npx fiyuu feat list
- npx fiyuu feat socket on|off

## Starter Routes

- / -> Fiyuu one-page home
${optionalLines.join("\n")}

## Notes

- Folder-based routing lives directly under app/
- This starter ships with only the root page by default
- Root and nested layouts are supported with app/layout.tsx and layout.meta.ts
- Custom fallback views can be edited at app/not-found.tsx and app/error.tsx
- Backend route handlers live under app/api/**/route.ts
- Middleware is optional and can be added later under app/middleware.ts
- Optional features can be toggled later with fiyuu feat ...
- Runtime environment lives in .fiyuu/env and .fiyuu/SECRET
- AI-readable markdown docs live in .fiyuu/PROJECT.md, .fiyuu/PATHS.md, .fiyuu/STATES.md, and .fiyuu/FEATURES.md
- Client-visible transport obfuscation reduces readability, but absolute secrecy still requires server-only keys and HTTPS
- UI layer is Gea-first (@geajs/core) with compile-time JSX output
`;
}

function createFiyuuConfig(answers) {
  return `export default {
  app: {
    name: "Fiyuu App",
    runtime: "node",
    port: 4050,
  },
  ai: {
    enabled: ${String(answers.skills)},
    skillsDirectory: "./skills",
    defaultSkills: ${JSON.stringify(answers.selectedSkills)},
    graphContext: true,
  },
  fullstack: {
    client: true,
    serverActions: true,
    serverQueries: true,
    sockets: ${String(answers.sockets)},
  },
  data: {
    driver: ${JSON.stringify(answers.database ? "f1" : "none")},
    path: "./server/f1/schema.f1",
  },
  security: {
    requestEncryption: ${String(answers.encryption)},
    serverSecretFile: "./.fiyuu/SECRET",
  },
  middleware: {
    enabled: ${String(answers.authHints)},
  },
  websocket: {
    enabled: ${String(answers.sockets)},
    path: "/__fiyuu/ws",
    heartbeatMs: 15000,
    maxPayloadBytes: 65536,
  },
  developerTools: {
    enabled: true,
    renderTiming: true,
  },
  observability: {
    requestId: true,
    warningsAsOverlay: true,
  },
  auth: {
    enabled: ${String(answers.authHints)},
    sessionStrategy: "cookie",
  },
  analytics: {
    enabled: true,
    provider: "console",
  },
  featureFlags: {
    enabled: true,
    defaults: {
      onboardingRevamp: true,
      realtimeCounter: ${String(answers.sockets)},
      requestInspector: ${String(answers.database)},
    },
  },
} as const;
`;
}

function createAppMiddleware(answers) {
  return `type MiddlewareContext = {
  url: URL;
  responseHeaders: Record<string, string>;
  requestId: string;
  warnings: string[];
};

type MiddlewareNext = () => Promise<void>;

const requestHeaders = async (context: MiddlewareContext, next: MiddlewareNext) => {
  context.responseHeaders["x-fiyuu-route"] = context.url.pathname;
  if (context.requestId) {
    context.responseHeaders["x-fiyuu-request-id"] = context.requestId;
  }
  await next();
};

const authGuard = async (context: MiddlewareContext, next: MiddlewareNext) => {
  ${answers.authHints ? 'if (context.url.pathname.startsWith("/requests")) {\n    context.responseHeaders["x-fiyuu-guard"] = "active";\n  }' : ""}
  await next();
};

const warningsHeader = async (context: MiddlewareContext, next: MiddlewareNext) => {
  if (context.warnings.length > 0) {
    context.responseHeaders["x-fiyuu-warnings"] = String(context.warnings.length);
  }
  await next();
};

export const middleware = [requestHeaders, authGuard, warningsHeader];
`;
}

function createRootLayout() {
  return `import { Component } from "@geajs/core";
import { defineLayout, html, type LayoutProps } from "fiyuu/client";

export const layout = defineLayout({
  name: "root",
});

export default class RootLayout extends Component<LayoutProps> {
  template({ children }: LayoutProps = this.props) {
    return html\`<div class="min-h-screen bg-[#f7f3ea] text-[#33412f] dark:bg-[#111513] dark:text-[#e8f1ea]">\${children ?? ""}</div>\`;
  }
}
`;
}

function createRootLayoutMeta() {
  return `import { defineMeta } from "fiyuu/client";

export default defineMeta({
  intent: "Root layout for the Fiyuu starter application",
  title: "Fiyuu",
  seo: {
    title: "Fiyuu - AI-first fullstack framework",
    description: "Fiyuu starter with layouts, metadata, realtime, auth, and API routes.",
  },
});
`;
}

function createNotFoundPage() {
  return `import { Component } from "@geajs/core";
import { escapeHtml, html } from "fiyuu/client";

type NotFoundData = {
  title?: string;
  route?: string;
  method?: string;
};

export default class NotFoundPage extends Component<{ data?: NotFoundData }> {
  template({ data }: { data?: NotFoundData } = this.props) {
    return html\`
      <main class="min-h-screen w-full px-5 py-8 text-[#30402a]">
        <section class="w-full rounded-2xl border border-[#7a8f6b]/20 bg-[#f8f4ec] p-6">
          <p class="text-xs uppercase tracking-[0.22em] text-[#627356]">404</p>
          <h1 class="mt-3 text-3xl font-semibold text-[#24311f]">\${escapeHtml(data?.title ?? "Page not found")}</h1>
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

function createErrorPage() {
  return `import { Component } from "@geajs/core";
import { escapeHtml, html } from "fiyuu/client";

type ErrorData = {
  message?: string;
  route?: string;
  method?: string;
  stack?: string;
};

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

function createHealthApiRoute() {
  return `export async function GET() {
  return {
    ok: true,
    service: "fiyuu-app",
    timestamp: new Date().toISOString(),
  };
}
`;
}

function createAuthSessionApiRoute(answers) {
  const source = answers.database ? 'import { listSessions } from "../../../../server/f1/index.js";\n' : "";
  const body = answers.database ? '  return { sessions: await listSessions() };\n' : '  return { sessions: [] };\n';
  return `${source}export async function GET() {
${body}}
`;
}

function createAnalyticsModule() {
  return `export function track(event: string, payload: Record<string, unknown> = {}) {
  if (typeof window !== "undefined") {
    console.info("[fiyuu:analytics]", event, payload);
    return;
  }

  console.info("[fiyuu:analytics:server]", event, payload);
}
`;
}

function createFeatureFlagsModule() {
  return `const flags = {
  onboardingRevamp: true,
  realtimeCounter: true,
  requestInspector: true,
} as const;

export function isFeatureEnabled(name: keyof typeof flags): boolean {
  return flags[name];
}

export function listFeatureFlags() {
  return flags;
}
`;
}

function createDotFiyuuEnv() {
  return `APP_NAME=Fiyuu App
APP_ENV=development
FIYUU_PUBLIC_APP_NAME=Fiyuu App
`;
}

function createDotFiyuuReadme() {
  return `# .fiyuu

This directory stores Fiyuu-managed runtime artifacts and server-only secrets.

- env -> environment variables loaded by Fiyuu
- SECRET -> server-only secret material
- PROJECT.md -> AI-readable project summary
- PATHS.md -> AI-readable route and file map
- STATES.md -> AI-readable structural state map
- FEATURES.md -> AI-readable startup feature inventory
- graph.json -> generated project graph
- build.json -> generated runtime build manifest

Do not expose SECRET to the browser bundle.
`;
}

function createDotFiyuuFeatures(answers) {
  return `# Features

## Startup Defaults

- analytics: enabled
- feature flags: enabled
- developer tools: enabled in dev
- request timing: enabled
- middleware/auth guard: ${answers.authHints ? "enabled" : "disabled"}
- websocket example: ${answers.sockets ? "enabled" : "disabled"}
- f1 requests example: ${answers.database ? "enabled" : "disabled"}
`;
}

function createDotFiyuuProject(answers) {
  return `# Project

AI-readable project summary for the starter app.

## Identity

- framework: Fiyuu
- style: AI-first fullstack framework
- primary route: /

## Capabilities

- websocket: ${answers.sockets ? "enabled" : "disabled"}
- f1 database: ${answers.database ? "enabled" : "disabled"}
- request protection helpers: ${answers.encryption ? "enabled" : "disabled"}
- skills: ${answers.skills ? "enabled" : "disabled"}
- middleware/auth guards: ${answers.authHints ? "enabled" : "disabled"}
`;
}

function createDotFiyuuPaths(answers) {
  return `# Paths

## Route Folders

- / -> app/
${answers.sockets ? "- /live -> app/live/" : ""}
${answers.database ? "- /requests -> app/requests/" : ""}
${answers.authHints ? "- /auth -> app/auth/" : ""}

## Fixed Files

- page.tsx -> route UI entry
- meta.ts -> route metadata and render mode
- schema.ts -> input/output contract
- query.ts -> read-side logic
- action.ts -> write-side logic

## Backend Paths

- server/socket.ts -> websocket scaffold ${answers.sockets ? "present" : "optional"}
- server/f1/ -> F1 data scaffold ${answers.database ? "present" : "optional"}
- server/crypto.ts -> server request protection ${answers.encryption ? "present" : "optional"}
- lib/client-crypto.ts -> client request protection ${answers.encryption ? "present" : "optional"}
`;
}

function createDotFiyuuStates(answers) {
  return `# States

## Runtime

- default port: 4050
- render mode for /: csr
- websocket configured: ${answers.sockets ? "yes" : "no"}
- live websocket example route: ${answers.sockets ? "/live" : "not generated"}
- f1 requests example route: ${answers.database ? "/requests" : "not generated"}
- auth example route: ${answers.authHints ? "/auth" : "not generated"}

## Security

- secret source: .fiyuu/SECRET
- env source: .fiyuu/env
- request obfuscation helpers: ${answers.encryption ? "yes" : "no"}

## AI

- graph context: yes
- skills directory: ${answers.skills ? "skills/" : "not enabled"}
`;
}

function createProductStrategistSkill() {
  return `# Product Strategist

Use this skill when planning new features inside a Fiyuu app.

## Focus

- map goals to route folders
- define intent before implementation
- outline query and action contracts first
- preserve AI-readable structure
`;
}

function createSupportTriageSkill() {
  return `# Support Triage

Use this skill when debugging incidents or handling customer-facing issues.

## Focus

- inspect the route folder first
- separate schema, query, action, and UI failures
- keep fixes deterministic
- document intent changes when behavior changes
`;
}

function createSeoOptimizerSkill() {
  return `# SEO Optimizer

Use this skill when improving discoverability and social previews.

## Focus

- check every route for seo.title and seo.description
- keep titles specific and concise
- keep descriptions clear and action-oriented
- flag duplicate title/description combinations
- suggest schema-ready copy improvements
`;
}

function createHomeAction(answers) {
  const maybeF1 = answers.database ? 'import { saveTodoDraft } from "../server/f1/index.js";\n' : "";
  const maybeBody = answers.database
    ? "  await saveTodoDraft(input.title);\n"
    : "";

  return `import { z } from "zod";
import { defineAction } from "fiyuu/client";
${maybeF1}
export const action = defineAction({
  input: z.object({
    title: z.string().min(1),
  }),
  output: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
  description: "Accepts a new todo title for future server-side persistence",
});

export async function execute({ input }: { input: { title: string } }) {
${maybeBody}  return {
    success: true,
    message: \`Queued todo: \${input.title}\`,
  };
}
`;
}

function createHomeMeta(answers) {
  return `import { defineMeta } from "fiyuu/client";

export default defineMeta({
  intent: "Home page introducing the Fiyuu framework with a calm starter experience",
  title: "Home",
  render: "ssr",
  seo: {
    title: "Fiyuu Starter",
    description: "Gea-first one-page starter for AI-readable fullstack projects.",
  },
});
`;
}

function createHomeQuery(answers) {
  const skills = answers.selectedSkills;

  return `import { z } from "zod";
import { defineQuery } from "fiyuu/client";

export const query = defineQuery({
  input: z.object({}),
  output: z.object({
    stats: z.array(
      z.object({
        label: z.string(),
        value: z.string(),
      }),
    ),
    skills: z.array(z.string()),
  }),
  description: "Loads the starter content for the Fiyuu home page",
});

export async function execute() {
  return {
    stats: [
      { label: "Layout", value: "One page" },
      { label: "Viewport", value: "100% screen" },
      { label: "Render", value: "SSR" },
      { label: "Devtools", value: "Built in" },
    ],
    skills: ${JSON.stringify(skills)},
  };
}
`;
}

function createLiveMeta(answers) {
  return `import { defineMeta } from "fiyuu/client";

export default defineMeta({
  intent: "Live counter page demonstrating websocket updates",
  title: "Live",
  render: "csr",
  seo: {
    title: "Live Counter - Fiyuu",
    description: "Realtime websocket example built with Fiyuu.",
  },
});
`;
}

function createLiveQuery() {
  return `import { z } from "zod";
import { defineQuery } from "fiyuu/client";

export const query = defineQuery({
  input: z.object({}),
  output: z.object({
    initialCount: z.number(),
    channel: z.string(),
  }),
  description: "Loads starter websocket metadata for the live counter route",
});

export async function execute() {
  return {
    initialCount: 0,
    channel: "updates",
  };
}
`;
}

function createLiveSchema() {
  return `import { z } from "zod";

export const input = z.object({});

export const output = z.object({
  initialCount: z.number(),
  channel: z.string(),
});

export const description = "Loads starter websocket metadata for the live counter route";
`;
}

function createLivePage() {
  return `import { Component } from "@geajs/core";
import { definePage, escapeHtml, html, type PageProps } from "fiyuu/client";

type LiveData = {
  initialCount: number;
  channel: string;
};

export const page = definePage({
  intent: "Live counter page demonstrating websocket updates",
});

export default class Page extends Component<PageProps<LiveData>> {
  template({ data }: PageProps<LiveData> = this.props) {
    const script = "const count=document.getElementById('fiyuu-live-count');const status=document.getElementById('fiyuu-live-status');const protocol=location.protocol==='https:'?'wss':'ws';const path='__FIYUU_WS_PATH__'.replace('__FIYUU_WS_PATH__','/__fiyuu/ws');const socket=new WebSocket(protocol+'://'+location.host+path);const fail=()=>{if(status)status.textContent='unavailable';};const timeout=setTimeout(fail,3500);socket.addEventListener('open',()=>{clearTimeout(timeout);if(status)status.textContent='connected';});socket.addEventListener('error',()=>{clearTimeout(timeout);fail();});socket.addEventListener('close',()=>{if(status&&status.textContent!=='unavailable')status.textContent='closed';});socket.addEventListener('message',(event)=>{try{const payload=JSON.parse(event.data);if(payload&&payload.type==='counter:tick'&&typeof payload.count==='number'&&count){count.textContent=String(payload.count);}}catch{if(status)status.textContent='message-error';}});";
    return html\`
      <main class="min-h-screen w-full px-6 py-12 text-[#31402b]">
        <div class="w-full rounded-[2rem] border border-[#7a8f6b]/20 bg-white/70 p-8">
          <div class="text-xs uppercase tracking-[0.24em] text-[#6d805f]">Realtime Example</div>
          <h1 class="mt-4 text-4xl font-semibold text-[#24311f]">Live Counter</h1>
          <p class="mt-4 max-w-2xl text-lg leading-8 text-[#5f6d58]">This route listens to the starter websocket server and updates a counter in real time.</p>
          <div class="mt-8 grid gap-4 sm:grid-cols-2">
            <div class="rounded-3xl bg-[#31402b] p-8 text-[#f7f3ea]"><div class="text-xs uppercase tracking-[0.2em] text-[#cdd7c6]">Channel</div><div class="mt-3 text-3xl font-semibold">\${escapeHtml(data?.channel ?? "updates")}</div></div>
            <div class="rounded-3xl border border-[#7a8f6b]/20 bg-[#fcfaf5] p-8"><div class="text-xs uppercase tracking-[0.2em] text-[#7a8b71]">Live Count</div><div id="fiyuu-live-count" class="mt-3 text-5xl font-semibold text-[#24311f]">\${String(data?.initialCount ?? 0)}</div><div class="mt-3 text-sm text-[#61705b]">Socket status: <span id="fiyuu-live-status">connecting</span></div></div>
          </div>
        </div>
      </main>
      <script type="module">\${script}</script>
    \`;
  }
}
`;
}

function createRequestsMeta(answers) {
  return `import { defineMeta } from "fiyuu/client";

export default defineMeta({
  intent: "Request list page showing records from the F1 starter store",
  title: "Requests",
  render: "ssr",
  seo: {
    title: "Requests - Fiyuu",
    description: "F1-backed request list example in the Fiyuu starter.",
  },
});
`;
}

function createRequestsQuery() {
  return `import { z } from "zod";
import { defineQuery } from "fiyuu/client";
import { listRequests } from "../../server/f1/index.js";

export const query = defineQuery({
  input: z.object({}),
  output: z.object({
    requests: z.array(
      z.object({
        id: z.string(),
        route: z.string(),
        method: z.string(),
        source: z.string(),
      }),
    ),
  }),
  description: "Loads request records from the F1 starter store",
});

export async function execute() {
  return {
    requests: await listRequests(),
  };
}
`;
}

function createRequestsSchema() {
  return `import { z } from "zod";

export const input = z.object({});

export const output = z.object({
  requests: z.array(
    z.object({
      id: z.string(),
      route: z.string(),
      method: z.string(),
      source: z.string(),
    }),
  ),
});

export const description = "Loads request records from the F1 starter store";
`;
}

function createRequestsPage() {
  return `import { Component } from "@geajs/core";
import { definePage, escapeHtml, html, type PageProps } from "fiyuu/client";

type RequestsData = {
  requests: Array<{
    id: string;
    route: string;
    method: string;
    source: string;
  }>;
};

export const page = definePage({
  intent: "Request list page showing records from the F1 starter store",
});

export default class Page extends Component<PageProps<RequestsData>> {
  template({ data }: PageProps<RequestsData> = this.props) {
    const baseRequests = data?.requests ?? [];
    const rows = Array.from({ length: 400 }, (_, index) =>
      baseRequests[index % (baseRequests.length || 1)] ?? { id: "n/a", route: "/", method: "GET", source: "empty" },
    );
    const rowsHtml = rows
      .map(
        (request, index) => html\`<div class="grid grid-cols-[1.2fr_1fr_1fr_1fr] gap-4 border-b border-[#7a8f6b]/10 px-6 py-4 text-sm text-[#364330]"><div>\${escapeHtml(request.id)}-\${index}</div><div>\${escapeHtml(request.route)}</div><div>\${escapeHtml(request.method)}</div><div>\${escapeHtml(request.source)}</div></div>\`,
      )
      .join("");

    return html\`
      <main class="min-h-screen bg-[#f7f3ea] px-6 py-12 text-[#31402b]">
        <div class="mx-auto max-w-6xl rounded-[2rem] border border-[#7a8f6b]/20 bg-white/70 p-8">
          <div class="text-xs uppercase tracking-[0.24em] text-[#6d805f]">F1 Example</div>
          <h1 class="mt-4 text-4xl font-semibold text-[#24311f]">Global Request List</h1>
          <p class="mt-4 max-w-2xl text-lg leading-8 text-[#5f6d58]">This route reads starter records from the lightweight F1 store and renders a deterministic list in Gea mode.</p>
          <div class="mt-6 rounded-2xl bg-[#edf3e7] px-4 py-4 text-sm text-[#4d5d47]">Rows rendered: \${rows.length}</div>
          <div class="mt-8 overflow-hidden rounded-3xl border border-[#7a8f6b]/15 bg-[#fcfaf5]">
            <div class="grid grid-cols-[1.2fr_1fr_1fr_1fr] gap-4 border-b border-[#7a8f6b]/10 px-6 py-4 text-xs uppercase tracking-[0.2em] text-[#7a8b71]"><div>ID</div><div>Route</div><div>Method</div><div>Source</div></div>
            \${rowsHtml}
          </div>
        </div>
      </main>
    \`;
  }
}
`;
}

function createAuthMeta() {
  return `import { defineMeta } from "fiyuu/client";

export default defineMeta({
  intent: "Auth page demonstrating F1-backed users and sessions",
  title: "Auth",
  render: "ssr",
  seo: {
    title: "Auth - Fiyuu",
    description: "Working username and password auth example with F1 sessions.",
  },
});
`;
}

function createAuthQuery(answers) {
  const source = answers.database
    ? 'import { listSessions, listUsers } from "../../server/f1/index.js";\n'
    : "";
  const body = answers.database
    ? '  return {\n    users: await listUsers(),\n    sessions: await listSessions(),\n    hint: { username: "founder", password: "fiyuu123" },\n  };\n'
    : '  return { users: [], sessions: [], hint: { username: "founder", password: "fiyuu123" } };\n';

  return `import { z } from "zod";
import { defineQuery } from "fiyuu/client";
${source}
export const query = defineQuery({
  input: z.object({}),
  output: z.object({
    users: z.array(z.object({ id: z.string(), username: z.string(), role: z.string() })),
    sessions: z.array(z.object({ id: z.string(), userId: z.string(), status: z.string() })),
    hint: z.object({ username: z.string(), password: z.string() }),
  }),
  description: "Loads starter auth data from the F1 store",
});

export async function execute() {
${body}}
`;
}

function createAuthSchema() {
  return `import { z } from "zod";

export const input = z.object({});

export const output = z.object({
  users: z.array(z.object({ id: z.string(), username: z.string(), role: z.string() })),
  sessions: z.array(z.object({ id: z.string(), userId: z.string(), status: z.string() })),
  hint: z.object({ username: z.string(), password: z.string() }),
});

export const description = "Loads starter auth data from the F1 store";
`;
}

function createAuthAction(answers) {
  const source = answers.database ? 'import { signIn } from "../../server/f1/index.js";\n' : "";
  const body = answers.database
    ? '  return signIn(input.username, input.password);\n'
    : '  return { success: true, message: "Signed in successfully", session: { id: "demo-session", userId: "demo-user", status: "active" }, user: { id: "demo-user", username: input.username, role: "member" } };\n';

  return `import { z } from "zod";
import { defineAction } from "fiyuu/client";
${source}
export const action = defineAction({
  input: z.object({
    username: z.string().min(1),
    password: z.string().min(1),
  }),
  output: z.object({
    success: z.boolean(),
    message: z.string(),
    session: z.object({ id: z.string(), userId: z.string(), status: z.string() }).nullable(),
    user: z.object({ id: z.string(), username: z.string(), role: z.string() }).nullable(),
  }),
  description: "Creates a starter auth session with username and password",
});

export async function execute({ input }: { input: { username: string; password: string } }) {
${body}}
`;
}

function createAuthPage() {
  return `import { Component } from "@geajs/core";
import { definePage, escapeHtml, html, type PageProps } from "fiyuu/client";

type AuthData = {
  users: Array<{ id: string; username: string; role: string }>;
  sessions: Array<{ id: string; userId: string; status: string }>;
  hint: { username: string; password: string };
};

export const page = definePage({
  intent: "Auth page demonstrating F1-backed users and sessions",
});

export default class Page extends Component<PageProps<AuthData>> {
  template({ data }: PageProps<AuthData> = this.props) {
    const usersHtml = (data?.users ?? [])
      .map((user) => html\`<div class="rounded-2xl border border-[#7a8f6b]/10 px-4 py-4 text-sm"><div class="font-medium text-[#24311f]">\${escapeHtml(user.username)}</div><div class="mt-1 text-[#61705b]">\${escapeHtml(user.role)} · \${escapeHtml(user.id)}</div></div>\`)
      .join("");
    const sessionsHtml = (data?.sessions ?? [])
      .map((session) => html\`<div class="rounded-2xl border border-white/10 px-4 py-4 text-sm"><div class="font-medium">\${escapeHtml(session.id)}</div><div class="mt-1 text-[#dbe5d4]">\${escapeHtml(session.userId)} · \${escapeHtml(session.status)}</div></div>\`)
      .join("");
    const script = "const form=document.getElementById('fiyuu-auth-form');const username=document.getElementById('fiyuu-auth-username');const password=document.getElementById('fiyuu-auth-password');const result=document.getElementById('fiyuu-auth-result');const submit=document.getElementById('fiyuu-auth-submit');form&&form.addEventListener('submit',async(event)=>{event.preventDefault();if(!username||!password||!result||!submit)return;submit.setAttribute('disabled','true');result.textContent='Signing in...';const response=await fetch('/auth',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username:username.value,password:password.value})});const payload=await response.json();result.textContent=payload.message||'Finished';submit.removeAttribute('disabled');if(payload.success){location.reload();}});";

    return html\`
      <main class="min-h-screen w-full bg-[#f7f3ea] px-6 py-12 text-[#31402b]">
        <div class="w-full rounded-[2rem] border border-[#7a8f6b]/20 bg-white/70 p-8">
          <div class="text-xs uppercase tracking-[0.24em] text-[#6d805f]">Auth Example</div>
          <h1 class="mt-4 text-4xl font-semibold text-[#24311f]">F1-backed Auth Starter</h1>
          <p class="mt-4 max-w-2xl text-lg leading-8 text-[#5f6d58]">This route shows how user and session records can live in the F1 store while your UI stays inside the same deterministic feature structure.</p>
          <div class="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <section class="rounded-3xl border border-[#7a8f6b]/15 bg-[#fcfaf5] p-6"><h2 class="text-lg font-semibold text-[#24311f]">Sign in</h2><p class="mt-2 text-sm text-[#61705b]">Use the default starter account to test a working username/password flow.</p><div class="mt-4 rounded-2xl bg-[#eef4e8] px-4 py-4 text-sm text-[#44513f]">username: <strong>\${escapeHtml(data?.hint.username ?? "founder")}</strong><br/>password: <strong>\${escapeHtml(data?.hint.password ?? "fiyuu123")}</strong></div><form id="fiyuu-auth-form" class="mt-5 space-y-3"><input id="fiyuu-auth-username" name="username" value="\${escapeHtml(data?.hint.username ?? "founder")}" placeholder="Username" class="w-full rounded-2xl border border-[#7a8f6b]/20 bg-white px-4 py-3 outline-none"/><input id="fiyuu-auth-password" name="password" value="\${escapeHtml(data?.hint.password ?? "fiyuu123")}" type="password" placeholder="Password" class="w-full rounded-2xl border border-[#7a8f6b]/20 bg-white px-4 py-3 outline-none"/><button id="fiyuu-auth-submit" type="submit" class="rounded-2xl bg-[#31402b] px-5 py-3 text-sm font-medium text-[#f7f3ea]">Sign in</button></form><div id="fiyuu-auth-result" class="mt-4 text-sm text-[#55654e]"></div></section>
            <section class="rounded-3xl border border-[#7a8f6b]/15 bg-[#fcfaf5] p-6"><h2 class="text-lg font-semibold text-[#24311f]">Users</h2><div class="mt-4 space-y-3">\${usersHtml}</div></section>
            <section class="rounded-3xl bg-[#31402b] p-6 text-[#f7f3ea]"><h2 class="text-lg font-semibold">Sessions</h2><div class="mt-4 space-y-3">\${sessionsHtml}</div></section>
          </div>
        </div>
      </main>
      <script type="module">\${script}</script>
    \`;
  }
}
`;
}

function createHomeSchema() {
  return `import { z } from "zod";

export const input = z.object({});

export const output = z.object({
  stats: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
    }),
  ),
  skills: z.array(z.string()),
});

export const description = "Loads the starter content for the Fiyuu home page";
`;
}

function createHomePage(answers) {
  const themeMainClasses = answers.theming
    ? 'min-h-screen bg-[linear-gradient(180deg,#f7f3ea_0%,#f1ebde_58%,#e9e0d0_100%)] px-4 py-4 text-[#33412f] dark:bg-[linear-gradient(180deg,#121614_0%,#171f1a_100%)] dark:text-[#e6efe8] sm:px-6 sm:py-5'
    : 'min-h-screen bg-[linear-gradient(180deg,#f7f3ea_0%,#f1ebde_58%,#e9e0d0_100%)] px-4 py-4 text-[#33412f] sm:px-6 sm:py-5';
  const themeSectionClasses = answers.theming
    ? 'flex min-h-[calc(100vh-2rem)] w-full flex-col justify-between rounded-[1.5rem] border border-[#7a8f6b]/20 bg-[#f8f4ec]/80 p-5 dark:border-[#4f6756]/35 dark:bg-[#1b241f]/90 sm:min-h-[calc(100vh-2.5rem)] sm:p-7'
    : 'flex min-h-[calc(100vh-2rem)] w-full flex-col justify-between rounded-[1.5rem] border border-[#7a8f6b]/20 bg-[#f8f4ec]/80 p-5 sm:min-h-[calc(100vh-2.5rem)] sm:p-7';
  const themeNav = answers.theming
    ? '<nav class="flex items-center justify-between"><p class="text-xs uppercase tracking-[0.22em] text-[#627356] dark:text-[#95b39d]">Fiyuu starter</p><button id="fiyuu-theme-toggle" type="button" class="rounded-full border border-[#7a8f6b]/20 px-3 py-1 text-xs text-[#43523f] dark:border-[#6f8d77]/30 dark:text-[#d1e3d6]">Dark</button></nav>'
    : '<p class="text-xs uppercase tracking-[0.22em] text-[#627356]">Fiyuu starter</p>';
  const themeScript = answers.theming
    ? "const root=document.documentElement;const button=document.getElementById('fiyuu-theme-toggle');const saved=localStorage.getItem('fiyuu-theme');const initial=saved||'light';if(initial==='dark'){root.classList.add('dark');}if(button){button.textContent=root.classList.contains('dark')?'Light':'Dark';button.addEventListener('click',()=>{const next=root.classList.contains('dark')?'light':'dark';root.classList.toggle('dark',next==='dark');localStorage.setItem('fiyuu-theme',next);button.textContent=next==='dark'?'Light':'Dark';});}"
    : "";
  return `import { Component } from "@geajs/core";
import { definePage, escapeHtml, html, type PageProps } from "fiyuu/client";

type HomeData = {
  stats: Array<{
    label: string;
    value: string;
  }>;
  skills: string[];
};

export const page = definePage({
  intent: "Minimal one-page home route for a focused Fiyuu starter",
});

export default class Page extends Component<PageProps<HomeData>> {
  template({ data }: PageProps<HomeData> = this.props) {
    const statsHtml = (data?.stats ?? [])
      .map(
        (item) => html\`<div class="rounded-xl border border-[#7a8f6b]/18 bg-[#fcfaf5] px-4 py-3"><p class="text-[11px] uppercase tracking-[0.2em] text-[#708067]">\${escapeHtml(item.label)}</p><p class="mt-1 text-2xl font-semibold text-[#263320]">\${escapeHtml(item.value)}</p></div>\`,
      )
      .join("");
    const skillsHtml = (data?.skills ?? [])
      .map((skill) => html\`<span class="rounded-full border border-[#7a8f6b]/20 px-3 py-1 text-xs text-[#44513f]">\${escapeHtml(skill)}</span>\`)
      .join("");
    const explainHtml = [
      { title: "Single structure", body: "Routes, queries, actions, and metadata live in predictable folders." },
      { title: "AI-readable", body: "Project docs and contracts stay explicit so assistants can reason safely." },
      { title: "Gea-first runtime", body: "Rendering is optimized for Gea components with deterministic behavior." },
    ]
      .map((item) => html\`<article class="rounded-xl border border-[#7a8f6b]/16 bg-[#fcfaf5] px-4 py-4"><h2 class="text-sm font-semibold text-[#24311f]">\${item.title}</h2><p class="mt-2 text-sm leading-6 text-[#5c6955]">\${item.body}</p></article>\`)
      .join("");
    return html\`
      <main class="${themeMainClasses}">
        <section class="${themeSectionClasses}">
          ${themeNav}
          <header>
            <h1 class="mt-3 text-4xl font-semibold tracking-tight text-[#24311f] dark:text-[#ecf5ef] sm:text-5xl lg:text-6xl">Fiyuu is a structured fullstack framework for humans and AI.</h1>
            <p class="mt-4 max-w-4xl text-base leading-7 text-[#56654e] dark:text-[#b9cabc] sm:text-lg">It keeps route UI, server logic, and metadata in one deterministic layout so teams ship faster without losing clarity.</p>
          </header>
          <div class="mt-5 grid gap-3 lg:grid-cols-3">\${explainHtml}</div>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">\${statsHtml}</div>
          <footer class="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#7a8f6b]/15 pt-4">
            <p class="text-sm text-[#5f6d58] dark:text-[#acc1b1]">AI-first fullstack framework structure with deterministic routing.</p>
            <div class="flex flex-wrap gap-2">\${skillsHtml}</div>
          </footer>
        </section>
      </main>
      ${answers.theming ? `<script type="module">${themeScript}</script>` : ''}
    \`;
  }
}
`;
}

function createF1Schema() {
  return `message TodoDraft {
  string id = 1;
  string title = 2;
  int64 createdAt = 3;
}

message RequestRecord {
  string id = 1;
  string route = 2;
  string method = 3;
  string source = 4;
}

message UserRecord {
  string id = 1;
  string username = 2;
  string role = 3;
  string passwordHash = 4;
}

message SessionRecord {
  string id = 1;
  string userId = 2;
  string status = 3;
}
`;
}

function createF1Index() {
  return `import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type TodoDraft = {
  id: string;
  title: string;
  createdAt: number;
};

type RequestRecord = {
  id: string;
  route: string;
  method: string;
  source: string;
};

type UserRecord = {
  id: string;
  username: string;
  role: string;
  passwordHash: string;
};

type SessionRecord = {
  id: string;
  userId: string;
  status: string;
};

type F1DatabaseShape = {
  drafts: TodoDraft[];
  requests: RequestRecord[];
  users: UserRecord[];
  sessions: SessionRecord[];
};

const databasePath = path.resolve(process.cwd(), ".fiyuu", "data", "f1.json");
let writeQueue = Promise.resolve();

class F1Table<TRecord extends { id: string }> {
  constructor(private readonly tableName: keyof F1DatabaseShape) {}

  async findMany(): Promise<TRecord[]> {
    const database = await loadDatabase();
    return structuredClone(database[this.tableName]) as unknown as TRecord[];
  }

  async findById(id: string): Promise<TRecord | null> {
    const rows = await this.findMany();
    return rows.find((row) => row.id === id) ?? null;
  }

  async findFirst(predicate: (record: TRecord) => boolean): Promise<TRecord | null> {
    const rows = await this.findMany();
    return rows.find(predicate) ?? null;
  }

  async insert(record: TRecord): Promise<TRecord> {
    await mutateDatabase((database) => {
      database[this.tableName].unshift(record as never);
    });
    return record;
  }

  async replace(records: TRecord[]): Promise<void> {
    await mutateDatabase((database) => {
      database[this.tableName] = records as never;
    });
  }
}

export function createF1Database() {
  return {
    table<TRecord extends { id: string }>(tableName: keyof F1DatabaseShape) {
      return new F1Table<TRecord>(tableName);
    },
  };
}

const f1 = createF1Database();

async function ensureDatabase(): Promise<void> {
  if (existsSync(databasePath)) {
    return;
  }

  await mkdir(path.dirname(databasePath), { recursive: true });
  await writeFile(databasePath, \`\${JSON.stringify(createSeedDatabase(), null, 2)}\n\`);
}

async function loadDatabase(): Promise<F1DatabaseShape> {
  await ensureDatabase();
  const content = await readFile(databasePath, "utf8");
  return JSON.parse(content) as F1DatabaseShape;
}

async function mutateDatabase(mutator: (database: F1DatabaseShape) => void): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    const database = await loadDatabase();
    mutator(database);
    await mkdir(path.dirname(databasePath), { recursive: true });
    await writeFile(databasePath, \`\${JSON.stringify(database, null, 2)}\n\`);
  });
  await writeQueue;
}

function createSeedDatabase(): F1DatabaseShape {
  return {
    drafts: [],
    requests: [
      { id: "req_001", route: "/", method: "GET", source: "starter-home" },
      { id: "req_002", route: "/requests", method: "GET", source: "f1-store" },
      { id: "req_003", route: "/live", method: "WS", source: "socket-feed" },
    ],
    users: [
      { id: "usr_001", username: "founder", role: "admin", passwordHash: hashPassword("fiyuu123") },
      { id: "usr_002", username: "ops", role: "operator", passwordHash: hashPassword("ops12345") },
    ],
    sessions: [
      { id: "ses_001", userId: "usr_001", status: "active" },
      { id: "ses_002", userId: "usr_002", status: "idle" },
    ],
  };
}

export async function saveTodoDraft(title: string): Promise<TodoDraft> {
  const drafts = f1.table<TodoDraft>("drafts");
  const draft = {
    id: \`f1_\${Date.now()}\`,
    title,
    createdAt: Date.now(),
  };
  return drafts.insert(draft);
}

export async function listTodoDrafts(): Promise<TodoDraft[]> {
  return f1.table<TodoDraft>("drafts").findMany();
}

export async function listRequests(): Promise<RequestRecord[]> {
  return f1.table<RequestRecord>("requests").findMany();
}

export async function listUsers(): Promise<Array<{ id: string; username: string; role: string }>> {
  const users = await f1.table<UserRecord>("users").findMany();
  return users.map(({ passwordHash, ...user }) => user);
}

export async function listSessions(): Promise<SessionRecord[]> {
  return f1.table<SessionRecord>("sessions").findMany();
}

export async function createSession(username: string): Promise<SessionRecord> {
  const users = f1.table<UserRecord>("users");
  const sessions = f1.table<SessionRecord>("sessions");
  const user = await users.findFirst((entry) => entry.username === username);
  if (!user) {
    throw new Error("User not found");
  }
  const session = { id: \`ses_\${Date.now()}\`, userId: user.id, status: "active" };
  return sessions.insert(session);
}

export async function signIn(username: string, password: string) {
  const users = f1.table<UserRecord>("users");
  const user = await users.findFirst((entry) => entry.username === username);
  if (!user) {
    return { success: false, message: "Unknown username", session: null, user: null };
  }

  if (user.passwordHash !== hashPassword(password)) {
    return { success: false, message: "Invalid password", session: null, user: null };
  }

  const session = await createSession(username);
  const { passwordHash, ...safeUser } = user;
  return { success: true, message: "Signed in successfully", session, user: safeUser };
}

function hashPassword(password: string) {
  let hash = 2166136261;
  for (let index = 0; index < password.length; index += 1) {
    hash ^= password.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return \`f1_\${(hash >>> 0).toString(16)}\`;
}
`;
}

function createSocketServer() {
  return `import type { WebSocket } from "ws";

export function registerSocketServer() {
  return {
    namespace: "updates",
    events: ["counter:tick", "socket:echo"],
    onConnect(socket: WebSocket) {
      socket.send(JSON.stringify({ type: "socket:connected", channel: "updates" }));
      let count = 0;
      const interval = setInterval(() => {
        count += 1;
        socket.send(JSON.stringify({ type: "counter:tick", count }));
      }, 1000);

      socket.on("close", () => {
        clearInterval(interval);
      });
    },
    onMessage(socket: WebSocket, message: string) {
      socket.send(JSON.stringify({ type: "socket:echo", message }));
    },
  };
}
`;
}

function createServerCrypto() {
  return `import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

type Envelope = {
  seed: string;
  payload: string;
  map: Record<string, string>;
  noise: Record<string, string>;
};

function deriveKey(secret: string): Buffer {
  return createHash("sha256").update(secret).digest();
}

function toBase64Url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function fromBase64Url(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function randomToken(size = 10): string {
  return randomBytes(size).toString("hex");
}

function createNoise(seed: string) {
  return {
    [randomToken(4)]: toBase64Url(seed.slice(0, 8)),
    [randomToken(4)]: toBase64Url(randomToken(6)),
    [randomToken(4)]: toBase64Url(\`\${Date.now()}\`),
  };
}

function obfuscateObject(value: Record<string, unknown>) {
  const map: Record<string, string> = {};
  const output: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(value)) {
    const alias = randomToken(6);
    map[alias] = key;
    output[alias] = entry;
  }

  return { map, output };
}

function restoreObject(value: Record<string, unknown>, map: Record<string, string>) {
  const output: Record<string, unknown> = {};

  for (const [alias, entry] of Object.entries(value)) {
    const key = map[alias];
    if (key) {
      output[key] = entry;
    }
  }

  return output;
}

export function encryptPayload(payload: Record<string, unknown>, secret: string): Envelope {
  const seed = randomToken(8);
  const { map, output } = obfuscateObject(payload);
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", deriveKey(secret), iv);
  const encoded = JSON.stringify(output);
  const encrypted = Buffer.concat([cipher.update(encoded, "utf8"), cipher.final()]);

  return {
    seed,
    payload: \`\${iv.toString("hex")}\.\${encrypted.toString("base64url")}\`,
    map,
    noise: createNoise(seed),
  };
}

export function decryptPayload(input: Envelope, secret: string) {
  const [ivHex, value] = input.payload.split(".");
  const decipher = createDecipheriv("aes-256-cbc", deriveKey(secret), Buffer.from(ivHex, "hex"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(value, "base64url")), decipher.final()]).toString("utf8");
  const parsed = JSON.parse(decrypted) as Record<string, unknown>;
  return restoreObject(parsed, input.map);
}

export function hashValue(value: string, secret: string) {
  return createHash("sha256").update(\`\${secret}:\${value}\`).digest("hex");
}

export function encodeResponseMeta(meta: Record<string, string>) {
  return Object.fromEntries(Object.entries(meta).map(([key, value]) => [randomToken(5), toBase64Url(\`\${key}:\${value}\`)]));
}

export function decodeResponseMeta(meta: Record<string, string>) {
  const output: Record<string, string> = {};

  for (const value of Object.values(meta)) {
    const decoded = fromBase64Url(value);
    const [key, entry] = decoded.split(":");
    output[key] = entry;
  }

  return output;
}
`;
}

function createClientCrypto() {
  return `type Envelope = {
  seed: string;
  payload: string;
  map: Record<string, string>;
  noise: Record<string, string>;
};

function randomToken(size = 12) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

function toBase64Url(input: string) {
  return btoa(input).replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  return atob(normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "="));
}

function obfuscateObject(value: Record<string, unknown>) {
  const map: Record<string, string> = {};
  const output: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(value)) {
    const alias = randomToken(6);
    map[alias] = key;
    output[alias] = entry;
  }

  return { map, output };
}

function restoreObject(value: Record<string, unknown>, map: Record<string, string>) {
  const output: Record<string, unknown> = {};

  for (const [alias, entry] of Object.entries(value)) {
    const key = map[alias];
    if (key) {
      output[key] = entry;
    }
  }

  return output;
}

async function importAesKey(secret: string) {
  const secretBytes = new TextEncoder().encode(secret);
  const digest = await crypto.subtle.digest("SHA-256", secretBytes);
  return crypto.subtle.importKey("raw", digest, { name: "AES-CBC" }, false, ["encrypt", "decrypt"]);
}

export async function obfuscateRequest(payload: Record<string, unknown>, secret: string): Promise<Envelope> {
  const seed = randomToken(8);
  const { map, output } = obfuscateObject(payload);
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const key = await importAesKey(secret);
  const encoded = new TextEncoder().encode(JSON.stringify(output));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-CBC", iv }, key, encoded);

  return {
    seed,
    payload: \`\${Array.from(iv, (value) => value.toString(16).padStart(2, "0")).join("")}\.\${toBase64Url(String.fromCharCode(...new Uint8Array(encrypted)))}\`,
    map,
    noise: {
      [randomToken(4)]: toBase64Url(seed.slice(0, 8)),
      [randomToken(4)]: toBase64Url(randomToken(6)),
    },
  };
}

export async function readObfuscatedResponse(input: Envelope, secret: string) {
  const [ivHex, payload] = input.payload.split(".");
  const iv = new Uint8Array(ivHex.match(/.{1,2}/g)?.map((value) => parseInt(value, 16)) ?? []);
  const encrypted = Uint8Array.from(fromBase64Url(payload), (char) => char.charCodeAt(0));
  const key = await importAesKey(secret);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-CBC", iv }, key, encrypted);
  const parsed = JSON.parse(new TextDecoder().decode(decrypted)) as Record<string, unknown>;
  return restoreObject(parsed, input.map);
}

export async function signRequestBody(body: string) {
  const bytes = new TextEncoder().encode(body);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((value) => value.toString(16).padStart(2, "0")).join("");
}
`;
}
