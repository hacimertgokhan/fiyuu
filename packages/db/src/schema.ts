import type { TableSchema, ColumnDef } from "./types.js";

const schemaRegistry = new Map<string, TableSchema>();

export function defineTable(schema: TableSchema): TableSchema {
  if (schemaRegistry.has(schema.name)) {
    return schemaRegistry.get(schema.name)!;
  }

  validateSchema(schema);
  schemaRegistry.set(schema.name, schema);
  return schema;
}

export function getTableSchema(name: string): TableSchema | undefined {
  return schemaRegistry.get(name);
}

export function getAllSchemas(): TableSchema[] {
  return Array.from(schemaRegistry.values());
}

export function clearSchemaRegistry(): void {
  schemaRegistry.clear();
}

function validateSchema(schema: TableSchema): void {
  if (!schema.name || schema.name.trim().length === 0) {
    throw new Error("Table schema must have a non-empty name.");
  }

  if (!schema.columns || Object.keys(schema.columns).length === 0) {
    throw new Error(`Table "${schema.name}" must have at least one column.`);
  }

  const primaryKeys = Object.entries(schema.columns)
    .filter(([, col]) => col.primaryKey)
    .map(([name]) => name);

  if (primaryKeys.length > 1) {
    throw new Error(`Table "${schema.name}" has multiple primary keys: ${primaryKeys.join(", ")}. Only one is allowed.`);
  }

  for (const [colName, col] of Object.entries(schema.columns)) {
    if (col.type === undefined) {
      throw new Error(`Column "${colName}" in table "${schema.name}" is missing a type.`);
    }
  }
}

export function mergeRowWithDefaults(
  tableName: string,
  row: Record<string, unknown>,
): Record<string, unknown> {
  const schema = schemaRegistry.get(tableName);
  if (!schema) return row;

  const merged: Record<string, unknown> = { ...row };

  for (const [colName, col] of Object.entries(schema.columns)) {
    if (merged[colName] === undefined && col.default !== undefined) {
      merged[colName] = typeof col.default === "function" ? col.default() : col.default;
    }
  }

  return merged;
}

export function validateRow(
  tableName: string,
  row: Record<string, unknown>,
): string[] {
  const schema = schemaRegistry.get(tableName);
  if (!schema) return [];

  const errors: string[] = [];

  for (const [colName, col] of Object.entries(schema.columns)) {
    const value = row[colName];

    if (value === null || value === undefined) {
      if (!col.nullable && !col.primaryKey && col.default === undefined) {
        errors.push(`Column "${colName}" in table "${tableName}" cannot be null.`);
      }
      continue;
    }

    const actualType = getJsType(value);
    if (actualType !== col.type) {
      errors.push(`Column "${colName}" in table "${tableName}" expects type "${col.type}" but got "${actualType}".`);
    }
  }

  for (const [colName, col] of Object.entries(schema.columns)) {
    if (col.unique && row[colName] !== undefined && row[colName] !== null) {
      // uniqueness check is done at Table level
    }
  }

  return errors;
}

function getJsType(value: unknown): string {
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object" && value !== null) return "object";
  return "null";
}
