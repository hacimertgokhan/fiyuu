# Routing

Fiyuu uses file-based routing with intuitive conventions. The file system is your router.

## Basic Routing

### Static Routes

Create folders with `page.tsx` files:

```
app/
├── page.tsx              → /
├── about/
│   └── page.tsx          → /about
├── contact/
│   └── page.tsx          → /contact
└── team/
    └── page.tsx          → /team
```

### Index Routes

The `page.tsx` in a folder serves the index of that path:

```
app/blog/page.tsx         → /blog
app/blog/tips/page.tsx    → /blog/tips
```

## Dynamic Routes

Use square brackets for dynamic segments:

```
app/blog/[slug]/page.tsx       → /blog/hello-world
app/users/[id]/page.tsx        → /users/123
```

Access params in query/page:

```typescript
// app/blog/[slug]/query.ts
export async function execute({ params }: { params: { slug: string } }) {
  const post = await db.query("SELECT * FROM posts WHERE slug = ?", [params.slug]);
  return { post };
}
```

### Multiple Dynamic Segments

```
app/[category]/[product]/page.tsx  → /electronics/iphone-15
```

```typescript
// Access both params
const { category, product } = params;
```

## Catch-All Routes

Three dots for catch-all (rest) parameters:

```
app/docs/[...path]/page.tsx     → /docs/a/b/c/d
```

Access as array:

```typescript
const path = params.path;  // ['a', 'b', 'c', 'd']

// Reconstruct full path
const fullPath = params.path.join('/');  // 'a/b/c/d'
```

Use cases:
- Documentation sites
- File browsers
- Multi-level categories

## Optional Catch-All

Double brackets for optional catch-all:

```
app/[[...slug]]/page.tsx        → / or /about or /about/team
```

The route matches:
- `/`
- `/about`
- `/about/team`

```typescript
// slug may be undefined
const path = params.slug;  // undefined or ['about', 'team']
```

## Route Priority

Routes are matched in order of specificity:

1. **Exact matches** first
2. **Dynamic segments** (`[id]`)
3. **Catch-all** (`[...path]`)
4. **Optional catch-all** (`[[...path]]`)

Example:

```
app/blog/
├── page.tsx              → /blog (exact)
├── [slug]/page.tsx       → /blog/hello (dynamic)
└── [...path]/page.tsx    → /blog/a/b/c (catch-all)
```

`/blog` → exact match
`/blog/hello` → dynamic segment
`/blog/2024/jan/post` → catch-all

## Layout Routes

Layouts wrap child routes:

```
app/
├── layout.tsx            # Root layout (wraps everything)
├── page.tsx              → /
├── about/
│   ├── layout.tsx        # About layout (wraps about/*)
│   ├── page.tsx          → /about
│   └── team/
│       └── page.tsx      → /about/team
```

### Root Layout

```typescript
// app/layout.tsx
import { Component } from "@geajs/core";
import { html, type LayoutProps } from "@fiyuu/core/client";

export default class RootLayout extends Component<LayoutProps> {
  template({ children }: LayoutProps) {
    return html`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width">
          <title>Fiyuu App</title>
        </head>
        <body>
          <nav>Main Navigation</nav>
          <main>${children}</main>
          <footer>Footer</footer>
        </body>
      </html>
    `;
  }
}
```

### Nested Layouts

```typescript
// app/dashboard/layout.tsx
export default class DashboardLayout extends Component<LayoutProps> {
  template({ children }: LayoutProps) {
    return html`
      <div style="display: flex;">
        <aside>Sidebar</aside>
        <div style="flex: 1;">${children}</div>
      </div>
    `;
  }
}
```

### Layout Hierarchy

```
/layout.tsx
  └── /dashboard/layout.tsx
        └── /dashboard/settings/page.tsx
```

Final HTML structure:
```html
<html>
  <body>
    <nav>Main Navigation</nav>
    <main>
      <div style="display: flex;">
        <aside>Sidebar</aside>
        <div>Settings Page Content</div>
      </div>
    </main>
    <footer>Footer</footer>
  </body>
</html>
```

## API Routes

Create REST API endpoints with `route.ts`:

```
app/api/
├── users/
│   └── route.ts          → /api/users (GET, POST, PUT, DELETE)
├── users/[id]/
│   └── route.ts          → /api/users/123
└── health/
    └── route.ts          → /api/health
```

### REST Handler

```typescript
// app/api/users/route.ts
import { db } from "@fiyuu/db";

// GET /api/users
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  
  const users = await db.query("SELECT * FROM users LIMIT 20 OFFSET ?", [
    (page - 1) * 20
  ]);
  
  return Response.json({ users, page });
}

// POST /api/users
export async function POST(request: Request) {
  const body = await request.json();
  
  // Validate
  if (!body.name || !body.email) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }
  
  const id = crypto.randomUUID();
  await db.query(
    "INSERT INTO users (id, name, email) VALUES (?, ?, ?)",
    [id, body.name, body.email]
  );
  
  return Response.json({ id, name: body.name, email: body.email }, { status: 201 });
}

// PUT /api/users
export async function PUT(request: Request) {
  const body = await request.json();
  // ... update logic
  return Response.json({ success: true });
}

// DELETE /api/users
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  
  await db.query("DELETE FROM users WHERE id = ?", [id]);
  return Response.json({ success: true });
}
```

### Dynamic API Routes

```typescript
// app/api/users/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const [user] = await db.query("SELECT * FROM users WHERE id = ?", [params.id]);
  
  if (!user) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  
  return Response.json(user);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  await db.query(
    "UPDATE users SET name = ?, email = ? WHERE id = ?",
    [body.name, body.email, params.id]
  );
  return Response.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  await db.query("DELETE FROM users WHERE id = ?", [params.id]);
  return Response.json({ success: true });
}
```

## Error Handling

### 404 Not Found

Create `not-found.tsx`:

```typescript
// app/not-found.tsx
import { Component } from "@geajs/core";
import { html } from "@fiyuu/core/client";

export default class NotFound extends Component {
  template() {
    return html`
      <div style="text-align: center; padding: 100px 20px;">
        <h1 style="font-size: 72px; margin: 0;">404</h1>
        <p style="font-size: 20px; color: #666;">Page not found</p>
        <a href="/" style="color: #007bff;">Go Home</a>
      </div>
    `;
  }
}
```

### Error Boundaries

Create `error.tsx`:

```typescript
// app/error.tsx
import { Component } from "@geajs/core";
import { html } from "@fiyuu/core/client";

export default class ErrorBoundary extends Component<{ error: Error }> {
  template({ error }: { error: Error }) {
    return html`
      <div style="padding: 40px; background: #fee; border: 1px solid #fcc;">
        <h2 style="color: #c00;">Something went wrong</h2>
        <pre style="overflow: auto; padding: 16px; background: #fff;">${error.message}</pre>
      </div>
    `;
  }
}
```

## Route Groups

Use parentheses for route groups (don't affect URL):

```
app/
├── (marketing)/
│   ├── page.tsx          → /
│   ├── about/
│   │   └── page.tsx      → /about
│   └── layout.tsx        # Marketing layout
├── (shop)/
│   ├── products/
│   │   └── page.tsx      → /products
│   └── layout.tsx        # Shop layout
```

Useful for:
- Different layouts for different sections
- Organizing routes without changing URLs
- A/B testing different page versions

## Parallel Routes

Use `@folder` for parallel routes (advanced):

```
app/
├── @sidebar/
│   └── page.tsx
├── @main/
│   └── page.tsx
└── layout.tsx            # Renders children, sidebar, and main
```

## Route Middleware

Apply middleware to routes:

```typescript
// app/middleware.ts (or in specific routes)
import { defineMiddleware } from "@fiyuu/core";

export const middleware = defineMiddleware({
  // Run before route
  async before(request: Request) {
    // Check auth
    const token = request.headers.get("authorization");
    if (!token) {
      return new Response("Unauthorized", { status: 401 });
    }
    
    // Add to context
    return { user: await verifyToken(token) };
  },
  
  // Run after route
  async after(response: Response) {
    // Add headers
    response.headers.set("X-Custom-Header", "value");
    return response;
  },
});
```

## Route Config

### Base Path

Set base path in `fiyuu.config.ts`:

```typescript
export default {
  app: {
    basePath: "/app",  // All routes prefixed with /app
  },
};
```

Now:
- `app/page.tsx` → `/app/`
- `app/about/page.tsx` → `/app/about`

## Best Practices

1. **Use descriptive names** for dynamic segments: `[userId]` not `[id]`
2. **Limit nesting** to 3-4 levels deep
3. **Use API routes** for data mutations
4. **404 page** at root catches all unmatched routes
5. **Route groups** for different layouts

## Common Patterns

### Blog with Categories

```
app/blog/
├── page.tsx                    → /blog (all posts)
├── [slug]/page.tsx             → /blog/hello-world (single post)
├── category/
│   └── [category]/
│       └── page.tsx            → /blog/category/tech
└── author/
    └── [author]/
        └── page.tsx            → /blog/author/john
```

### E-commerce

```
app/
├── products/
│   ├── page.tsx                → /products (listing)
│   └── [id]/page.tsx           → /products/123 (detail)
├── categories/
│   └── [...path]/page.tsx      → /categories/electronics/phones
├── cart/
│   └── page.tsx
└── checkout/
    └── page.tsx
```

### Dashboard

```
app/dashboard/
├── layout.tsx                  # Dashboard layout with sidebar
├── page.tsx                    → /dashboard
├── users/
│   ├── page.tsx                → /dashboard/users
│   └── [id]/page.tsx           → /dashboard/users/123
├── settings/
│   └── page.tsx                → /dashboard/settings
└── api/
    └── stats/route.ts          → /dashboard/api/stats
```

## Debugging Routes

Run `fiyuu sync` to see all routes:

```bash
fiyuu sync
cat .fiyuu/PATHS.md
```

Or use the graph command:

```bash
fiyuu graph stats
```

## Next Steps

- Learn about [Rendering Modes](./rendering-modes.md)
- Explore [Meta Configuration](./meta-configuration.md)
- Read the [File Contracts](./file-contracts.md) guide
