<p align="center">
  <img src="https://img.shields.io/badge/version-0.3.0-3a624b?style=flat-square" alt="Version" />
  <img src="https://img.shields.io/badge/license-MIT-3a624b?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/runtime-Node.js-3a624b?style=flat-square" alt="Runtime" />
  <img src="https://img.shields.io/badge/bundler-esbuild-3a624b?style=flat-square" alt="Bundler" />
  <img src="https://img.shields.io/badge/AI-native-3a624b?style=flat-square" alt="AI Native" />
</p>

<h1 align="center">Fiyuu</h1>

<p align="center">
  <strong>The fullstack framework that AI can actually read.</strong>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> ·
  <a href="#the-problem">The Problem</a> ·
  <a href="#how-it-works">How It Works</a> ·
  <a href="#core-features">Features</a> ·
  <a href="#project-structure">Project Structure</a> ·
  <a href="#commands">Commands</a> ·
  <a href="#docs">Docs</a>
</p>

---

## The Problem

AI coding assistants are powerful — but they **guess** your project structure. They scan files, make assumptions, and often get it wrong. In a fast-moving codebase, this means:

- Copilot suggests imports from routes that don't exist
- Cursor refactors break because it doesn't understand data flow
- Local LLMs hallucinate API contracts that were never defined

**The root cause:** modern frameworks are too flexible. Route structure, data fetching, and server actions are scattered across files with no machine-readable contract tying them together.

## How Fiyuu Fixes This

Fiyuu enforces **one simple rule**: every route is a folder with exactly five possible files. That's it. No ambiguity, no guessing.

```
app/
├── page.tsx       → What the user sees
├── query.ts       → How data is fetched (runs on server)
├── action.ts      → What the user can do (server mutations)
├── schema.ts      → The contract (Zod types for input/output)
└── meta.ts        → Route metadata (title, SEO, render mode)
```

When you run `fiyuu sync`, the framework reads this structure and exports:

```
.fiyuu/
├── graph.json       ← Complete route graph with relationships
├── PROJECT.md       ← "What this project does" for AI agents
├── PATHS.md         ← Every route, its files, and purpose
├── FEATURES.md      ← Feature-by-feature breakdown
├── EXECUTION.md     ← "How to safely make changes"
└── WARNINGS.md      ← Anti-patterns and code smells
```

Now Copilot, Cursor, or any LLM pipeline works from **the same source of truth** — not guesses.

## Quick Start

```bash
npm create fiyuu-app@latest my-app
cd my-app
npm install
npm run dev
```

Your app is live at `http://localhost:4050`. Open it, start coding.

## Core Features

### 1. Deterministic File Contracts

No more wondering where a route's data fetching lives. In Fiyuu, it's always `query.ts`. Server actions are always `action.ts`. Types are always `schema.ts`.

```
# Every route follows the same pattern
app/
├── users/
│   ├── page.tsx       ← Lists users
│   ├── query.ts       ← fetchUsers()
│   └── schema.ts      ← input/output types
├── users/[id]/
│   ├── page.tsx       ← User detail
│   ├── query.ts       ← fetchUser(id)
│   └── action.ts      ← updateUser(id)
└── api/health.ts      ← Simple API endpoint
```

### 2. Type-Safe Server Contracts (Define Once, Use Everywhere)

```typescript
// app/users/schema.ts — define your contract ONCE
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
// app/users/query.ts — implementation, fully typed
import { query } from "./schema.js";

export async function execute({ input }) {
  const users = await db.query("SELECT * FROM users LIMIT 20 OFFSET ?", [
    (input.page - 1) * 20,
  ]);
  const total = await db.query("SELECT COUNT(*) as c FROM users")[0].c;
  return { users, total };
}
```

```typescript
// app/users/page.tsx — types inferred automatically
import { query } from "./query.js";
type PageData = InferQueryOutput<typeof query>;
// ✅ users: { id: string, name: string }[]
// ✅ total: number
// No manual type duplication needed.
```

### 3. Built-In Database (FiyuuDB)

No setup, no config files, no external dependencies. Just import and query.

```typescript
import { db } from "@fiyuu/db";

// SQL-like queries
const users = await db.query("SELECT * FROM users WHERE active = ?", [true]);
await db.query("INSERT INTO users (name, email) VALUES (?, ?)", [
  "Ali",
  "ali@test.com",
]);

// Table API for simple operations
const table = db.table("users");
table.insert({ name: "Ahmet", email: "ahmet@test.com" });
const admins = table.find({ role: "admin" });
```

Data persists automatically between restarts. Perfect for prototyping and internal tools.

### 4. Real-Time Channels

WebSocket and NATS support built into the framework. No external libraries needed.

```typescript
// Server — app/services/chat.ts
import { defineService } from "@fiyuu/runtime";

export default defineService({
  name: "chat",
  start({ realtime, db }) {
    const chat = realtime.channel("chat");

    chat.on("message", async (data, socket) => {
      // Broadcast to all connected clients
      chat.broadcast("new-message", {
        text: data.text,
        user: socket.userId,
        at: new Date().toISOString(),
      });

      // Persist to database
      await db.query("INSERT INTO messages (text, user) VALUES (?, ?)", [
        data.text,
        socket.userId,
      ]);
    });
  },
});
```

```html
<!-- Client — works in any page.tsx -->
<script>
  const chat = fiyuu.channel("chat");
  chat.on("new-message", (data) => appendMessage(data));
  chat.emit("message", { text: "Hello from the client!" });
</script>
```

### 5. Background Services (Always-Alive Architecture)

Unlike Next.js (request-driven), Fiyuu apps run continuously with background services. Think cron jobs, data sync, health checks — all native.

```typescript
// app/services/data-sync.ts
import { defineService } from "@fiyuu/runtime";

export default defineService({
  name: "data-sync",
  async start({ db, realtime, log }) {
    log("info", "Starting data sync...");

    // Runs every 30 seconds in the background
    setInterval(async () => {
      const stats = await db.query(
        "SELECT COUNT(*) as c FROM users WHERE active = 1"
      );
      realtime.channel("stats").emit("update", stats[0]);
    }, 30000);
  },

  async stop({ log }) {
    log("info", "Stopping data sync...");
  },
});
```

### 6. AI Assistant Integration

```bash
# Export project graph + AI docs
fiyuu sync

# Validate project structure
fiyuu doctor

# Ask AI about your project (route-aware context)
fiyuu ai "explain how the /users route works"
fiyuu ai "what database tables are used in this project?"
fiyuu ai "list all server actions and their input schemas"
```

Each command gives AI tools the exact context they need — no more guessing.

### 7. SEO Support (New in v0.2.0)

```typescript
// fiyuu.config.ts
export default {
  seo: {
    baseUrl: "https://example.com",
    sitemap: true,
    robots: true,
  },
};
```

Automatically generates:
- `/sitemap.xml` — all static routes with priority
- `/robots.txt` — with sitemap reference

### 8. Per-Route Rendering Modes

```typescript
// app/blog/meta.ts — this route uses SSG
import { defineMeta } from "@fiyuu/core/client";

export default defineMeta({
  intent: "Blog listing page",
  render: "ssg", // or "ssr" (default) or "csr"
  revalidate: 300, // re-generate every 5 minutes (ISR-style)
  seo: {
    title: "Blog — My Site",
    description: "Latest articles and tutorials",
  },
});
```

Each route picks its own rendering strategy. Mix SSR, SSG, and CSR in the same app.

### 9. Spring Boot Style Decorators (New in v0.3.0)

Enterprise-like patterns with less boilerplate. Controllers, Services, Repositories, Guards, and Dependency Injection.

```typescript
// src/api/user.controller.ts
import { Controller, Get, Post, Body, Param } from "@fiyuu/core";
import { UserService } from "./user.service.js";

@Controller("/api/users")
class UserController {
  constructor(private userService: UserService) {}

  @Get()
  async list() {
    return await this.userService.findAll();
  }

  @Get("/:id")
  async getById(@Param("id") id: string) {
    return await this.userService.findById(id);
  }

  @Post()
  async create(@Body() dto: CreateUserDTO) {
    return await this.userService.create(dto);
  }
}
```

Automatic dependency injection, type safety, and request routing.

### 10. Advanced F1 Database (New in v0.3.0)

Indexing, transactions, migrations, and relations — zero external packages.

```typescript
import { db } from "@fiyuu/db";

// Transactions with automatic rollback
await db.transaction(async (tx) => {
  const user = await tx.table("users").insert({ name: "Ali" });
  await tx.table("profiles").insert({ userId: user._id, bio: "Hello" });
  // If anything fails, both operations are rolled back
});

// Indexes for fast queries
await db.table("users").createIndex("email", { unique: true });

// Migrations for schema versioning
await db.migrator().up();
```

### 11. Integrated Components (New in v0.3.0)

Optimized, production-ready components for common needs: images, video, links, and SEO.

```typescript
import { FiyuuImage, FiyuuVideo, FiyuuLink, FiyuuHead } from "@fiyuu/core/components";

// Automatic lazy loading, responsive srcset, CLS prevention
const img = FiyuuImage({ src: "/hero.jpg", alt: "Hero", width: 1200, height: 600 });

// Video with auto poster, lazy loading
const video = FiyuuVideo({ src: "/video.mp4", poster: "/poster.jpg", lazy: true });

// Client-side navigation with prefetch
const link = FiyuuLink({ href: "/about", children: "About" });

// SEO meta tags and structured data
const head = FiyuuHead({
  title: "My Site",
  description: "The best site",
  image: "/og.jpg",
  structuredData: { "@type": "WebSite" }
});
```

## Project Structure

A complete Fiyuu project looks like this:

```
my-app/
├── app/
│   ├── layout.tsx          ← Root layout (wraps all pages)
│   ├── layout.meta.ts      ← Layout metadata
│   ├── meta.ts             ← Root page metadata
│   ├── page.tsx            ← Home page (/)
│   ├── query.ts            ← Home page data
│   ├── not-found.tsx       ← 404 page (any unmatched route)
│   ├── error.tsx           ← Error boundary
│   │
│   ├── about/
│   │   ├── page.tsx        ← /about
│   │   └── meta.ts
│   │
│   ├── blog/
│   │   ├── page.tsx        ← /blog (SSG)
│   │   ├── query.ts
│   │   ├── schema.ts
│   │   └── meta.ts
│   │
│   ├── blog/[slug]/
│   │   ├── page.tsx        ← /blog/my-post (dynamic)
│   │   ├── query.ts
│   │   └── schema.ts
│   │
│   ├── api/
│   │   └── health.ts       ← GET /api/health
│   │
│   └── services/
│       └── data-sync.ts    ← Background service
│
├── .fiyuu/                 ← Generated by fiyuu sync
│   ├── graph.json
│   ├── PROJECT.md
│   └── ...
│
├── fiyuu.config.ts         ← App configuration
└── package.json
```

## Commands

### Development

| Command | Description |
|---|---|
| `fiyuu dev` | Start dev server with live reload |
| `fiyuu build` | Production build |
| `fiyuu start` | Run production server |

### Project Health

| Command | Description |
|---|---|
| `fiyuu sync` | Export graph + AI docs from project structure |
| `fiyuu doctor` | Validate structure, find anti-patterns |
| `fiyuu doctor --fix` | Auto-fix common issues |
| `fiyuu graph stats` | Show route and feature statistics |
| `fiyuu graph export --format markdown` | Export graph as Markdown |

### AI Assistant

| Command | Description |
|---|---|
| `fiyuu ai "your question"` | Ask AI about your project with route-aware context |

### Feature Flags

| Command | Description |
|---|---|
| `fiyuu feat list` | List available features |
| `fiyuu feat socket on` | Enable WebSocket support |
| `fiyuu feat socket off` | Disable WebSocket support |

### Deployment

| Command | Description |
|---|---|
| `fiyuu deploy` | Deploy via SSH to your server |
| `fiyuu cloud help` | Fiyuu Cloud platform commands |
| `fiyuu cloud deploy mysite` | Deploy to Fiyuu Cloud |

## How Fiyuu Compares

| Feature | Fiyuu | Next.js | Astro |
|---|---|---|---|
| AI project graph | ✅ Built-in | ❌ | ❌ |
| Fixed file contracts | ✅ Always | ⚠️ Flexible | ⚠️ Flexible |
| AI docs export | ✅ `fiyuu sync` | ❌ | ❌ |
| Background services | ✅ Always-alive | ❌ Request-only | ❌ |
| Built-in database | ✅ FiyuuDB | ❌ | ❌ |
| Real-time channels | ✅ WS + NATS | ⚠️ External pkg | ⚠️ External pkg |
| SSR / CSR / SSG | ✅ Per-route | ✅ | ✅ |
| File-based routing | ✅ | ✅ | ✅ |
| Ecosystem maturity | 🟡 Growing | ✅ Mature | ✅ Mature |

**Fiyuu is not trying to replace Next.js or Astro.** It's for teams that want AI tools to understand their codebase as well as they do.

## Who Is Fiyuu For?

- **AI-assisted teams** using Copilot, Cursor, Claude, or local LLMs who want reliable project context
- **Internal tools and dashboards** where fast development matters more than ecosystem size
- **Solo developers** who want a framework that handles DB, realtime, and SEO out of the box
- **Prototyping** — ship a full app with auth, database, and realtime in minutes

## Who Is Fiyuu NOT For?

- Teams that need a massive plugin ecosystem (use Next.js)
- Content-heavy sites that need MDX/MDX integrations (use Astro)
- Projects that depend on specific third-party integrations

## Documentation

### Official Guides
| Resource | Purpose |
|---|---|
| [Website & Docs](examples/fiyuu-website) | Live documentation with examples |
| [PUBLISHING.md](PUBLISHING.md) | How to publish Fiyuu packages to npm |
| [examples/fiyuu-website/README.md](examples/fiyuu-website/README.md) | Website structure and design system |

### Package Documentation
| Package | README |
|---|---|
| [@fiyuu/core](packages/core/README.md) | Core framework, decorators, components |
| [@fiyuu/runtime](packages/runtime/README.md) | Server runtime and routing |
| [@fiyuu/db](packages/db/README.md) | F1 Database, queries, transactions |
| [@fiyuu/realtime](packages/realtime/README.md) | WebSocket, NATS, real-time |
| [@fiyuu/cli](packages/cli/README.md) | CLI commands and project management |
| [create-fiyuu-app](packages/create-fiyuu-app/README.md) | App scaffolding and templates |

### Legacy Docs (v0.2.0)
| Resource | Link |
|---|---|
| English docs | [docs/en.md](docs/en.md) |
| Turkish docs | [docs/tr.md](docs/tr.md) |
| Skills guide (EN) | [docs/skills.md](docs/skills.md) |
| Skills guide (TR) | [docs/skills.tr.md](docs/skills.tr.md) |
| v2 Product Spec | [docs/v2-product-spec.tr.md](docs/v2-product-spec.tr.md) |
| Benchmark Matrix | [docs/benchmark-matrix.md](docs/benchmark-matrix.md) |
| AI-for-Framework Guide | [docs/ai-for-framework.md](docs/ai-for-framework.md) |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push and open a Pull Request

Before submitting, run `fiyuu doctor` to make sure your project structure is valid.

## License

[MIT](LICENSE) — © Hacı Mert Gökhan
