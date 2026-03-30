import type { Document, TableSchema, QueryResult } from "./types.js";
import { parseSQL, executeSelect, executeInsert, executeUpdate, executeDelete } from "./query-engine.js";
import { getTableSchema, mergeRowWithDefaults, validateRow } from "./schema.js";
import type { StorageEngine } from "./storage.js";

export class Table<T extends Document = Document> {
  readonly name: string;
  private data: Document[];
  private storage: StorageEngine;
  private schema: TableSchema | undefined;
  private uniqueIndexes = new Map<string, Set<unknown>>();
  private indexFields = new Set<string>();

  constructor(name: string, storage: StorageEngine, initialData: Document[] = []) {
    this.name = name;
    this.storage = storage;
    this.data = initialData;
    this.schema = getTableSchema(name);

    if (this.schema) {
      for (const [colName, col] of Object.entries(this.schema.columns)) {
        if (col.unique) this.uniqueIndexes.set(colName, new Set());
        if (col.index) this.indexFields.add(colName);
      }
    }

    this.rebuildIndexes();
  }

  get count(): number {
    return this.data.length;
  }

  get schemaName(): string | undefined {
    return this.schema?.name;
  }

  find(filter?: Partial<T>): T[] {
    if (!filter || Object.keys(filter).length === 0) return [...this.data] as T[];
    return this.data.filter((row) => this.matchesFilter(row, filter)) as T[];
  }

  findOne(filter: Partial<T>): T | undefined {
    return this.data.find((row) => this.matchesFilter(row, filter)) as T | undefined;
  }

  findById(id: string): T | undefined {
    return this.data.find((row) => row._id === id) as T | undefined;
  }

  insert(row: Omit<T, "_id" | "_createdAt" | "_updatedAt"> & { _id?: string }): T {
    const now = Date.now();
    const doc: Document = {
      _id: (row as unknown as Document)._id || generateId(),
      _createdAt: now,
      _updatedAt: now,
      ...(row as unknown as Record<string, unknown>),
    };

    if (this.schema) {
      const merged = mergeRowWithDefaults(this.name, doc);
      const errors = validateRow(this.name, merged);
      if (errors.length > 0) throw new Error(`Validation failed for table "${this.name}": ${errors.join("; ")}`);
      Object.assign(doc, merged);
    }

    this.checkUniqueness(doc);
    this.data.push(doc);
    this.updateIndexes(doc);
    this.storage.scheduleFlush(this.name, this.data);

    return doc as T;
  }

  insertMany(rows: Array<Omit<T, "_id" | "_createdAt" | "_updatedAt"> & { _id?: string }>): T[] {
    const inserted: T[] = [];
    for (const row of rows) {
      inserted.push(this.insert(row));
    }
    return inserted;
  }

  update(id: string, updates: Partial<T>): boolean {
    const row = this.data.find((r) => r._id === id);
    if (!row) return false;

    const now = Date.now();
    for (const [key, value] of Object.entries(updates)) {
      if (key === "_id" || key === "_createdAt") continue;
      (row as Record<string, unknown>)[key] = value;
    }
    row._updatedAt = now;

    this.checkUniqueness(row);
    this.storage.scheduleFlush(this.name, this.data);
    return true;
  }

  updateWhere(filter: Partial<T>, updates: Partial<T>): number {
    const rows = this.data.filter((row) => this.matchesFilter(row, filter));
    for (const row of rows) {
      const now = Date.now();
      for (const [key, value] of Object.entries(updates)) {
        if (key === "_id" || key === "_createdAt") continue;
        (row as Record<string, unknown>)[key] = value;
      }
      row._updatedAt = now;
    }

    if (rows.length > 0) this.storage.scheduleFlush(this.name, this.data);
    return rows.length;
  }

  delete(id: string): boolean {
    const idx = this.data.findIndex((row) => row._id === id);
    if (idx === -1) return false;

    this.data.splice(idx, 1);
    this.storage.scheduleFlush(this.name, this.data);
    return true;
  }

  deleteWhere(filter: Partial<T>): number {
    const before = this.data.length;
    this.data = this.data.filter((row) => !this.matchesFilter(row, filter));
    const removed = before - this.data.length;

    if (removed > 0) this.storage.scheduleFlush(this.name, this.data);
    return removed;
  }

  clear(): void {
    this.data = [];
    this.storage.scheduleFlush(this.name, this.data);
  }

  query(sql: string, params: unknown[] = []): QueryResult {
    const parsed = parseSQL(sql, [...params]);

    switch (parsed.type) {
      case "SELECT": {
        if (parsed.table !== this.name) {
          return { rows: [], affected: 0, error: `Table "${parsed.table}" not found (expected "${this.name}").` };
        }
        return executeSelect(parsed, this.data);
      }
      case "INSERT": {
        if (parsed.table !== this.name) {
          return { rows: [], affected: 0, error: `Table "${parsed.table}" not found (expected "${this.name}").` };
        }
        const result = executeInsert(parsed, this.data);
        this.storage.scheduleFlush(this.name, this.data);
        return result;
      }
      case "UPDATE": {
        if (parsed.table !== this.name) {
          return { rows: [], affected: 0, error: `Table "${parsed.table}" not found (expected "${this.name}").` };
        }
        const result = executeUpdate(parsed, this.data);
        this.storage.scheduleFlush(this.name, this.data);
        return result;
      }
      case "DELETE": {
        if (parsed.table !== this.name) {
          return { rows: [], affected: 0, error: `Table "${parsed.table}" not found (expected "${this.name}").` };
        }
        const affected = executeDelete(parsed, this.data);
        this.storage.scheduleFlush(this.name, this.data);
        return { rows: [], affected };
      }
    }
  }

  private matchesFilter(row: Document, filter: Partial<T>): boolean {
    for (const [key, value] of Object.entries(filter)) {
      if (row[key] !== value) return false;
    }
    return true;
  }

  private checkUniqueness(row: Document): void {
    for (const [col, uniqueSet] of this.uniqueIndexes) {
      const val = row[col];
      if (val === undefined || val === null) continue;

      const existingIdx = this.data.findIndex((r) => r._id !== row._id && r[col] === val);
      if (existingIdx !== -1) {
        throw new Error(`Unique constraint violation on column "${col}" in table "${this.name}". Value "${String(val)}" already exists.`);
      }
    }
  }

  private rebuildIndexes(): void {
    for (const [, uniqueSet] of this.uniqueIndexes) {
      uniqueSet.clear();
    }
    for (const row of this.data) {
      this.updateIndexes(row);
    }
  }

  private updateIndexes(row: Document): void {
    for (const [col, uniqueSet] of this.uniqueIndexes) {
      const val = row[col];
      if (val !== undefined && val !== null) uniqueSet.add(val);
    }
  }

  toJSON(): Document[] {
    return [...this.data];
  }
}

function generateId(): string {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 10);
  return `d_${time}${rand}`;
}
