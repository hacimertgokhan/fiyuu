import { promises as fs } from "node:fs";
import path from "node:path";

export class StorageEngine {
  private baseDirectory: string;
  private flushTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private autosave: boolean;
  private autosaveIntervalMs: number;

  constructor(options: { path: string; autosave: boolean; autosaveIntervalMs: number }) {
    this.baseDirectory = path.resolve(options.path);
    this.autosave = options.autosave;
    this.autosaveIntervalMs = options.autosaveIntervalMs;
  }

  get directory(): string {
    return this.baseDirectory;
  }

  async ensureDirectory(): Promise<void> {
    await fs.mkdir(this.baseDirectory, { recursive: true });
  }

  tableFilePath(tableName: string): string {
    const safeName = tableName.replace(/[^a-zA-Z0-9_\-]/g, "_");
    return path.join(this.baseDirectory, `${safeName}.json`);
  }

  metaFilePath(): string {
    return path.join(this.baseDirectory, "_meta.json");
  }

  async readTable(tableName: string): Promise<unknown[]> {
    const filePath = this.tableFilePath(tableName);
    try {
      const raw = await fs.readFile(filePath, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch {
      return [];
    }
  }

  async writeTable(tableName: string, data: unknown[]): Promise<void> {
    const filePath = this.tableFilePath(tableName);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
  }

  scheduleFlush(tableName: string, data: unknown[]): void {
    if (!this.autosave) return;

    const existing = this.flushTimers.get(tableName);
    if (existing) {
      clearTimeout(existing);
    }

    this.flushTimers.set(
      tableName,
      setTimeout(() => {
        this.flushTimers.delete(tableName);
        this.writeTable(tableName, data).catch(() => {
          // swallow autosave errors
        });
      }, this.autosaveIntervalMs),
    );
  }

  async flushAll(tables: Map<string, unknown[]>): Promise<void> {
    for (const [name, timer] of this.flushTimers) {
      clearTimeout(timer);
    }
    this.flushTimers.clear();

    const writes: Promise<void>[] = [];
    for (const [tableName, data] of tables) {
      writes.push(this.writeTable(tableName, data));
    }
    await Promise.all(writes);
  }

  async readMeta(): Promise<Record<string, unknown>> {
    const filePath = this.metaFilePath();
    try {
      const raw = await fs.readFile(filePath, "utf8");
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  async writeMeta(meta: Record<string, unknown>): Promise<void> {
    const filePath = this.metaFilePath();
    await fs.writeFile(filePath, JSON.stringify(meta, null, 2), "utf8");
  }

  async tableExists(tableName: string): Promise<boolean> {
    try {
      await fs.access(this.tableFilePath(tableName));
      return true;
    } catch {
      return false;
    }
  }

  async deleteTable(tableName: string): Promise<void> {
    const filePath = this.tableFilePath(tableName);
    try {
      await fs.unlink(filePath);
    } catch {
      // table file may not exist
    }
  }
}
