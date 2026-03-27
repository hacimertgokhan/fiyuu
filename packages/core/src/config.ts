import { existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export interface FiyuuConfig {
  app?: {
    name?: string;
    runtime?: "node" | "bun";
    port?: number;
  };
  ai?: {
    enabled?: boolean;
    skillsDirectory?: string;
    defaultSkills?: string[];
    graphContext?: boolean;
    inspector?: {
      enabled?: boolean;
      localModelCommand?: string;
      timeoutMs?: number;
      autoSetupPrompt?: boolean;
    };
  };
  fullstack?: {
    client?: boolean;
    serverActions?: boolean;
    serverQueries?: boolean;
    sockets?: boolean;
  };
  data?: {
    driver?: string;
    path?: string;
  };
  security?: {
    requestEncryption?: boolean;
    serverSecretFile?: string;
  };
  websocket?: {
    enabled?: boolean;
    path?: string;
    heartbeatMs?: number;
    maxPayloadBytes?: number;
  };
  middleware?: {
    enabled?: boolean;
  };
  developerTools?: {
    enabled?: boolean;
    renderTiming?: boolean;
  };
  observability?: {
    requestId?: boolean;
    warningsAsOverlay?: boolean;
  };
  auth?: {
    enabled?: boolean;
    sessionStrategy?: "cookie" | "token";
  };
  analytics?: {
    enabled?: boolean;
    provider?: string;
  };
  featureFlags?: {
    enabled?: boolean;
    defaults?: Record<string, boolean>;
  };
  errors?: {
    /**
     * Called for every unhandled server error.
     * Use this to send errors to Sentry, Datadog, etc.
     */
    handler?: (error: Error, context: { route: string; method: string; requestId: string }) => void | Promise<void>;
    /**
     * Whether to expose error details (stack trace, message) in responses.
     * Defaults to true in dev, false in production.
     */
    expose?: boolean;
  };
}

export interface LoadedFiyuuConfig {
  config: FiyuuConfig;
  env: Record<string, string>;
}

export async function loadFiyuuConfig(rootDirectory: string, mode: "dev" | "start" = "dev"): Promise<LoadedFiyuuConfig> {
  const env = await loadFiyuuEnvironment(rootDirectory, mode);
  const configPath = path.join(rootDirectory, "fiyuu.config.ts");

  if (!existsSync(configPath)) {
    applyEnv(env);
    return { config: {}, env };
  }

  const moduleUrl = pathToFileURL(configPath).href;
  const loaded = await import(`${moduleUrl}?t=${Date.now()}`);
  const config = ((loaded.default ?? loaded.config ?? {}) as FiyuuConfig) ?? {};
  applyEnv(env);
  return { config, env };
}

async function loadFiyuuEnvironment(rootDirectory: string, mode: "dev" | "start"): Promise<Record<string, string>> {
  const directory = path.join(rootDirectory, ".fiyuu");
  const files = [
    path.join(directory, "env"),
    path.join(directory, `${mode}.env`),
    path.join(directory, "SECRET"),
  ];
  const env: Record<string, string> = {};

  for (const filePath of files) {
    if (!existsSync(filePath)) {
      continue;
    }

    const name = path.basename(filePath);
    if (name === "SECRET") {
      env.FIYUU_SECRET = (await fs.readFile(filePath, "utf8")).trim();
      continue;
    }

    const content = await fs.readFile(filePath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }
      const separator = trimmed.indexOf("=");
      if (separator <= 0) {
        continue;
      }
      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim();
      env[key] = value;
    }
  }

  return env;
}

function applyEnv(env: Record<string, string>): void {
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
