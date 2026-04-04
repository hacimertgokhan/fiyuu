import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import type { FiyuuConfig } from "@fiyuu/core";

import { c, existsSync, fs, log, warn } from "../shared.js";
import { build } from "./build.js";

type DeployOptions = {
  dryRun: boolean;
  skipBuild: boolean;
};

type RunOptions = {
  cwd?: string;
  dryRun?: boolean;
  input?: string;
};

const DEFAULT_PORT = 4050;
const DEFAULT_EXCLUDES = [
  ".git",
  "node_modules",
  ".fiyuu/dev",
  ".fiyuu/cache",
  "dist",
  "*.log",
];

export async function deploy(
  rootDirectory: string,
  appDirectory: string,
  config: FiyuuConfig,
  args: string[] = [],
): Promise<void> {
  const options = parseDeployOptions(args);
  const deployConfig = config.deploy;

  if (!deployConfig || !deployConfig.ssh) {
    throw new Error("Missing `deploy.ssh` configuration in fiyuu.config.ts.");
  }

  const ssh = deployConfig.ssh;
  if (!ssh.host || !ssh.user || !ssh.destinationPath) {
    throw new Error("`deploy.ssh.host`, `deploy.ssh.user`, and `deploy.ssh.destinationPath` are required.");
  }

  const sshPort = ssh.port ?? 22;
  const keepReleases = Math.max(1, ssh.keepReleases ?? 3);
  const destinationPath = trimTrailingSlash(ssh.destinationPath);
  const releaseId = createReleaseId();
  const remoteArchivePath = `/tmp/fiyuu-${releaseId}.tgz`;
  const localArchivePath = path.join(os.tmpdir(), `fiyuu-${releaseId}.tgz`);
  const shouldBuildLocally = deployConfig.localBuild !== false && !options.skipBuild;

  const privateKeyPath = resolveOptionalPath(rootDirectory, ssh.privateKeyPath);
  if (privateKeyPath && !existsSync(privateKeyPath)) {
    throw new Error(`SSH key not found: ${privateKeyPath}`);
  }

  const ecosystemFile = await ensurePm2EcosystemFile(rootDirectory, config, options.dryRun);

  log("deploy", `${ssh.user}@${ssh.host}:${destinationPath}`);
  if (options.dryRun) {
    warn("dry-run enabled — no files will be uploaded and no remote commands will execute.");
  }

  if (shouldBuildLocally) {
    log("step 1/4", "building locally");
    await build(rootDirectory, appDirectory, config);
  } else {
    log("step 1/4", "skipping local build");
  }

  log("step 2/4", "creating deployment archive");
  await createArchive({
    rootDirectory,
    outputPath: localArchivePath,
    excludes: [...DEFAULT_EXCLUDES, ...(deployConfig.excludes ?? [])],
    dryRun: options.dryRun,
  });

  log("step 3/4", "uploading archive to remote host");
  const scpArgs = buildScpArgs({
    privateKeyPath,
    port: sshPort,
    source: localArchivePath,
    target: `${ssh.user}@${ssh.host}:${remoteArchivePath}`,
  });
  await runProcess("scp", scpArgs, { dryRun: options.dryRun });

  log("step 4/4", "running remote install/build/start commands");
  const remoteScript = createRemoteScript({
    destinationPath,
    releaseId,
    remoteArchivePath,
    keepReleases,
    installCommand: deployConfig.remote?.installCommand ?? "npm install --omit=dev",
    buildCommand: deployConfig.remote?.buildCommand ?? "npm run build",
    startCommand: deployConfig.remote?.startCommand,
    healthcheckCommand: deployConfig.remote?.healthcheckCommand,
    pm2Enabled: deployConfig.pm2?.enabled !== false,
    pm2AppName: deployConfig.pm2?.appName ?? normalizeAppName(config.app?.name || path.basename(rootDirectory)),
    pm2EcosystemFile: ecosystemFile,
  });

  const sshArgs = buildSshArgs({
    privateKeyPath,
    port: sshPort,
    target: `${ssh.user}@${ssh.host}`,
  });
  await runProcess("ssh", [...sshArgs, "bash", "-s"], { dryRun: options.dryRun, input: remoteScript });

  if (!options.dryRun && existsSync(localArchivePath)) {
    await fs.unlink(localArchivePath);
  }

  log("done", `deployment completed (${releaseId})`, c.green);
}

function parseDeployOptions(args: string[]): DeployOptions {
  const options: DeployOptions = {
    dryRun: false,
    skipBuild: false,
  };

  for (const arg of args) {
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--skip-build" || arg === "--no-build") {
      options.skipBuild = true;
      continue;
    }

    throw new Error(`Unknown deploy option: ${arg}`);
  }

  return options;
}

function createReleaseId(): string {
  return new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "") || "/";
}

function resolveOptionalPath(rootDirectory: string, maybePath: string | undefined): string | null {
  if (!maybePath) {
    return null;
  }

  if (path.isAbsolute(maybePath)) {
    return maybePath;
  }

  return path.resolve(rootDirectory, maybePath);
}

function normalizeAppName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "fiyuu-app";
}

async function ensurePm2EcosystemFile(
  rootDirectory: string,
  config: FiyuuConfig,
  dryRun: boolean,
): Promise<string> {
  const deployConfig = config.deploy;
  const pm2 = deployConfig?.pm2;
  const ecosystemFile = pm2?.ecosystemFile ?? "ecosystem.config.cjs";
  const shouldAutoCreate = pm2?.autoCreate !== false;

  if (!shouldAutoCreate || pm2?.enabled === false) {
    return ecosystemFile;
  }

  const absolutePath = path.resolve(rootDirectory, ecosystemFile);
  if (existsSync(absolutePath)) {
    return ecosystemFile;
  }

  const instances = pm2?.instances ?? 1;
  const execMode = pm2?.execMode ?? (instances === 1 ? "fork" : "cluster");
  const appName = pm2?.appName ?? normalizeAppName(config.app?.name || path.basename(rootDirectory));
  const maxMemoryRestart = pm2?.maxMemoryRestart ?? "300M";
  const env: Record<string, string> = {
    NODE_ENV: "production",
    PORT: String(config.app?.port ?? DEFAULT_PORT),
    ...(pm2?.env ?? {}),
  };

  const envLines = Object.entries(env)
    .map(([key, value]) => `      ${JSON.stringify(key)}: ${JSON.stringify(value)},`)
    .join("\n");

  const instancesValue = typeof instances === "number" ? String(instances) : JSON.stringify(instances);

  const content = `module.exports = {\n  apps: [\n    {\n      name: ${JSON.stringify(appName)},\n      script: "npm",\n      args: "run start",\n      cwd: __dirname,\n      instances: ${instancesValue},\n      exec_mode: ${JSON.stringify(execMode)},\n      max_memory_restart: ${JSON.stringify(maxMemoryRestart)},\n      env: {\n${envLines}\n      },\n    },\n  ],\n};\n`;

  if (dryRun) {
    log("pm2", `dry-run: would create ${ecosystemFile}`);
    return ecosystemFile;
  }

  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, content, "utf8");
  log("pm2", `created ${ecosystemFile}`);

  return ecosystemFile;
}

async function createArchive(input: {
  rootDirectory: string;
  outputPath: string;
  excludes: string[];
  dryRun: boolean;
}): Promise<void> {
  const excludeSet = new Set(
    input.excludes
      .map((item) => item.trim())
      .filter(Boolean),
  );

  const args: string[] = ["-czf", input.outputPath];
  for (const pattern of excludeSet) {
    args.push(`--exclude=${pattern}`);
  }
  args.push("-C", input.rootDirectory, ".");

  await runProcess("tar", args, { dryRun: input.dryRun });
}

function buildScpArgs(input: {
  privateKeyPath: string | null;
  port: number;
  source: string;
  target: string;
}): string[] {
  const args: string[] = [];

  if (input.privateKeyPath) {
    args.push("-i", input.privateKeyPath);
  }

  args.push("-P", String(input.port));
  args.push(input.source, input.target);

  return args;
}

function buildSshArgs(input: {
  privateKeyPath: string | null;
  port: number;
  target: string;
}): string[] {
  const args: string[] = [];

  if (input.privateKeyPath) {
    args.push("-i", input.privateKeyPath);
  }

  args.push("-p", String(input.port));
  args.push(input.target);

  return args;
}

function quote(value: string): string {
  return `'${value.replace(/'/g, `'"'"'`)}'`;
}

function createRemoteScript(input: {
  destinationPath: string;
  releaseId: string;
  remoteArchivePath: string;
  keepReleases: number;
  installCommand: string;
  buildCommand: string;
  startCommand?: string;
  healthcheckCommand?: string;
  pm2Enabled: boolean;
  pm2AppName: string;
  pm2EcosystemFile: string;
}): string {
  const lines: string[] = [];

  lines.push("set -euo pipefail");
  lines.push(`DEPLOY_BASE=${quote(input.destinationPath)}`);
  lines.push(`RELEASE_ID=${quote(input.releaseId)}`);
  lines.push(`ARCHIVE_PATH=${quote(input.remoteArchivePath)}`);
  lines.push(`KEEP_RELEASES=${Math.max(1, input.keepReleases)}`);
  lines.push("RELEASES_DIR=\"$DEPLOY_BASE/releases\"");
  lines.push("RELEASE_PATH=\"$RELEASES_DIR/$RELEASE_ID\"");
  lines.push("CURRENT_PATH=\"$DEPLOY_BASE/current\"");
  lines.push("");
  lines.push("mkdir -p \"$RELEASES_DIR\" \"$DEPLOY_BASE/shared\" \"$RELEASE_PATH\"");
  lines.push("tar -xzf \"$ARCHIVE_PATH\" -C \"$RELEASE_PATH\"");
  lines.push("rm -f \"$ARCHIVE_PATH\"");
  lines.push("ln -sfn \"$RELEASE_PATH\" \"$CURRENT_PATH\"");
  lines.push("cd \"$CURRENT_PATH\"");
  lines.push("");
  lines.push(input.installCommand);
  lines.push(input.buildCommand);
  lines.push("");

  if (input.startCommand && input.startCommand.trim()) {
    lines.push(input.startCommand);
  } else if (input.pm2Enabled) {
    lines.push("if command -v pm2 >/dev/null 2>&1; then");
    lines.push(`  if [ -f ${quote(input.pm2EcosystemFile)} ]; then`);
    lines.push(`    pm2 startOrReload ${quote(input.pm2EcosystemFile)} --env production`);
    lines.push("  else");
    lines.push(`    pm2 start \"npm run start\" --name ${quote(input.pm2AppName)} --update-env`);
    lines.push("  fi");
    lines.push("  pm2 save >/dev/null 2>&1 || true");
    lines.push("else");
    lines.push("  mkdir -p .fiyuu");
    lines.push("  if [ -f .fiyuu/server.pid ] && kill -0 \"$(cat .fiyuu/server.pid)\" 2>/dev/null; then");
    lines.push("    kill \"$(cat .fiyuu/server.pid)\" || true");
    lines.push("  fi");
    lines.push("  nohup npm run start > .fiyuu/runtime.log 2>&1 &");
    lines.push("  echo $! > .fiyuu/server.pid");
    lines.push("fi");
  } else {
    lines.push("mkdir -p .fiyuu");
    lines.push("if [ -f .fiyuu/server.pid ] && kill -0 \"$(cat .fiyuu/server.pid)\" 2>/dev/null; then");
    lines.push("  kill \"$(cat .fiyuu/server.pid)\" || true");
    lines.push("fi");
    lines.push("nohup npm run start > .fiyuu/runtime.log 2>&1 &");
    lines.push("echo $! > .fiyuu/server.pid");
  }

  if (input.healthcheckCommand && input.healthcheckCommand.trim()) {
    lines.push("");
    lines.push(input.healthcheckCommand);
  }

  lines.push("");
  lines.push("if [ -d \"$RELEASES_DIR\" ]; then");
  lines.push("  cd \"$RELEASES_DIR\"");
  lines.push("  RELEASE_COUNT=$(ls -1 | wc -l | tr -d ' ')");
  lines.push("  if [ \"$RELEASE_COUNT\" -gt \"$KEEP_RELEASES\" ]; then");
  lines.push("    ls -1dt * | tail -n +$((KEEP_RELEASES + 1)) | while read -r OLD_RELEASE; do");
  lines.push("      rm -rf \"$RELEASES_DIR/$OLD_RELEASE\"");
  lines.push("    done");
  lines.push("  fi");
  lines.push("fi");

  return `${lines.join("\n")}\n`;
}

async function runProcess(command: string, args: string[], options: RunOptions = {}): Promise<void> {
  const rendered = renderCommand(command, args);
  log("exec", rendered, c.gray);

  if (options.dryRun) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      stdio: ["pipe", "inherit", "inherit"],
      env: process.env,
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Command failed (${code}): ${rendered}`));
    });

    if (options.input) {
      child.stdin.write(options.input);
    }

    child.stdin.end();
  });
}

function renderCommand(command: string, args: string[]): string {
  return [command, ...args].map(renderArg).join(" ");
}

function renderArg(value: string): string {
  if (/^[a-zA-Z0-9_@%+=:,./-]+$/.test(value)) {
    return value;
  }

  return JSON.stringify(value);
}
