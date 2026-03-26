#!/usr/bin/env node

import { existsSync, realpathSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline/promises";
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
const dependencyVersion = resolveFrameworkDependency(frameworkRoot, useLocal);
const answers = await collectAnswers(useDefaults);

await mkdir(targetDirectory, { recursive: true });
await createProject(targetDirectory, packageName, dependencyVersion, answers);

renderSuccess(packageName, targetDirectory, answers);

async function collectAnswers(useDefaultsFlag) {
  const defaults = {
    sockets: true,
    database: true,
    encryption: true,
    skills: true,
    authHints: true,
    aboutPage: true,
  };

  if (useDefaultsFlag) {
    return defaults;
  }

  const rl = readline.createInterface({ input, output });

  try {
    renderSetupIntro();
    console.log(`${ui.bold}${ui.moss}Realtime & Data${ui.reset}`);

    const result = {
      sockets: await askBoolean(rl, "Include socket-ready realtime server scaffolding?", defaults.sockets),
      database: await askBoolean(rl, "Include the lightweight F1 database scaffolding?", defaults.database),
      authHints: await askBoolean(rl, "Include auth-ready middleware and request guards?", defaults.authHints),
      encryption: defaults.encryption,
      skills: defaults.skills,
      aboutPage: defaults.aboutPage,
    };

    console.log("");
    console.log(`${ui.bold}${ui.moss}AI & Security${ui.reset}`);

    result.encryption = await askBoolean(rl, "Include request signing and encryption helpers?", defaults.encryption);
    result.skills = await askBoolean(rl, "Include starter AI skills and AI config?", defaults.skills);

    console.log("");
    console.log(`${ui.bold}${ui.moss}Routes & Examples${ui.reset}`);

    result.aboutPage = await askBoolean(rl, "Generate an example /about route too?", defaults.aboutPage);

    renderAnswerSummary(result);
    return result;
  } finally {
    rl.close();
  }
}

async function askBoolean(rl, question, defaultValue) {
  const suffix = defaultValue ? `${ui.moss}Y${ui.reset}/${ui.muted}n${ui.reset}` : `${ui.muted}y${ui.reset}/${ui.moss}N${ui.reset}`;
  const prompt = `${ui.border}•${ui.reset} ${ui.cream}${question}${ui.reset} ${ui.muted}(${suffix})${ui.reset} `;
  const answer = (await rl.question(prompt)).trim().toLowerCase();

  if (!answer) {
    return defaultValue;
  }

  return answer === "y" || answer === "yes";
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
    ["Sockets", answers.sockets],
    ["F1 Database", answers.database],
    ["Middleware/Auth", answers.authHints],
    ["Request Security", answers.encryption],
    ["AI Skills", answers.skills],
    ["About Route", answers.aboutPage],
  ];

  console.log("");
  console.log(`${ui.bold}${ui.olive}Starter Profile${ui.reset}`);
  for (const [label, enabled] of entries) {
    console.log(`${ui.border}•${ui.reset} ${ui.cream}${label}${ui.reset} ${enabled ? `${ui.success}enabled${ui.reset}` : `${ui.muted}disabled${ui.reset}`}`);
  }
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
  console.log(`${ui.border}•${ui.reset} ${ui.muted}Sockets:${ui.reset} ${answers.sockets ? `${ui.success}on${ui.reset}` : `${ui.muted}off${ui.reset}`}`);
  console.log(`${ui.border}•${ui.reset} ${ui.muted}F1:${ui.reset} ${answers.database ? `${ui.success}on${ui.reset}` : `${ui.muted}off${ui.reset}`}`);
  console.log(`${ui.border}•${ui.reset} ${ui.muted}Middleware:${ui.reset} ${answers.authHints ? `${ui.success}on${ui.reset}` : `${ui.muted}off${ui.reset}`}`);
  console.log(`${ui.border}•${ui.reset} ${ui.muted}AI:${ui.reset} ${answers.skills ? `${ui.success}on${ui.reset}` : `${ui.muted}off${ui.reset}`}`);
}

function color(...codes) {
  return useColor ? `\u001b[${codes.join(";")}m` : "";
}

function resolveFrameworkDependency(frameworkRoot, useLocalFlag) {
  const packageJsonPath = path.join(frameworkRoot, "package.json");
  const canUseLocal = useLocalFlag || existsSync(packageJsonPath);

  if (!canUseLocal) {
    return "latest";
  }

  return `file:${realpathSync(frameworkRoot).split(path.sep).join("/")}`;
}

async function createProject(targetDirectory, packageName, dependencyVersion, answers) {
  const files = new Map([
    ["package.json", createPackageJson(packageName, dependencyVersion)],
    ["tsconfig.json", createTsConfig()],
    [".gitignore", "node_modules/\n.fiyuu/\ndist/\n"],
    ["README.md", createReadme(packageName, answers)],
    ["fiyuu.config.ts", createFiyuuConfig(answers)],
    ["app/layout.tsx", createRootLayout()],
    ["app/layout.meta.ts", createRootLayoutMeta()],
    ["app/middleware.ts", createAppMiddleware(answers)],
    ["app/api/health/route.ts", createHealthApiRoute()],
    ["app/action.ts", createHomeAction(answers)],
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
    ["lib/analytics.ts", createAnalyticsModule()],
    ["lib/feature-flags.ts", createFeatureFlagsModule()],
  ]);

  if (answers.skills) {
    files.set("skills/product-strategist.md", createProductStrategistSkill());
    files.set("skills/support-triage.md", createSupportTriageSkill());
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

  if (answers.aboutPage) {
    files.set("app/about/meta.ts", createAboutMeta(answers));
    files.set("app/about/query.ts", createAboutQuery());
    files.set("app/about/schema.ts", createAboutSchema());
    files.set("app/about/page.tsx", createAboutPage());
  }

  for (const [relativePath, content] of files) {
    const absolutePath = path.join(targetDirectory, relativePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, content);
  }
}

function createPackageJson(projectName, dependencyVersion) {
  const usesLocalFramework = dependencyVersion.startsWith("file:");
  const includeSockets = true;

  return `${JSON.stringify(
    {
      name: projectName,
      version: "0.1.0",
      private: true,
      type: "module",
      scripts: {
        dev: usesLocalFramework ? "node ./node_modules/fiyuu/bin/fiyuu.mjs dev" : "fiyuu dev",
        build: usesLocalFramework ? "node ./node_modules/fiyuu/bin/fiyuu.mjs build" : "fiyuu build",
        start: usesLocalFramework ? "node ./node_modules/fiyuu/bin/fiyuu.mjs start" : "fiyuu start",
      },
      dependencies: {
        fiyuu: dependencyVersion,
        react: "^19.1.0",
        "react-dom": "^19.1.0",
        ...(includeSockets ? { ws: "^8.18.1" } : {}),
        zod: "^3.24.2",
      },
      devDependencies: {
        "@types/node": "^22.13.10",
        "@types/react": "^19.1.2",
        "@types/react-dom": "^19.1.2",
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
    "jsx": "react-jsx",
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

  if (answers.aboutPage) optionalLines.push("- /about -> example folder-based route");
  if (answers.sockets) optionalLines.push("- /live -> websocket-powered live counter example");
  if (answers.database) optionalLines.push("- /requests -> F1-backed global request list example");
  if (answers.authHints) optionalLines.push("- /auth -> F1-backed auth starter example");
  optionalLines.push("- /api/health -> app router backend endpoint");
  if (answers.database) optionalLines.push("- server/f1 -> lightweight F1 data layer scaffold");
  if (answers.database) optionalLines.push("- .fiyuu/data/f1.json -> persistent lightweight database file");
  if (answers.sockets) optionalLines.push("- server/socket.ts -> realtime server scaffold");
  if (answers.encryption) optionalLines.push("- server/crypto.ts and lib/client-crypto.ts -> request protection helpers");
  if (answers.skills) optionalLines.push("- skills/ -> AI prompts for product and support workflows");
  optionalLines.push("- lib/analytics.ts -> startup analytics stub");
  optionalLines.push("- lib/feature-flags.ts -> startup feature flag helpers");

  return `# ${projectName}

Generated with create-fiyuu-app.

## Commands

- npm run dev
- npm run build
- npm run start

## Starter Routes

- / -> Fiyuu home page
${optionalLines.join("\n")}

## Notes

- Folder-based routing lives directly under app/
- Creating app/about/page.tsx + app/about/meta.ts creates the /about route
- Root and nested layouts are supported with app/layout.tsx and layout.meta.ts
- Backend route handlers live under app/api/**/route.ts
- Large client-side collections can use the built-in VirtualList helper
- F1 persists to .fiyuu/data/f1.json with a tiny ORM-like table API
- Middleware lives at app/middleware.ts and runs before route handling
- Runtime environment lives in .fiyuu/env and .fiyuu/SECRET
- AI-readable markdown docs live in .fiyuu/PROJECT.md, .fiyuu/PATHS.md, .fiyuu/STATES.md, and .fiyuu/FEATURES.md
- Client-visible transport obfuscation reduces readability, but absolute secrecy still requires server-only keys and HTTPS
${answers.authHints ? "- Starter auth credentials: username `founder` password `fiyuu123`" : ""}
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
    defaultSkills: ${JSON.stringify(answers.skills ? ["product-strategist", "support-triage"] : [])},
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
  return `import { defineLayout, type LayoutProps } from "fiyuu/client";

export const layout = defineLayout({
  name: "root",
});

export default function RootLayout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[#f7f3ea] text-[#33412f]">
      {children}
    </div>
  );
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
- optional about route: ${answers.aboutPage ? "enabled" : "disabled"}

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
${answers.aboutPage ? "- /about -> app/about/" : ""}

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
  render: "csr",
  seo: {
    title: "Fiyuu Starter",
    description: "AI-first fullstack starter with auth, realtime, F1 data, and API routes.",
  },
});
`;
}

function createHomeQuery(answers) {
  const skills = answers.skills ? ["product-strategist", "support-triage"] : [];
  const realtime = answers.sockets ? "Socket-ready" : "HTTP-first";
  const database = answers.database ? "F1 built-in" : "Not enabled";

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
      { label: "Render Modes", value: "CSR + SSR" },
      { label: "Realtime", value: ${JSON.stringify(realtime)} },
      { label: "Data Layer", value: ${JSON.stringify(database)} },
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
  return `import { useEffect, useMemo, useState } from "react";
import { definePage, type PageProps } from "fiyuu/client";

type LiveData = {
  initialCount: number;
  channel: string;
};

export const page = definePage({
  intent: "Live counter page demonstrating websocket updates",
});

export default function Page({ data }: PageProps<LiveData>) {
  const [count, setCount] = useState(data?.initialCount ?? 0);
  const [status, setStatus] = useState("connecting");

  const socketUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    return \`\${protocol}://\${window.location.host}/__fiyuu/ws\`;
  }, []);

  useEffect(() => {
    if (!socketUrl) {
      return;
    }

    const socket = new WebSocket(socketUrl);

    socket.addEventListener("open", () => setStatus("connected"));
    socket.addEventListener("close", () => setStatus("closed"));
    socket.addEventListener("message", (event) => {
      try {
        const payload = JSON.parse(event.data) as { type?: string; count?: number };
        if (payload.type === "counter:tick" && typeof payload.count === "number") {
          setCount(payload.count);
        }
      } catch {
        setStatus("message-error");
      }
    });

    return () => {
      socket.close();
    };
  }, [socketUrl]);

  return (
    <main className="min-h-screen bg-[#f7f3ea] px-6 py-16 text-[#31402b]">
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-[#7a8f6b]/20 bg-white/70 p-10 shadow-[0_24px_80px_rgba(68,84,57,0.10)]">
        <div className="text-xs uppercase tracking-[0.24em] text-[#6d805f]">Realtime Example</div>
        <h1 className="mt-4 text-4xl font-semibold text-[#24311f]">Live Counter</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-[#5f6d58]">
          This route listens to the starter websocket server and updates a counter in real time.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl bg-[#31402b] p-8 text-[#f7f3ea]">
            <div className="text-xs uppercase tracking-[0.2em] text-[#cdd7c6]">Channel</div>
            <div className="mt-3 text-3xl font-semibold">{data?.channel}</div>
          </div>
          <div className="rounded-3xl border border-[#7a8f6b]/20 bg-[#fcfaf5] p-8">
            <div className="text-xs uppercase tracking-[0.2em] text-[#7a8b71]">Live Count</div>
            <div className="mt-3 text-5xl font-semibold text-[#24311f]">{count}</div>
            <div className="mt-3 text-sm text-[#61705b]">Socket status: {status}</div>
          </div>
        </div>
      </div>
    </main>
  );
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
  return `import { definePage, type PageProps, VirtualList, useClientMemo } from "fiyuu/client";

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

export default function Page({ data }: PageProps<RequestsData>) {
  const rows = useClientMemo(
    () => Array.from({ length: 100000 }, (_, index) => data?.requests[index % (data?.requests.length || 1)] ?? { id: "n/a", route: "/", method: "GET", source: "empty" }),
    [data],
  );

  return (
    <main className="min-h-screen bg-[#f7f3ea] px-6 py-16 text-[#31402b]">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-[#7a8f6b]/20 bg-white/70 p-10 shadow-[0_24px_80px_rgba(68,84,57,0.10)]">
        <div className="text-xs uppercase tracking-[0.24em] text-[#6d805f]">F1 Example</div>
        <h1 className="mt-4 text-4xl font-semibold text-[#24311f]">Global Request List</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-[#5f6d58]">
          This route reads starter records from the lightweight F1 store and renders a virtualized list so very large datasets stay responsive.
        </p>
        <div className="mt-6 rounded-2xl bg-[#edf3e7] px-4 py-4 text-sm text-[#4d5d47]">
          Virtualized rows: 100,000 generated from the base F1 dataset.
        </div>
        <div className="mt-8 overflow-hidden rounded-3xl border border-[#7a8f6b]/15 bg-[#fcfaf5]">
          <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr] gap-4 border-b border-[#7a8f6b]/10 px-6 py-4 text-xs uppercase tracking-[0.2em] text-[#7a8b71]">
            <div>ID</div>
            <div>Route</div>
            <div>Method</div>
            <div>Source</div>
          </div>
          <VirtualList
            items={rows}
            height={520}
            itemHeight={64}
            renderItem={(request, index) => (
              <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr] gap-4 border-b border-[#7a8f6b]/10 px-6 py-4 text-sm text-[#364330]">
                <div>{request.id}-{index}</div>
                <div>{request.route}</div>
                <div>{request.method}</div>
                <div>{request.source}</div>
              </div>
            )}
          />
        </div>
      </div>
    </main>
  );
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
  return `import { definePage, type PageProps } from "fiyuu/client";

type AuthData = {
  users: Array<{ id: string; username: string; role: string }>;
  sessions: Array<{ id: string; userId: string; status: string }>;
  hint: { username: string; password: string };
};

export const page = definePage({
  intent: "Auth page demonstrating F1-backed users and sessions",
});

export default function Page({ data }: PageProps<AuthData>) {
  return (
    <main className="min-h-screen bg-[#f7f3ea] px-6 py-16 text-[#31402b]">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-[#7a8f6b]/20 bg-white/70 p-10 shadow-[0_24px_80px_rgba(68,84,57,0.10)]">
        <div className="text-xs uppercase tracking-[0.24em] text-[#6d805f]">Auth Example</div>
        <h1 className="mt-4 text-4xl font-semibold text-[#24311f]">F1-backed Auth Starter</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-[#5f6d58]">
          This route shows how user and session records can live in the F1 store while your UI stays inside the same deterministic feature structure.
        </p>
        <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-3xl border border-[#7a8f6b]/15 bg-[#fcfaf5] p-6">
            <h2 className="text-lg font-semibold text-[#24311f]">Sign in</h2>
            <p className="mt-2 text-sm text-[#61705b]">Use the default starter account to test a working username/password flow.</p>
            <div className="mt-4 rounded-2xl bg-[#eef4e8] px-4 py-4 text-sm text-[#44513f]">
              username: <strong>{data?.hint.username}</strong><br />
              password: <strong>{data?.hint.password}</strong>
            </div>
            <form id="fiyuu-auth-form" className="mt-5 space-y-3">
              <input id="fiyuu-auth-username" name="username" defaultValue={data?.hint.username} placeholder="Username" className="w-full rounded-2xl border border-[#7a8f6b]/20 bg-white px-4 py-3 outline-none" />
              <input id="fiyuu-auth-password" name="password" defaultValue={data?.hint.password} type="password" placeholder="Password" className="w-full rounded-2xl border border-[#7a8f6b]/20 bg-white px-4 py-3 outline-none" />
              <button id="fiyuu-auth-submit" type="submit" className="rounded-2xl bg-[#31402b] px-5 py-3 text-sm font-medium text-[#f7f3ea] disabled:opacity-60">
                Sign in
              </button>
            </form>
            <div id="fiyuu-auth-result" className="mt-4 text-sm text-[#55654e]"></div>
          </section>
          <section className="rounded-3xl border border-[#7a8f6b]/15 bg-[#fcfaf5] p-6">
            <h2 className="text-lg font-semibold text-[#24311f]">Users</h2>
            <div className="mt-4 space-y-3">
              {data?.users.map((user) => (
                <div key={user.id} className="rounded-2xl border border-[#7a8f6b]/10 px-4 py-4 text-sm">
                  <div className="font-medium text-[#24311f]">{user.username}</div>
                  <div className="mt-1 text-[#61705b]">{user.role} · {user.id}</div>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-3xl bg-[#31402b] p-6 text-[#f7f3ea]">
            <h2 className="text-lg font-semibold">Sessions</h2>
            <div className="mt-4 space-y-3">
              {data?.sessions.map((session) => (
                <div key={session.id} className="rounded-2xl border border-white/10 px-4 py-4 text-sm">
                  <div className="font-medium">{session.id}</div>
                  <div className="mt-1 text-[#dbe5d4]">{session.userId} · {session.status}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
      <script
        type="module"
        dangerouslySetInnerHTML={{
          __html: ${JSON.stringify(
            'const form=document.getElementById("fiyuu-auth-form");const username=document.getElementById("fiyuu-auth-username");const password=document.getElementById("fiyuu-auth-password");const result=document.getElementById("fiyuu-auth-result");const submit=document.getElementById("fiyuu-auth-submit");form?.addEventListener("submit",async(event)=>{event.preventDefault();if(!username||!password||!result||!submit)return;submit.setAttribute("disabled","true");result.textContent="Signing in...";const response=await fetch("/auth",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({username:username.value,password:password.value})});const payload=await response.json();result.textContent=payload.message||"Finished";submit.removeAttribute("disabled");if(payload.success){window.location.reload();}});',
          )},
        }}
      />
    </main>
  );
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
  const routeLinks = [
    '{ href: "/auth", label: "Auth", helper: "Username/password starter" }',
    '{ href: "/requests", label: "F1 Requests", helper: "Shared data example" }',
    '{ href: "/live", label: "Live", helper: "Realtime counter" }',
    '{ href: "/about", label: "About", helper: "Framework overview" }',
  ].join(", ");

  return `import { definePage, type PageProps } from "fiyuu/client";

type HomeData = {
  stats: Array<{
    label: string;
    value: string;
  }>;
  skills: string[];
};

export const page = definePage({
  intent: "Home page introducing the Fiyuu framework with a calm starter experience",
});

export default function Page({ data }: PageProps<HomeData>) {
  const links = [${routeLinks}];

  return (
    <div className="min-h-screen bg-[#f7f3ea] text-[#33412f]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(107,128,92,0.18),_transparent_38%),linear-gradient(180deg,_#f7f3ea_0%,_#f1ebde_58%,_#e9e0d0_100%)]" />
      <main className="relative mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-20">
        <section className="overflow-hidden rounded-[2.5rem] border border-[#7a8f6b]/20 bg-white/70 p-8 shadow-[0_30px_120px_rgba(68,84,57,0.10)] backdrop-blur-xl lg:p-12">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_420px] lg:items-start">
            <div>
              <div className="inline-flex rounded-full border border-[#7a8f6b]/25 bg-[#eef3e8] px-3 py-1 text-xs uppercase tracking-[0.24em] text-[#627356]">
                AI-first fullstack framework
              </div>
              <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-tight text-[#24311f] sm:text-6xl lg:text-7xl">
                Build product systems that stay clear for engineers and AI.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#55654e] sm:text-xl">
                Fiyuu keeps frontend, backend, realtime flows, and project context in one deterministic app structure.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a href="https://github.com/hacimertgokhan/fiyuu" target="_blank" rel="noreferrer" className="inline-flex items-center rounded-2xl bg-[#31402b] px-5 py-3 text-sm font-medium text-[#f7f3ea] transition hover:bg-[#283422]">
                  View GitHub
                </a>
                <a href="/auth" className="inline-flex items-center rounded-2xl border border-[#7a8f6b]/20 bg-white px-5 py-3 text-sm font-medium text-[#42513d] transition hover:bg-[#f8f4ec]">
                  Open Starter Auth
                </a>
              </div>
              <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {links.map((link) => (
                  <a key={link.href} href={link.href} className="rounded-2xl border border-[#7a8f6b]/15 bg-[#fcfaf5] px-5 py-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                    <div className="text-sm font-semibold text-[#2f3d2a]">{link.label}</div>
                    <div className="mt-2 text-sm leading-6 text-[#65735f]">{link.helper}</div>
                    <div className="mt-4 text-xs uppercase tracking-[0.2em] text-[#7a8b71]">{link.href}</div>
                  </a>
                ))}
              </div>
            </div>

            <aside className="rounded-[2rem] bg-[#31402b] p-6 text-[#f7f3ea] shadow-2xl shadow-[#31402b]/10 lg:sticky lg:top-10">
              <div className="text-xs uppercase tracking-[0.24em] text-[#d4dfcd]">Project snapshot</div>
              <div className="mt-6 space-y-3">
                {data?.stats.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-[#c7d3c0]">{item.label}</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{item.value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl bg-[#25311f] px-4 py-4">
                <div className="text-xs uppercase tracking-[0.2em] text-[#c7d3c0]">Included skills</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {data?.skills.map((skill) => (
                    <span key={skill} className="rounded-full bg-white/10 px-3 py-1 text-sm text-[#eef3e8]">{skill}</span>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}
`;
}

function createAboutMeta(answers) {
  return `import { defineMeta } from "fiyuu/client";

export default defineMeta({
  intent: "About page describing route folders in the Fiyuu starter",
  title: "About",
  render: "ssr",
  seo: {
    title: "About - Fiyuu",
    description: "Overview of the Fiyuu framework structure and startup-ready features.",
  },
});
`;
}

function createAboutQuery() {
  return `import { z } from "zod";
import { defineQuery } from "fiyuu/client";

export const query = defineQuery({
  input: z.object({}),
  output: z.object({
    headline: z.string(),
    body: z.string(),
    pillars: z.array(z.string()),
  }),
  description: "Loads content for the about route",
});

export async function execute() {
  return {
    headline: "Fiyuu keeps fullstack work readable",
    body: "Every feature lives in a route folder with explicit files for metadata, schema, reads, writes, and UI. That keeps implementation predictable for engineers and understandable for AI systems.",
    pillars: ["Folder-based routes", "Typed contracts", "Realtime and data scaffolds", "AI-readable project context"],
  };
}
`;
}

function createAboutSchema() {
  return `import { z } from "zod";

export const input = z.object({});

export const output = z.object({
  headline: z.string(),
  body: z.string(),
  pillars: z.array(z.string()),
});

export const description = "Loads content for the about route";
`;
}

function createAboutPage() {
  return `import { definePage, type PageProps } from "fiyuu/client";

type AboutData = {
  headline: string;
  body: string;
  pillars: string[];
};

export const page = definePage({
  intent: "About page describing route folders in the Fiyuu starter",
});

export default function Page({ data }: PageProps<AboutData>) {
  return (
    <main className="min-h-screen bg-[#f7f3ea] px-6 py-16 text-[#31402b]">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-[#7a8f6b]/20 bg-white/70 p-10 shadow-[0_24px_80px_rgba(68,84,57,0.10)]">
        <div className="text-xs uppercase tracking-[0.24em] text-[#6d805f]">About</div>
        <h1 className="mt-4 text-4xl font-semibold text-[#24311f]">{data?.headline}</h1>
        <p className="mt-4 text-lg leading-8 text-[#5f6d58]">{data?.body}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {data?.pillars.map((pillar) => (
            <div key={pillar} className="rounded-2xl border border-[#7a8f6b]/15 bg-[#fcfaf5] px-5 py-5 text-sm text-[#44513f]">
              {pillar}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
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
