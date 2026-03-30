export interface Document {
  _id: string;
  _createdAt: number;
  _updatedAt: number;
  [key: string]: unknown;
}

export type ColumnType = "string" | "number" | "boolean" | "object" | "array" | "null";

export interface ColumnDef {
  type: ColumnType;
  nullable?: boolean;
  primaryKey?: boolean;
  unique?: boolean;
  index?: boolean;
  default?: unknown;
}

export interface TableSchema {
  name: string;
  columns: Record<string, ColumnDef>;
}

export interface WhereNode {
  field: string;
  op: WhereOp;
  value: unknown;
}

export type WhereOp =
  | "="
  | "!="
  | ">"
  | "<"
  | ">="
  | "<="
  | "LIKE"
  | "IN"
  | "NOT IN"
  | "IS NULL"
  | "IS NOT NULL";

export interface OrderByClause {
  field: string;
  direction: "ASC" | "DESC";
}

export interface SelectQuery {
  type: "SELECT";
  columns: string[];
  table: string;
  where: WhereNode[];
  orderBy: OrderByClause[];
  limit: number | null;
  offset: number | null;
  groupBy: string[];
  aggregate: AggregateClause | null;
}

export interface AggregateClause {
  fn: "COUNT" | "SUM" | "AVG" | "MIN" | "MAX";
  field: string;
  alias: string;
}

export interface InsertQuery {
  type: "INSERT";
  table: string;
  columns: string[];
  values: unknown[][];
}

export interface UpdateQuery {
  type: "UPDATE";
  table: string;
  sets: Record<string, unknown>;
  where: WhereNode[];
}

export interface DeleteQuery {
  type: "DELETE";
  table: string;
  where: WhereNode[];
}

export type ParsedQuery = SelectQuery | InsertQuery | UpdateQuery | DeleteQuery;

export interface QueryResult {
  rows: Document[];
  affected: number;
  error?: string;
}

export type RawRow = Record<string, unknown>;
