import { existsSync, promises as fs } from "node:fs";
import path from "node:path";
import { loadFiyuuConfig, scanApp } from "@fiyuu/core";
import { bundleClient, startServer } from "@fiyuu/runtime";

interface BenchmarkStats {
  route: string;
  avg: number;
  p50: number;
  p95: number;
  min: number;
  max: number;
}

async function main(): Promise<void> {
  const workspaceRoot = process.cwd();
  const rootDirectory = process.env.FIYUU_BENCH_ROOT
    ? path.resolve(workspaceRoot, process.env.FIYUU_BENCH_ROOT)
    : workspaceRoot;
  const appDirectory = resolveAppDirectory(rootDirectory);
  const rounds = Number(process.env.FIYUU_BENCH_ROUNDS ?? 20);
  const warmupRounds = Number(process.env.FIYUU_BENCH_WARMUP ?? 3);
  const outputDirectory = path.join(rootDirectory, ".fiyuu", "bench", "client");

  const loaded = await loadFiyuuConfig(rootDirectory, "start");
  const config = loaded.config;
  const features = await scanApp(appDirectory);
  const routes = features.filter((feature) => feature.files["page.tsx"]).map((feature) => feature.route);
  const assets = await bundleClient(features, outputDirectory);
  const bundleMetrics = await readBundleMetrics(assets.map((asset) => asset.bundleFile));

  const server = await startServer({
    mode: "start",
    rootDirectory,
    appDirectory,
    config,
    port: 4180,
    maxPort: 4220,
    clientOutputDirectory: outputDirectory,
    staticClientRoot: outputDirectory,
  });

  console.log("\nFiyuu Gea Runtime Benchmark");
  console.log(`- App: ${appDirectory}`);
  console.log(`- Routes: ${routes.length}`);
  console.log(`- URL: ${server.url}`);
  console.log(`- Warmup: ${warmupRounds} / Measured: ${rounds}`);
  console.log(`- Bundles: ${bundleMetrics.count} files, ${bundleMetrics.totalKb.toFixed(2)} KB total`);

  try {
    const stats = await benchmarkRoutes(server.url, routes, warmupRounds, rounds);
    printBenchmarkTable(stats);
  } finally {
    await server.close();
  }
}

function resolveAppDirectory(rootDirectory: string): string {
  const rootAppDirectory = path.join(rootDirectory, "app");
  const exampleAppDirectory = path.join(rootDirectory, "examples", "basic-app", "app");
  const localAppDirectory = path.join(rootDirectory, "my-app", "app");

  if (pathExists(rootAppDirectory)) {
    return rootAppDirectory;
  }
  if (pathExists(exampleAppDirectory)) {
    return exampleAppDirectory;
  }
  if (pathExists(localAppDirectory)) {
    return localAppDirectory;
  }

  throw new Error("No app directory found. Expected ./app, ./examples/basic-app/app, or ./my-app/app.");
}

function pathExists(filePath: string): boolean {
  return existsSync(filePath);
}

async function readBundleMetrics(bundleFiles: string[]): Promise<{ count: number; totalKb: number }> {
  let totalBytes = 0;
  for (const bundleFile of bundleFiles) {
    try {
      const stat = await fs.stat(bundleFile);
      totalBytes += stat.size;
    } catch {
      // Ignore missing bundles for non-CSR routes.
    }
  }

  return {
    count: bundleFiles.length,
    totalKb: totalBytes / 1024,
  };
}

async function benchmarkRoutes(baseUrl: string, routes: string[], warmupRounds: number, rounds: number): Promise<BenchmarkStats[]> {
  const stats: BenchmarkStats[] = [];

  for (const route of routes) {
    for (let index = 0; index < warmupRounds; index += 1) {
      await requestRoute(baseUrl, route);
    }

    const times: number[] = [];
    for (let index = 0; index < rounds; index += 1) {
      const startedAt = performance.now();
      await requestRoute(baseUrl, route);
      times.push(performance.now() - startedAt);
    }

    const sorted = times.slice().sort((left, right) => left - right);
    stats.push({
      route,
      avg: average(times),
      p50: percentile(sorted, 50),
      p95: percentile(sorted, 95),
      min: sorted[0] ?? 0,
      max: sorted[sorted.length - 1] ?? 0,
    });
  }

  return stats;
}

async function requestRoute(baseUrl: string, route: string): Promise<void> {
  const response = await fetch(`${baseUrl}${route}`, {
    headers: {
      accept: "text/html",
      "cache-control": "no-cache",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    const snippet = body.replace(/\s+/g, " ").slice(0, 260);
    throw new Error(`Benchmark request failed for ${route} with status ${response.status}: ${snippet}`);
  }

  await response.text();
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(sortedValues: number[], percentileRank: number): number {
  if (sortedValues.length === 0) {
    return 0;
  }
  const index = Math.min(sortedValues.length - 1, Math.max(0, Math.ceil((percentileRank / 100) * sortedValues.length) - 1));
  return sortedValues[index] ?? 0;
}

function printBenchmarkTable(stats: BenchmarkStats[]): void {
  console.log("\nRoute metrics (ms)");
  console.log("- route | avg | p50 | p95 | min | max");
  for (const row of stats) {
    console.log(`- ${row.route} | ${row.avg.toFixed(2)} | ${row.p50.toFixed(2)} | ${row.p95.toFixed(2)} | ${row.min.toFixed(2)} | ${row.max.toFixed(2)}`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown benchmark error";
  console.error(message);
  process.exitCode = 1;
});
