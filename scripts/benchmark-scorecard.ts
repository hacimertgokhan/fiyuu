import { spawn } from "node:child_process";
import { existsSync, promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

interface CommandResult {
  label: string;
  command: string;
  args: string[];
  durationMs: number;
  stdout: string;
  stderr: string;
  exitCode: number;
}

interface RouteMetric {
  route: string;
  avg: number;
  p95: number;
}

interface CommandOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

async function main(): Promise<void> {
  const rootDirectory = process.cwd();
  const appProjectDirectory = resolveAppProjectDirectory(rootDirectory);
  const benchmarkRoot = path.relative(rootDirectory, appProjectDirectory) || ".";
  const fiyuuCliEntry =
    appProjectDirectory === rootDirectory ? path.join(rootDirectory, "bin", "fiyuu.mjs") : path.join(appProjectDirectory, "node_modules", "fiyuu", "bin", "fiyuu.mjs");
  const outputPath = path.join(rootDirectory, "docs", "benchmarks", "latest-scorecard.md");

  const failures: string[] = [];

  const build = await runCommand("Cold build", "npm", ["run", "build"], {
    cwd: appProjectDirectory,
  });
  if (build.exitCode !== 0) failures.push(`${build.label} (exit ${build.exitCode})`);

  const benchmark = await runCommand("SSR benchmark", "npm", ["run", "benchmark:gea"], {
    cwd: rootDirectory,
    env: {
      ...process.env,
      FIYUU_BENCH_ROOT: benchmarkRoot,
    },
  });
  if (benchmark.exitCode !== 0) failures.push(`${benchmark.label} (exit ${benchmark.exitCode})`);

  const sync = await runCommand("AI context sync", process.execPath, [fiyuuCliEntry, "sync"], {
    cwd: appProjectDirectory,
  });
  if (sync.exitCode !== 0) failures.push(`${sync.label} (exit ${sync.exitCode})`);

  const doctor = await runCommand("Doctor checks", process.execPath, [fiyuuCliEntry, "doctor"], {
    cwd: appProjectDirectory,
  });
  if (doctor.exitCode !== 0) failures.push(`${doctor.label} (exit ${doctor.exitCode})`);

  const metrics = parseBenchmarkMetrics(benchmark.stdout + benchmark.stderr);
  const doctorStatus = parseDoctorStatus(doctor.stdout + doctor.stderr);

  const report = renderReport({
    generatedAt: new Date().toISOString(),
    platform: `${os.platform()} ${os.release()}`,
    cpu: os.cpus()[0]?.model ?? "unknown",
    cpuCores: os.cpus().length,
    memoryGb: (os.totalmem() / 1024 / 1024 / 1024).toFixed(1),
    build,
    benchmark,
    sync,
    doctor,
    failures,
    metrics,
    doctorStatus,
  });

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, report);

  console.log("\nFiyuu Benchmark Scorecard");
  console.log(`- Output: ${outputPath}`);
  console.log(`- App project: ${appProjectDirectory}`);
  console.log(`- Build: ${(build.durationMs / 1000).toFixed(2)}s`);
  console.log(`- Sync: ${(sync.durationMs / 1000).toFixed(2)}s`);
  console.log(`- Doctor: ${doctorStatus.errors} error(s), ${doctorStatus.warnings} warning(s)`);
  console.log(`- SSR routes measured: ${metrics.routeCount}`);

  if (failures.length > 0) {
    console.log(`- Status: partial (${failures.join(", ")})`);
    process.exitCode = 1;
    return;
  }

  console.log("- Status: success");
}

function runCommand(label: string, command: string, args: string[], options: CommandOptions = {}): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const startedAt = performance.now();
    const child = spawn(command, args, {
      cwd: options.cwd ?? process.cwd(),
      env: options.env ?? process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
    });

    child.stderr.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });

    child.on("error", (error) => reject(error));

    child.on("close", (exitCode) => {
      resolve({
        label,
        command,
        args,
        durationMs: performance.now() - startedAt,
        stdout,
        stderr,
        exitCode: exitCode ?? 1,
      });
    });
  });
}

function resolveAppProjectDirectory(rootDirectory: string): string {
  const rootAppDirectory = path.join(rootDirectory, "app");
  if (existsSync(rootAppDirectory)) {
    return rootDirectory;
  }

  const localStarterDirectory = path.join(rootDirectory, "my-app");
  const localStarterApp = path.join(localStarterDirectory, "app");
  const localStarterPackage = path.join(localStarterDirectory, "package.json");
  if (existsSync(localStarterApp) && existsSync(localStarterPackage)) {
    return localStarterDirectory;
  }

  throw new Error("No app project found. Expected ./app or ./my-app/app.");
}

function parseBenchmarkMetrics(raw: string): {
  routeCount: number;
  avgMs: number;
  p95Ms: number;
  maxP95Ms: number;
  bundleKb: number;
} {
  const text = stripAnsi(raw);
  const lines = text.split(/\r?\n/);
  const rows: RouteMetric[] = [];

  let bundleKb = 0;
  const bundleLine = lines.find((line) => line.includes("Bundles:"));
  if (bundleLine) {
    const match = bundleLine.match(/,\s*([0-9]+(?:\.[0-9]+)?)\s*KB total/i);
    if (match?.[1]) {
      bundleKb = Number(match[1]);
    }
  }

  for (const line of lines) {
    if (!line.startsWith("- /") || !line.includes("|")) {
      continue;
    }

    const parts = line
      .slice(2)
      .split("|")
      .map((part) => part.trim());

    if (parts.length < 6) {
      continue;
    }

    const route = parts[0] ?? "";
    const avg = Number(parts[1] ?? "0");
    const p95 = Number(parts[3] ?? "0");

    if (!route || Number.isNaN(avg) || Number.isNaN(p95)) {
      continue;
    }

    rows.push({ route, avg, p95 });
  }

  const routeCount = rows.length;
  const avgMs = routeCount === 0 ? 0 : rows.reduce((sum, row) => sum + row.avg, 0) / routeCount;
  const p95Ms = routeCount === 0 ? 0 : rows.reduce((sum, row) => sum + row.p95, 0) / routeCount;
  const maxP95Ms = routeCount === 0 ? 0 : Math.max(...rows.map((row) => row.p95));

  return {
    routeCount,
    avgMs,
    p95Ms,
    maxP95Ms,
    bundleKb,
  };
}

function parseDoctorStatus(raw: string): { errors: number; warnings: number } {
  const text = stripAnsi(raw);

  if (text.includes("healthy") && text.includes("no issues detected")) {
    return { errors: 0, warnings: 0 };
  }

  const match = text.match(/status\s*(?:→|:)?\s*(\d+)\s+error\(s\),\s*(\d+)\s+warning\(s\)/i);
  if (!match) {
    return { errors: 0, warnings: 0 };
  }

  return {
    errors: Number(match[1] ?? "0"),
    warnings: Number(match[2] ?? "0"),
  };
}

function stripAnsi(value: string): string {
  return value.replace(/\u001b\[[0-9;]*m/g, "");
}

function renderReport(input: {
  generatedAt: string;
  platform: string;
  cpu: string;
  cpuCores: number;
  memoryGb: string;
  build: CommandResult;
  benchmark: CommandResult;
  sync: CommandResult;
  doctor: CommandResult;
  failures: string[];
  metrics: {
    routeCount: number;
    avgMs: number;
    p95Ms: number;
    maxP95Ms: number;
    bundleKb: number;
  };
  doctorStatus: { errors: number; warnings: number };
}): string {
  return `# Latest Benchmark Scorecard

Generated at: ${input.generatedAt}

## Environment

- Platform: ${input.platform}
- CPU: ${input.cpu}
- CPU cores: ${input.cpuCores}
- Memory: ${input.memoryGb} GB

## Summary

Status: ${input.failures.length === 0 ? "success" : `partial (${input.failures.join(", ")})`}

| Metric | Value |
| --- | --- |
| Build time (s) | ${(input.build.durationMs / 1000).toFixed(2)} |
| Sync time (s) | ${(input.sync.durationMs / 1000).toFixed(2)} |
| Doctor errors | ${input.doctorStatus.errors} |
| Doctor warnings | ${input.doctorStatus.warnings} |
| SSR routes measured | ${input.metrics.routeCount} |
| SSR avg over routes (ms) | ${input.metrics.avgMs.toFixed(2)} |
| SSR p95 avg over routes (ms) | ${input.metrics.p95Ms.toFixed(2)} |
| SSR max p95 (ms) | ${input.metrics.maxP95Ms.toFixed(2)} |
| Client bundle total (KB) | ${input.metrics.bundleKb.toFixed(2)} |

## Command Exit Codes

| Command | Exit code |
| --- | --- |
| ${input.build.label} | ${input.build.exitCode} |
| ${input.benchmark.label} | ${input.benchmark.exitCode} |
| ${input.sync.label} | ${input.sync.exitCode} |
| ${input.doctor.label} | ${input.doctor.exitCode} |

## Commands

1) ${input.build.command} ${input.build.args.join(" ")}
2) ${input.benchmark.command} ${input.benchmark.args.join(" ")}
3) ${input.sync.command} ${input.sync.args.join(" ")}
4) ${input.doctor.command} ${input.doctor.args.join(" ")}

## Raw Output: Build

\`\`\`text
${truncateOutput(stripAnsi(input.build.stdout + input.build.stderr))}
\`\`\`

## Raw Output: Benchmark

\`\`\`text
${truncateOutput(stripAnsi(input.benchmark.stdout + input.benchmark.stderr))}
\`\`\`

## Raw Output: Sync

\`\`\`text
${truncateOutput(stripAnsi(input.sync.stdout + input.sync.stderr))}
\`\`\`

## Raw Output: Doctor

\`\`\`text
${truncateOutput(stripAnsi(input.doctor.stdout + input.doctor.stderr))}
\`\`\`
`;
}

function truncateOutput(output: string): string {
  const trimmed = output.trim();
  if (trimmed.length <= 9000) {
    return trimmed;
  }
  return `${trimmed.slice(0, 9000)}\n... (truncated)`;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
