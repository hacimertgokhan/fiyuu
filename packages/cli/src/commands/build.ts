import path from "node:path";
import { scanApp } from "@fiyuu/core";
import { bundleClient, startServer } from "@fiyuu/runtime";
import type { FiyuuConfig } from "@fiyuu/core";
import { c, existsSync, fs, log } from "../shared.js";
import { sync } from "./sync.js";

const DEFAULT_PORT = 4050;

export async function build(rootDirectory: string, appDirectory: string, config: FiyuuConfig): Promise<void> {
  const configuredPort = config.app?.port ?? DEFAULT_PORT;

  console.log(`\n${c.bold}${c.cyan}Fiyuu Build${c.reset}`);
  log("app", appDirectory);
  log("step 1/3", "syncing project graph");
  await sync(rootDirectory, appDirectory);

  log("step 2/3", "bundling client assets");
  const features = await scanApp(appDirectory);
  await bundleClient(features, path.join(rootDirectory, ".fiyuu", "client"));

  log("step 3/3", "writing runtime manifest");
  const manifestPath = path.join(rootDirectory, ".fiyuu", "build.json");
  const manifest = {
    rootDirectory,
    appDirectory,
    clientDirectory: path.join(rootDirectory, ".fiyuu", "client"),
    port: configuredPort,
    config,
    builtAt: new Date().toISOString(),
  };

  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  log("done", `artifacts ready — run ${c.cyan}fiyuu start${c.reset} (port ${configuredPort})`);
}

export async function start(rootDirectory: string, fallbackConfig: FiyuuConfig): Promise<void> {
  const manifestPath = path.join(rootDirectory, ".fiyuu", "build.json");

  if (!existsSync(manifestPath)) {
    throw new Error("Build manifest missing. Run `fiyuu build` first.");
  }

  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8")) as {
    rootDirectory: string;
    appDirectory: string;
    clientDirectory: string;
    port: number;
    config?: FiyuuConfig;
  };

  const config = manifest.config ?? fallbackConfig;

  await startServer({
    mode: "start",
    rootDirectory: manifest.rootDirectory,
    appDirectory: manifest.appDirectory,
    config,
    port: manifest.port,
    maxPort: manifest.port + 10,
    clientOutputDirectory: manifest.clientDirectory,
    staticClientRoot: manifest.clientDirectory,
  });
}
