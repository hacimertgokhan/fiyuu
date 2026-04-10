# Fiyuu Backend Skill

## Overview

Fiyuu'nun backend sistemi intent-based programming prensibiyle çalışır. File-based routing, otomatik API generation ve type-safe endpoints sunar.

## Quick Start

```typescript
// app/api/users/page.ts → Route: /api/users
import { definePage, html } from "@fiyuu/core";

export default definePage({
  load: () => db.users.all(),
  render: ({ data }) => html`<ul>${data.map(u => html`<li>${u.name}</li>`)}</ul>`,
});
```

## API Endpoints

### Basic API

```typescript
// app/api/users.ts → POST /api/users
import { defineApi } from "@fiyuu/core";
import { z } from "zod";

export default defineApi({
  method: "POST",
  input: {
    body: z.object({ name: z.string(), email: z.string().email() }),
  },
  handler: async ({ body }) => {
    const user = await db.users.create(body);
    return { success: true, user };
  },
});
```

### File-Based Routing

```
app/api/
├── users.ts           → /api/users
├── users/[id].ts      → /api/users/:id
├── posts/
│   ├── index.ts       → /api/posts
│   └── [slug].ts      → /api/posts/:slug
└── graphql.ts         → /api/graphql
```

## Server Actions

```typescript
// app/users/action.ts
import { defineAction } from "@fiyuu/core";

export default defineAction({
  name: "createUser",
  fields: {
    name: { type: "text", required: true },
    email: { type: "email", required: true },
  },
  handler: async (data) => {
    const user = await db.users.create(data);
    return { success: true, data: user };
  },
  redirect: "/users",
});
```

## Middleware

```typescript
// middleware.ts (root)
import { defineMiddleware } from "@fiyuu/core";

export default defineMiddleware({
  pattern: "/api/*",
  handler: async (ctx, next) => {
    // Auth check
    if (!ctx.headers.authorization) {
      return { status: 401, body: { error: "Unauthorized" } };
    }
    return next();
  },
});
```

## Error Handling

```typescript
import { defineApi, HttpError } from "@fiyuu/core";

export default defineApi({
  handler: async () => {
    const user = await db.users.find("123");
    if (!user) {
      throw new HttpError(404, "User not found");
    }
    return user;
  },
});
```

## Best Practices

1. **Validation**: Her zaman Zod schema kullan
2. **Error Boundaries**: API'lerde error boundary kullan
3. **Caching**: Sık erişilen data'yı memoize et
4. **Rate Limiting**: Public API'lere rate limit ekle

## Advanced

### Custom Decorators

```typescript
import { Controller, Get, Post, Body } from "@fiyuu/core/decorators";

@Controller("/users")
class UserController {
  @Get()
  async list() {
    return db.users.all();
  }
  
  @Post()
  async create(@Body() data: CreateUserDto) {
    return db.users.create(data);
  }
}
```

### Webhooks

```typescript
// app/api/webhooks/stripe.ts
export default defineApi({
  method: "POST",
  handler: async ({ body, headers }) => {
    const sig = headers["stripe-signature"];
    // Verify and process webhook
    return { received: true };
  },
});
```
