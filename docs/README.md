# Fiyuu Documentation

Welcome to the comprehensive Fiyuu framework documentation. Fiyuu is an AI-native fullstack framework with deterministic file contracts, built-in database, real-time communication, and enterprise-grade patterns.

## Quick Navigation

### 🚀 Getting Started
- [Installation](./getting-started/installation.md) - Setup your first Fiyuu project
- [Project Structure](./getting-started/project-structure.md) - Understand the file contracts
- [First Application](./getting-started/first-app.md) - Build your first app step-by-step

### 📚 Core Concepts
- [File Contracts](./core-concepts/file-contracts.md) - page, query, action, schema, meta
- [Routing](./core-concepts/routing.md) - Static, dynamic, and API routes
- [Rendering Modes](./core-concepts/rendering-modes.md) - SSR, CSR, SSG, ISR explained
- [Meta Configuration](./core-concepts/meta-configuration.md) - SEO and route config

### 📖 API Reference
- [Decorators](./api-reference/decorators.md) - @Controller, @Service, @Repository, @Guard
- [Database](./api-reference/database.md) - F1 Database complete API
- [Real-Time](./api-reference/realtime.md) - WebSocket and NATS channels
- [Components](./api-reference/components.md) - FiyuuImage, FiyuuVideo, FiyuuHead
- [HTTP Exceptions](./api-reference/http-exceptions.md) - Error handling

### 🛠️ Guides
- [Authentication](./guides/authentication.md) - JWT and Guards implementation
- [CRUD Operations](./guides/crud-operations.md) - Complete REST API tutorial
- [Background Services](./guides/background-services.md) - Cron jobs and workers
- [Real-Time Chat](./guides/real-time-chat.md) - WebSocket implementation
- [File Uploads](./guides/file-uploads.md) - Handling multipart data
- [Deployment](./guides/deployment.md) - Docker, PM2, and VPS deployment

### 💡 Examples
- [Blog API](./examples/blog-api.md) - Content management API
- [E-Commerce](./examples/e-commerce.md) - Product catalog and orders
- [SaaS Dashboard](./examples/saas-dashboard.md) - Multi-tenant application

## What is Fiyuu?

Fiyuu is a **Gea-first fullstack framework** designed for AI-assisted development. It enforces deterministic file contracts that make your codebase predictable and machine-readable.

### Key Features

- **AI-Native Context**: Auto-generate project graphs with `fiyuu sync`
- **Deterministic Contracts**: Fixed file structure (page, query, action, schema, meta)
- **Spring Boot Style**: Enterprise patterns with decorators (@Controller, @Service, @Repository)
- **Built-in Database**: F1 Database with SQL-like API, transactions, migrations
- **Real-Time**: WebSocket and NATS channels built-in
- **Always-Alive Services**: Background jobs and schedulers
- **Type-Safe**: Zod validation with automatic type inference

## Quick Start

```bash
# Create a new project
npm create fiyuu-app@latest my-app

# Navigate and install
cd my-app
npm install

# Start development
npm run dev
```

Your app is live at `http://localhost:4050`.

## Example: Complete Route

```typescript
// app/users/schema.ts
import { defineQuery, z } from "@fiyuu/core";

export const query = defineQuery({
  input: z.object({ page: z.number().default(1) }),
  output: z.object({
    users: z.array(z.object({ id: z.string(), name: z.string() })),
    total: z.number(),
  }),
  description: "List users with pagination",
});
```

```typescript
// app/users/query.ts
import { query } from "./schema.js";

export async function execute({ input }) {
  const users = await db.query("SELECT * FROM users LIMIT 20 OFFSET ?", [
    (input.page - 1) * 20,
  ]);
  return { users, total: users.length };
}
```

```typescript
// app/users/page.tsx
import { Component } from "@geajs/core";
import { html, type PageProps } from "@fiyuu/core/client";
import type { query } from "./query.js";

type PageData = Awaited<ReturnType<typeof execute>>;

export default class UsersPage extends Component<PageProps<PageData>> {
  template({ data }: PageProps<PageData>) {
    return html`
      <h1>Users</h1>
      <ul>
        ${data.users.map(u => html`<li>${u.name}</li>`).join("")}
      </ul>
    `;
  }
}
```

## CLI Commands

```bash
fiyuu dev              # Start development server
fiyuu build            # Production build
fiyuu start            # Run production server
fiyuu sync             # Generate AI docs and project graph
fiyuu doctor           # Validate project structure
fiyuu doctor --fix     # Auto-fix common issues
```

## Need Help?

- Run `fiyuu doctor` for project health checks
- Check [Troubleshooting](./getting-started/installation.md#troubleshooting)
- Join discussions on [GitHub](https://github.com/hacimertgokhan/fiyuu)

## License

MIT © Hacı Mert Gökhan
