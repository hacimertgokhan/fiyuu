/**
 * F1 — Fiyuu's lightweight JSON database.
 * All data lives at .fiyuu/data/f1.json (relative to process.cwd()).
 */

import { existsSync, promises as fs } from "node:fs";
import path from "node:path";

const DB_PATH = path.join(process.cwd(), ".fiyuu", "data", "f1.json");

// ── Types ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  passwordHash: string;
  createdAt: number;
}

export interface Session {
  id: string;
  userId: string;
  status: "active" | "expired";
  createdAt: number;
}

export interface Doc {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: "getting-started" | "core-concepts" | "reference";
  order: number;
  published: boolean;
  authorId: string;
  createdAt: number;
  updatedAt: number;
}

export interface ChangelogEntry {
  id: string;
  version: string;
  title: string;
  content: string;
  createdAt: number;
}

export interface Database {
  users: User[];
  sessions: Session[];
  docs: Doc[];
  changelog: ChangelogEntry[];
}

// ── Read / Write ──────────────────────────────────────────────────────────────

export async function readDb(): Promise<Database> {
  if (!existsSync(DB_PATH)) {
    const fresh = buildSeedData();
    await writeDb(fresh);
    return fresh;
  }
  const raw = await fs.readFile(DB_PATH, "utf8");
  const db = JSON.parse(raw) as Partial<Database>;
  return {
    users: db.users ?? [],
    sessions: db.sessions ?? [],
    docs: db.docs ?? [],
    changelog: db.changelog ?? [],
  };
}

export async function writeDb(db: Database): Promise<void> {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2) + "\n");
}

// ── Seed data ─────────────────────────────────────────────────────────────────

function buildSeedData(): Database {
  const now = Date.now();
  return {
    users: [
      {
        id: "usr_admin_001",
        name: "Admin",
        email: "admin@fiyuu.dev",
        role: "admin",
        // password: "fiyuu123"
        passwordHash: "f1_eb473d3c",
        createdAt: now - 86400000 * 14,
      },
    ],
    sessions: [],
    docs: [
      {
        id: "doc_001",
        slug: "getting-started",
        title: "Getting Started",
        excerpt: "Set up your first Fiyuu project in minutes. No bundler, no boilerplate — just a route and a page.",
        content: `Fiyuu is an AI-first fullstack framework built on GEA. Every route is a self-contained feature directory.

## Installation

\`\`\`bash
npm create fiyuu-app my-project
cd my-project
npm run dev
\`\`\`

Your app will start at http://localhost:4050.

## Project structure

\`\`\`
my-app/
├── app/
│   ├── layout.tsx      ← Root layout (wraps all pages)
│   ├── page.tsx        ← Home page
│   ├── query.ts        ← Data fetching
│   ├── action.ts       ← Server mutations
│   ├── schema.ts       ← Zod contracts
│   ├── meta.ts         ← SEO & render config
│   └── middleware.ts   ← Global middleware
├── lib/                ← Shared utilities
└── fiyuu.config.ts     ← Framework config
\`\`\`

## Your first route

Create app/hello/page.tsx:

\`\`\`typescript
import { Component } from "@geajs/core";
import { definePage, html } from "@fiyuu/core/client";

export const page = definePage({ intent: "Say hello" });

export default class HelloPage extends Component {
  template() {
    return html\`<h1>Hello, Fiyuu!</h1>\`;
  }
}
\`\`\`

Navigate to /hello — that's it.`,
        category: "getting-started",
        order: 1,
        published: true,
        authorId: "usr_admin_001",
        createdAt: now - 86400000 * 10,
        updatedAt: now - 86400000 * 10,
      },
      {
        id: "doc_002",
        slug: "route-contracts",
        title: "Route Contracts",
        excerpt: "The core pattern of Fiyuu — each route defines its own schema, query, action, and page in isolation.",
        content: `A route contract is a directory of up to 5 files that fully describe a route's data, behavior, and UI.

## The 5 files

page.tsx — GEA component, server-rendered HTML
query.ts — Data fetching, runs before render
action.ts — Server mutations, called via fiyuu.action()
schema.ts — Zod types, shared between query and action
meta.ts — SEO metadata and render mode

## Defining a query

\`\`\`typescript
// app/blog/query.ts
import { z } from "zod";
import { defineQuery, type QueryContext } from "@fiyuu/core/client";

export const query = defineQuery({
  description: "Fetch all published posts.",
  input: z.object({}),
  output: z.object({
    posts: z.array(z.object({ id: z.string(), title: z.string() }))
  }),
});

export async function execute({ request }: QueryContext) {
  const posts = await db.posts.filter(p => p.published);
  return { posts };
}
\`\`\`

## Calling an action from the client

\`\`\`javascript
const result = await fiyuu.action('/blog', { title: 'Hello World' });
if (result.success) window.location.reload();
\`\`\``,
        category: "core-concepts",
        order: 1,
        published: true,
        authorId: "usr_admin_001",
        createdAt: now - 86400000 * 9,
        updatedAt: now - 86400000 * 9,
      },
      {
        id: "doc_003",
        slug: "gea-components",
        title: "GEA Components",
        excerpt: "GEA is the rendering engine under Fiyuu. Class-based, SSR-first, no virtual DOM.",
        content: `GEA components are TypeScript classes that render to HTML strings.

## Basic component

\`\`\`typescript
import { Component } from "@geajs/core";
import { html, escapeHtml } from "@fiyuu/core/client";

export default class Greeting extends Component<{ name: string }> {
  template({ name } = this.props) {
    return html\`<h1>Hello, \${escapeHtml(name)}!</h1>\`;
  }
}
\`\`\`

## Page component

\`\`\`typescript
import { Component } from "@geajs/core";
import { definePage, html, type PageProps, type InferQueryOutput } from "@fiyuu/core/client";
import type { query } from "./query.js";

type PageData = InferQueryOutput<typeof query>;

export const page = definePage({ intent: "List all posts" });

export default class PostsPage extends Component<PageProps<PageData>> {
  template({ data } = this.props) {
    const posts = data?.posts ?? [];
    return html\`
      <ul>\${posts.map(p => html\`<li>\${escapeHtml(p.title)}</li>\`).join("")}</ul>
    \`;
  }
}
\`\`\`

## The html tag

The html tagged template literal is a pass-through that signals to your IDE this is safe HTML. Always use escapeHtml() for user content.`,
        category: "core-concepts",
        order: 2,
        published: true,
        authorId: "usr_admin_001",
        createdAt: now - 86400000 * 8,
        updatedAt: now - 86400000 * 8,
      },
      {
        id: "doc_004",
        slug: "f1-database",
        title: "F1 Database",
        excerpt: "Zero-config JSON store built into Fiyuu. Perfect for prototypes — swap it for any DB when you scale.",
        content: `F1 is Fiyuu's built-in database. Data is stored as a JSON file at .fiyuu/data/f1.json.

## Reading and writing

\`\`\`typescript
// lib/db.ts
import { existsSync, promises as fs } from "node:fs";

const DB_PATH = ".fiyuu/data/f1.json";

export async function readDb() {
  if (!existsSync(DB_PATH)) return { users: [], docs: [] };
  return JSON.parse(await fs.readFile(DB_PATH, "utf8"));
}

export async function writeDb(db) {
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
}
\`\`\`

## Usage in a query

\`\`\`typescript
export async function execute() {
  const db = await readDb();
  return { docs: db.docs.filter(d => d.published) };
}
\`\`\`

## Replacing F1

When you outgrow it, swap readDb/writeDb for Prisma, Drizzle, or any ORM — your route contracts stay unchanged.`,
        category: "core-concepts",
        order: 3,
        published: true,
        authorId: "usr_admin_001",
        createdAt: now - 86400000 * 7,
        updatedAt: now - 86400000 * 7,
      },
      {
        id: "doc_005",
        slug: "middleware",
        title: "Middleware",
        excerpt: "Run code before every request — auth guards, redirects, response headers — with full TypeScript types.",
        content: `Middleware runs before every route handler. Export a middleware function from app/middleware.ts.

## Basic example

\`\`\`typescript
import { defineMiddleware } from "@fiyuu/core";

export const middleware = defineMiddleware(async ({ url, request }, next) => {
  console.log(url.pathname);
  await next();
});
\`\`\`

## Authentication guard

\`\`\`typescript
import { defineMiddleware } from "@fiyuu/core";
import { getSessionUser } from "../lib/auth.js";

export const middleware = defineMiddleware(async ({ url, request }, next) => {
  if (url.pathname.startsWith("/dashboard")) {
    const user = await getSessionUser(request);
    if (!user) {
      return {
        headers: { Location: "/auth" },
        response: { status: 302, body: "" },
      };
    }
  }
  await next();
});
\`\`\`

## Chaining

Export an array to run multiple handlers in sequence:

\`\`\`typescript
export const middleware = [
  defineMiddleware(logger),
  defineMiddleware(authGuard),
];
\`\`\``,
        category: "core-concepts",
        order: 4,
        published: true,
        authorId: "usr_admin_001",
        createdAt: now - 86400000 * 6,
        updatedAt: now - 86400000 * 6,
      },
      {
        id: "doc_006",
        slug: "client-runtime",
        title: "window.fiyuu Runtime",
        excerpt: "The browser-side API that ships with every Fiyuu app. State, actions, partial renders — no build step.",
        content: `Every Fiyuu page automatically receives the window.fiyuu runtime.

## fiyuu.action()

Call a server action from the browser:

\`\`\`javascript
const result = await fiyuu.action('/dashboard', {
  kind: 'create',
  title: 'My new doc',
});
if (result.success) window.location.reload();
\`\`\`

## fiyuu.state()

Reactive state with automatic DOM syncing:

\`\`\`javascript
const count = fiyuu.state('count', 0);
count.set(count.get() + 1);
\`\`\`

## fiyuu.data()

Access server-embedded data from the client:

\`\`\`typescript
// server: embed data
clientData("my-docs", docs)

// client: read it
const docs = fiyuu.data('my-docs');
\`\`\`

## fiyuu.router

Client-side navigation:

\`\`\`javascript
fiyuu.router.push('/docs/getting-started');
fiyuu.router.prefetch('/docs');
\`\`\``,
        category: "reference",
        order: 1,
        published: true,
        authorId: "usr_admin_001",
        createdAt: now - 86400000 * 5,
        updatedAt: now - 86400000 * 5,
      },
      {
        id: "doc_007",
        slug: "cli-reference",
        title: "CLI Reference",
        excerpt: "All fiyuu CLI commands — dev, build, start, sync, generate, doctor, and more.",
        content: `The Fiyuu CLI is available as the fiyuu command.

## fiyuu dev

Start the development server with hot reload:

\`\`\`bash
fiyuu dev
fiyuu dev --port 3000
\`\`\`

## fiyuu build

Build client assets for production:

\`\`\`bash
fiyuu build
\`\`\`

## fiyuu start

Start the production server:

\`\`\`bash
fiyuu start
fiyuu start --port 8080
\`\`\`

## fiyuu generate

Scaffold new files:

\`\`\`bash
fiyuu generate page
fiyuu generate action
fiyuu generate layout
\`\`\`

## fiyuu doctor

Check your project for issues — missing page.tsx, routes with no intent, zero-JS pages with scripts.

## fiyuu graph

Print the project route graph.`,
        category: "reference",
        order: 2,
        published: true,
        authorId: "usr_admin_001",
        createdAt: now - 86400000 * 4,
        updatedAt: now - 86400000 * 4,
      },
    ],
    changelog: [
      {
        id: "cl_002",
        version: "0.2.0",
        title: "Middleware types & workspace fixes",
        content: `defineMiddleware — Type-safe middleware helper exported from @fiyuu/core. No more context: any.

my-app workspace — Apps are now proper workspace members. fiyuu/client resolves natively.

Better error messages — Module load failures now include the missing package name and an npm install hint.

FiyuuMiddlewareContext, FiyuuMiddlewareResult, FiyuuMiddlewareHandler exported from @fiyuu/core.

Bug fixes: Fixed MiddlewareResult return type not being enforced at compile time. Fixed workspace symlink not being created for apps outside packages/*.`,
        createdAt: now - 86400000 * 1,
      },
      {
        id: "cl_001",
        version: "0.1.0",
        title: "Initial release",
        content: `The first public release of the Fiyuu framework.

Route contract pattern — schema, query, action, page, meta per route.
GEA rendering engine — class-based SSR components with html tagged templates.
F1 Database — zero-config JSON store at .fiyuu/data/f1.json.
window.fiyuu runtime — state, bind, action, partial, router, modal, ws.
Middleware — app/middleware.ts with next() chaining.
Dev server — hot reload via WebSocket, Fiyuu Console dev panel.
CLI — dev, build, start, sync, generate, doctor, graph.
TypeScript-first — all contracts fully typed via Zod inference.`,
        createdAt: now - 86400000 * 14,
      },
    ],
  };
}
