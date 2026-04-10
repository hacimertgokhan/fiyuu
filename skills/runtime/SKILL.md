# Fiyuu Runtime Skill

## Overview

Fiyuu runtime, server/client arası seamless geçiş, hot reload, ve optimize edilmiş bundle sistemi sunar.

## Server Runtime

### Request Context

```typescript
import { definePage } from "@fiyuu/core";

export default definePage({
  load: (ctx) => {
    // ctx içinde:
    // - params: Route params
    // - query: Query string
    // - headers: HTTP headers
    // - cookies: Cookies
    // - request: Raw request
    
    return {
      userAgent: ctx.headers["user-agent"],
      referer: ctx.headers.referer,
    };
  },
});
```

### Response Helpers

```typescript
import { redirect, json, html } from "@fiyuu/core";

// Redirect
return redirect("/login", 302);

// JSON response
return json({ success: true, data: user });

// HTML response
return html`<h1>Hello</h1>`;

// Custom status
return { status: 404, body: "Not found" };
```

## Client Runtime

### Hydration

```typescript
// Island Architecture
import { defineComponent } from "@fiyuu/core";

export default defineComponent({
  name: "Counter",
  island: "visible", // visible | load | idle | interaction
  
  serverRender: () => html`<button class="counter">0</button>`,
  
  clientScript: `
    document.querySelectorAll('.counter').forEach(btn => {
      let count = 0;
      btn.addEventListener('click', () => {
        btn.textContent = ++count;
      });
    });
  `,
});
```

### State Management

```typescript
// Global state (client-side)
import { createStore } from "@fiyuu/runtime/client";

const store = createStore({
  theme: "dark",
  user: null,
});

store.set("theme", "light");
const theme = store.get("theme");

// Subscribe
store.subscribe("user", (user) => {
  console.log("User changed:", user);
});
```

### Client-Side Navigation

```typescript
import { navigate } from "@fiyuu/runtime/client";

// SPA-like navigation (no full reload)
navigate("/users");

// With state
navigate("/users", { state: { from: "home" } });

// Prefetch on hover
<a href="/users" data-prefetch>Users</a>
```

## Hot Module Replacement

```typescript
// fiyuu.config.ts
export default {
  dev: {
    hmr: true,
    reload: "fast", // fast | full | false
  },
};
```

### HMR API

```typescript
// Component hot reload
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    // Module updated
  });
}
```

## Private Assets

```typescript
// Server-side only access
import { readPrivateAsset, readPrivateJson } from "@fiyuu/runtime/server-private";

// Read file
const config = await readPrivateAsset("config/secrets.txt");

// Read JSON
const data = await readPrivateJson<Config>("config/settings.json");

// List directory
const files = await listPrivateAssets("data/");
```

## Error Boundaries

```typescript
import { definePage, ifAnyError } from "@fiyuu/core";

export default definePage({
  load: () => ifAnyError(
    () => riskyOperation(),
    { fallback: { error: true } }
  ),
  
  render: ({ data }) => {
    if (data.error) {
      return html`<p>Something went wrong</p>`;
    }
    return html`<div>${data}</div>`;
  },
  
  errorBoundary: true, // Global boundary'ye yakala
});
```

## Middleware Runtime

```typescript
// Middleware chain
import { defineMiddleware } from "@fiyuu/core";

export default defineMiddleware({
  pattern: "/*",
  handler: async (ctx, next) => {
    // Before request
    console.log("Request:", ctx.url);
    
    const response = await next();
    
    // After request
    console.log("Response:", response.status);
    
    return response;
  },
});
```

## Environment Variables

```typescript
// Server-side
const dbUrl = process.env.DATABASE_URL;

// Client-side (exposed)
const apiUrl = import.meta.env.PUBLIC_API_URL;

// fiyuu.config.ts
export default {
  env: {
    // Client'a expose et
    public: ["PUBLIC_API_URL", "PUBLIC_STRIPE_KEY"],
  },
};
```

## Bundle Optimization

```typescript
// Code splitting (automatic)
const HeavyComponent = lazy(() => import("./HeavyComponent"));

// Prefetch
prefetch("/users/page.ts");

// Preload critical
preload("/styles/critical.css");
```

## Best Practices

1. **Island Architecture**: Minimal client JS
2. **Progressive Hydration**: Gerekli yerde etkileşim
3. **Error Boundaries**: Graceful degradation
4. **Private Assets**: Hassas data'yı korumaya al
5. **HMR**: Geliştirme sürecini hızlandır

## Runtime Comparison

| Feature | Server | Client |
|---------|--------|--------|
| Data Fetching | ✅ Full access | ⚠️ API only |
| File System | ✅ Yes | ❌ No |
| Private Assets | ✅ Yes | ❌ No |
| State | Request-scoped | Global |
| Rendering | Full HTML | Partial |
