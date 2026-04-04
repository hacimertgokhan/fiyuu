import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";

const STORE_PATH = process.env.FIYUU_CONTROL_STORE || path.resolve(process.cwd(), "data/store.json");
const POLL_INTERVAL_MS = Number(process.env.FIYUU_WORKER_POLL_MS || 3000);
const DEPLOY_HOOK = (process.env.FIYUU_DEPLOY_HOOK || "").trim();
const KEEP_ARTIFACTS = process.env.FIYUU_KEEP_ARTIFACTS === "true";

let busy = false;
let writeQueue = Promise.resolve();

if (!existsSync(STORE_PATH)) {
  console.error(`[fiyuu-work] store file not found: ${STORE_PATH}`);
  process.exit(1);
}

console.log("[fiyuu-work] deployment worker started");
console.log(`[fiyuu-work] poll interval: ${POLL_INTERVAL_MS}ms`);
if (!DEPLOY_HOOK) {
  console.warn("[fiyuu-work] FIYUU_DEPLOY_HOOK is not set. Deployments will fail until a hook command is configured.");
}

setInterval(() => {
  void tick();
}, POLL_INTERVAL_MS);

void tick();

async function tick() {
  if (busy) {
    return;
  }
  busy = true;

  try {
    const store = await readStore();
    const deployment = store.deployments.find((item) => item.status === "queued");
    if (!deployment) {
      return;
    }

    deployment.status = "running";
    deployment.startedAt = now();
    deployment.log = appendLog(deployment.log, "Worker picked deployment from queue.");
    await writeStore(store);

    const project = store.projects.find((item) => item.id === deployment.projectId);
    if (!project) {
      await failDeployment(deployment.id, "Project not found.");
      return;
    }

    if (!deployment.artifactPath || !existsSync(deployment.artifactPath)) {
      await failDeployment(deployment.id, "Deployment artifact missing.");
      return;
    }

    const hook = await runDeployHook({
      deploymentId: deployment.id,
      projectSlug: project.slug,
      subdomain: project.subdomain,
      artifactPath: deployment.artifactPath,
    });

    if (!hook.ok) {
      await failDeployment(deployment.id, hook.output || "Hook failed.");
      return;
    }

    const fresh = await readStore();
    const target = fresh.deployments.find((item) => item.id === deployment.id);
    if (!target) {
      return;
    }

    target.status = "ready";
    target.finishedAt = now();
    target.log = appendLog(target.log, hook.output || "Deployment completed.");
    await writeStore(fresh);

    if (!KEEP_ARTIFACTS && target.artifactPath && existsSync(target.artifactPath)) {
      await fs.unlink(target.artifactPath);
    }
  } catch (error) {
    console.error("[fiyuu-work] worker loop error:", error);
  } finally {
    busy = false;
  }
}

async function failDeployment(deploymentId, reason) {
  const store = await readStore();
  const deployment = store.deployments.find((item) => item.id === deploymentId);
  if (!deployment) {
    return;
  }

  deployment.status = "failed";
  deployment.finishedAt = now();
  deployment.log = appendLog(deployment.log, reason);
  await writeStore(store);
}

async function runDeployHook(input) {
  if (!DEPLOY_HOOK) {
    return {
      ok: false,
      output: "FIYUU_DEPLOY_HOOK is missing. Set a command that performs build+push+deploy.",
    };
  }

  const args = [input.deploymentId, input.projectSlug, input.subdomain, input.artifactPath];
  const command = `${DEPLOY_HOOK} ${args.map(quote).join(" ")}`;

  return new Promise((resolve) => {
    const child = spawn(command, {
      shell: true,
      env: {
        ...process.env,
        FIYUU_DEPLOYMENT_ID: input.deploymentId,
        FIYUU_PROJECT_SLUG: input.projectSlug,
        FIYUU_SUBDOMAIN: input.subdomain,
        FIYUU_ARTIFACT_PATH: input.artifactPath,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    const output = [];
    child.stdout.on("data", (chunk) => output.push(String(chunk)));
    child.stderr.on("data", (chunk) => output.push(String(chunk)));

    child.on("close", (code) => {
      const text = output.join("").trim();
      resolve({
        ok: code === 0,
        output: text || `Hook exited with code ${code ?? "unknown"}.`,
      });
    });
  });
}

function quote(value) {
  return `'${String(value).replace(/'/g, `'"'"'`)}'`;
}

function appendLog(existing, next) {
  const lines = [String(existing || "").trim(), `[${now()}] ${next}`].filter(Boolean);
  return lines.join("\n");
}

function now() {
  return new Date().toISOString();
}

async function readStore() {
  const content = await fs.readFile(STORE_PATH, "utf8");
  const parsed = JSON.parse(content);
  return {
    accounts: Array.isArray(parsed.accounts) ? parsed.accounts : [],
    sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    tokens: Array.isArray(parsed.tokens) ? parsed.tokens : [],
    projects: Array.isArray(parsed.projects) ? parsed.projects : [],
    deployments: Array.isArray(parsed.deployments) ? parsed.deployments : [],
  };
}

async function writeStore(nextStore) {
  writeQueue = writeQueue.then(async () => {
    const temp = `${STORE_PATH}.tmp`;
    await fs.writeFile(temp, JSON.stringify(nextStore, null, 2) + "\n", "utf8");
    await fs.rename(temp, STORE_PATH);
  });

  await writeQueue;
}
