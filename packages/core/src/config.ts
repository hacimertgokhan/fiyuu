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
    autosave?: boolean;
    autosaveIntervalMs?: number;
    tables?: string[];
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
  realtime?: {
    enabled?: boolean;
    transports?: ("websocket" | "nats")[];
    websocket?: {
      path?: string;
      heartbeatMs?: number;
      maxPayloadBytes?: number;
    };
    nats?: {
      url?: string;
      name?: string;
    };
  };
  services?: {
    enabled?: boolean;
    directory?: string;
    failFast?: boolean;
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
  deploy?: {
    /**
     * Enables `fiyuu deploy` workflow.
     * If undefined, deploy command still works when `deploy.ssh` is configured.
     */
    enabled?: boolean;
    /**
     * Build locally before upload. Defaults to true.
     */
    localBuild?: boolean;
    /**
     * Extra archive exclude patterns for `tar`.
     */
    excludes?: string[];
    ssh?: {
      host: string;
      user: string;
      port?: number;
      privateKeyPath?: string;
      /**
       * Absolute path on remote server (for example: /var/www/my-app)
       */
      destinationPath: string;
      /**
       * Number of old releases to keep on the server.
       */
      keepReleases?: number;
    };
    remote?: {
      /**
       * Command executed on remote server in release directory.
       */
      installCommand?: string;
      /**
       * Command executed on remote server after install.
       */
      buildCommand?: string;
      /**
       * Command executed on remote server to start/reload the app.
       */
      startCommand?: string;
      /**
       * Optional validation command after start.
       */
      healthcheckCommand?: string;
    };
    pm2?: {
      enabled?: boolean;
      /**
       * Auto-generate ecosystem file in project root if missing.
       */
      autoCreate?: boolean;
      ecosystemFile?: string;
      appName?: string;
      instances?: number | "max";
      execMode?: "fork" | "cluster";
      maxMemoryRestart?: string;
      env?: Record<string, string>;
    };
  };
  cloud?: {
    /**
     * Control-plane API endpoint for `fiyuu cloud`.
     * Example: https://api.fiyuu.work
     */
    endpoint?: string;
    /**
     * Default project slug used by `fiyuu cloud deploy`.
     */
    project?: string;
    /**
     * Extra archive exclude patterns used by cloud deploy packaging.
     */
    excludes?: string[];
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
