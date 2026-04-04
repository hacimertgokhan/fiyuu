import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import type { FiyuuConfig } from "@fiyuu/core";

import { c, existsSync, fs, log } from "../shared.js";
import { build } from "./build.js";

type ParsedArgs = {
  positionals: string[];
  flags: Set<string>;
  values: Map<string, string>;
};

type CloudState = {
  endpoint: string;
  token: string;
  updatedAt: string;
};

type RunOptions = {
  cwd?: string;
  dryRun?: boolean;
};

const DEFAULT_CLOUD_ENDPOINT = "http://127.0.0.1:7788";
const CLOUD_STATE_PATH = path.join(os.homedir(), ".fiyuu", "cloud.json");
const DEFAULT_ARCHIVE_EXCLUDES = [
  ".git",
  "node_modules",
  ".fiyuu/dev",
  ".fiyuu/cache",
  "dist",
  "*.log",
];

export async function handleCloudCommand(
  rootDirectory: string,
  appDirectory: string,
  config: FiyuuConfig,
  args: string[],
): Promise<void> {
  const [subcommand = "help", ...rest] = args;

  switch (subcommand) {
    case "help":
      printCloudHelp();
      return;

    case "login":
      await cloudLogin(config, rest);
      return;

    case "logout":
      await cloudLogout();
      return;

    case "whoami":
      await cloudWhoami(config, rest);
      return;

    case "projects":
      await cloudProjects(config, rest);
      return;

    case "project":
      await cloudProject(config, rest);
      return;

    case "token":
      await cloudToken(config, rest);
      return;

    case "deploy":
      await cloudDeploy(rootDirectory, appDirectory, config, rest);
      return;

    default:
      throw new Error(`Unknown cloud command: ${subcommand}`);
  }
}

function printCloudHelp(): void {
  console.log(`
${c.bold}${c.cyan}Fiyuu Cloud${c.reset}
  ${c.cyan}cloud login <token>${c.reset}                     Match CLI with account token
  ${c.cyan}cloud logout${c.reset}                            Remove saved cloud token
  ${c.cyan}cloud whoami${c.reset}                            Show current account
  ${c.cyan}cloud projects${c.reset}                          List your projects and free-plan usage
  ${c.cyan}cloud project create <slug>${c.reset}             Create project (free max 3)
  ${c.cyan}cloud token create [name]${c.reset}               Create a new API token
  ${c.cyan}cloud deploy [project-slug]${c.reset}             Build + upload deploy payload to control-plane
`);
}

async function cloudLogin(config: FiyuuConfig, args: string[]): Promise<void> {
  const parsed = parseArgs(args);
  const token = (parsed.positionals[0] ?? parsed.values.get("token") ?? "").trim();
  if (!token) {
    throw new Error("Usage: fiyuu cloud login <token> [--endpoint <url>]");
  }

  const endpoint = await resolveEndpoint(config, parsed.values.get("endpoint"));
  const me = await requestJson<{ account: CloudAccount }>({
    endpoint,
    method: "GET",
    path: "/v1/me",
    token,
  });

  await writeCloudState({
    endpoint,
    token,
    updatedAt: new Date().toISOString(),
  });

  log("cloud", `connected as ${me.account.email} (${me.account.plan})`);
  log("token", `saved to ${CLOUD_STATE_PATH}`, c.gray);
}

async function cloudLogout(): Promise<void> {
  if (!existsSync(CLOUD_STATE_PATH)) {
    log("cloud", "no saved session");
    return;
  }

  await fs.unlink(CLOUD_STATE_PATH);
  log("cloud", "session cleared");
}

async function cloudWhoami(config: FiyuuConfig, args: string[]): Promise<void> {
  const parsed = parseArgs(args);
  const session = await resolveSession(config, parsed.values.get("endpoint"));
  const me = await requestJson<{ account: CloudAccount }>({
    endpoint: session.endpoint,
    method: "GET",
    path: "/v1/me",
    token: session.token,
  });

  log("account", `${me.account.email} (${me.account.plan})`);
  log("limit", `plan limit: ${formatLimit(me.account.limit)}`);
}

async function cloudProjects(config: FiyuuConfig, args: string[]): Promise<void> {
  const parsed = parseArgs(args);
  const session = await resolveSession(config, parsed.values.get("endpoint"));

  const data = await requestJson<{
    limit: number;
    count: number;
    projects: Array<{ slug: string; subdomain: string; createdAt: string }>;
  }>({
    endpoint: session.endpoint,
    method: "GET",
    path: "/v1/projects",
    token: session.token,
  });

  log("projects", `${data.count}/${formatLimit(data.limit)} used`);
  if (data.projects.length === 0) {
    console.log(`  ${c.gray}No projects yet.${c.reset}`);
    return;
  }

  for (const project of data.projects) {
    console.log(`  ${c.cyan}${project.slug}${c.reset}  https://${project.subdomain}  ${c.gray}${project.createdAt}${c.reset}`);
  }
}

async function cloudProject(config: FiyuuConfig, args: string[]): Promise<void> {
  const [subcommand = "", ...rest] = args;
  const parsed = parseArgs(rest);
  const session = await resolveSession(config, parsed.values.get("endpoint"));

  if (subcommand !== "create") {
    throw new Error("Usage: fiyuu cloud project create <slug> [--name <project-name>]");
  }

  const slug = normalizeSlug(parsed.positionals[0]);
  if (!slug) {
    throw new Error("Project slug is required (a-z, 0-9, -).");
  }

  const name = (parsed.values.get("name") ?? slug).trim();
  const created = await requestJson<{
    project: { slug: string; subdomain: string };
    limit: number;
    remaining: number;
  }>({
    endpoint: session.endpoint,
    method: "POST",
    path: "/v1/projects",
    token: session.token,
    json: { slug, name },
  });

  log("project", `${created.project.slug} created`);
  log("domain", `https://${created.project.subdomain}`);
  log("limit", `${created.remaining} slots left on plan (${formatLimit(created.limit)} max)`);
}

async function cloudToken(config: FiyuuConfig, args: string[]): Promise<void> {
  const [subcommand = "", ...rest] = args;
  const parsed = parseArgs(rest);
  const session = await resolveSession(config, parsed.values.get("endpoint"));

  if (subcommand !== "create") {
    throw new Error("Usage: fiyuu cloud token create [name]");
  }

  const name = (parsed.positionals[0] ?? parsed.values.get("name") ?? "cli-token").trim();
  const created = await requestJson<{ token: string; name: string }>({
    endpoint: session.endpoint,
    method: "POST",
    path: "/v1/tokens",
    token: session.token,
    json: { name },
  });

  log("token", `name: ${created.name}`);
  console.log(`${c.bold}${c.yellow}Store this token now:${c.reset} ${created.token}`);
}

async function cloudDeploy(
  rootDirectory: string,
  appDirectory: string,
  config: FiyuuConfig,
  args: string[],
): Promise<void> {
  const parsed = parseArgs(args);
  const session = await resolveSession(config, parsed.values.get("endpoint"));
  const projectSlug = normalizeSlug(parsed.positionals[0] ?? config.cloud?.project);
  if (!projectSlug) {
    throw new Error("Project slug is required. Use `fiyuu cloud deploy <slug>` or set `cloud.project` in config.");
  }

  const skipBuild = parsed.flags.has("skip-build") || parsed.flags.has("no-build");
  const dryRun = parsed.flags.has("dry-run");
  const archivePath = path.join(os.tmpdir(), `fiyuu-cloud-${Date.now()}.tgz`);

  if (!skipBuild) {
    log("step 1/3", "building project");
    await build(rootDirectory, appDirectory, config);
  } else {
    log("step 1/3", "skipping build");
  }

  log("step 2/3", "packing source");
  await createArchive({
    rootDirectory,
    outputPath: archivePath,
    excludes: [...DEFAULT_ARCHIVE_EXCLUDES, ...(config.cloud?.excludes ?? []), ...(config.deploy?.excludes ?? [])],
    dryRun,
  });

  if (dryRun) {
    log("step 3/3", "dry-run complete (no upload)");
    return;
  }

  try {
    log("step 3/3", `uploading deploy payload for ${projectSlug}`);
    const payload = await fs.readFile(archivePath);
    const deploy = await requestJson<{
      deployment: { id: string; status: string; createdAt: string };
      project: { slug: string; subdomain: string };
    }>({
      endpoint: session.endpoint,
      method: "POST",
      path: `/v1/projects/${projectSlug}/deploy`,
      token: session.token,
      rawBody: payload,
      headers: {
        "content-type": "application/octet-stream",
      },
    });

    log("deploy", `${deploy.deployment.id} (${deploy.deployment.status})`);
    log("url", `https://${deploy.project.subdomain}`);
  } finally {
    if (existsSync(archivePath)) {
      await fs.unlink(archivePath);
    }
  }
}

async function resolveSession(config: FiyuuConfig, endpointOverride?: string): Promise<{ endpoint: string; token: string }> {
  const state = await readCloudState();
  const endpoint = resolveEndpointFromSources(config, endpointOverride, state);
  const tokenFromEnv = process.env.FIYUU_CLOUD_TOKEN?.trim();
  const token = tokenFromEnv || state?.token || "";

  if (!token) {
    throw new Error("No cloud token found. Run `fiyuu cloud login <token>` or set FIYUU_CLOUD_TOKEN.");
  }

  return { endpoint, token };
}

async function resolveEndpoint(config: FiyuuConfig, endpointOverride?: string): Promise<string> {
  const state = await readCloudState();
  return resolveEndpointFromSources(config, endpointOverride, state);
}

function resolveEndpointFromSources(
  config: FiyuuConfig,
  endpointOverride: string | undefined,
  state: CloudState | null,
): string {
  const endpoint =
    endpointOverride?.trim() ||
    process.env.FIYUU_CLOUD_ENDPOINT?.trim() ||
    config.cloud?.endpoint?.trim() ||
    state?.endpoint?.trim() ||
    DEFAULT_CLOUD_ENDPOINT;

  return trimTrailingSlash(endpoint);
}

async function readCloudState(): Promise<CloudState | null> {
  if (!existsSync(CLOUD_STATE_PATH)) {
    return null;
  }

  try {
    const raw = await fs.readFile(CLOUD_STATE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<CloudState>;
    if (!parsed.token || !parsed.endpoint) {
      return null;
    }

    return {
      endpoint: String(parsed.endpoint),
      token: String(parsed.token),
      updatedAt: String(parsed.updatedAt || new Date().toISOString()),
    };
  } catch {
    return null;
  }
}

async function writeCloudState(state: CloudState): Promise<void> {
  await fs.mkdir(path.dirname(CLOUD_STATE_PATH), { recursive: true });
  await fs.writeFile(CLOUD_STATE_PATH, JSON.stringify(state, null, 2) + "\n", { mode: 0o600 });
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function parseArgs(args: string[]): ParsedArgs {
  const flags = new Set<string>();
  const values = new Map<string, string>();
  const positionals: string[] = [];

  for (let i = 0; i < args.length; i += 1) {
    const current = args[i];
    if (!current.startsWith("--")) {
      positionals.push(current);
      continue;
    }

    const withoutPrefix = current.slice(2);
    const eqIndex = withoutPrefix.indexOf("=");
    if (eqIndex >= 0) {
      const key = withoutPrefix.slice(0, eqIndex).trim();
      const value = withoutPrefix.slice(eqIndex + 1).trim();
      if (key) {
        values.set(key, value);
      }
      continue;
    }

    const next = args[i + 1];
    if (next && !next.startsWith("--")) {
      values.set(withoutPrefix, next);
      i += 1;
      continue;
    }

    flags.add(withoutPrefix);
  }

  return { positionals, flags, values };
}

function normalizeSlug(input: string | undefined): string {
  const slug = String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return "";
  }

  return slug;
}

function formatLimit(limit: number): string {
  if (!Number.isFinite(limit)) {
    return "unlimited";
  }

  return String(limit);
}

type CloudAccount = {
  id: string;
  email: string;
  name: string;
  plan: string;
  limit: number;
};

async function requestJson<T>(input: {
  endpoint: string;
  method: "GET" | "POST";
  path: string;
  token?: string;
  json?: unknown;
  rawBody?: Buffer;
  headers?: Record<string, string>;
}): Promise<T> {
  const url = `${input.endpoint}${input.path}`;
  const headers: Record<string, string> = {
    accept: "application/json",
    ...input.headers,
  };

  if (input.token) {
    headers.authorization = `Bearer ${input.token}`;
  }

  let body: string | Blob | undefined;
  if (input.rawBody) {
    const bytes = Uint8Array.from(input.rawBody);
    body = new Blob([bytes], { type: headers["content-type"] ?? "application/octet-stream" });
  } else if (input.json !== undefined) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(input.json);
  }

  const response = await fetch(url, {
    method: input.method,
    headers,
    body,
  });

  const text = await response.text();
  const parsed = parseJson(text);

  if (!response.ok) {
    const reason = extractErrorMessage(parsed) || `${response.status} ${response.statusText}`;
    throw new Error(`Cloud API request failed: ${reason}`);
  }

  return parsed as T;
}

function parseJson(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) {
    return {};
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return { raw: text };
  }
}

function extractErrorMessage(value: unknown): string {
  if (!value || typeof value !== "object") {
    return "";
  }

  const maybeError = (value as { error?: unknown }).error;
  if (typeof maybeError === "string" && maybeError.trim()) {
    return maybeError.trim();
  }

  return "";
}

async function createArchive(input: {
  rootDirectory: string;
  outputPath: string;
  excludes: string[];
  dryRun: boolean;
}): Promise<void> {
  const args: string[] = ["-czf", input.outputPath];
  const unique = Array.from(new Set(input.excludes.map((item) => item.trim()).filter(Boolean)));
  for (const pattern of unique) {
    args.push(`--exclude=${pattern}`);
  }
  args.push("-C", input.rootDirectory, ".");

  await runProcess("tar", args, { dryRun: input.dryRun });
}

async function runProcess(command: string, args: string[], options: RunOptions = {}): Promise<void> {
  const rendered = [command, ...args].join(" ");
  log("exec", rendered, c.gray);

  if (options.dryRun) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      stdio: "inherit",
      env: process.env,
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Command failed (${code}): ${rendered}`));
    });
  });
}
