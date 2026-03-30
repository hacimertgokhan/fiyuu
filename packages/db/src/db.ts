import type { Document, QueryResult, TableSchema } from "./types.js";
import { Table } from "./table.js";
import { StorageEngine } from "./storage.js";
import { defineTable, getTableSchema, getAllSchemas, clearSchemaRegistry } from "./schema.js";
import { parseSQL, executeSelect, executeUpdate, executeDelete } from "./query-engine.js";

export interface FiyuuDBOptions {
  path?: string;
  autosave?: boolean;
  autosaveIntervalMs?: number;
  tables?: string[];
}

export class FiyuuDB {
  private tables = new Map<string, Table<Document>>();
  private storage: StorageEngine;
  private loaded = false;
  private options: FiyuuDBOptions;

  constructor(options: FiyuuDBOptions = {}) {
    this.options = options;
    this.storage = new StorageEngine({
      path: options.path || ".fiyuu/data",
      autosave: options.autosave !== false,
      autosaveIntervalMs: options.autosaveIntervalMs || 5000,
    });
  }

  async initialize(): Promise<void> {
    if (this.loaded) return;
    await this.storage.ensureDirectory();

    const allSchemas = getAllSchemas();
    const schemaNames = allSchemas.map((s) => s.name);
    const optionTableNames = this.options.tables || [];
    const allTableNames = [...new Set([...schemaNames, ...optionTableNames])];

    for (const tableName of allTableNames) {
      const data = await this.storage.readTable(tableName);
      const docs = data as Document[];
      this.tables.set(tableName, new Table(tableName, this.storage, docs));
    }

    this.loaded = true;
  }

  async shutdown(): Promise<void> {
    const allTables = new Map<string, Document[]>();
    for (const [name, table] of this.tables) {
      allTables.set(name, table.toJSON());
    }
    await this.storage.flushAll(allTables);
    this.tables.clear();
    this.loaded = false;
  }

  table<T extends Document = Document>(name: string): Table<T> {
    if (!this.tables.has(name)) {
      this.tables.set(name, new Table(name, this.storage, []));
    }
    return this.tables.get(name) as unknown as Table<T>;
  }

  query(sql: string, params: unknown[] = []): QueryResult {
    const parsed = parseSQL(sql, [...params]);
    const tableName = "table" in parsed ? parsed.table : undefined;

    if (!tableName) {
      return { rows: [], affected: 0, error: "Could not determine table name from query." };
    }

    const table = this.tables.get(tableName);
    if (!table) {
      return { rows: [], affected: 0, error: `Table "${tableName}" does not exist.` };
    }

    return table.query(sql, params);
  }

  async createTable(schemaOrName: TableSchema | string): Promise<void> {
    if (typeof schemaOrName === "string") {
      const name = schemaOrName;
      if (!this.tables.has(name)) {
        this.tables.set(name, new Table(name, this.storage, []));
      }
      return;
    }

    const schema = schemaOrName;
    defineTable(schema);

    if (!this.tables.has(schema.name)) {
      this.tables.set(schema.name, new Table(schema.name, this.storage, []));
    }
  }

  async dropTable(name: string): Promise<void> {
    this.tables.delete(name);
    await this.storage.deleteTable(name);
  }

  listTables(): string[] {
    return Array.from(this.tables.keys());
  }

  getTableInfo(name: string): { name: string; count: number; schema?: TableSchema } | undefined {
    const table = this.tables.get(name);
    if (!table) return undefined;

    return {
      name: table.name,
      count: table.count,
      schema: getTableSchema(name),
    };
  }

  async seed(tableName: string, rows: Array<Record<string, unknown>>): Promise<number> {
    const table = this.table(tableName);
    let count = 0;
    for (const row of rows) {
      table.insert(row);
      count++;
    }
    return count;
  }

  stats(): { tables: number; totalRows: number; details: Array<{ name: string; rows: number }> } {
    const details: Array<{ name: string; rows: number }> = [];
    let totalRows = 0;

    for (const [name, table] of this.tables) {
      details.push({ name, rows: table.count });
      totalRows += table.count;
    }

    return { tables: this.tables.size, totalRows, details };
  }
}

let globalDb: FiyuuDB | null = null;

export function createDB(options?: FiyuuDBOptions): FiyuuDB {
  return new FiyuuDB(options);
}

export function getDB(): FiyuuDB {
  if (!globalDb) {
    globalDb = new FiyuuDB();
  }
  return globalDb;
}

export function setDB(db: FiyuuDB): void {
  globalDb = db;
}
