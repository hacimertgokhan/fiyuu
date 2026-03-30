import type {
  Document,
  WhereNode,
  OrderByClause,
  SelectQuery,
  InsertQuery,
  UpdateQuery,
  DeleteQuery,
  ParsedQuery,
  QueryResult,
  AggregateClause,
} from "./types.js";

const SQL_KEYWORDS = /\b(SELECT|INSERT|UPDATE|DELETE|FROM|INTO|SET|VALUES|WHERE|ORDER BY|GROUP BY|LIMIT|OFFSET|AND|OR|AS|COUNT|SUM|AVG|MIN|MAX|ASC|DESC|LIKE|IN|IS|NULL|NOT)\b/gi;
const TOKEN_PATTERN = /('(?:\\.|[^'\\])*')|("(?:\\.|[^"\\])*")|(\(|\))|([<>!=]+\s*)|(\b\w+\b)|([*+,])/gi;

export function parseSQL(sql: string, params: unknown[] = []): ParsedQuery {
  const trimmed = sql.trim();
  const upper = trimmed.toUpperCase().trim();

  if (upper.startsWith("SELECT")) return parseSelect(trimmed, params);
  if (upper.startsWith("INSERT")) return parseInsert(trimmed, params);
  if (upper.startsWith("UPDATE")) return parseUpdate(trimmed, params);
  if (upper.startsWith("DELETE")) return parseDelete(trimmed, params);

  throw new Error(`Unsupported SQL command: "${trimmed.slice(0, 30)}..."`);
}

function parseSelect(sql: string, params: unknown[]): SelectQuery {
  const upper = sql.toUpperCase();

  const fromIdx = upper.indexOf(" FROM ");
  if (fromIdx === -1) throw new Error("SELECT query missing FROM clause.");

  const columnsPart = sql.slice(6, fromIdx).trim();
  const rest = sql.slice(fromIdx + 6);

  const columns = parseColumns(columnsPart);

  let whereClause = "";
  let orderByClause = "";
  let groupByClause = "";
  let limitClause = "";
  let offsetClause = "";

  let current = rest;
  const whereIdx = findKeyword(current, " WHERE ");
  if (whereIdx !== -1) {
    const afterWhere = current.slice(whereIdx + 7);
    whereClause = extractUpToKeyword(afterWhere, [" ORDER BY", " GROUP BY", " LIMIT", " OFFSET"]);
    current = current.slice(whereIdx + 7 + whereClause.length);
  }

  const orderIdx = findKeyword(current, " ORDER BY ");
  if (orderIdx !== -1) {
    const afterOrder = current.slice(orderIdx + 10);
    orderByClause = extractUpToKeyword(afterOrder, [" LIMIT", " OFFSET", " GROUP BY"]);
    current = current.slice(orderIdx + 10 + orderByClause.length);
  }

  const groupIdx = findKeyword(current, " GROUP BY ");
  if (groupIdx !== -1) {
    const afterGroup = current.slice(groupIdx + 10);
    groupByClause = extractUpToKeyword(afterGroup, [" ORDER BY", " LIMIT", " OFFSET"]);
    current = current.slice(groupIdx + 10 + groupByClause.length);
  }

  const limitIdx = findKeyword(current, " LIMIT ");
  if (limitIdx !== -1) {
    const afterLimit = current.slice(limitIdx + 7);
    limitClause = extractUpToKeyword(afterLimit, [" OFFSET"]).trim();
    current = current.slice(limitIdx + 7 + limitClause.length);
  }

  const offsetIdx = findKeyword(current, " OFFSET ");
  if (offsetIdx !== -1) {
    offsetClause = current.slice(offsetIdx + 8).trim();
  }

  const table = rest.slice(0, fromIdx > 0 ? undefined : rest.indexOf(" ")).trim().split(/\s+/)[0].replace(/[`"]/g, "");

  const tableFromRest = extractTableNameFromSelectRest(rest);
  const where = whereClause ? parseWhere(whereClause, params) : [];
  const orderBy = orderByClause ? parseOrderBy(orderByClause) : [];
  const groupBy = groupByClause ? groupByClause.split(",").map((s) => s.trim()) : [];
  const limit = limitClause ? parseInt(resolveParam(limitClause.trim(), params), 10) || null : null;
  const offset = offsetClause ? parseInt(resolveParam(offsetClause.trim(), params), 10) || null : null;

  const aggregate = detectAggregate(columns);

  return { type: "SELECT", columns, table: tableFromRest, where, orderBy, limit, offset, groupBy, aggregate };
}

function parseInsert(sql: string, params: unknown[]): InsertQuery {
  const upper = sql.toUpperCase();

  const intoIdx = upper.indexOf(" INTO ");
  const valuesIdx = upper.indexOf(" VALUES ");
  if (intoIdx === -1 || valuesIdx === -1) throw new Error("INSERT query missing INTO or VALUES clause.");

  const table = sql.slice(intoIdx + 6, upper.indexOf("(", intoIdx + 6)).trim().replace(/[`"]/g, "");

  const colsPart = sql.slice(upper.indexOf("(", intoIdx + 6) + 1, upper.indexOf(")", intoIdx + 6));
  const columns = colsPart.split(",").map((c) => c.trim().replace(/[`"]/g, ""));

  const valuesPart = sql.slice(valuesIdx + 8).trim();
  const values = parseValuesList(valuesPart, params);

  return { type: "INSERT", table, columns, values };
}

function parseUpdate(sql: string, params: unknown[]): UpdateQuery {
  const upper = sql.toUpperCase();

  const setIdx = upper.indexOf(" SET ");
  if (setIdx === -1) throw new Error("UPDATE query missing SET clause.");

  const table = sql.slice(7, setIdx).trim().replace(/[`"]/g, "");

  const whereIdx = findKeyword(upper, " WHERE ");
  let setPart: string;
  let wherePart = "";

  if (whereIdx !== -1) {
    setPart = sql.slice(setIdx + 5, whereIdx);
    wherePart = sql.slice(whereIdx + 7);
  } else {
    setPart = sql.slice(setIdx + 5);
  }

  const sets = parseSetClause(setPart, params);
  const where = wherePart ? parseWhere(wherePart, params) : [];

  return { type: "UPDATE", table, sets, where };
}

function parseDelete(sql: string, params: unknown[]): DeleteQuery {
  const upper = sql.toUpperCase();

  const fromIdx = upper.indexOf(" FROM ");
  const whereIdx = findKeyword(upper, " WHERE ");

  let table: string;
  let wherePart = "";

  if (fromIdx !== -1) {
    table = sql.slice(fromIdx + 6, whereIdx !== -1 ? whereIdx : undefined).trim().replace(/[`"]/g, "");
  } else {
    table = sql.slice(6, whereIdx !== -1 ? whereIdx : undefined).trim().replace(/[`"]/g, "");
  }

  if (whereIdx !== -1) {
    wherePart = sql.slice(whereIdx + 7);
  }

  const where = wherePart ? parseWhere(wherePart, params) : [];
  return { type: "DELETE", table, where };
}

function parseColumns(columnsPart: string): string[] {
  if (columnsPart.trim() === "*") return ["*"];
  return columnsPart.split(",").map((c) => {
    const trimmed = c.trim();
    const asMatch = trimmed.match(/^(.+?)\s+AS\s+(\w+)$/i);
    if (asMatch) return `${asMatch[1].trim()} AS ${asMatch[2].trim()}`;
    return trimmed.replace(/[`"]/g, "");
  });
}

function parseWhere(whereClause: string, params: unknown[]): WhereNode[] {
  const nodes: WhereNode[] = [];
  const conditionPattern = /(\w+)\s*(IS\s+NOT\s+NULL|IS\s+NULL|[<>!=]+\s*|LIKE\s+|IN\s+)\s*(?:(\?)|'([^']*)'|"([^"]*)"|(\S+))?/gi;

  let match: RegExpExecArray | null;
  while ((match = conditionPattern.exec(whereClause)) !== null) {
    const field = match[1];
    let op = match[2].trim().toUpperCase();
    const paramPlaceholder = match[3];
    const singleQuoted = match[4];
    const doubleQuoted = match[5];
    const rawValue = match[6];

    let value: unknown;

    if (paramPlaceholder === "?") {
      value = params.shift();
    } else if (singleQuoted !== undefined) {
      value = singleQuoted;
    } else if (doubleQuoted !== undefined) {
      value = doubleQuoted;
    } else if (rawValue !== undefined) {
      if (rawValue.toUpperCase() === "NULL") {
        value = null;
      } else if (rawValue.toUpperCase() === "TRUE") {
        value = true;
      } else if (rawValue.toUpperCase() === "FALSE") {
        value = false;
      } else {
        const num = Number(rawValue);
        value = isNaN(num) ? rawValue : num;
      }
    }

    if (op === "IS NOT") op = "IS NOT NULL";
    else if (op === "IS") op = "IS NULL";
    else if (op.startsWith("LIKE")) op = "LIKE";
    else if (op.startsWith("IN")) op = "IN";

    nodes.push({ field, op: op as WhereNode["op"], value });
  }

  return nodes;
}

function parseOrderBy(orderByClause: string): OrderByClause[] {
  return orderByClause.split(",").map((part) => {
    const [field, dir] = part.trim().split(/\s+/);
    return {
      field: field.replace(/[`"]/g, ""),
      direction: (dir?.toUpperCase() === "DESC" ? "DESC" : "ASC") as "ASC" | "DESC",
    };
  });
}

function parseSetClause(setClause: string, params: unknown[]): Record<string, unknown> {
  const sets: Record<string, unknown> = {};
  const pairs = splitTopLevel(setClause, ",");

  for (const pair of pairs) {
    const eqIdx = pair.indexOf("=");
    if (eqIdx === -1) continue;
    const field = pair.slice(0, eqIdx).trim().replace(/[`"]/g, "");
    let valueStr = pair.slice(eqIdx + 1).trim();

    if (valueStr === "?") {
      sets[field] = params.shift();
    } else {
      sets[field] = parseLiteral(valueStr);
    }
  }

  return sets;
}

function parseValuesList(valuesPart: string, params: unknown[]): unknown[][] {
  const rows: unknown[][] = [];
  const cleaned = valuesPart.trim();

  if (cleaned.startsWith("(")) {
    let depth = 0;
    let current = "";
    let currentRow: unknown[] = [];

    for (const ch of cleaned) {
      if (ch === "(") {
        if (depth > 0) current += ch;
        depth++;
      } else if (ch === ")") {
        depth--;
        if (depth === 0) {
          if (current.trim()) {
            currentRow.push(...splitTopLevel(current, ",").map((v) => parseValueOrParam(v.trim(), params)));
          }
          rows.push(currentRow);
          currentRow = [];
          current = "";
        } else {
          current += ch;
        }
      } else if (depth > 0) {
        current += ch;
      }
    }
  }

  return rows;
}

function parseValueOrParam(valueStr: string, params: unknown[]): unknown {
  if (valueStr === "?") return params.shift();
  return parseLiteral(valueStr);
}

function parseLiteral(valueStr: string): unknown {
  const trimmed = valueStr.trim();
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) return trimmed.slice(1, -1);
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) return trimmed.slice(1, -1);
  if (trimmed.toUpperCase() === "NULL") return null;
  if (trimmed.toUpperCase() === "TRUE") return true;
  if (trimmed.toUpperCase() === "FALSE") return false;
  const num = Number(trimmed);
  if (!isNaN(num) && trimmed.length > 0) return num;
  return trimmed;
}

function resolveParam(value: string, params: unknown[]): string {
  if (value === "?") {
    const p = params.shift();
    return p !== undefined ? String(p) : "";
  }
  return value;
}

function findKeyword(str: string, keyword: string): number {
  return str.toUpperCase().indexOf(keyword);
}

function extractUpToKeyword(str: string, keywords: string[]): string {
  let earliest = str.length;
  for (const kw of keywords) {
    const idx = str.toUpperCase().indexOf(kw);
    if (idx !== -1 && idx < earliest) earliest = idx;
  }
  return str.slice(0, earliest);
}

function splitTopLevel(str: string, delimiter: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  let inQuote: string | null = null;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];

    if (inQuote) {
      current += ch;
      if (ch === inQuote && str[i - 1] !== "\\") inQuote = null;
      continue;
    }

    if (ch === "'" || ch === '"') {
      inQuote = ch;
      current += ch;
    } else if (ch === "(") {
      depth++;
      current += ch;
    } else if (ch === ")") {
      depth--;
      current += ch;
    } else if (ch === delimiter && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }

  if (current.trim()) parts.push(current);
  return parts;
}

function extractTableNameFromSelectRest(rest: string): string {
  const upper = rest.toUpperCase();
  let endIdx = upper.length;
  for (const kw of [" WHERE", " ORDER", " GROUP", " LIMIT"]) {
    const idx = upper.indexOf(kw);
    if (idx !== -1 && idx < endIdx) endIdx = idx;
  }
  return rest.slice(0, endIdx).trim().replace(/[`"]/g, "");
}

function detectAggregate(columns: string[]): AggregateClause | null {
  for (const col of columns) {
    const upper = col.toUpperCase();
    const match = upper.match(/^(COUNT|SUM|AVG|MIN|MAX)\((\*|\w+)\)(\s+AS\s+(\w+))?$/);
    if (match) {
      return { fn: match[1] as AggregateClause["fn"], field: match[2], alias: match[4] || match[1] };
    }
  }
  return null;
}

export function executeSelect(query: SelectQuery, tableData: Document[]): QueryResult {
  let rows = [...tableData];

  if (query.where.length > 0) {
    rows = rows.filter((row) => evaluateWhere(row, query.where));
  }

  if (query.groupBy.length > 0 || query.aggregate) {
    return executeAggregate(query, rows);
  }

  if (query.orderBy.length > 0) {
    rows.sort((a, b) => {
      for (const ob of query.orderBy) {
        const aVal = a[ob.field] as string | number;
        const bVal = b[ob.field] as string | number;
        const cmp = compareValues(aVal, bVal);
        if (cmp !== 0) return ob.direction === "ASC" ? cmp : -cmp;
      }
      return 0;
    });
  }

  if (query.offset !== null) rows = rows.slice(query.offset);
  if (query.limit !== null) rows = rows.slice(0, query.limit);

  if (query.columns[0] !== "*") {
    rows = rows.map((row) => {
      const projected: Document = { _id: row._id, _createdAt: row._createdAt, _updatedAt: row._updatedAt };
      for (const col of query.columns) {
        const asMatch = col.match(/^(.+?)\s+AS\s+(\w+)$/i);
        if (asMatch) {
          projected[asMatch[2].trim()] = row[asMatch[1].trim()];
        } else {
          projected[col] = row[col];
        }
      }
      return projected;
    });
  }

  return { rows, affected: 0 };
}

function executeAggregate(query: SelectQuery, rows: Document[]): QueryResult {
  if (query.aggregate) {
    const { fn, field, alias } = query.aggregate;

    if (field === "*") {
      const count = rows.length;
      return { rows: [{ _id: "", _createdAt: 0, _updatedAt: 0, [alias]: count } as Document], affected: 0 };
    }

    const values = rows.map((r) => r[field] as number).filter((v) => typeof v === "number");

    let result: number;
    switch (fn) {
      case "COUNT":
        result = values.length;
        break;
      case "SUM":
        result = values.reduce((a, b) => a + b, 0);
        break;
      case "AVG":
        result = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        break;
      case "MIN":
        result = values.length > 0 ? Math.min(...values) : 0;
        break;
      case "MAX":
        result = values.length > 0 ? Math.max(...values) : 0;
        break;
      default:
        result = 0;
    }

    return { rows: [{ [alias]: result } as Document], affected: 0 };
  }

  // GROUP BY
  const groups = new Map<string, Document[]>();
  for (const row of rows) {
    const key = query.groupBy.map((f) => String(row[f] ?? "")).join("|");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  const resultRows: Document[] = [];
  for (const [, groupRows] of groups) {
    const aggregated: Document = { _id: "", _createdAt: 0, _updatedAt: 0 };
    for (const col of query.columns) {
      const match = col.match(/^(COUNT|SUM|AVG|MIN|MAX)\((\*|\w+)\)(\s+AS\s+(\w+))?$/);
      if (match) {
        const fn = match[1];
        const fnField = match[2];
        const alias = match[4] || fn;
        const vals = fnField === "*" ? groupRows.map(() => 1) : groupRows.map((r) => r[fnField] as number).filter((v) => typeof v === "number");
        switch (fn) {
          case "COUNT":
            aggregated[alias] = vals.length;
            break;
          case "SUM":
            aggregated[alias] = vals.reduce((a, b) => a + b, 0);
            break;
          case "AVG":
            aggregated[alias] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
            break;
          case "MIN":
            aggregated[alias] = vals.length > 0 ? Math.min(...vals) : 0;
            break;
          case "MAX":
            aggregated[alias] = vals.length > 0 ? Math.max(...vals) : 0;
            break;
        }
      } else {
        aggregated[col] = groupRows[0][col];
      }
    }
    resultRows.push(aggregated);
  }

  return { rows: resultRows, affected: 0 };
}

export function executeInsert(query: InsertQuery, tableData: Document[]): QueryResult {
  const inserted: Document[] = [];

  for (const valueRow of query.values) {
    const row: Document = { _id: "", _createdAt: Date.now(), _updatedAt: Date.now() };
    for (let i = 0; i < query.columns.length; i++) {
      row[query.columns[i]] = valueRow[i];
    }
    inserted.push(row);
  }

  tableData.push(...inserted);
  return { rows: inserted, affected: inserted.length };
}

export function executeUpdate(query: UpdateQuery, tableData: Document[]): QueryResult {
  let affected = 0;

  for (const row of tableData) {
    if (evaluateWhere(row, query.where)) {
      for (const [key, value] of Object.entries(query.sets)) {
        (row as Record<string, unknown>)[key] = value;
      }
      row._updatedAt = Date.now();
      affected++;
    }
  }

  return { rows: [], affected };
}

export function executeDelete(query: DeleteQuery, tableData: Document[]): number {
  let count = 0;

  for (let i = tableData.length - 1; i >= 0; i--) {
    if (evaluateWhere(tableData[i], query.where)) {
      tableData.splice(i, 1);
      count++;
    }
  }

  return count;
}

function evaluateWhere(row: Document, nodes: WhereNode[]): boolean {
  if (nodes.length === 0) return true;

  for (const node of nodes) {
    const value = row[node.field];

    switch (node.op) {
      case "=":
        if (value !== node.value) return false;
        break;
      case "!=":
        if (value === node.value) return false;
        break;
      case ">":
        if (!((value as number) > (node.value as number))) return false;
        break;
      case "<":
        if (!((value as number) < (node.value as number))) return false;
        break;
      case ">=":
        if (!((value as number) >= (node.value as number))) return false;
        break;
      case "<=":
        if (!((value as number) <= (node.value as number))) return false;
        break;
      case "LIKE": {
        const pattern = String(node.value).replace(/%/g, ".*").replace(/_/g, ".");
        if (!new RegExp(`^${pattern}$`, "i").test(String(value))) return false;
        break;
      }
      case "IN": {
        if (!Array.isArray(node.value)) return false;
        if (!node.value.includes(value)) return false;
        break;
      }
      case "NOT IN": {
        if (!Array.isArray(node.value)) return false;
        if (node.value.includes(value)) return false;
        break;
      }
      case "IS NULL":
        if (value !== null && value !== undefined) return false;
        break;
      case "IS NOT NULL":
        if (value === null || value === undefined) return false;
        break;
    }
  }

  return true;
}

function compareValues(a: string | number | undefined, b: string | number | undefined): number {
  if (a === undefined || a === null) return -1;
  if (b === undefined || b === null) return 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}
