# Meta Configuration

Route metadata controls SEO, rendering, and AI understanding. Define it once per route in `meta.ts`.

## Basic Structure

```typescript
import { defineMeta } from "@fiyuu/core/client";

export default defineMeta({
  // Required: AI context
  intent: "What this route does",
  
  // Optional: Rendering mode
  render: "ssr",
  
  // Optional: SEO
  seo: {
    title: "Page Title",
    description: "Page description",
  },
});
```

## Required Fields

### intent

**Required.** Describes what the route does. Used by AI tools and documentation generation.

```typescript
export default defineMeta({
  intent: "User profile page - displays user info and allows editing",
});
```

Good intents:
- ✅ "Product listing with filters and pagination"
- ✅ "Checkout flow - shipping, payment, confirmation"
- ✅ "Blog post with comments and related articles"

Bad intents:
- ❌ "Page"
- ❌ "Users"
- ❌ "Main"

## Rendering Configuration

### render

Controls how the page is rendered.

```typescript
export default defineMeta({
  render: "ssr",   // Server-Side Rendering (default)
  // render: "csr",   // Client-Side Rendering
  // render: "ssg",   // Static Site Generation
});
```

### revalidate

For SSG: how often to regenerate the page (seconds).

```typescript
export default defineMeta({
  render: "ssg",
  revalidate: 3600,  // Regenerate every hour
});
```

Special values:
- `false` - Never revalidate (pure static)
- `"on-demand"` - Manual revalidation only

```typescript
// Never revalidate
revalidate: false

// Manual revalidation
revalidate: "on-demand"
```

## SEO Configuration

### Basic SEO

```typescript
export default defineMeta({
  seo: {
    title: "About Us - Company Name",
    description: "Learn about our mission and team",
    keywords: ["about", "company", "team", "mission"],
  },
});
```

### Title Options

```typescript
seo: {
  // Simple string
  title: "Page Title",
  
  // Object with template
  title: {
    default: "My Site",
    template: "%s | My Site",  // "About | My Site"
  },
}
```

### Open Graph (Social Sharing)

```typescript
export default defineMeta({
  seo: {
    og: {
      title: "Article Title",
      description: "Article summary for social media",
      image: "https://mysite.com/og-image.jpg",
      type: "article",  // website | article | product
      siteName: "My Site",
      locale: "en_US",
    },
  },
});
```

### Twitter Card

```typescript
export default defineMeta({
  seo: {
    twitter: {
      card: "summary_large_image",  // summary | summary_large_image
      site: "@myhandle",
      creator: "@authorhandle",
      title: "Page Title",
      description: "Page description",
      image: "https://mysite.com/twitter-card.jpg",
    },
  },
});
```

### Structured Data (JSON-LD)

```typescript
export default defineMeta({
  seo: {
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Article Title",
      author: {
        "@type": "Person",
        name: "Author Name",
      },
      datePublished: "2024-01-15",
      publisher: {
        "@type": "Organization",
        name: "Publisher Name",
        logo: {
          "@type": "ImageObject",
          url: "https://mysite.com/logo.png",
        },
      },
    },
  },
});
```

Common schema types:
- `WebSite` - Homepage
- `WebPage` - Generic page
- `Article` - Blog post
- `Product` - Product page
- `Organization` - Company info
- `Person` - Profile page
- `BreadcrumbList` - Navigation

### Canonical URL

```typescript
export default defineMeta({
  seo: {
    canonical: "https://mysite.com/preferred-url",
  },
});
```

### Robots Meta

```typescript
export default defineMeta({
  seo: {
    robots: {
      index: true,      // Allow indexing
      follow: true,     // Follow links
      noarchive: false, // Allow cached version
      nosnippet: false, // Allow snippets
    },
  },
});
```

Hide from search engines:

```typescript
seo: {
  robots: {
    index: false,
    follow: false,
  },
}
```

## Feature Flags

Enable/disable route-specific features:

```typescript
export default defineMeta({
  features: {
    websocket: true,    // Enable WebSocket for this route
    auth: true,         // Require authentication
    analytics: true,    // Track page views
    prefetch: true,     // Prefetch linked pages
  },
});
```

### Auth Requirement

```typescript
export default defineMeta({
  intent: "Admin dashboard - requires login",
  features: {
    auth: {
      required: true,
      redirect: "/login",
      roles: ["admin", "moderator"],
    },
  },
});
```

## Layout Meta

Layouts can have their own meta:

```typescript
// app/layout.meta.ts
export default defineMeta({
  intent: "Root layout - wraps all pages",
  seo: {
    title: {
      default: "My Site",
      template: "%s | My Site",
    },
  },
});
```

Child routes inherit and override:

```typescript
// app/blog/[slug]/meta.ts
export default defineMeta({
  intent: "Blog post",
  seo: {
    title: "Article Title",  // Becomes "Article Title | My Site"
  },
});
```

## Dynamic Meta

For dynamic routes, use query data:

```typescript
// app/products/[id]/meta.ts
import { defineMeta } from "@fiyuu/core/client";
import type { query } from "./query.js";

export default defineMeta(async ({ data }: { data: Awaited<ReturnType<typeof query.execute>> }) => {
  return {
    intent: `Product page for ${data.product.name}`,
    seo: {
      title: `${data.product.name} - Buy Now`,
      description: data.product.description,
      og: {
        image: data.product.image,
      },
    },
  };
});
```

## Complete Example

```typescript
import { defineMeta } from "@fiyuu/core/client";

export default defineMeta({
  // AI Context
  intent: "Product detail page - displays product info, images, reviews, and add to cart",
  
  // Rendering
  render: "ssr",  // Dynamic pricing requires SSR
  
  // SEO
  seo: {
    title: "Product Name - Shop Category",
    description: "Detailed product description for SEO",
    keywords: ["product", "category", "buy", "shop"],
    
    canonical: "https://shop.com/products/product-name",
    
    og: {
      title: "Product Name",
      description: "Short description for social",
      image: "https://shop.com/images/product-og.jpg",
      type: "product",
      siteName: "My Shop",
    },
    
    twitter: {
      card: "summary_large_image",
      title: "Product Name",
      image: "https://shop.com/images/product-twitter.jpg",
    },
    
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Product Name",
      image: "https://shop.com/images/product.jpg",
      description: "Product description",
      offers: {
        "@type": "Offer",
        price: "99.99",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
    },
    
    robots: {
      index: true,
      follow: true,
    },
  },
  
  // Features
  features: {
    auth: false,
    websocket: true,  // Real-time stock updates
    analytics: true,
  },
});
```

## Meta Inheritance

Meta merges from parent to child:

```
app/
├── layout.meta.ts          # Root defaults
├── blog/
│   ├── layout.meta.ts      # Blog section defaults
│   └── [slug]/
│       └── meta.ts         # Post-specific
```

Merging rules:
- `intent` - Child overrides parent
- `render` - Child overrides parent
- `seo.title` - Uses template if provided
- `seo.description` - Child overrides
- `features` - Merged (child can disable parent features)

## Generating Sitemap

Fiyuu automatically generates sitemap from meta:

```bash
fiyuu build
# Creates /sitemap.xml
```

Control sitemap inclusion:

```typescript
export default defineMeta({
  sitemap: {
    include: true,
    priority: 0.8,        // 0.0 to 1.0
    changefreq: "daily",  // always | hourly | daily | weekly | monthly | yearly | never
  },
});
```

Exclude from sitemap:

```typescript
export default defineMeta({
  sitemap: {
    include: false,
  },
});
```

## Best Practices

1. **Always write `intent`** - Helps AI understand your code
2. **Unique titles** - Every page should have unique title
3. **150 char descriptions** - Optimal length for SEO
4. **OG images** - 1200x630px for best social sharing
5. **Canonical URLs** - Prevent duplicate content issues
6. **Structured data** - Helps search engines understand content

## Debugging Meta

View generated meta:

```bash
fiyuu sync
cat .fiyuu/graph.json | jq '.routes[].meta'
```

Check rendered HTML:

```bash
curl -s http://localhost:4050/my-page | grep -E "<title>|<meta"
```

## Next Steps

- Learn about [Rendering Modes](./rendering-modes.md)
- Read about [File Contracts](./file-contracts.md)
- Explore [Routing](./routing.md)
