/**
 * F1 DB Index Manager
 *
 * Hash-based indexing for fast lookups on indexed and unique fields.
 * Replaces full table scans with O(1) hash lookups.
 */

import type { Document } from "./types.js";

export interface IndexEntry {
  field: string;
  type: "hash" | "unique";
  data: Map<unknown, Set<string>>; // value -> set of _id
}

export class IndexManager {
  private indexes = new Map<string, IndexEntry>();

  /**
   * Create an index on a field.
   */
  createIndex(field: string, type: "hash" | "unique" = "hash"): void {
    if (this.indexes.has(field)) return;
    this.indexes.set(field, { field, type, data: new Map() });
  }

  /**
   * Remove an index.
   */
  dropIndex(field: string): void {
    this.indexes.delete(field);
  }

  /**
   * Rebuild all indexes from data.
   */
  rebuild(data: Document[]): void {
    // Clear all index data
    for (const [, index] of this.indexes) {
      index.data.clear();
    }

    // Re-index all documents
    for (const doc of data) {
      this.addDocument(doc);
    }
  }

  /**
   * Add a document to all indexes.
   */
  addDocument(doc: Document): void {
    for (const [field, index] of this.indexes) {
      const value = doc[field];
      if (value === undefined || value === null) continue;

      if (!index.data.has(value)) {
        index.data.set(value, new Set());
      }
      index.data.get(value)!.add(doc._id);
    }
  }

  /**
   * Remove a document from all indexes.
   */
  removeDocument(doc: Document): void {
    for (const [field, index] of this.indexes) {
      const value = doc[field];
      if (value === undefined || value === null) continue;

      const ids = index.data.get(value);
      if (ids) {
        ids.delete(doc._id);
        if (ids.size === 0) {
          index.data.delete(value);
        }
      }
    }
  }

  /**
   * Update a document in indexes (remove old, add new).
   */
  updateDocument(oldDoc: Document, newDoc: Document): void {
    this.removeDocument(oldDoc);
    this.addDocument(newDoc);
  }

  /**
   * Look up document IDs by field value using index.
   * Returns null if no index exists for the field.
   */
  lookup(field: string, value: unknown): Set<string> | null {
    const index = this.indexes.get(field);
    if (!index) return null;

    return index.data.get(value) ?? new Set();
  }

  /**
   * Check if a value would violate a unique constraint.
   * Returns the existing document ID if violation detected.
   */
  checkUnique(field: string, value: unknown, excludeId?: string): string | null {
    const index = this.indexes.get(field);
    if (!index || index.type !== "unique") return null;

    const ids = index.data.get(value);
    if (!ids || ids.size === 0) return null;

    for (const id of ids) {
      if (id !== excludeId) return id;
    }

    return null;
  }

  /**
   * Check if a field has an index.
   */
  hasIndex(field: string): boolean {
    return this.indexes.has(field);
  }

  /**
   * Get index statistics.
   */
  stats(): Array<{ field: string; type: string; uniqueValues: number; totalEntries: number }> {
    const result: Array<{ field: string; type: string; uniqueValues: number; totalEntries: number }> = [];

    for (const [, index] of this.indexes) {
      let totalEntries = 0;
      for (const [, ids] of index.data) {
        totalEntries += ids.size;
      }

      result.push({
        field: index.field,
        type: index.type,
        uniqueValues: index.data.size,
        totalEntries,
      });
    }

    return result;
  }
}
