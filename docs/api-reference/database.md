# Database (F1 DB)

Fiyuu includes a built-in database called F1 DB. Zero configuration, SQL-like API, ACID transactions.

## Overview

F1 DB provides:
- SQL interface with prepared statements
- Table API for common operations
- ACID transactions
- Automatic migrations
- Indexing
- Relations

## Installation

Already included with `@fiyuu/db`:

```typescript
import { db } from "@fiyuu/db";
```

## SQL Interface

### Basic Queries

```typescript
import { db } from "@fiyuu/db";

// Select
const users = await db.query("SELECT * FROM users");
const [user] = await db.query("SELECT * FROM users WHERE id = ?", ["123"]);

// Insert
await db.query(
  "INSERT INTO users (id, name, email) VALUES (?, ?, ?)",
  [crypto.randomUUID(), "John", "john@example.com"]
);

// Update
await db.query(
  "UPDATE users SET name = ? WHERE id = ?",
  ["Jane", "123"]
);

// Delete
await db.query("DELETE FROM users WHERE id = ?", ["123"]);
```

### Query Results

```typescript
// SELECT returns array
const users = await db.query("SELECT * FROM users");
// [{ id: "1", name: "John" }, { id: "2", name: "Jane" }]

// INSERT returns metadata
const result = await db.query("INSERT INTO users ...");
// { insertId: "uuid", affectedRows: 1 }

// UPDATE/DELETE returns metadata
const result = await db.query("UPDATE users SET ...");
// { affectedRows: 5 }
```

### Advanced Queries

```typescript
// JOIN
const posts = await db.query(`
  SELECT p.*, u.name as author_name
  FROM posts p
  JOIN users u ON p.author_id = u.id
  WHERE p.published = ?
`, [true]);

// Aggregation
const stats = await db.query(`
  SELECT 
    COUNT(*) as total,
    AVG(age) as avg_age,
    MAX(created_at) as latest
  FROM users
  WHERE active = ?
`, [true]);

// Subqueries
const activeUsers = await db.query(`
  SELECT * FROM users
  WHERE id IN (
    SELECT user_id FROM sessions
    WHERE last_seen > datetime('now', '-1 day')
  )
`);

// Full-text search (if enabled)
const results = await db.query(`
  SELECT * FROM posts
  WHERE content MATCH ?
`, ["search term"]);
```

## Table API

Higher-level abstraction for common operations.

### Getting a Table

```typescript
const users = db.table("users");
```

### CRUD Operations

```typescript
// Create
const user = await users.insert({
  id: crypto.randomUUID(),
  name: "John Doe",
  email: "john@example.com",
  createdAt: new Date().toISOString(),
});

// Read all
const allUsers = await users.find();

// Read with filter
const activeUsers = await users.find({ active: true });
const john = await users.find({ name: "John Doe" });

// Read one
const user = await users.findOne({ id: "123" });

// Update
await users.update({ id: "123" }, { name: "Jane Doe" });

// Update many
await users.update({ active: false }, { lastLogin: null });

// Delete
await users.delete({ id: "123" });

// Delete many
await users.delete({ expired: true });
```

### Query Options

```typescript
// Sorting
const users = await users.find({}, { sort: { createdAt: "desc" } });

// Pagination
const users = await users.find({}, { 
  skip: 20, 
  limit: 10 
});

// Projection (select fields)
const users = await users.find({}, { 
  projection: { name: 1, email: 1 } 
});

// Combined
const users = await users.find(
  { active: true },
  { 
    sort: { createdAt: "desc" },
    skip: 0,
    limit: 20,
    projection: { id: 1, name: 1, email: 1 }
  }
);
```

### Count

```typescript
const total = await users.count();
const active = await users.count({ active: true });
```

## Transactions

ACID transactions with automatic rollback on error.

### Basic Transaction

```typescript
await db.transaction(async (tx) => {
  // All operations use tx instead of db
  const user = await tx.table("users").insert({
    id: crypto.randomUUID(),
    name: "John",
    email: "john@example.com",
  });
  
  await tx.table("profiles").insert({
    userId: user.id,
    bio: "Hello world",
  });
  
  await tx.table("accounts").insert({
    userId: user.id,
    balance: 0,
  });
  
  // If any insert fails, all are rolled back
});
```

### Transaction with Return

```typescript
const result = await db.transaction(async (tx) => {
  const order = await tx.table("orders").insert({
    userId: "123",
    total: 100,
    status: "pending",
  });
  
  for (const item of items) {
    await tx.table("order_items").insert({
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity,
    });
    
    // Decrement stock
    await tx.query(
      "UPDATE products SET stock = stock - ? WHERE id = ?",
      [item.quantity, item.productId]
    );
  }
  
  return order;  // Return value from transaction
});
```

### Nested Transactions (Savepoints)

```typescript
await db.transaction(async (tx) => {
  // Outer transaction
  await tx.table("users").insert({ ... });
  
  // Inner transaction (savepoint)
  await tx.transaction(async (innerTx) => {
    await innerTx.table("logs").insert({ ... });
    // Can rollback independently
  });
});
```

### Manual Rollback

```typescript
await db.transaction(async (tx) => {
  const user = await tx.table("users").insert({ ... });
  
  if (!isValid(user)) {
    throw new Error("Invalid user");  // Triggers rollback
  }
  
  await tx.table("profiles").insert({ ... });
});
```

## Indexing

Speed up queries with indexes.

### Creating Indexes

```typescript
// Single field index
await db.table("users").createIndex("email");

// Unique index
await db.table("users").createIndex("email", { unique: true });

// Compound index
await db.table("posts").createIndex(["authorId", "createdAt"]);

// Named index
await db.table("users").createIndex("search", {
  fields: ["name", "email"],
  unique: false,
});
```

### Dropping Indexes

```typescript
await db.table("users").dropIndex("email");
```

### Listing Indexes

```typescript
const indexes = await db.table("users").listIndexes();
// [{ name: "email", unique: true, fields: ["email"] }, ...]
```

## Migrations

Version your database schema.

### Creating Migrations

```typescript
// app/database/migrations/001-initial.ts
export async function up(db: Database) {
  // Create tables
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `);
  
  await db.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT,
      authorId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (authorId) REFERENCES users(id)
    )
  `);
  
  // Create indexes
  await db.table("users").createIndex("email", { unique: true });
  await db.table("posts").createIndex("authorId");
}

export async function down(db: Database) {
  await db.query("DROP TABLE IF EXISTS posts");
  await db.query("DROP TABLE IF EXISTS users");
}
```

### Running Migrations

```typescript
// app/database/migrations/index.ts
import { db } from "@fiyuu/db";

export async function runMigrations() {
  const migrator = db.migrator({
    migrationsPath: "./app/database/migrations",
  });
  
  // Run pending migrations
  await migrator.up();
  
  // Check status
  const status = await migrator.status();
  console.log(`Applied ${status.applied.length} migrations`);
  console.log(`Pending ${status.pending.length} migrations`);
}
```

### Migration CLI

```bash
# Run migrations
fiyuu db migrate

# Rollback last migration
fiyuu db migrate:rollback

# Reset database
fiyuu db migrate:reset

# Check status
fiyuu db migrate:status
```

## Relations

Define relationships between tables.

### One-to-Many

```typescript
// User has many Posts
const user = await db.table("users").findOne({ id: "123" });
const posts = await db.table("posts").find({ authorId: user.id });

// With join
const usersWithPosts = await db.query(`
  SELECT u.*, json_group_array(
    json_object('id', p.id, 'title', p.title)
  ) as posts
  FROM users u
  LEFT JOIN posts p ON p.authorId = u.id
  WHERE u.id = ?
  GROUP BY u.id
`, ["123"]);
```

### Many-to-Many

```typescript
// Users <-> Roles through UserRoles
const userRoles = await db.query(`
  SELECT r.* FROM roles r
  JOIN user_roles ur ON ur.roleId = r.id
  WHERE ur.userId = ?
`, [userId]);
```

### Eager Loading

```typescript
// Custom helper for relations
async function getUserWithPosts(userId: string) {
  const user = await db.table("users").findOne({ id: userId });
  if (!user) return null;
  
  const posts = await db.table("posts").find(
    { authorId: userId },
    { sort: { createdAt: "desc" } }
  );
  
  return { ...user, posts };
}
```

## Schema Definition

Define table schemas with types:

```typescript
import { defineTable, z } from "@fiyuu/db";

const UserTable = defineTable("users", {
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  age: z.number().optional(),
  active: z.boolean().default(true),
  createdAt: z.string().datetime(),
});

// Type-safe table access
type User = z.infer<typeof UserTable>;

const users = db.table<User>("users");
const user = await users.findOne({ id: "123" });  // Typed as User | null
```

## Configuration

### Database Location

```typescript
// fiyuu.config.ts
export default {
  database: {
    path: "./data/app.db",     // SQLite file location
    wal: true,                  // Write-Ahead Logging
    cacheSize: 10000,           // Page cache size
  },
};
```

### Connection Pool

```typescript
export default {
  database: {
    pool: {
      min: 2,
      max: 10,
    },
  },
};
```

## Best Practices

1. **Use transactions** for multi-step operations
2. **Index frequently queried fields**
3. **Use migrations** for schema changes
4. **Sanitize inputs** with parameterized queries
5. **Keep migrations reversible** (down function)

## Performance Tips

```typescript
// Use indexes for WHERE clauses
await db.table("users").createIndex("email");

// Limit results
const users = await db.table("users").find({}, { limit: 20 });

// Select only needed fields
const users = await db.table("users").find({}, { 
  projection: { id: 1, name: 1 } 
});

// Batch inserts
await db.transaction(async (tx) => {
  for (const user of users) {
    await tx.table("users").insert(user);
  }
});
```

## Next Steps

- Learn about [Decorators](./decorators.md) for repository pattern
- Explore [Real-Time](./realtime.md) channels
- Read the [HTTP Exceptions](./http-exceptions.md) guide
