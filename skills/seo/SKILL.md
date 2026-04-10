# Fiyuu SEO Skill

## Overview

Fiyuu, content'den dinamik olarak meta tag'ler üreten, structured data destekli, AI-friendly SEO sistemi sunar.

## Quick Start

```typescript
import { definePage, html } from "@fiyuu/core";

export default definePage({
  render: () => html`
    <h1>Fiyuu Framework</h1>
    <p>AI-native fullstack framework for modern web development.</p>
  `,
  
  seo: {
    // Content'den otomatik üret
    auto: true,
    
    // Manuel override
    meta: {
      title: "Fiyuu — AI-Native Framework",
      description: "Build faster with intent-based programming",
    },
  },
});
```

## Auto SEO (Content Analysis)

```typescript
export default definePage({
  render: () => html`
    <article>
      <h1>Getting Started with Fiyuu</h1>
      <p>Learn how to build modern web applications...</p>
      <img src="/hero.png" alt="Fiyuu Hero" />
    </article>
  `,
  
  seo: {
    auto: {
      titleSelector: "h1",           // h1'den title
      descSelector: "p:first-child", // İlk p'den description
      imageSelector: "img",          // İlk img'den OG image
    },
  },
});
```

## Manual SEO

```typescript
import { definePage, generateJsonLd } from "@fiyuu/core";

export default definePage({
  load: () => db.posts.find(slug),
  
  seo: {
    meta: (post) => ({
      title: post.title,
      description: post.excerpt,
      canonical: `https://site.com/blog/${post.slug}`,
      
      // Open Graph
      og: {
        title: post.title,
        description: post.excerpt,
        image: post.coverImage,
        type: "article",
        url: `https://site.com/blog/${post.slug}`,
      },
      
      // Twitter Card
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description: post.excerpt,
        image: post.coverImage,
        site: "@fiyuu",
      },
      
      // JSON-LD Structured Data
      jsonLd: generateJsonLd("Article", {
        headline: post.title,
        author: {
          "@type": "Person",
          name: post.author.name,
        },
        datePublished: post.publishedAt,
        image: post.coverImage,
      }),
    }),
  },
});
```

## Structured Data Types

### Article

```typescript
import { generateJsonLd } from "@fiyuu/core";

jsonLd: generateJsonLd("Article", {
  headline: "Article Title",
  author: { "@type": "Person", name: "John Doe" },
  datePublished: "2024-01-15",
  image: "https://site.com/image.jpg",
})
```

### Product

```typescript
jsonLd: generateJsonLd("Product", {
  name: "Fiyuu Pro",
  image: "https://site.com/product.jpg",
  description: "AI framework license",
  sku: "FIYUU-001",
  brand: { "@type": "Brand", name: "Fiyuu" },
  offers: {
    "@type": "Offer",
    price: "99.00",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  },
})
```

### Organization

```typescript
jsonLd: generateJsonLd("Organization", {
  name: "Fiyuu Inc.",
  url: "https://fiyuu.work",
  logo: "https://fiyuu.work/logo.png",
  sameAs: [
    "https://twitter.com/fiyuu",
    "https://github.com/fiyuu",
  ],
})
```

### Breadcrumb

```typescript
jsonLd: generateJsonLd("BreadcrumbList", {
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "/" },
    { "@type": "ListItem", position: 2, name: "Blog", item: "/blog" },
    { "@type": "ListItem", position: 3, name: "Post Title", item: "/blog/post" },
  ],
})
```

## AI-Generated SEO

```typescript
export default definePage({
  load: () => db.posts.find(slug),
  
  seo: {
    // AI/otomatik SEO üretici
    generate: {
      generateTitle: (post, content) => 
        `${post.title} | Fiyuu Blog`,
      
      generateDescription: (post, content) => {
        // İlk 160 karakter
        const text = content?.replace(/<[^>]+>/g, " ").trim() || "";
        return text.slice(0, 160) + (text.length > 160 ? "..." : "");
      },
      
      suggestKeywords: (post, content) => {
        // Basit keyword extraction
        const words = content?.toLowerCase().match(/\b\w{4,}\b/g) || [];
        const freq = {};
        words.forEach(w => freq[w] = (freq[w] || 0) + 1);
        return Object.entries(freq)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([w]) => w);
      },
    },
  },
});
```

## Sitemap Configuration

```typescript
// fiyuu.config.ts
export default {
  seo: {
    baseUrl: "https://fiyuu.work",
    sitemap: {
      enabled: true,
      exclude: ["/admin/*", "/private/*"],
    },
    robots: {
      enabled: true,
      rules: [
        { userAgent: "*", allow: "/" },
        { userAgent: "*", disallow: "/admin" },
      ],
    },
  },
};
```

## Page-Level Sitemap

```typescript
export default definePage({
  seo: {
    sitemap: {
      priority: 0.8,        // 0.0 - 1.0
      changefreq: "daily",  // always | hourly | daily | weekly | monthly
      lastmod: new Date(),  // Son değişiklik
    },
  },
});
```

## Multilingual SEO

```typescript
export default definePage({
  seo: {
    meta: {
      lang: "tr",
      locale: "tr_TR",
    },
    alternates: {
      languages: {
        "en": "https://site.com/en/page",
        "tr": "https://site.com/tr/page",
        "de": "https://site.com/de/page",
      },
      canonical: "https://site.com/page",
    },
  },
});
```

## Best Practices

1. **Unique Titles**: Her sayfa benzersiz title'a sahip olsun
2. **Meta Descriptions**: 150-160 karakter arası
3. **OG Images**: 1200x630 px önerilir
4. **Canonical URLs**: Duplicate content'i önle
5. **Structured Data**: Schema.org standartlarını kullan
6. **Sitemap**: Dinamik içerik için otomatik güncelle
