import path from "node:path";
import { scanApp } from "@fiyuu/core";
import { bundleClient, startServer } from "@fiyuu/runtime";
import type { FiyuuConfig } from "@fiyuu/core";
import { c, existsSync, fs, log } from "../shared.js";
import { sync } from "./sync.js";
import { build as esbuild } from "esbuild";
import { glob } from "node:fs/promises";

const DEFAULT_PORT = 4050;

export async function build(rootDirectory: string, appDirectory: string, config: FiyuuConfig): Promise<void> {
  const configuredPort = config.app?.port ?? DEFAULT_PORT;

  console.log(`\n${c.bold}${c.cyan}Fiyuu Build${c.reset}`);
  log("app", appDirectory);
  log("step 1/4", "syncing project graph");
  await sync(rootDirectory, appDirectory);

  log("step 2/4", "bundling client assets");
  const features = await scanApp(appDirectory);
  await bundleClient(features, path.join(rootDirectory, ".fiyuu", "client"));

  log("step 3/4", "compiling server assets");
  await bundleServer(appDirectory, path.join(rootDirectory, ".fiyuu", "server"));

  log("step 4/4", "writing runtime manifest");
  const manifestPath = path.join(rootDirectory, ".fiyuu", "build.json");
  const manifest = {
    rootDirectory,
    appDirectory,
    clientDirectory: path.join(rootDirectory, ".fiyuu", "client"),
    serverDirectory: path.join(rootDirectory, ".fiyuu", "server"),
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
    serverDirectory?: string;
    port: number;
    config?: FiyuuConfig;
  };

  const config = manifest.config ?? fallbackConfig;

  await startServer({
    mode: "start",
    rootDirectory: manifest.rootDirectory,
    appDirectory: manifest.appDirectory,
    serverDirectory: manifest.serverDirectory,
    config,
    port: manifest.port,
    maxPort: manifest.port + 10,
    clientOutputDirectory: manifest.clientDirectory,
    staticClientRoot: manifest.clientDirectory,
  });
}

async function bundleServer(appDirectory: string, outputDirectory: string): Promise<void> {
  // Find all .ts and .tsx files in app directory
  const entries: string[] = [];
  for await (const file of glob("**/*.{ts,tsx}", { cwd: appDirectory })) {
    entries.push(path.join(appDirectory, file));
  }

  if (entries.length === 0) {
    return;
  }

  await fs.mkdir(outputDirectory, { recursive: true });

  // Build each file individually to preserve structure
  await Promise.all(
    entries.map(async (entry) => {
      const relativePath = path.relative(appDirectory, entry);
      const outFile = path.join(outputDirectory, relativePath.replace(/\.tsx?$/, ".js"));
      
      await fs.mkdir(path.dirname(outFile), { recursive: true });
      
      await esbuild({
        entryPoints: [entry],
        bundle: true,
        format: "esm",
        platform: "node",
        target: ["node20"],
        outfile: outFile,
        jsx: "automatic",
        jsxImportSource: "@geajs/core",
        sourcemap: false,
        packages: "external", // Don't bundle node_modules
      });
    })
  );
}
