/**
 * F1 DB Migration System
 *
 * Tracks and applies database migrations in order.
 *
 * @example
 * ```ts
 * // migrations/001_create_users.ts
 * export const up = async (db: FiyuuDB) => {
 *   await db.createTable({
 *     name: "users",
 *     columns: {
 *       name: { type: "string" },
 *       email: { type: "string", unique: true }
 *     }
 *   });
 * };
 *
 * export const down = async (db: FiyuuDB) => {
 *   await db.dropTable("users");
 * };
 * ```
 */

import type { Document } from "./types.js";

export interface Migration {
  name: string;
  version: number;
  up: (db: MigrationDB) => Promise<void> | void;
  down?: (db: MigrationDB) => Promise<void> | void;
}

export interface MigrationRecord extends Document {
  name: string;
  version: number;
  appliedAt: number;
}

export interface MigrationDB {
  createTable: (schema: unknown) => Promise<void>;
  dropTable: (name: string) => Promise<void>;
  table: (name: string) => unknown;
  query: (sql: string, params?: unknown[]) => unknown;
}

export class MigrationRunner {
  private migrations: Migration[] = [];
  private db: MigrationDB;
  private getApplied: () => MigrationRecord[];
  private recordMigration: (record: Omit<MigrationRecord, "_id" | "_createdAt" | "_updatedAt">) => void;
  private removeMigrationRecord: (name: string) => void;

  constructor(
    db: MigrationDB,
    getApplied: () => MigrationRecord[],
    recordMigration: (record: Omit<MigrationRecord, "_id" | "_createdAt" | "_updatedAt">) => void,
    removeMigrationRecord: (name: string) => void,
  ) {
    this.db = db;
    this.getApplied = getApplied;
    this.recordMigration = recordMigration;
    this.removeMigrationRecord = removeMigrationRecord;
  }

  /**
   * Register a migration.
   */
  register(migration: Migration): void {
    this.migrations.push(migration);
    this.migrations.sort((a, b) => a.version - b.version);
  }

  /**
   * Register multiple migrations.
   */
  registerAll(migrations: Migration[]): void {
    for (const m of migrations) {
      this.register(m);
    }
  }

  /**
   * Run all pending migrations.
   */
  async up(): Promise<string[]> {
    const applied = this.getApplied();
    const appliedNames = new Set(applied.map((m) => m.name));
    const pending = this.migrations.filter((m) => !appliedNames.has(m.name));
    const ran: string[] = [];

    for (const migration of pending) {
      await migration.up(this.db);
      this.recordMigration({
        name: migration.name,
        version: migration.version,
        appliedAt: Date.now(),
      });
      ran.push(migration.name);
    }

    return ran;
  }

  /**
   * Rollback the last N migrations.
   */
  async down(count: number = 1): Promise<string[]> {
    const applied = this.getApplied();
    const sorted = [...applied].sort((a, b) => b.version - a.version);
    const toRollback = sorted.slice(0, count);
    const rolledBack: string[] = [];

    for (const record of toRollback) {
      const migration = this.migrations.find((m) => m.name === record.name);
      if (migration?.down) {
        await migration.down(this.db);
      }
      this.removeMigrationRecord(record.name);
      rolledBack.push(record.name);
    }

    return rolledBack;
  }

  /**
   * Get migration status.
   */
  status(): Array<{ name: string; version: number; applied: boolean; appliedAt?: number }> {
    const applied = this.getApplied();
    const appliedMap = new Map(applied.map((m) => [m.name, m]));

    return this.migrations.map((m) => {
      const record = appliedMap.get(m.name);
      return {
        name: m.name,
        version: m.version,
        applied: !!record,
        appliedAt: record?.appliedAt,
      };
    });
  }

  /**
   * Get pending migrations count.
   */
  pendingCount(): number {
    const applied = new Set(this.getApplied().map((m) => m.name));
    return this.migrations.filter((m) => !applied.has(m.name)).length;
  }
}
