# Fiyuu Database Skill

## Overview

Fiyuu, F1 Database adını verdiği, SQLite tabanlı, zero-config bir database sistemi sunar. SQL-like API, otomatik migrations ve relations desteği içerir.

## Quick Start

```typescript
import { db } from "@fiyuu/db";

// Define schema
const users = db.table("users", {
  id: db.uuid().primaryKey(),
  name: db.string(),
  email: db.string().unique(),
  createdAt: db.timestamp().defaultNow(),
});

// CRUD Operations
const user = await users.create({ name: "Ahmet", email: "ahmet@example.com" });
const allUsers = await users.findMany();
const oneUser = await users.findUnique({ where: { id: "123" } });
await users.update({ where: { id: "123" }, data: { name: "Mehmet" } });
await users.delete({ where: { id: "123" } });
```

## Schema Definition

### Types

```typescript
import { db } from "@fiyuu/db";

const schema = {
  // Strings
  name: db.string(),                    // TEXT
  email: db.string().unique(),          // TEXT UNIQUE
  bio: db.text(),                       // TEXT (long)
  
  // Numbers
  age: db.integer(),                    // INTEGER
  price: db.real(),                     // REAL (float)
  
  // Boolean
  active: db.boolean(),                 // INTEGER (0/1)
  
  // Date/Time
  createdAt: db.timestamp(),            // INTEGER (unix ms)
  
  // IDs
  id: db.uuid(),                        // TEXT UUID
  serial: db.serial(),                  // INTEGER AUTOINCREMENT
  
  // JSON
  metadata: db.json(),                  // TEXT (JSON)
  
  // Enums
  role: db.enum(["user", "admin"]),     // TEXT CHECK
};
```

### Relations

```typescript
// One-to-Many
const users = db.table("users", {
  id: db.uuid().primaryKey(),
  name: db.string(),
});

const posts = db.table("posts", {
  id: db.uuid().primaryKey(),
  title: db.string(),
  authorId: db.string().references("users.id"), // Foreign key
});

// Query with relation
const userWithPosts = await users.findUnique({
  where: { id: "123" },
  include: { posts: true },
});
```

## Querying

### Basic Queries

```typescript
// Find one
const user = await users.findUnique({ where: { id: "123" } });
const byEmail = await users.findUnique({ where: { email: "test@example.com" } });

// Find many
const allUsers = await users.findMany();
const activeUsers = await users.findMany({ where: { active: true } });

// Pagination
const page = await users.findMany({
  take: 10,
  skip: 20,
  orderBy: { createdAt: "desc" },
});
```

### Filters

```typescript
// Comparison
const adults = await users.findMany({ where: { age: { gte: 18 } } });
const recent = await users.findMany({ where: { createdAt: { gt: lastWeek } } });

// String
const search = await users.findMany({
  where: { name: { contains: "ahmet", mode: "insensitive" } },
});

// Logical
const result = await users.findMany({
  where: {
    AND: [
      { active: true },
      { OR: [{ role: "admin" }, { role: "moderator" }] },
    ],
  },
});
```

### Aggregations

```typescript
const stats = await users.aggregate({
  where: { active: true },
  _count: true,
  _avg: { age: true },
  _sum: { points: true },
  _max: { createdAt: true },
});
```

## Transactions

```typescript
import { db } from "@fiyuu/db";

const result = await db.transaction(async (tx) => {
  const user = await tx.users.create({ data: { name: "Ahmet" } });
  const post = await tx.posts.create({
    data: { title: "Hello", authorId: user.id },
  });
  return { user, post };
});
// Transaction otomatik commit/rollback
```

## Migrations

### Auto Migration

```bash
# Schema değişikliklerini otomatik uygula
$ fiyuu db migrate
```

### Manual Migration

```typescript
// migrations/001_add_bio.ts
export default {
  up: async (db) => {
    await db.alterTable("users", (table) => {
      table.addColumn("bio", db.text());
    });
  },
  down: async (db) => {
    await db.alterTable("users", (table) => {
      table.dropColumn("bio");
    });
  },
};
```

## Raw SQL

```typescript
// Raw query
const results = await db.$queryRaw`
  SELECT * FROM users 
  WHERE age > ${minAge} 
  ORDER BY created_at DESC
`;

// Raw execute
await db.$executeRaw`UPDATE users SET active = 1 WHERE id = ${userId}`;
```

## Best Practices

1. **Indexing**: Sık sorgulanan alanlara index ekle
   ```typescript
   email: db.string().index()
   ```

2. **Timestamps**: Her tabloda createdAt/updatedAt olsun
   ```typescript
   createdAt: db.timestamp().defaultNow(),
   updatedAt: db.timestamp().autoUpdate(),
   ```

3. **Soft Delete**: Veriyi silme, flag'le
   ```typescript
   deletedAt: db.timestamp().nullable(),
   ```

4. **Constraints**: Validasyon database seviyesinde
   ```typescript
   email: db.string().unique().notNull(),
   ```
