# Rendering Modes

Fiyuu supports multiple rendering strategies. Each route can choose its own mode.

## Overview

| Mode | Description | Use Case |
|------|-------------|----------|
| **SSR** | Server-Side Rendering (default) | Dynamic data, auth-required |
| **CSR** | Client-Side Rendering | Highly interactive, no SEO needed |
| **SSG** | Static Site Generation | Marketing pages, docs |
| **ISR** | Incremental Static Regeneration | Semi-static with updates |

## SSR (Server-Side Rendering)

Default mode. Server renders HTML on every request.

```typescript
// app/dashboard/meta.ts
import { defineMeta } from "@fiyuu/core/client";

export default defineMeta({
  intent: "User dashboard - requires auth",
  render: "ssr",  // Default, can be omitted
});
```

### How SSR Works

1. Request hits server
2. `query.ts` executes (server only)
3. Server renders `page.tsx` to HTML
4. HTML sent to browser
5. Browser hydrates interactive elements

### When to Use SSR

- **User-specific data** (dashboards, profiles)
- **Authentication required** (admin panels)
- **SEO-sensitive dynamic content** (product pages)
- **Frequently changing data** (news, stocks)

### SSR Benefits

- Fresh data on every request
- Full SEO support
- Fast Time to First Byte (TTFB)
- No client-side data fetching needed

### SSR Trade-offs

- Higher server load
- Slower than cached SSG
- Requires running server

## CSR (Client-Side Rendering)

Minimal HTML, JavaScript renders everything in browser.

```typescript
// app/app/meta.ts
export default defineMeta({
  intent: "Interactive admin panel",
  render: "csr",
});
```

```typescript
// app/app/page.tsx
import { Component } from "@geajs/core";
import { html } from "@fiyuu/core/client";

export default class AdminApp extends Component {
  template() {
    return html`
      <div id="app"></div>
      <script>
        // Client-side app takes over
        const app = document.getElementById('app');
        
        async function loadData() {
          const res = await fetch('/api/data');
          const data = await res.json();
          app.innerHTML = render(data);
        }
        
        loadData();
      </script>
    `;
  }
}
```

### How CSR Works

1. Server sends minimal HTML shell
2. Browser downloads JavaScript
3. JavaScript fetches data from API
4. JavaScript renders content

### When to Use CSR

- **Internal tools** (no SEO needed)
- **Highly interactive apps** (complex state)
- **Real-time dashboards** (live updates)
- **Behind authentication** (admin panels)

### CSR Benefits

- Fast navigation after initial load
- Rich interactivity
- Reduced server load
- Can work offline

### CSR Trade-offs

- Poor SEO (empty initial HTML)
- Slower initial load
- Requires JavaScript

## SSG (Static Site Generation)

HTML pre-rendered at build time.

```typescript
// app/about/meta.ts
export default defineMeta({
  intent: "About page - static content",
  render: "ssg",
});
```

```typescript
// app/about/query.ts
export async function execute() {
  // This runs at BUILD TIME, not request time
  const team = await fetchTeamFromCMS();
  return { team };
}
```

### How SSG Works

1. During `fiyuu build`, `query.ts` executes
2. Results saved as static data
3. `page.tsx` renders to static HTML
4. HTML served from CDN or static host

### When to Use SSG

- **Marketing pages** (landing, about)
- **Documentation** (docs, blog posts)
- **Content that rarely changes**
- **Maximum performance** needed

### SSG Benefits

- Fastest possible response (cached HTML)
- No server needed (CDN only)
- Lowest hosting costs
- Best reliability

### SSG Trade-offs

- Data is stale until rebuild
- Build time increases with content
- Not suitable for user-specific content

## ISR (Incremental Static Regeneration)

SSG with automatic background updates.

```typescript
// app/blog/[slug]/meta.ts
export default defineMeta({
  intent: "Blog post - statically generated with updates",
  render: "ssg",
  revalidate: 3600,  // Regenerate every hour (3600 seconds)
});
```

### How ISR Works

1. First request: Served from cache (SSG)
2. After `revalidate` time: Trigger background regeneration
3. Next request: Served fresh cache

```
Request 1:     Cached (stale) → Background update starts
Request 2-N:   Cached (stale) → Update in progress
Request N+1:   Fresh cache    → Update complete
```

### Revalidate Options

```typescript
// Time-based (seconds)
revalidate: 60        // Every minute
revalidate: 3600      // Every hour
revalidate: 86400     // Every day

// Never revalidate (pure SSG)
revalidate: false

// On-demand revalidation (manual)
revalidate: "on-demand"
```

### On-Demand Revalidation

```typescript
// app/api/revalidate/route.ts
export async function POST(request: Request) {
  const { path } = await request.json();
  
  // Trigger revalidation
  await fetch(`http://localhost:4050${path}`, {
    headers: { "x-revalidate": "true" },
  });
  
  return Response.json({ revalidated: true });
}
```

### When to Use ISR

- **Blog posts** (update when edited)
- **Product catalogs** (inventory changes)
- **News sites** (frequent updates)
- **Any semi-static content**

## Comparing Modes

### Performance

| Metric | SSR | CSR | SSG | ISR |
|--------|-----|-----|-----|-----|
| TTFB | Fast | Slow | Fastest | Fastest |
| FCP | Fast | Slow | Fast | Fast |
| TTI | Fast | Slow | Fast | Fast |
| Subsequent | Fast | Fastest | Fast | Fast |

*TTFB: Time to First Byte | FCP: First Contentful Paint | TTI: Time to Interactive*

### SEO

| Mode | SEO Support |
|------|-------------|
| SSR | ✅ Full |
| CSR | ❌ None (without prerender) |
| SSG | ✅ Full |
| ISR | ✅ Full |

### Server Load

| Mode | Server Requirement |
|------|-------------------|
| SSR | High (render per request) |
| CSR | Low (static files only) |
| SSG | None (CDN only) |
| ISR | Low (background updates) |

## Choosing the Right Mode

### Decision Tree

```
Is content user-specific?
├── Yes → SSR
└── No
    Does content change frequently?
    ├── Yes → ISR
    └── No → SSG
        Is SEO important?
        ├── Yes → Keep SSG
        └── No → Could use CSR
```

### Real-World Examples

| Page Type | Mode | Reason |
|-----------|------|--------|
| Homepage | SSG | Marketing content |
| User Dashboard | SSR | Private, dynamic |
| Admin Panel | CSR | Internal tool |
| Blog Post | ISR | Content updates |
| API Docs | SSG | Rarely changes |
| Checkout | SSR | Dynamic, secure |
| Search Results | SSR | Dynamic per query |

## Hybrid Approaches

Different modes for different routes in the same app:

```
app/
├── page.tsx              # SSG (marketing)
├── meta.ts               # render: "ssg"
├── about/
│   ├── page.tsx          # SSG
│   └── meta.ts           # render: "ssg"
├── blog/
│   ├── page.tsx          # ISR
│   └── meta.ts           # render: "ssg", revalidate: 3600
├── dashboard/
│   ├── page.tsx          # SSR
│   └── meta.ts           # render: "ssr"
└── admin/
    ├── page.tsx          # CSR
    └── meta.ts           # render: "csr"
```

## Client-Side Data Fetching in SSR

Even SSR pages can have client-side updates:

```typescript
// app/dashboard/page.tsx
export default class Dashboard extends Component<PageProps<PageData>> {
  template({ data }: PageProps<PageData>) {
    return html`
      <main>
        <!-- Server-rendered initial data -->
        <div id="stats">${data.stats}</div>
        
        <!-- Client-side updates -->
        <script>
          async function updateStats() {
            const res = await fetch('/api/stats');
            const data = await res.json();
            document.getElementById('stats').textContent = data.value;
          }
          
          // Update every 30 seconds
          setInterval(updateStats, 30000);
        </script>
      </main>
    `;
  }
}
```

## Streaming SSR (Future)

Partial page streaming for faster TTFB:

```typescript
// app/products/page.tsx
export default class ProductsPage extends Component {
  async *template() {
    // Send header immediately
    yield html`<h1>Products</h1>`;
    
    // Load slow data
    const products = await fetchProducts(); // Slow
    
    // Send products when ready
    yield html`<div>${products.map(p => html`<p>${p.name}</p>`)}</div>`;
  }
}
```

## Debugging Render Modes

Check how a page is rendered:

```bash
# View project graph
fiyuu sync
cat .fiyuu/graph.json | grep -A 5 '"render"'
```

Add debug header:

```typescript
// Check render mode in response
console.log(response.headers.get("x-render-mode"));  // "ssr" | "ssg" | "csr"
```

## Best Practices

1. **Default to SSG** for public pages
2. **Use SSR** for user-specific content
3. **Use ISR** for content that updates occasionally
4. **Use CSR** sparingly (internal tools only)
5. **Minimize revalidate time** (balance freshness vs server load)

## Migration Between Modes

Changing modes is as simple as editing `meta.ts`:

```typescript
// Before
render: "ssr"

// After (for better performance)
render: "ssg"
revalidate: 3600
```

Run `fiyuu build` to regenerate with new mode.

## Next Steps

- Learn about [Meta Configuration](./meta-configuration.md)
- Read [File Contracts](./file-contracts.md)
- Explore [API Routes](../api-reference/decorators.md)
