/**
 * F1 DB Transaction Support
 *
 * Provides basic transaction semantics with rollback on error.
 * All operations within a transaction are applied atomically.
 *
 * @example
 * ```ts
 * await db.transaction(async (tx) => {
 *   const user = tx.table("users").insert({ name: "Ali" });
 *   tx.table("profiles").insert({ userId: user._id, bio: "..." });
 *   // If any operation throws, all changes are rolled back
 * });
 * ```
 */

import type { Document } from "./types.js";
import type { Table } from "./table.js";

export interface TransactionContext {
  table<T extends Document = Document>(name: string): TransactionTable<T>;
}

export interface TransactionTable<T extends Document = Document> {
  find(filter?: Partial<T>): T[];
  findOne(filter: Partial<T>): T | undefined;
  findById(id: string): T | undefined;
  insert(row: Omit<T, "_id" | "_createdAt" | "_updatedAt"> & { _id?: string }): T;
  insertMany(rows: Array<Omit<T, "_id" | "_createdAt" | "_updatedAt"> & { _id?: string }>): T[];
  update(id: string, updates: Partial<T>): boolean;
  updateWhere(filter: Partial<T>, updates: Partial<T>): number;
  delete(id: string): boolean;
  deleteWhere(filter: Partial<T>): number;
}

interface TableSnapshot {
  name: string;
  data: Document[];
}

/**
 * Execute a function within a transaction.
 * If the function throws, all changes are rolled back.
 */
export async function executeTransaction(
  tables: Map<string, Table<Document>>,
  getTable: (name: string) => Table<Document>,
  fn: (ctx: TransactionContext) => Promise<void> | void,
): Promise<void> {
  // Take snapshots of all tables that might be modified
  const snapshots = new Map<string, TableSnapshot>();
  const modifiedTables = new Set<string>();

  // Create proxy tables that track modifications
  const ctx: TransactionContext = {
    table<T extends Document = Document>(name: string): TransactionTable<T> {
      const realTable = getTable(name);

      // Take snapshot before first modification
      if (!snapshots.has(name)) {
        snapshots.set(name, {
          name,
          data: JSON.parse(JSON.stringify(realTable.toJSON())),
        });
      }

      // Return proxied table that tracks modifications
      return {
        find: (filter) => realTable.find(filter as Partial<Document>) as T[],
        findOne: (filter) => realTable.findOne(filter as Partial<Document>) as T | undefined,
        findById: (id) => realTable.findById(id) as T | undefined,
        insert: (row) => {
          modifiedTables.add(name);
          return realTable.insert(row as Omit<Document, "_id" | "_createdAt" | "_updatedAt">) as T;
        },
        insertMany: (rows) => {
          modifiedTables.add(name);
          return realTable.insertMany(rows as Array<Omit<Document, "_id" | "_createdAt" | "_updatedAt">>) as T[];
        },
        update: (id, updates) => {
          modifiedTables.add(name);
          return realTable.update(id, updates as Partial<Document>);
        },
        updateWhere: (filter, updates) => {
          modifiedTables.add(name);
          return realTable.updateWhere(filter as Partial<Document>, updates as Partial<Document>);
        },
        delete: (id) => {
          modifiedTables.add(name);
          return realTable.delete(id);
        },
        deleteWhere: (filter) => {
          modifiedTables.add(name);
          return realTable.deleteWhere(filter as Partial<Document>);
        },
      };
    },
  };

  try {
    await fn(ctx);
    // Transaction succeeded - changes are already applied to real tables
  } catch (error) {
    // Transaction failed - rollback all modified tables
    for (const tableName of modifiedTables) {
      const snapshot = snapshots.get(tableName);
      if (snapshot) {
        const realTable = tables.get(tableName);
        if (realTable) {
          realTable.restoreFromSnapshot(snapshot.data);
        }
      }
    }
    throw error;
  }
}
