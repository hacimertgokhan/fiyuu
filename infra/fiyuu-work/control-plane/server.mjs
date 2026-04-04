import { createServer } from "node:http";
import { randomBytes, randomUUID, createHash, timingSafeEqual, scryptSync } from "node:crypto";
import { existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";

const PORT = Number(process.env.PORT || 7788);
const ADMIN_SECRET = process.env.FIYUU_ADMIN_SECRET || "";
const STORE_PATH = process.env.FIYUU_CONTROL_STORE || path.resolve(process.cwd(), "data/store.json");
const UPLOADS_DIR = process.env.FIYUU_UPLOADS_DIR || path.resolve(path.dirname(STORE_PATH), "uploads");
const MAX_BODY_BYTES = 64 * 1024 * 1024;
const SESSION_TTL_DAYS = Number(process.env.FIYUU_SESSION_TTL_DAYS || 14);
const CORS_ORIGIN = process.env.FIYUU_CORS_ORIGIN || "*";

const PLAN_LIMITS = {
  free: 3,
  pro: 100,
  enterprise: Number.POSITIVE_INFINITY,
};

let writeQueue = Promise.resolve();

await ensureStore();

const server = createServer(async (req, res) => {
  try {
    applyCors(res);
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url || "/", `http://localhost:${PORT}`);

    if (req.method === "GET" && url.pathname === "/healthz") {
      sendJson(res, 200, { ok: true, service: "fiyuu-work-control-plane" });
      return;
    }

    if (req.method === "POST" && url.pathname === "/v1/admin/bootstrap") {
      await handleBootstrap(req, res);
      return;
    }

    if (req.method === "POST" && url.pathname === "/v1/accounts/register") {
      await handleRegister(req, res);
      return;
    }

    if (req.method === "POST" && url.pathname === "/v1/accounts/login") {
      await handleLogin(req, res);
      return;
    }

    if (!url.pathname.startsWith("/v1/")) {
      sendJson(res, 404, { error: "Not found" });
      return;
    }

    if (req.method === "GET" && url.pathname === "/v1/accounts/me") {
      const auth = await authenticateSession(req);
      if (!auth.ok) {
        sendJson(res, auth.status, { error: auth.error });
        return;
      }

      const store = await readStore();
      const activeProjects = store.projects.filter((item) => item.accountId === auth.account.id && !item.archivedAt).length;

      sendJson(res, 200, {
        account: publicAccount(auth.account),
        projects: {
          active: activeProjects,
          limit: limitForPlan(auth.account.plan),
        },
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/v1/accounts/cli-token") {
      const auth = await authenticateSession(req);
      if (!auth.ok) {
        sendJson(res, auth.status, { error: auth.error });
        return;
      }

      await handleCreateToken(req, res, auth.account);
      return;
    }

    const auth = await authenticateApiToken(req);
    if (!auth.ok) {
      sendJson(res, auth.status, { error: auth.error });
      return;
    }

    if (req.method === "GET" && url.pathname === "/v1/me") {
      sendJson(res, 200, {
        account: publicAccount(auth.account),
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/v1/projects") {
      const store = await readStore();
      const projects = store.projects
        .filter((project) => project.accountId === auth.account.id && !project.archivedAt)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

      sendJson(res, 200, {
        limit: limitForPlan(auth.account.plan),
        count: projects.length,
        projects,
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/v1/projects") {
      await handleCreateProject(req, res, auth.account);
      return;
    }

    if (req.method === "POST" && url.pathname === "/v1/tokens") {
      await handleCreateToken(req, res, auth.account);
      return;
    }

    const deployMatch = url.pathname.match(/^\/v1\/projects\/([a-z0-9-]{1,48})\/deploy$/);
    if (req.method === "POST" && deployMatch) {
      await handleDeploy(req, res, auth.account, deployMatch[1]);
      return;
    }

    const deploymentsMatch = url.pathname.match(/^\/v1\/projects\/([a-z0-9-]{1,48})\/deployments$/);
    if (req.method === "GET" && deploymentsMatch) {
      await handleListDeployments(res, auth.account, deploymentsMatch[1]);
      return;
    }

    sendJson(res, 404, { error: "Not found" });
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

server.listen(PORT, () => {
  console.log(`[fiyuu-work] control-plane listening on http://localhost:${PORT}`);
  if (!ADMIN_SECRET) {
    console.warn("[fiyuu-work] WARNING: FIYUU_ADMIN_SECRET is empty. Bootstrap endpoint is disabled.");
  }
});

async function handleRegister(req, res) {
  const body = await readJson(req);
  const email = normalizeEmail(body.email);
  const name = String(body.name || "").trim().slice(0, 120);
  const password = String(body.password || "");

  if (!email || !name) {
    sendJson(res, 400, { error: "`email` and `name` are required." });
    return;
  }

  if (!isStrongEnoughPassword(password)) {
    sendJson(res, 400, { error: "`password` must be at least 8 characters." });
    return;
  }

  const store = await readStore();
  const existing = store.accounts.find((item) => item.email === email);
  if (existing) {
    sendJson(res, 409, { error: "Account already exists for this email." });
    return;
  }

  const account = {
    id: randomUUID(),
    email,
    name,
    plan: "free",
    passwordHash: hashPassword(password),
    createdAt: now(),
    disabledAt: null,
  };

  store.accounts.push(account);
  const sessionToken = createSession(store, account.id);
  await writeStore(store);

  sendJson(res, 201, {
    account: publicAccount(account),
    sessionToken,
    message: "Registration completed.",
  });
}

async function handleLogin(req, res) {
  const body = await readJson(req);
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");

  if (!email || !password) {
    sendJson(res, 400, { error: "`email` and `password` are required." });
    return;
  }

  const store = await readStore();
  const account = store.accounts.find((item) => item.email === email && !item.disabledAt);
  if (!account || !account.passwordHash || !verifyPassword(password, account.passwordHash)) {
    sendJson(res, 401, { error: "Invalid credentials." });
    return;
  }

  const sessionToken = createSession(store, account.id);
  await writeStore(store);

  sendJson(res, 200, {
    account: publicAccount(account),
    sessionToken,
  });
}

async function handleBootstrap(req, res) {
  if (!ADMIN_SECRET) {
    sendJson(res, 503, { error: "Bootstrap disabled. Set FIYUU_ADMIN_SECRET." });
    return;
  }

  const provided = req.headers["x-admin-secret"];
  if (provided !== ADMIN_SECRET) {
    sendJson(res, 403, { error: "Invalid admin secret" });
    return;
  }

  const body = await readJson(req);
  const email = normalizeEmail(body.email);
  const name = String(body.name || "").trim();
  const plan = normalizePlan(body.plan);
  const password = String(body.password || "");

  if (!email || !name) {
    sendJson(res, 400, { error: "`email` and `name` are required" });
    return;
  }

  const store = await readStore();
  let account = store.accounts.find((item) => item.email === email);

  if (!account) {
    account = {
      id: randomUUID(),
      email,
      name,
      plan,
      passwordHash: password ? hashPassword(password) : null,
      createdAt: now(),
      disabledAt: null,
    };
    store.accounts.push(account);
  }

  const tokenValue = randomToken();
  store.tokens.push({
    id: randomUUID(),
    accountId: account.id,
    name: "bootstrap-token",
    tokenHash: hashToken(tokenValue),
    createdAt: now(),
    lastUsedAt: null,
    revokedAt: null,
  });

  await writeStore(store);

  sendJson(res, 201, {
    account: publicAccount(account),
    token: tokenValue,
    message: "Store this token now. It will not be shown again.",
  });
}

async function handleCreateProject(req, res, account) {
  const body = await readJson(req);
  const slug = normalizeSlug(body.slug);
  const name = String(body.name || slug).trim().slice(0, 80);

  if (!slug) {
    sendJson(res, 400, { error: "Valid `slug` is required (a-z, 0-9, -)." });
    return;
  }

  const store = await readStore();
  const owned = store.projects.filter((project) => project.accountId === account.id && !project.archivedAt);

  if (owned.length >= limitForPlan(account.plan)) {
    sendJson(res, 403, {
      error: `Project limit reached for plan '${account.plan}'.`,
      code: "PLAN_PROJECT_LIMIT",
      limit: limitForPlan(account.plan),
      current: owned.length,
    });
    return;
  }

  if (store.projects.some((project) => project.slug === slug && !project.archivedAt)) {
    sendJson(res, 409, { error: "Project slug is already taken." });
    return;
  }

  const project = {
    id: randomUUID(),
    accountId: account.id,
    slug,
    name,
    subdomain: `${slug}.fiyuu.work`,
    createdAt: now(),
    archivedAt: null,
  };

  store.projects.push(project);
  await writeStore(store);

  sendJson(res, 201, {
    project,
    limit: limitForPlan(account.plan),
    remaining: Math.max(0, limitForPlan(account.plan) - (owned.length + 1)),
  });
}

async function handleCreateToken(req, res, account) {
  const body = await readJson(req);
  const tokenName = String(body.name || "cli-token").trim().slice(0, 64) || "cli-token";

  const store = await readStore();
  const tokenValue = randomToken();

  store.tokens.push({
    id: randomUUID(),
    accountId: account.id,
    name: tokenName,
    tokenHash: hashToken(tokenValue),
    createdAt: now(),
    lastUsedAt: null,
    revokedAt: null,
  });

  await writeStore(store);

  sendJson(res, 201, {
    token: tokenValue,
    name: tokenName,
    message: "Store this token now. It will not be shown again.",
  });
}

async function handleDeploy(req, res, account, projectSlug) {
  const store = await readStore();
  const project = store.projects.find((item) => item.accountId === account.id && item.slug === projectSlug && !item.archivedAt);

  if (!project) {
    sendJson(res, 404, { error: "Project not found" });
    return;
  }

  const body = await readRawBody(req, MAX_BODY_BYTES);
  if (body.length === 0) {
    sendJson(res, 400, { error: "Empty deploy payload" });
    return;
  }

  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  const artifactPath = path.join(UPLOADS_DIR, `${project.id}-${Date.now()}.tgz`);
  await fs.writeFile(artifactPath, body, { mode: 0o600 });

  const deployment = {
    id: randomUUID(),
    projectId: project.id,
    status: "queued",
    sourceSizeBytes: body.length,
    artifactPath,
    createdAt: now(),
    startedAt: null,
    finishedAt: null,
    log: "Queued by control-plane. Connect this endpoint to your build runner.",
  };

  store.deployments.push(deployment);
  await writeStore(store);

  sendJson(res, 202, {
    deployment,
    project: {
      id: project.id,
      slug: project.slug,
      subdomain: project.subdomain,
    },
  });
}

async function handleListDeployments(res, account, projectSlug) {
  const store = await readStore();
  const project = store.projects.find((item) => item.accountId === account.id && item.slug === projectSlug);

  if (!project) {
    sendJson(res, 404, { error: "Project not found" });
    return;
  }

  const deployments = store.deployments
    .filter((item) => item.projectId === project.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  sendJson(res, 200, { project, deployments });
}

async function authenticateApiToken(req) {
  const token = bearerToken(req);
  if (!token) {
    return { ok: false, status: 401, error: "Missing Bearer token" };
  }

  const tokenHash = hashToken(token);
  const store = await readStore();
  const tokenRecord = store.tokens.find((item) => safeTokenHashEquals(item.tokenHash, tokenHash) && !item.revokedAt);
  if (!tokenRecord) {
    return { ok: false, status: 401, error: "Invalid token" };
  }

  const account = store.accounts.find((item) => item.id === tokenRecord.accountId && !item.disabledAt);
  if (!account) {
    return { ok: false, status: 401, error: "Account disabled or missing" };
  }

  tokenRecord.lastUsedAt = now();
  await writeStore(store);

  return { ok: true, account, tokenRecord };
}

async function authenticateSession(req) {
  const sessionToken = bearerToken(req);
  if (!sessionToken) {
    return { ok: false, status: 401, error: "Missing session token" };
  }

  const nowIso = now();
  const sessionHash = hashToken(sessionToken);
  const store = await readStore();

  const session = store.sessions.find((item) => {
    if (item.revokedAt) return false;
    if (!safeTokenHashEquals(item.sessionHash, sessionHash)) return false;
    return item.expiresAt > nowIso;
  });

  if (!session) {
    return { ok: false, status: 401, error: "Invalid or expired session token" };
  }

  const account = store.accounts.find((item) => item.id === session.accountId && !item.disabledAt);
  if (!account) {
    return { ok: false, status: 401, error: "Account disabled or missing" };
  }

  session.lastUsedAt = nowIso;
  await writeStore(store);

  return { ok: true, account, session };
}

function bearerToken(req) {
  const authorization = req.headers.authorization || "";
  if (!authorization.startsWith("Bearer ")) {
    return "";
  }
  return authorization.slice("Bearer ".length).trim();
}

function createSession(store, accountId) {
  const sessionToken = `sess_${randomToken()}`;
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  store.sessions.push({
    id: randomUUID(),
    accountId,
    sessionHash: hashToken(sessionToken),
    createdAt: now(),
    lastUsedAt: null,
    expiresAt,
    revokedAt: null,
  });

  return sessionToken;
}

async function ensureStore() {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  if (existsSync(STORE_PATH)) {
    return;
  }

  await fs.writeFile(
    STORE_PATH,
    JSON.stringify(
      {
        accounts: [],
        sessions: [],
        tokens: [],
        projects: [],
        deployments: [],
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );
}

async function readStore() {
  const content = await fs.readFile(STORE_PATH, "utf8");
  const parsed = JSON.parse(content);

  return {
    accounts: normalizeArray(parsed.accounts).map((item) => ({
      id: String(item.id || randomUUID()),
      email: normalizeEmail(item.email),
      name: String(item.name || ""),
      plan: normalizePlan(item.plan),
      passwordHash: typeof item.passwordHash === "string" && item.passwordHash ? item.passwordHash : null,
      createdAt: String(item.createdAt || now()),
      disabledAt: item.disabledAt ? String(item.disabledAt) : null,
    })),
    sessions: normalizeArray(parsed.sessions).map((item) => ({
      id: String(item.id || randomUUID()),
      accountId: String(item.accountId || ""),
      sessionHash: String(item.sessionHash || ""),
      createdAt: String(item.createdAt || now()),
      lastUsedAt: item.lastUsedAt ? String(item.lastUsedAt) : null,
      expiresAt: String(item.expiresAt || now()),
      revokedAt: item.revokedAt ? String(item.revokedAt) : null,
    })),
    tokens: normalizeArray(parsed.tokens).map((item) => ({
      id: String(item.id || randomUUID()),
      accountId: String(item.accountId || ""),
      name: String(item.name || "cli-token"),
      tokenHash: String(item.tokenHash || ""),
      createdAt: String(item.createdAt || now()),
      lastUsedAt: item.lastUsedAt ? String(item.lastUsedAt) : null,
      revokedAt: item.revokedAt ? String(item.revokedAt) : null,
    })),
    projects: normalizeArray(parsed.projects).map((item) => ({
      id: String(item.id || randomUUID()),
      accountId: String(item.accountId || ""),
      slug: normalizeSlug(item.slug),
      name: String(item.name || item.slug || ""),
      subdomain: String(item.subdomain || `${normalizeSlug(item.slug)}.fiyuu.work`),
      createdAt: String(item.createdAt || now()),
      archivedAt: item.archivedAt ? String(item.archivedAt) : null,
    })),
    deployments: normalizeArray(parsed.deployments).map((item) => ({
      id: String(item.id || randomUUID()),
      projectId: String(item.projectId || ""),
      status: normalizeDeploymentStatus(item.status),
      sourceSizeBytes: Number(item.sourceSizeBytes || 0),
      artifactPath: item.artifactPath ? String(item.artifactPath) : null,
      createdAt: String(item.createdAt || now()),
      startedAt: item.startedAt ? String(item.startedAt) : null,
      finishedAt: item.finishedAt ? String(item.finishedAt) : null,
      log: String(item.log || ""),
    })),
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

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function safeTokenHashEquals(leftHex, rightHex) {
  try {
    const left = Buffer.from(leftHex, "hex");
    const right = Buffer.from(rightHex, "hex");
    if (left.length !== right.length || left.length === 0) {
      return false;
    }

    return timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

function randomToken() {
  return randomBytes(32).toString("base64url");
}

function normalizeEmail(input) {
  return String(input || "").trim().toLowerCase();
}

function normalizeSlug(input) {
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

function normalizePlan(input) {
  const value = String(input || "free").trim().toLowerCase();
  if (value === "pro" || value === "enterprise") {
    return value;
  }

  return "free";
}

function limitForPlan(plan) {
  if (plan === "pro") {
    return PLAN_LIMITS.pro;
  }

  if (plan === "enterprise") {
    return PLAN_LIMITS.enterprise;
  }

  return PLAN_LIMITS.free;
}

function publicAccount(account) {
  return {
    id: account.id,
    email: account.email,
    name: account.name,
    plan: account.plan,
    limit: limitForPlan(account.plan),
    createdAt: account.createdAt,
  };
}

function now() {
  return new Date().toISOString();
}

function applyCors(res) {
  res.setHeader("access-control-allow-origin", CORS_ORIGIN);
  res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type,authorization,x-admin-secret");
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(body);
}

async function readRawBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;

    req.on("data", (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        reject(new Error(`Body too large (>${maxBytes} bytes)`));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    req.on("error", reject);
  });
}

async function readJson(req) {
  const raw = await readRawBody(req, MAX_BODY_BYTES);
  if (raw.length === 0) {
    return {};
  }

  return JSON.parse(raw.toString("utf8"));
}

function normalizeArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value;
}

function isStrongEnoughPassword(value) {
  return typeof value === "string" && value.length >= 8;
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("base64url");
  const derived = scryptSync(password, salt, 64).toString("base64url");
  return `scrypt$${salt}$${derived}`;
}

function verifyPassword(password, encoded) {
  if (!encoded.startsWith("scrypt$")) {
    return false;
  }

  const parts = encoded.split("$");
  if (parts.length !== 3) {
    return false;
  }

  const salt = parts[1];
  const stored = parts[2];
  const candidate = scryptSync(password, salt, 64).toString("base64url");

  const left = Buffer.from(stored);
  const right = Buffer.from(candidate);
  if (left.length !== right.length || left.length === 0) {
    return false;
  }

  return timingSafeEqual(left, right);
}

function normalizeDeploymentStatus(input) {
  const value = String(input || "queued");
  if (value === "queued" || value === "running" || value === "failed" || value === "ready") {
    return value;
  }
  return "queued";
}
