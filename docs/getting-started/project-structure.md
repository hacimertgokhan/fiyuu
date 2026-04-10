# Project Structure

Fiyuu uses a deterministic file contract system. Every route follows the same predictable structure.

## The 5-File Contract

Each route in Fiyuu consists of up to 5 files with specific purposes:

```
app/
├── page.tsx          # What the user sees (Gea component)
├── query.ts          # How data is fetched (server-side)
├── action.ts         # What the user can do (server mutations)
├── schema.ts         # The contract (Zod types)
└── meta.ts           # Route metadata (SEO, render mode)
```

This structure is **immutable** and **predictable**. Every route follows the same pattern.

## Complete Project Structure

```
my-app/
├── app/                      # Application routes
│   ├── layout.tsx           # Root layout (wraps all pages)
│   ├── layout.meta.ts       # Layout metadata
│   ├── meta.ts              # Root page metadata
│   ├── page.tsx             # Home page (/)
│   ├── query.ts             # Home page data
│   ├── schema.ts            # Home page schema
│   ├── not-found.tsx        # 404 page
│   ├── error.tsx            # Error boundary
│   │
│   ├── about/               # Static route (/about)
│   │   ├── page.tsx
│   │   └── meta.ts
│   │
│   ├── blog/                # Route with data (/blog)
│   │   ├── page.tsx
│   │   ├── query.ts
│   │   ├── schema.ts
│   │   └── meta.ts
│   │
│   ├── blog/[slug]/         # Dynamic route (/blog/hello-world)
│   │   ├── page.tsx
│   │   ├── query.ts
│   │   └── schema.ts
│   │
│   ├── docs/[...path]/      # Catch-all route (/docs/a/b/c)
│   │   ├── page.tsx
│   │   └── query.ts
│   │
│   ├── api/                 # API routes
│   │   ├── health/
│   │   │   └── route.ts     # GET /api/health
│   │   └── users/
│   │       └── route.ts     # REST endpoints
│   │
│   └── services/            # Background services
│       └── email.service.ts
│
├── .fiyuu/                   # Generated files (don't edit)
│   ├── graph.json           # Project graph
│   ├── PROJECT.md           # AI project description
│   ├── PATHS.md             # Route documentation
│   ├── FEATURES.md          # Feature breakdown
│   ├── EXECUTION.md         # Safe change guide
│   ├── WARNINGS.md          # Anti-patterns
│   ├── client/              # Built client assets
│   └── server/              # Built server assets
│
├── data/                     # Static data files
│   └── seed.json
│
├── fiyuu.config.ts          # Framework configuration
├── package.json
├── tsconfig.json
└── Dockerfile               # Optional: container config
```

## File Types Explained

### page.tsx

The UI component rendered for the route. Uses Gea (JSX-like) components.

```typescript
import { Component } from "@geajs/core";
import { html, type PageProps } from "@fiyuu/core/client";
import type { query } from "./query.js";

type PageData = Awaited<ReturnType<typeof query.execute>>;

export default class MyPage extends Component<PageProps<PageData>> {
  template({ data }: PageProps<PageData>) {
    return html`
      <main>
        <h1>${data.title}</h1>
      </main>
    `;
  }
}
```

### query.ts

Server-side data fetching. Runs only on the server.

```typescript
import { query } from "./schema.js";
import { db } from "@fiyuu/db";

export { query };

export async function execute({ input }: { input: typeof query._input }) {
  const items = await db.query("SELECT * FROM items LIMIT ? OFFSET ?", [
    input.limit,
    (input.page - 1) * input.limit,
  ]);
  
  return { items, page: input.page };
}
```

### action.ts

Server mutations for form submissions or API calls.

```typescript
import { action } from "./schema.js";
import { db } from "@fiyuu/db";

export { action };

export async function execute({ input }: { input: typeof action._input }) {
  const result = await db.query(
    "INSERT INTO users (name, email) VALUES (?, ?)",
    [input.name, input.email]
  );
  
  return { success: true, userId: result.insertId };
}
```

### schema.ts

Zod schemas defining input/output types and validation.

```typescript
import { defineQuery, defineAction, z } from "@fiyuu/core";

export const query = defineQuery({
  input: z.object({
    page: z.number().default(1),
    limit: z.number().max(100).default(20),
  }),
  output: z.object({
    items: z.array(z.object({ id: z.string(), name: z.string() })),
    page: z.number(),
  }),
  description: "List items with pagination",
});

export const action = defineAction({
  input: z.object({
    name: z.string().min(2),
    email: z.string().email(),
  }),
  output: z.object({
    success: z.boolean(),
    userId: z.string().optional(),
  }),
  description: "Create a new user",
});
```

### meta.ts

Route metadata including SEO and rendering configuration.

```typescript
import { defineMeta } from "@fiyuu/core/client";

export default defineMeta({
  intent: "User list page - displays paginated users",
  render: "ssr",  // ssr | csr | ssg
  revalidate: 300,  // ISR: revalidate every 5 minutes (SSG only)
  seo: {
    title: "Users - My App",
    description: "Browse all users in the system",
    keywords: ["users", "directory"],
    og: {
      title: "User Directory",
      image: "/og-users.jpg",
    },
  },
});
```

### layout.tsx

Wraps child routes. Can be nested.

```typescript
import { Component } from "@geajs/core";
import { html, type LayoutProps } from "@fiyuu/core/client";

export default class RootLayout extends Component<LayoutProps> {
  template({ children }: LayoutProps) {
    return html`
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width" />
        </head>
        <body>
          <nav>Navigation</nav>
          <main>${children}</main>
          <footer>Footer</footer>
        </body>
      </html>
    `;
  }
}
```

## Route Conventions

### Static Routes

```
app/about/page.tsx       → /about
app/contact/page.tsx     → /contact
```

### Dynamic Routes

```
app/blog/[slug]/page.tsx        → /blog/hello-world
app/users/[id]/page.tsx         → /users/123
```

Multiple segments:
```
app/[category]/[product]/page.tsx  → /electronics/iphone-15
```

### Catch-All Routes

```
app/docs/[...path]/page.tsx     → /docs/a/b/c/d
```

Access params as array:
```typescript
const path = params.path;  // ['a', 'b', 'c', 'd']
```

### Optional Catch-All

```
app/[[...slug]]/page.tsx        → / or /about or /about/team
```

### API Routes

```
app/api/users/route.ts          → /api/users (all HTTP methods)
```

## The .fiyuu Directory

This directory is auto-generated. **Never edit files here directly.**

Run `fiyuu sync` to regenerate:

```bash
fiyuu sync
```

Generated files include:
- **graph.json**: Complete route graph for AI tools
- **PROJECT.md**: What this project does
- **PATHS.md**: Every route and its purpose
- **FEATURES.md**: Feature-by-feature breakdown
- **EXECUTION.md**: How to safely make changes
- **WARNINGS.md**: Anti-patterns and issues

## Next Steps

- Build your [First Application](./first-app.md)
- Learn about [File Contracts](../core-concepts/file-contracts.md) in depth
- Understand [Routing](../core-concepts/routing.md) patterns
