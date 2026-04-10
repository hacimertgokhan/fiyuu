# Fiyuu Caching Skill

## Overview

Fiyuu, multi-strategy caching sistemi sunar: memory, filesystem, Redis ve edge cache. Memoization, ISR ve SWR desteği içerir.

## Memoization

### Basic Memo

```typescript
import { memo, memoAsync, invalidate } from "@fiyuu/core";

// Sync function
const getConfig = memo(
  () => loadConfig(),
  { ttl: 300 } // 5 dakika
);

// Async function
const getUser = memoAsync(
  async (id: string) => db.users.find(id),
  { ttl: 60, tags: ["users"] }
);

// Kullanım
const user1 = await getUser("123"); // DB'den
const user2 = await getUser("123"); // Cache'den

// Invalidate
invalidate(getUser, { keys: ["123"] });
invalidate(getUser, { tags: ["users"] });
```

### Cache Options

```typescript
const getData = memoAsync(
  async (id: string) => fetchData(id),
  {
    ttl: 3600,              // Saniye cinsinden
    strategy: "memory",     // memory | filesystem | redis
    tags: ["api", "users"], // Grup invalidate için
    key: (args) => `user:${args[0]}`, // Özel key
    skip: (args) => args[0] === "skip", // Cache pas
    swr: true,              // Stale-while-revalidate
  }
);
```

## Stale-While-Revalidate (SWR)

```typescript
const getData = memoAsync(
  async () => fetchExpensiveData(),
  {
    ttl: 60,      // 60 saniye fresh
    swr: true,    // Süre dolunca eski datayı döndür, arka planda yenile
  }
);

// 60 saniye içinde: Cache'den döner
// 60 saniye sonra: Eski datayı döner + arka planda yeniler
```

## Page-Level Caching (ISR)

```typescript
import { definePage } from "@fiyuu/core";

export default definePage({
  load: () => db.posts.all(),
  render: ({ data }) => html`...`,
  
  cache: {
    // Incremental Static Regeneration
    revalidate: 3600,  // 1 saatte bir yenile
    
    // Static Generation (build-time)
    static: false,
    
    // Edge/CDN Cache
    edge: {
      ttl: 86400,              // 1 gün
      staleWhileRevalidate: 3600, // 1 saat eski data
    },
    
    // Cache varyasyonları
    vary: {
      headers: ["Accept-Language"],
      cookies: ["theme"],
      query: ["page", "limit"],
    },
    
    // Invalidate tag'leri
    tags: ["posts", "homepage"],
  },
});
```

## Cache Invalidation

### Programmatic

```typescript
import { invalidate } from "@fiyuu/core";

// Belirli key'i sil
invalidate(getUser, { keys: ["123"] });

// Tag'e göre sil
invalidate(getUser, { tags: ["users"] });

// Pattern match
invalidate(getUser, { pattern: "user:*" });

// Hepsini sil
invalidate(getUser, { all: true });
```

### API Endpoint ile

```typescript
// app/api/revalidate.ts
import { defineApi, invalidate } from "@fiyuu/core";

export default defineApi({
  method: "POST",
  handler: async ({ body }) => {
    // Webhook'dan gelen revalidate isteği
    invalidate(null, { tags: body.tags });
    return { revalidated: true };
  },
});
```

## Redis Adapter

```typescript
// fiyuu.config.ts
export default {
  cache: {
    default: "redis",
    strategies: {
      memory: { maxSize: 100 * 1024 * 1024 }, // 100MB
      redis: {
        url: process.env.REDIS_URL,
        ttl: 3600,
      },
    },
  },
};
```

## Edge Cache (CDN)

```typescript
// Cloudflare/Vercel Edge
export default definePage({
  cache: {
    edge: {
      ttl: 86400,
      staleWhileRevalidate: 3600,
    },
  },
});
```

## Database Query Cache

```typescript
import { db } from "@fiyuu/db";

const users = await db.users.findMany({
  cache: {
    key: "users:all",
    ttl: 300,
  },
});

// İkinci çağrı cache'den
const cached = await db.users.findMany({
  cache: { key: "users:all" },
});
```

## Best Practices

1. **TTL Seçimi**: Sık değişen data için kısa TTL (60s), sabit için uzun (1h+)
2. **Tagging**: İlişkili data'yı aynı tag ile grupla
3. **SWR**: Kullanıcı deneyimi kritikse SWR kullan
4. **Invalidate**: Data değiştiğinde hemen invalidate et
5. **Memory Management**: Memory cache için maxSize belirle

## Cache Strategies Comparison

| Strategy | Speed | Persistence | Use Case |
|----------|-------|-------------|----------|
| Memory | ⚡⚡⚡ | ❌ Process | Hot data, frequent access |
| Filesystem | ⚡⚡ | ✅ Server restart | Large objects, images |
| Redis | ⚡⚡ | ✅ Multi-server | Distributed apps |
| Edge | ⚡⚡⚡ | ✅ CDN | Static content, global |
