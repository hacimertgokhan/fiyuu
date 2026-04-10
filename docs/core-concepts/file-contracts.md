# File Contracts

Fiyuu's core innovation is deterministic file contracts. Every route follows the same immutable structure, making your codebase predictable for both developers and AI tools.

## The Contract System

Each route consists of exactly 5 possible files:

| File | Purpose | Runs On |
|------|---------|---------|
| `page.tsx` | UI component | Server (SSR) or Browser (CSR) |
| `query.ts` | Data fetching | Server only |
| `action.ts` | Mutations | Server only |
| `schema.ts` | Type contracts | Build time |
| `meta.ts` | Configuration | Build time |

This structure is **enforced by convention**. There's no configuration needed—the file structure itself declares intent.

## page.tsx - The View

The UI component rendered for the route. Uses Gea components (lightweight JSX alternative).

```typescript
import { Component } from "@geajs/core";
import { html, type PageProps } from "@fiyuu/core/client";
import type { query } from "./query.js";

type PageData = Awaited<ReturnType<typeof query.execute>>;

export default class UserListPage extends Component<PageProps<PageData>> {
  template({ data }: PageProps<PageData>) {
    return html`
      <main>
        <h1>Users</h1>
        <ul>
          ${data.users.map(user => html`
            <li>${user.name}</li>
          `).join("")}
        </ul>
      </main>
    `;
  }
}
```

### Key Points

- Must export a default class extending `Component`
- `template()` method returns HTML string
- `data` comes from `query.ts` execute function
- Full TypeScript support with inferred types

### Functional Components

You can also use functions:

```typescript
import { html } from "@fiyuu/core/client";

export default function UserPage({ data }: PageProps<PageData>) {
  return html`<h1>Hello ${data.name}</h1>`;
}
```

## query.ts - Data Fetching

Server-side data fetching with automatic caching and type inference.

```typescript
import { query } from "./schema.js";
import { db } from "@fiyuu/db";

// Re-export the schema for type inference
export { query };

// The execute function runs on the server
export async function execute({ input }: { input: typeof query._input }) {
  // Database query
  const users = await db.query(
    "SELECT * FROM users LIMIT ? OFFSET ?",
    [input.limit, (input.page - 1) * input.limit]
  );

  // Return must match schema output type
  return { 
    users,
    total: users.length 
  };
}
```

### Key Points

- `execute()` runs **only on the server**
- Input is automatically validated against schema
- Output is validated before being sent to client
- Return type is inferred for the page component

### Input Parameters

Access query parameters:

```typescript
export async function execute({ input, request }: ExecuteContext) {
  // Access URL params
  const url = new URL(request.url);
  const search = url.searchParams.get("q");
  
  // Input contains validated params from schema
  console.log(input.page);
  
  return { items: [] };
}
```

## action.ts - Mutations

Handle form submissions, API mutations, and state changes.

```typescript
import { createAction, updateAction, deleteAction } from "./schema.js";
import { db } from "@fiyuu/db";

export { createAction, updateAction, deleteAction };

export async function createUser({ input }: { input: typeof createAction._input }) {
  const id = crypto.randomUUID();
  
  await db.query(
    "INSERT INTO users (id, name, email) VALUES (?, ?, ?)",
    [id, input.name, input.email]
  );

  return { 
    success: true, 
    user: { id, name: input.name, email: input.email }
  };
}

export async function updateUser({ input }: { input: typeof updateAction._input }) {
  await db.query(
    "UPDATE users SET name = ?, email = ? WHERE id = ?",
    [input.name, input.email, input.id]
  );

  return { success: true };
}

export async function deleteUser({ input }: { input: typeof deleteAction._input }) {
  await db.query("DELETE FROM users WHERE id = ?", [input.id]);
  return { success: true };
}
```

### Key Points

- Multiple actions per route
- Each action has its own schema
- Automatic input validation
- Return success/error responses

## schema.ts - Type Contracts

Define once, use everywhere. Zod schemas provide validation and TypeScript types.

```typescript
import { defineQuery, defineAction, z } from "@fiyuu/core";

// Shared types
export const UserSchema = z.object({
  id: z.string(),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  role: z.enum(["admin", "user", "guest"]).default("user"),
  createdAt: z.string().datetime(),
});

// Query schema
export const query = defineQuery({
  input: z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(20),
    search: z.string().optional(),
  }),
  output: z.object({
    users: z.array(UserSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  }),
  description: "List users with pagination and optional search",
});

// Action schemas
export const createAction = defineAction({
  input: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
  }),
  output: z.object({
    success: z.boolean(),
    user: UserSchema.optional(),
    error: z.string().optional(),
  }),
  description: "Create a new user",
});

export const updateAction = defineAction({
  input: z.object({
    id: z.string(),
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
  }),
  output: z.object({
    success: z.boolean(),
    user: UserSchema.optional(),
  }),
  description: "Update an existing user",
});

export const deleteAction = defineAction({
  input: z.object({
    id: z.string(),
  }),
  output: z.object({
    success: z.boolean(),
  }),
  description: "Delete a user",
});
```

### Key Points

- Zod provides runtime validation
- TypeScript types are inferred automatically
- `description` is used for AI documentation
- Reusable schema fragments (UserSchema)

### Validation Rules

Common Zod validators:

```typescript
z.string().min(5).max(100);        // Length
z.string().email();                 // Email format
z.string().url();                   // URL format
z.string().regex(/^[a-z]+$/);       // Regex
z.number().int().positive();        // Integers
z.number().min(0).max(100);         // Range
z.boolean().default(false);         // Defaults
z.enum(["a", "b", "c"]);            // Enums
z.array(ItemSchema);                // Arrays
z.object({}).optional();            // Optional
z.union([A, B]);                    // Unions
```

## meta.ts - Configuration

Route metadata including SEO, rendering mode, and AI intent.

```typescript
import { defineMeta } from "@fiyuu/core/client";

export default defineMeta({
  // Required: What this route does (for AI context)
  intent: "User management page - lists, creates, and edits users",
  
  // Rendering mode
  render: "ssr",  // "ssr" | "csr" | "ssg"
  
  // ISR: Regenerate SSG page every N seconds (SSG only)
  revalidate: 300,  // 5 minutes
  
  // SEO configuration
  seo: {
    title: "User Management - Admin Dashboard",
    description: "Manage users, roles, and permissions",
    keywords: ["users", "admin", "dashboard"],
    
    // Open Graph
    og: {
      title: "User Management",
      description: "Manage your team",
      image: "/og-users.jpg",
      type: "website",
    },
    
    // Twitter Card
    twitter: {
      card: "summary_large_image",
      title: "User Management",
      image: "/twitter-users.jpg",
    },
    
    // Structured data
    structuredData: {
      "@type": "WebPage",
      name: "User Management",
      description: "Manage users and roles",
    },
  },
  
  // Route-specific feature flags
  features: {
    websocket: true,
    auth: true,
  },
});
```

### Key Points

- `intent` is crucial for AI understanding
- `render` controls SSR/CSR/SSG
- `revalidate` enables ISR for SSG
- All SEO fields are optional

## Putting It All Together

A complete route with all 5 files:

```
app/users/
├── page.tsx      → Renders user list
├── query.ts      → Fetches users from DB
├── action.ts     → Handles create/update/delete
├── schema.ts     → Defines all types
└── meta.ts       → SEO and configuration
```

Data flow:

1. Request hits `/users`
2. `meta.ts` determines rendering mode
3. `query.ts` fetches data (validated by `schema.ts`)
4. `page.tsx` renders with data
5. Form POSTs trigger `action.ts` mutations

## Optional Files

Not every route needs all 5 files:

| Route Type | Required Files |
|------------|----------------|
| Static page | `page.tsx`, `meta.ts` |
| Data page | `page.tsx`, `query.ts`, `schema.ts` |
| Full CRUD | All 5 files |
| API only | `route.ts` (in `api/` folder) |

## Best Practices

1. **Always write `intent`** - Helps AI understand your code
2. **Share schemas** - Reuse schema fragments across routes
3. **Validate everything** - Use Zod for all inputs
4. **Keep pages dumb** - Business logic in services, not pages
5. **Use descriptive names** - Clear schema descriptions

## Common Patterns

### Shared Schema Directory

```
app/
├── lib/
│   └── schemas/
│       ├── user.ts
│       └── post.ts
├── users/
│   └── schema.ts  → imports from lib/schemas
```

### API Routes

For REST APIs without pages:

```typescript
// app/api/users/route.ts
export async function GET() {
  const users = await db.query("SELECT * FROM users");
  return Response.json(users);
}

export async function POST(request: Request) {
  const body = await request.json();
  // ... create user
  return Response.json({ id }, { status: 201 });
}
```

## Next Steps

- Learn about [Routing](./routing.md) patterns
- Understand [Rendering Modes](./rendering-modes.md)
- Explore [Meta Configuration](./meta-configuration.md)
