/**
 * Private assets management for Fiyuu.
 *
 * The private/ directory contains files that should only be accessible
 * server-side. These files are NEVER served to the client via HTTP.
 * They can only be accessed through server-side code (actions, queries, services).
 */

import { existsSync, createReadStream } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { ServerResponse } from "node:http";
import { sendText, sendJson } from "server-utils.js";

export interface PrivateAsset {
  /** Asset name/path relative to private directory */
  name: string;
  /** Full file path */
  filePath: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  mimeType: string;
  /** Last modified timestamp */
  modifiedAt: Date;
}

export interface PrivateDirectoryConfig {
  /** Root directory for private assets */
  rootPath: string;
  /** Allowed MIME types (undefined = allow all) */
  allowedMimeTypes?: string[];
  /** Maximum file size in bytes (default: 100MB) */
  maxFileSize?: number;
  /** Whether to enable server-side caching */
  enableCache?: boolean;
}

const DEFAULT_MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const MIME_TYPES: Record<string, string> = {
  ".json": "application/json",
  ".csv": "text/csv",
  ".xml": "application/xml",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".yaml": "application/yaml",
  ".yml": "application/yaml",
  ".env": "text/plain",
  ".key": "text/plain",
  ".pem": "text/plain",
  ".crt": "text/plain",
  ".p12": "application/x-pkcs12",
  ".pfx": "application/x-pkcs12",
  ".sqlite": "application/x-sqlite3",
  ".db": "application/x-sqlite3",
  ".zip": "application/zip",
  ".tar": "application/x-tar",
  ".gz": "application/gzip",
  ".sql": "text/plain",
  ".log": "text/plain",
};

/**
 * Get MIME type for a file based on extension.
 */
export function getPrivateAssetMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] ?? "application/octet-stream";
}

/**
 * Check if a file is allowed to be accessed from private directory.
 * Blocks access to sensitive paths.
 */
export function isAllowedPrivatePath(filePath: string, rootPath: string): boolean {
  const resolvedPath = path.resolve(filePath);
  const resolvedRoot = path.resolve(rootPath);

  // Path traversal protection
  if (!resolvedPath.startsWith(resolvedRoot)) {
    return false;
  }

  // Block access to node_modules
  if (resolvedPath.includes("node_modules")) {
    return false;
  }

  // Block access to .git
  if (resolvedPath.includes(".git")) {
    return false;
  }

  // Block access to .env files directly (should use config instead)
  const basename = path.basename(resolvedPath);
  if (basename.startsWith(".env") && !basename.endsWith(".example")) {
    // Allow reading but log warning - actual env should be in .fiyuu/
    console.warn(`[fiyuu] Warning: Accessing .env file from private/: ${basename}`);
  }

  return true;
}

/**
 * Read a private asset as string (for text files).
 * This can only be called from server-side code.
 */
export async function readPrivateAsset(
  rootPath: string,
  assetName: string,
  encoding: BufferEncoding = "utf8",
): Promise<string> {
  const filePath = path.join(rootPath, assetName);

  if (!isAllowedPrivatePath(filePath, rootPath)) {
    throw new Error(`Access denied to private asset: ${assetName}`);
  }

  if (!existsSync(filePath)) {
    throw new Error(`Private asset not found: ${assetName}`);
  }

  return fs.readFile(filePath, encoding);
}

/**
 * Read a private asset as Buffer (for binary files).
 * This can only be called from server-side code.
 */
export async function readPrivateAssetBuffer(
  rootPath: string,
  assetName: string,
): Promise<Buffer> {
  const filePath = path.join(rootPath, assetName);

  if (!isAllowedPrivatePath(filePath, rootPath)) {
    throw new Error(`Access denied to private asset: ${assetName}`);
  }

  if (!existsSync(filePath)) {
    throw new Error(`Private asset not found: ${assetName}`);
  }

  return fs.readFile(filePath);
}

/**
 * Get metadata about a private asset without reading content.
 */
export async function getPrivateAssetInfo(
  rootPath: string,
  assetName: string,
): Promise<PrivateAsset | null> {
  const filePath = path.join(rootPath, assetName);

  if (!isAllowedPrivatePath(filePath, rootPath)) {
    return null;
  }

  if (!existsSync(filePath)) {
    return null;
  }

  const stats = await fs.stat(filePath);

  return {
    name: assetName,
    filePath: normalizePath(filePath),
    size: stats.size,
    mimeType: getPrivateAssetMimeType(filePath),
    modifiedAt: stats.mtime,
  };
}

/**
 * List all assets in the private directory.
 */
export async function listPrivateAssets(
  rootPath: string,
  subDirectory: string = "",
): Promise<PrivateAsset[]> {
  const targetDir = path.join(rootPath, subDirectory);

  if (!isAllowedPrivatePath(targetDir, rootPath)) {
    return [];
  }

  if (!existsSync(targetDir)) {
    return [];
  }

  const assets: PrivateAsset[] = [];
  await walkPrivateDirectory(rootPath, targetDir, assets);
  return assets;
}

async function walkPrivateDirectory(
  rootPath: string,
  currentDir: string,
  assets: PrivateAsset[],
): Promise<void> {
  const entries = await fs.readdir(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      // Skip hidden directories and node_modules
      if (entry.name.startsWith(".") || entry.name === "node_modules") {
        continue;
      }
      await walkPrivateDirectory(rootPath, fullPath, assets);
    } else if (entry.isFile()) {
      const stats = await fs.stat(fullPath);
      const relativeName = path.relative(rootPath, fullPath);

      assets.push({
        name: normalizePath(relativeName),
        filePath: normalizePath(fullPath),
        size: stats.size,
        mimeType: getPrivateAssetMimeType(fullPath),
        modifiedAt: stats.mtime,
      });
    }
  }
}

/**
 * Check if a request is trying to access private assets via HTTP.
 * This should be blocked - private assets are server-side only.
 */
export function isPrivatePathRequest(pathname: string): boolean {
  // Block any path starting with /private/ or containing /private/
  const normalizedPath = pathname.replace(/\\/g, "/");
  return (
    normalizedPath.startsWith("/private/") ||
    normalizedPath === "/private" ||
    normalizedPath.includes("/../private/") ||
    normalizedPath.includes("/./private/")
  );
}

/**
 * Block a request trying to access private assets.
 * Returns true if request was blocked.
 */
export function blockPrivateAccess(
  response: ServerResponse,
  pathname: string,
): boolean {
  if (!isPrivatePathRequest(pathname)) {
    return false;
  }

  response.statusCode = 403;
  response.setHeader("content-type", "text/plain; charset=utf-8");
  response.setHeader("x-fiyuu-private-blocked", "true");
  response.end(
    `Access denied: Private assets cannot be accessed via HTTP.\n` +
      `Path: ${pathname}\n\n` +
      `Private assets are server-side only. ` +
      `Use server actions, queries, or services to access them.`,
  );
  return true;
}

/**
 * Helper to safely access private assets in server code.
 * Returns null if asset doesn't exist or access is denied.
 */
export async function safeReadPrivateAsset<T = string>(
  rootPath: string,
  assetName: string,
  parser?: (content: string) => T,
): Promise<T | null> {
  try {
    const content = await readPrivateAsset(rootPath, assetName);
    return parser ? parser(content) : (content as unknown as T);
  } catch {
    return null;
  }
}

/**
 * Parse a JSON private asset.
 */
export async function readPrivateJson<T = unknown>(
  rootPath: string,
  assetName: string,
): Promise<T | null> {
  return safeReadPrivateAsset(rootPath, assetName, (content) => JSON.parse(content) as T);
}

/**
 * Parse a CSV private asset into array of objects.
 */
export async function readPrivateCsv(
  rootPath: string,
  assetName: string,
): Promise<Record<string, string>[] | null> {
  return safeReadPrivateAsset(rootPath, assetName, (content) => {
    const lines = content.trim().split("\n");
    if (lines.length === 0) return [];

    const headers = lines[0].split(",").map((h) => h.trim());
    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim());
      return headers.reduce((obj, header, i) => {
        obj[header] = values[i] ?? "";
        return obj;
      }, {} as Record<string, string>);
    });
  });
}

function normalizePath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}
