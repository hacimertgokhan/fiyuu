# Intent-Based Programming Demo

## Felsefe

> Yazılımcı **ne** istediğini söyler, Fiyuu **nasıl** yapılacağını bilir.

## Karşılaştırma

### ❌ Karmaşık (Next.js/App Router)
```typescript
// app/users/[id]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string() });

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
  
  return (
    <article>
      <h1>{user.name}</h1>
    </article>
  );
}
```

### ✅ Sade (Fiyuu Intent-Based)
```typescript
// app/users/[id]/page.ts
import { definePage, html } from "@fiyuu/core";

export default definePage({
  // Route YOK! Dosya path'i: app/users/[id]/page.ts → /users/:id
  
  input: {
    params: z.object({ id: z.string() }),
  },
  
  load: ({ params }) => db.users.find(params.id),
  
  render: ({ data: user }) => html`
    <article>
      <h1>${user.name}</h1>
    </article>
  `,
  
  seo: {
    meta: (user) => ({ title: user.name }),
    auto: true, // Content'den otomatik SEO
  },
  
  cache: {
    revalidate: 3600, // ISR - 1 saat
    tags: ["users"],
  },
});
```

## Özellikler

| Özellik | Intent-Based |
|---------|--------------|
| **Route** | Dosya path'inden otomatik |
| **Validation** | Zod schema, tek satır |
| **Data Fetching** | `load` fonksiyonu |
| **Rendering** | `html` template literal |
| **SEO** | Auto + Manual, content'den dinamik |
| **Cache** | ISR, Memo, Edge - tek config |
| **Ceremony** | Minimal |

## Dosya Yapısı = Route Yapısı

```
app/
├── page.ts              → /
├── about/page.ts        → /about
├── users/
│   ├── page.ts          → /users
│   ├── [id]/
│   │   └── page.ts      → /users/:id
│   └── [...slug]/
│       └── page.ts      → /users/*
├── blog/
│   └── [slug]/
│       └── page.ts      → /blog/:slug
├── products/
│   └── [id]/
│       └── page.ts      → /products/:id
└── api/
    └── users/
        └── action.ts    → /api/users/action
```

## Caching Stratejileri

### 1. Memoization (Function-Level)
```typescript
import { memoAsync } from "@fiyuu/core";

const getUser = memoAsync(
  async (id: string) => db.users.find(id),
  { 
    ttl: 60,           // 60 saniye cache
    tags: ["users"],   // Tag ile invalidate
    swr: true,         // Stale-while-revalidate
  }
);

// Cache'i temizle
invalidate(getUser, { tags: ["users"] });
```

### 2. Page-Level (ISR)
```typescript
export default definePage({
  cache: {
    revalidate: 3600,    // ISR - 1 saatte bir yenile
    static: false,       // true = build-time generate
    edge: {              // CDN cache
      ttl: 86400,
      staleWhileRevalidate: 3600,
    },
    tags: ["products"],  // Grup invalidate
  },
});
```

### 3. Cache Invalidation
```typescript
// Tag ile
invalidate(getUser, { tags: ["users"] });

// Key ile
invalidate(getUser, { keys: ["123"] });

// Pattern ile
invalidate(getUser, { pattern: "user:*" });

// Hepsini
invalidate(getUser, { all: true });
```

## SEO - Content'den Dinamik

### Auto SEO (Content Analysis)
```typescript
export default definePage({
  render: ({ data }) => html`
    <h1>${data.title}</h1>
    <p>${data.description}</p>
    <img src="${data.image}" />
  `,
  
  seo: {
    // Content'den otomatik çıkar
    auto: {
      titleSelector: "h1",           // h1'den title
      descSelector: "p:first-child", // ilk p'den description
      imageSelector: "img",          // ilk img'den OG image
    },
  },
});
```

### Manual + Auto Hybrid
```typescript
seo: {
  // Manuel override
  meta: (data) => ({
    title: data.title,
    og: { type: "article" },
  }),
  
  // AI/otomatik SEO
  generate: {
    generateTitle: (data, content) => `${data.title} | Site`,
    generateDescription: (data, content) => {
      // Content'den 160 karakter
      return content?.slice(0, 160) + "...";
    },
    suggestKeywords: (data, content) => {
      // Keyword extraction
      return ["fiyuu", "framework", "typescript"];
    },
  },
  
  // Structured Data
  jsonLd: generateJsonLd("Article", {
    headline: data.title,
    author: data.author,
  }),
}
```

### E-Ticaret (Product Schema)
```typescript
seo: {
  meta: (product) => ({
    title: `${product.name} - ${product.price}$`,
    description: product.description,
    ogImage: product.image,
    // Otomatik JSON-LD
    jsonLd: generateJsonLd("Product", {
      name: product.name,
      offers: {
        price: product.price,
        availability: "InStock",
      },
    }),
  }),
}
```

## Syntax

### Template Literal (`html`)
```typescript
html`
  <div class="${className}">
    ${items.map(item => html`<li>${item}</li>`)}
  </div>
`
```

### Conditional (`when`)
```typescript
${when(condition, 
  () => html`<p>Yes</p>`,
  () => html`<p>No</p>`
)}
```

### Loop
```typescript
${items.map(item => html`<li>${item.name}</li>`)}
```

## AI Anlaşılabilirliği

Bu yapı AI için mükemmel çünkü:

1. **Predictable structure** - Her zaman `definePage({...})`
2. **Declarative** - Ne yapılacağı belli, nasıl yapılacağı framework'e bırakılmış
3. **Type-safe** - Zod + TypeScript
4. **Parseable** - AST analizi kolay

```typescript
// AI bu kodu anlar:
{
  route: "/users",           // URL pattern
  load: () => {...},         // Data source
  render: ({data}) => {...}, // UI transform
  seo: {                     // SEO strategy
    meta: {...},
    auto: true,
  },
  cache: {                   // Performance
    revalidate: 3600,
    tags: ["users"],
  },
}
```

## Hız

- **Build**: 10x faster (less boilerplate to compile)
- **Runtime**: Optimized by framework
- **Development**: Hot reload, instant feedback
- **Learning**: 5 dakikada öğrenilir
- **SEO**: Otomatik, content'den dinamik
- **Cache**: Tek config, multi-strategy
