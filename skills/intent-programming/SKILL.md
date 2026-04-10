# Fiyuu Intent-Based Programming Skill

## Overview

Intent-based programming, yazılımcının **ne** istediğini deklare etmesi, framework'ün de **nasıl** yapılacağını bilmesi prensibine dayanır.

## Core Philosophy

> "Route'u yazma, dosya konumu belirlesin. 
> HTML'i JSX'te boğma, template literal kullan.
> Boilerplate yazma, intent söyle."

## Basic Intent

```typescript
// app/users/page.ts → Route: /users
import { definePage, html } from "@fiyuu/core";

export default definePage({
  // Route YOK! Dosya path'i belirler: app/users/page.ts → /users
  
  load: () => db.users.all(),
  render: ({ data }) => html`<h1>${data.length} users</h1>`,
});
```

## Intent Anatomy

```typescript
definePage({
  // 1. INPUT (Validation)
  input: {
    params: z.object({ id: z.string() }),
    query: z.object({ page: z.number().default(1) }),
  },
  
  // 2. LOAD (Data Fetching)
  load: ({ params, query }) => db.users.find(params.id),
  
  // 3. RENDER (UI)
  render: ({ data, error, loading }) => html`...`,
  
  // 4. SEO (Metadata)
  seo: {
    meta: (data) => ({ title: data.name }),
    auto: true,
  },
  
  // 5. CACHE (Performance)
  cache: {
    revalidate: 3600,
    tags: ["users"],
  },
});
```

## Route Inference

```
app/
├── page.ts              → /
├── about/page.ts        → /about
├── users/page.ts        → /users
├── users/[id]/page.ts   → /users/:id
├── blog/[...slug]/page.ts → /blog/*
```

## Comparison

### ❌ Next.js (Ceremony)

```typescript
// app/users/[id]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

async function getUser(id: string) {
  const res = await fetch(`/api/users/${id}`);
  if (!res.ok) throw new Error('Failed');
  return res.json();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await getUser(params.id);
  return { title: user.name };
}

export default async function UserPage({ params }: { params: { id: string } }) {
  const user = await getUser(params.id);
  if (!user) notFound();
  return <h1>{user.name}</h1>;
}
```

### ✅ Fiyuu (Intent)

```typescript
// app/users/[id]/page.ts
import { definePage, html } from "@fiyuu/core";

export default definePage({
  load: ({ params }) => db.users.find(params.id),
  render: ({ data }) => html`<h1>${data.name}</h1>`,
  seo: { meta: (user) => ({ title: user.name }) },
});
```

## Intent Types

### Page Intent

```typescript
definePage({
  route: "/users",        // Opsiyonel (dosyadan infer)
  method: "GET",          // HTTP method
  mode: "ssr",            // ssr | csr | static | edge
  
  input: { /* zod */ },   // Validation
  load: () => {},         // Data fetching
  render: () => {},       // HTML rendering
  seo: {},                // SEO config
  cache: {},              // Caching
  layout: "default",      // Layout name
  providers: ["auth"],    // Context providers
  skeleton: true,         // Loading state
  errorBoundary: true,    // Error handling
});
```

### API Intent

```typescript
import { defineApi } from "@fiyuu/core";

defineApi({
  route: "/api/users",
  method: "POST",
  input: {
    body: z.object({ name: z.string() }),
  },
  handler: async ({ body }) => {
    return db.users.create(body);
  },
  auth: true,
  rateLimit: 100,
});
```

### Action Intent

```typescript
import { defineAction } from "@fiyuu/core";

defineAction({
  name: "createPost",
  fields: {
    title: { type: "text", required: true },
    content: { type: "text", required: true },
  },
  handler: async (data) => {
    return db.posts.create(data);
  },
  redirect: "/posts",
});
```

### Component Intent

```typescript
import { defineComponent } from "@fiyuu/core";

defineComponent({
  name: "UserCard",
  props: {
    schema: z.object({ name: z.string() }),
  },
  serverRender: ({ name }) => html`<div>${name}</div>`,
  island: "visible", // Hydration strategy
});
```

### Layout Intent

```typescript
import { defineLayout } from "@fiyuu/core";

defineLayout({
  name: "default",
  wrapper: ({ head, body }) => html`
    <!DOCTYPE html>
    <html>
      <head>${head}</head>
      <body>${body}</body>
    </html>
  `,
  providers: ["theme", "auth"],
});
```

## Template Literals

### Basic

```typescript
html`<div class="${className}">${content}</div>`
```

### Conditionals

```typescript
import { when } from "@fiyuu/core";

${when(condition, 
  () => html`<p>Yes</p>`,
  () => html`<p>No</p>`
)}
```

### Lists

```typescript
html`
  <ul>
    ${items.map(item => html`
      <li key="${item.id}">${item.name}</li>
    `).join('')}
  </ul>
`
```

### Nested

```typescript
const Card = ({ title, children }) => html`
  <div class="card">
    <h2>${title}</h2>
    <div class="content">${children}</div>
  </div>
`;

// Usage
${Card({ 
  title: "Hello", 
  children: html`<p>Content</p>` 
})}
```

## Best Practices

1. **Single Responsibility**: Her intent tek iş yapsın
2. **Declarative**: Nasıl değil, ne yapılacağını söyle
3. **Type Safety**: Zod schema her zaman
4. **Minimal**: En az kod, en çok iş
5. **Predictable**: Dosya yapısı = Route yapısı

## Mental Model

```
┌─────────────────────────────────────┐
│  Yazılımcı                          │
│  └── Intent tanımlar (declarative)  │
│       ├── load: Ne veri?            │
│       ├── render: Nasıl görünür?    │
│       └── seo: Metadata?            │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  Fiyuu Framework                    │
│  ├── Route inference                │
│  ├── Validation                     │
│  ├── Caching                        │
│  ├── Rendering                      │
│  └── Optimization                   │
└─────────────────────────────────────┘
```
