import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const rootDirectory = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const packagesDirectory = path.join(rootDirectory, "packages");
const compiledPackagesDirectory = path.join(rootDirectory, "dist", "packages");
const releaseDirectory = path.join(rootDirectory, "dist", "release");
const tscCli = path.join(rootDirectory, "node_modules", "typescript", "bin", "tsc");
const rootReadmePath = path.join(rootDirectory, "README.md");
const rootLicensePath = path.join(rootDirectory, "LICENSE");

async function main() {
  await rm(releaseDirectory, { force: true, recursive: true });
  await mkdir(releaseDirectory, { recursive: true });

  await execFileAsync(process.execPath, [tscCli, "-p", "tsconfig.json"], { cwd: rootDirectory });

  const packageEntries = await readdir(packagesDirectory, { withFileTypes: true });

  for (const entry of packageEntries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const packageDirectory = path.join(packagesDirectory, entry.name);
    const manifestPath = path.join(packageDirectory, "package.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    const compiledDirectory = path.join(compiledPackagesDirectory, entry.name);
    const outputDirectory = path.join(releaseDirectory, entry.name);

    await mkdir(outputDirectory, { recursive: true });
    await copyPackageAssets(packageDirectory, outputDirectory);
    await copyCompiledSource(compiledDirectory, outputDirectory);
    await copyRootFileIfMissing(rootReadmePath, path.join(outputDirectory, "README.md"));
    await copyRootFileIfMissing(rootLicensePath, path.join(outputDirectory, "LICENSE"));

    const packagedManifest = normalizeManifest(manifest);
    await writeFile(path.join(outputDirectory, "package.json"), `${JSON.stringify(packagedManifest, null, 2)}\n`);
  }
}

async function copyPackageAssets(sourceDirectory, targetDirectory) {
  const entries = await readdir(sourceDirectory, { withFileTypes: true });

  for (const entry of entries) {
    if (["node_modules", "src", "package.json", "dist"].includes(entry.name)) {
      continue;
    }

    await cp(path.join(sourceDirectory, entry.name), path.join(targetDirectory, entry.name), { recursive: true });
  }
}

async function copyCompiledSource(sourceDirectory, targetDirectory) {
  const sourceStats = await safeStat(sourceDirectory);

  if (!sourceStats?.isDirectory()) {
    return;
  }

  const entries = await readdir(sourceDirectory, { withFileTypes: true });

  for (const entry of entries) {
    await cp(path.join(sourceDirectory, entry.name), path.join(targetDirectory, entry.name), { recursive: true });
  }
}

async function copyRootFileIfMissing(sourcePath, targetPath) {
  const targetStats = await safeStat(targetPath);

  if (targetStats) {
    return;
  }

  const sourceStats = await safeStat(sourcePath);

  if (!sourceStats?.isFile()) {
    return;
  }

  await cp(sourcePath, targetPath);
}

function normalizeManifest(manifest) {
  const nextManifest = { ...manifest };

  delete nextManifest.private;

  if (nextManifest.main) {
    nextManifest.main = toRuntimePath(nextManifest.main);
  }

  if (nextManifest.types) {
    nextManifest.types = toTypesPath(nextManifest.types);
  }

  if (nextManifest.bin) {
    nextManifest.bin = Object.fromEntries(
      Object.entries(nextManifest.bin).map(([name, value]) => [name, toRuntimePath(value)]),
    );
  }

  if (nextManifest.exports) {
    nextManifest.exports = rewriteExports(nextManifest.exports);
  }

  return nextManifest;
}

function rewriteExports(value) {
  if (typeof value === "string") {
    return toRuntimePath(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => rewriteExports(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, rewriteExports(item)]));
  }

  return value;
}

function toRuntimePath(value) {
  return value.replace(/\.(ts|tsx)$/u, ".js");
}

function toTypesPath(value) {
  return value.replace(/\.(ts|tsx)$/u, ".d.ts");
}

async function safeStat(targetPath) {
  try {
    return await stat(targetPath);
  } catch {
    return null;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Unknown package build error");
  process.exitCode = 1;
});
