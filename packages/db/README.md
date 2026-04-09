# @fiyuu/db

F1 DB - Embedded JSON database for the Fiyuu framework. Zero dependencies, zero configuration.

## Installation

```bash
npm install @fiyuu/db
```

## Quick Start

```typescript
import { createDB } from "@fiyuu/db";

const db = createDB({ path: ".data" });
await db.initialize();

// Insert
const user = db.table("users").insert({ name: "Ali", email: "ali@test.com" });

// Query
const users = db.table("users").find({ name: "Ali" });
const user = db.table("users").findById("d_abc123");

// Update
db.table("users").update(user._id, { name: "Ali Updated" });

// Delete
db.table("users").delete(user._id);
```

## Schema Definition

```typescript
import { defineTable } from "@fiyuu/db";

defineTable({
  name: "users",
  columns: {
    name: { type: "string" },
    email: { type: "string", unique: true },
    role: { type: "string", index: true, default: "user" },
    active: { type: "boolean", default: true },
  },
});
```

## SQL Queries

```typescript
const result = db.query("SELECT * FROM users WHERE role = ? ORDER BY name LIMIT 10", ["admin"]);
db.query("INSERT INTO users (name, email) VALUES (?, ?)", ["Ali", "ali@test.com"]);
db.query("UPDATE users SET role = ? WHERE _id = ?", ["admin", userId]);
db.query("DELETE FROM users WHERE active = ?", [false]);
```

## Transactions

```typescript
await db.transaction(async (tx) => {
  const user = tx.table("users").insert({ name: "Ali" });
  tx.table("profiles").insert({ userId: user._id, bio: "Hello" });
  // If anything throws, all changes are rolled back
});
```

## Migrations

```typescript
const runner = db.migrator();

runner.register({
  name: "001_create_users",
  version: 1,
  up: async (db) => {
    await db.createTable({
      name: "users",
      columns: { name: { type: "string" }, email: { type: "string", unique: true } },
    });
  },
  down: async (db) => {
    await db.dropTable("users");
  },
});

await runner.up(); // Apply pending migrations
```

## Features

- Zero dependencies
- JSON file storage with auto-save
- Schema validation with unique constraints
- SQL query support (SELECT, INSERT, UPDATE, DELETE)
- Transaction support with rollback
- Migration system
- Index manager for fast lookups
- Auto-generated `_id`, `_createdAt`, `_updatedAt` fields

## License

MIT
