# Components

Optimized, production-ready components for common UI needs.

## Overview

Fiyuu provides built-in components for:
- Images (lazy loading, srcset, CLS prevention)
- Videos (poster, preload controls)
- Links (prefetch, client navigation)
- Head (SEO meta tags, structured data)

## Installation

```typescript
import { 
  FiyuuImage, 
  FiyuuVideo, 
  FiyuuLink, 
  FiyuuHead 
} from "@fiyuu/core/components";
```

## FiyuuImage

Optimized image component with automatic lazy loading and responsive sizes.

### Basic Usage

```typescript
import { FiyuuImage } from "@fiyuu/core/components";

const image = FiyuuImage({
  src: "/images/photo.jpg",
  alt: "A beautiful photo",
  width: 1200,
  height: 800,
});
```

### Lazy Loading

```typescript
// Default: lazy loading enabled
FiyuuImage({
  src: "/images/photo.jpg",
  alt: "Photo",
  width: 800,
  height: 600,
  loading: "lazy",  // "lazy" | "eager"
});

// Above-the-fold image: eager loading
FiyuuImage({
  src: "/hero.jpg",
  alt: "Hero",
  width: 1920,
  height: 1080,
  loading: "eager",
  priority: "high",
});
```

### Responsive Images

```typescript
// Automatic srcset generation
FiyuuImage({
  src: "/images/photo.jpg",
  alt: "Photo",
  width: 1200,
  height: 800,
  sizes: [
    { width: 400, suffix: "sm" },
    { width: 800, suffix: "md" },
    { width: 1200, suffix: "lg" },
  ],
  // Generates: photo-sm.jpg, photo-md.jpg, photo-lg.jpg
});

// Custom srcset
FiyuuImage({
  src: "/images/photo.jpg",
  alt: "Photo",
  srcset: [
    { url: "/images/photo-400.jpg", width: 400 },
    { url: "/images/photo-800.jpg", width: 800 },
    { url: "/images/photo-1200.jpg", width: 1200 },
  ],
  sizes: "(max-width: 600px) 400px, (max-width: 1000px) 800px, 1200px",
});
```

### Art Direction (Picture Element)

```typescript
FiyuuImage({
  alt: "Responsive image",
  sources: [
    {
      media: "(max-width: 600px)",
      srcset: "/images/mobile.jpg",
      width: 600,
      height: 800,
    },
    {
      media: "(min-width: 601px)",
      srcset: "/images/desktop.jpg",
      width: 1920,
      height: 1080,
    },
  ],
});
```

### Placeholder

```typescript
// Blur-up placeholder
FiyuuImage({
  src: "/images/photo.jpg",
  alt: "Photo",
  width: 1200,
  height: 800,
  placeholder: {
    type: "blur",
    url: "/images/photo-blur.jpg",  // Tiny blurred version
  },
});

// Color placeholder
FiyuuImage({
  src: "/images/photo.jpg",
  alt: "Photo",
  width: 1200,
  height: 800,
  placeholder: {
    type: "color",
    color: "#e2e8f0",
  },
});
```

### Styling

```typescript
FiyuuImage({
  src: "/images/photo.jpg",
  alt: "Photo",
  width: 800,
  height: 600,
  class: "rounded-lg shadow-md",
  style: "object-fit: cover;",
  objectFit: "cover",  // cover | contain | fill | none
});
```

### Complete Example

```typescript
const heroImage = FiyuuImage({
  src: "/images/hero.jpg",
  alt: "Hero image showing our product",
  width: 1920,
  height: 1080,
  loading: "eager",
  priority: "high",
  sizes: [
    { width: 640, suffix: "sm" },
    { width: 1024, suffix: "md" },
    { width: 1920, suffix: "lg" },
  ],
  placeholder: {
    type: "blur",
    url: "/images/hero-blur.jpg",
  },
  class: "w-full h-auto",
  objectFit: "cover",
});
```

## FiyuuVideo

Optimized video component with lazy loading and controls.

### Basic Usage

```typescript
import { FiyuuVideo } from "@fiyuu/core/components";

const video = FiyuuVideo({
  src: "/videos/demo.mp4",
  width: 1280,
  height: 720,
});
```

### Poster and Preload

```typescript
FiyuuVideo({
  src: "/videos/demo.mp4",
  width: 1280,
  height: 720,
  poster: "/videos/demo-poster.jpg",
  preload: "metadata",  // "none" | "metadata" | "auto"
});
```

### Multiple Sources

```typescript
FiyuuVideo({
  width: 1280,
  height: 720,
  poster: "/videos/poster.jpg",
  sources: [
    { src: "/videos/demo.webm", type: "video/webm" },
    { src: "/videos/demo.mp4", type: "video/mp4" },
  ],
});
```

### Lazy Loading

```typescript
FiyuuVideo({
  src: "/videos/demo.mp4",
  width: 1280,
  height: 720,
  lazy: true,  // Load when in viewport
  poster: "/videos/demo-poster.jpg",
});
```

### Playback Options

```typescript
FiyuuVideo({
  src: "/videos/demo.mp4",
  width: 1280,
  height: 720,
  autoplay: false,
  muted: true,      // Required for autoplay
  loop: false,
  controls: true,
  playsinline: true,  // For mobile
});
```

### Complete Example

```typescript
const demoVideo = FiyuuVideo({
  width: 1920,
  height: 1080,
  poster: "/videos/demo-poster.jpg",
  sources: [
    { src: "/videos/demo.webm", type: "video/webm" },
    { src: "/videos/demo.mp4", type: "video/mp4" },
  ],
  preload: "metadata",
  lazy: true,
  controls: true,
  playsinline: true,
  class: "rounded-lg shadow-lg",
});
```

## FiyuuLink

Smart link component with prefetching and client navigation.

### Basic Usage

```typescript
import { FiyuuLink } from "@fiyuu/core/components";

const link = FiyuuLink({
  href: "/about",
  children: "About Us",
});
```

### Prefetching

```typescript
// Prefetch on hover (default)
FiyuuLink({
  href: "/products",
  children: "Products",
  prefetch: "hover",
});

// Prefetch immediately
FiyuuLink({
  href: "/important",
  children: "Important",
  prefetch: "eager",
});

// No prefetch
FiyuuLink({
  href: "/logout",
  children: "Logout",
  prefetch: "none",
});
```

### External Links

```typescript
FiyuuLink({
  href: "https://example.com",
  children: "External",
  external: true,  // Adds rel="noopener noreferrer"
});
```

### Styling

```typescript
FiyuuLink({
  href: "/contact",
  children: "Contact",
  class: "text-blue-600 hover:underline",
  activeClass: "text-blue-800 font-bold",
});
```

### Complete Example

```typescript
const navLink = FiyuuLink({
  href: "/products",
  children: "Products",
  prefetch: "hover",
  class: "nav-link",
  activeClass: "nav-link-active",
});
```

## FiyuuHead

SEO and meta tag management.

### Basic Usage

```typescript
import { FiyuuHead } from "@fiyuu/core/components";

const head = FiyuuHead({
  title: "Page Title",
  description: "Page description for SEO",
});
```

### Complete SEO

```typescript
FiyuuHead({
  title: "Product Name - Shop",
  description: "Buy Product Name at the best price",
  
  // Canonical URL
  canonical: "https://shop.com/products/name",
  
  // Open Graph
  og: {
    title: "Product Name",
    description: "Product description",
    image: "https://shop.com/og-image.jpg",
    type: "product",
    siteName: "My Shop",
  },
  
  // Twitter
  twitter: {
    card: "summary_large_image",
    title: "Product Name",
    image: "https://shop.com/twitter-image.jpg",
  },
  
  // Structured data
  structuredData: {
    "@type": "Product",
    name: "Product Name",
    offers: {
      "@type": "Offer",
      price: "99.99",
      priceCurrency: "USD",
    },
  },
});
```

### Custom Meta Tags

```typescript
FiyuuHead({
  title: "Page",
  meta: [
    { name: "author", content: "John Doe" },
    { name: "robots", content: "noindex, nofollow" },
    { property: "og:locale", content: "en_US" },
  ],
  link: [
    { rel: "canonical", href: "https://site.com/page" },
    { rel: "alternate", hreflang: "es", href: "https://site.com/es/page" },
  ],
});
```

### Using in Page

```typescript
// app/blog/[slug]/page.tsx
import { Component } from "@geajs/core";
import { html, FiyuuHead } from "@fiyuu/core/client";

export default class BlogPost extends Component<PageProps<PageData>> {
  template({ data }) {
    const head = FiyuuHead({
      title: data.post.title,
      description: data.post.excerpt,
      og: {
        title: data.post.title,
        description: data.post.excerpt,
        image: data.post.coverImage,
        type: "article",
      },
      structuredData: {
        "@type": "Article",
        headline: data.post.title,
        author: { "@type": "Person", name: data.post.author },
        datePublished: data.post.publishedAt,
      },
    });

    return html`
      ${head}
      <article>
        <h1>${data.post.title}</h1>
        <div>${data.post.content}</div>
      </article>
    `;
  }
}
```

## Responsive Helpers

### Media Queries

```typescript
import { mediaUp, mediaDown, mediaBetween, fluid } from "@fiyuu/core/client";

// Media queries
const styles = `
  ${mediaUp("md")} {
    font-size: 18px;
  }
  
  ${mediaDown("sm")} {
    font-size: 14px;
  }
  
  ${mediaBetween("sm", "lg")} {
    padding: 20px;
  }
`;

// Fluid sizing
const heroHeight = fluid({
  min: 300,
  max: 600,
  viewportMin: 320,
  viewportMax: 1920,
});
// Returns: calc(300px + (600 - 300) * ((100vw - 320px) / (1920 - 320)))
```

### Container Queries

```typescript
import { containerStyle } from "@fiyuu/core/client";

const cardStyle = containerStyle({
  minWidth: 200,
  maxWidth: 400,
});
```

## Complete Page Example

```typescript
// app/products/[id]/page.tsx
import { Component } from "@geajs/core";
import { html, type PageProps } from "@fiyuu/core/client";
import { FiyuuImage, FiyuuVideo, FiyuuLink, FiyuuHead } from "@fiyuu/core/components";

export default class ProductPage extends Component<PageProps<ProductData>> {
  template({ data }) {
    const head = FiyuuHead({
      title: `${data.name} - Buy Now`,
      description: data.description.slice(0, 160),
      og: {
        title: data.name,
        image: data.images[0],
        type: "product",
      },
    });

    const mainImage = FiyuuImage({
      src: data.images[0],
      alt: data.name,
      width: 800,
      height: 800,
      loading: "eager",
      sizes: [
        { width: 400, suffix: "sm" },
        { width: 800, suffix: "lg" },
      ],
      class: "product-image",
    });

    const demoVideo = data.video ? FiyuuVideo({
      src: data.video,
      width: 1280,
      height: 720,
      poster: data.videoPoster,
      lazy: true,
      controls: true,
    }) : null;

    const relatedLink = FiyuuLink({
      href: `/products/${data.relatedProduct.id}`,
      children: data.relatedProduct.name,
      prefetch: "hover",
    });

    return html`
      ${head}
      <main class="product-page">
        <h1>${data.name}</h1>
        ${mainImage}
        <p>${data.description}</p>
        ${demoVideo}
        <div class="related">
          <p>Also check out: ${relatedLink}</p>
        </div>
      </main>
    `;
  }
}
```

## Best Practices

1. **Always set width/height** - Prevents CLS (Cumulative Layout Shift)
2. **Use lazy loading** - For images below the fold
3. **Provide alt text** - Accessibility and SEO
4. **Optimize images** - Generate multiple sizes
5. **Use webp/webm** - Better compression
6. **Set poster for videos** - Better perceived performance

## Performance

- Images lazy load by default
- Automatic srcset for responsive images
- Video preload="metadata" by default
- Link prefetch on hover
- All components are lightweight

## Next Steps

- Learn about [Rendering Modes](../core-concepts/rendering-modes.md)
- Explore [Meta Configuration](../core-concepts/meta-configuration.md)
- Read [Routing](../core-concepts/routing.md)
